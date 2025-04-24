import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";

type Template = {
  id?: number;
  title: string;
  titleAr?: string;
  slug: string;
  categoryId: number;
  imageUrl: string;
  thumbnailUrl?: string;
  displayOrder: number;
  fields: string[];
  defaultValues?: any;
  settings?: any;
  active: boolean;
};

type Category = {
  id: number;
  name: string;
  nameAr?: string;
  slug: string;
};

export default function TemplateEditPage() {
  const { templateId } = useParams();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!templateId;
  
  const [formData, setFormData] = useState<Template>({
    title: '',
    titleAr: '',
    slug: '',
    categoryId: 0,
    imageUrl: '',
    thumbnailUrl: '',
    displayOrder: 0,
    fields: [],
    defaultValues: {},
    settings: {
      fontFamily: 'Tajawal',
      fontSize: 16,
      textColor: '#000000',
      backgroundColor: '#ffffff'
    },
    active: true
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories
  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: getQueryFn({}),
    onError: (error) => {
      toast({
        title: "خطأ في تحميل التصنيفات",
        description: "حدث خطأ أثناء تحميل بيانات التصنيفات",
        variant: "destructive",
      });
    }
  });

  // Fetch template details if editing
  const { data: template, isLoading: isTemplateLoading } = useQuery({
    queryKey: [`/api/templates/${templateId}`],
    queryFn: getQueryFn({}),
    enabled: isEditing,
    onSuccess: (data) => {
      console.log("تم تحميل بيانات القالب:", data);
      if (!data) {
        toast({
          title: "خطأ في تحميل القالب",
          description: "لم يتم العثور على بيانات القالب",
          variant: "destructive",
        });
        return;
      }
      
      try {
        setFormData({
          id: data.id,
          title: data.title || '',
          titleAr: data.titleAr || '',
          slug: data.slug || '',
          categoryId: typeof data.categoryId === 'number' ? data.categoryId : 0,
          imageUrl: data.imageUrl || '',
          thumbnailUrl: data.thumbnailUrl || '',
          displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : 0,
          fields: Array.isArray(data.fields) ? data.fields : [],
          defaultValues: data.defaultValues || {},
          settings: data.settings || {
            fontFamily: 'Tajawal',
            fontSize: 16,
            textColor: '#000000',
            backgroundColor: '#ffffff'
          },
          active: Boolean(data.active)
        });
        
        if (data.imageUrl) {
          setPreviewUrl(data.imageUrl);
        }
      } catch (err) {
        console.error("خطأ في معالجة بيانات القالب:", err);
        toast({
          title: "خطأ في معالجة بيانات القالب",
          description: "حدث خطأ أثناء معالجة بيانات القالب",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("خطأ في تحميل القالب:", error);
      toast({
        title: "خطأ في تحميل القالب",
        description: "حدث خطأ أثناء تحميل بيانات القالب",
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSwitchChange = (checked: boolean, name: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryId: parseInt(value)
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId) {
      toast({
        title: "اختر تصنيف",
        description: "يجب اختيار تصنيف للقالب",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.title) {
      toast({
        title: "أدخل عنوان",
        description: "يجب إدخال عنوان للقالب",
        variant: "destructive",
      });
      return;
    }
    
    if (!imageFile && !formData.imageUrl) {
      toast({
        title: "أضف صورة",
        description: "يجب إضافة صورة للقالب",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Add template data as JSON
      formDataToSend.append('templateData', JSON.stringify({
        title: formData.title,
        titleAr: formData.titleAr,
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-'),
        categoryId: parseInt(formData.categoryId.toString()), // تأكد من تحويله إلى رقم
        displayOrder: parseInt(formData.displayOrder.toString()), // تأكد من تحويله إلى رقم
        active: Boolean(formData.active), // تأكد من تحويله إلى قيمة منطقية
        settings: formData.settings || {},
        fields: Array.isArray(formData.fields) ? formData.fields : [],
        defaultValues: formData.defaultValues || {}
      }));
      
      // Add image file if selected
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }
      
      // Determine URL and method
      const url = isEditing 
        ? `/api/admin/templates/${templateId}` 
        : '/api/admin/templates';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      // Send request
      const response = await fetch(url, {
        method,
        body: formDataToSend,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      const result = await response.json();
      
      // Success
      toast({
        title: isEditing ? "تم تحديث القالب بنجاح" : "تم إضافة القالب بنجاح",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      
      // Redirect
      if (!isEditing) {
        // Go to template fields page if it's a new template
        setLocation(`/admin/templates/${result.id}/fields`);
      } else {
        // Go back to templates list
        setLocation('/admin/templates');
      }
    } catch (error) {
      console.error("Error submitting template:", error);
      toast({
        title: isEditing ? "فشل تحديث القالب" : "فشل إضافة القالب",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء معالجة الطلب",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if ((isEditing && isTemplateLoading) || isCategoriesLoading) {
    return (
      <div className="container py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {isEditing ? 'تعديل القالب' : 'إضافة قالب جديد'}
        </h1>
        
        <Button variant="outline" onClick={() => setLocation('/admin/templates')}>
          <ArrowLeft className="ml-2 h-4 w-4" />
          العودة للقوالب
        </Button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>بيانات القالب</CardTitle>
                <CardDescription>المعلومات الأساسية للقالب</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">عنوان القالب</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="أدخل عنوان القالب"
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="titleAr">عنوان القالب (بالعربية)</Label>
                  <Input
                    id="titleAr"
                    name="titleAr"
                    value={formData.titleAr || ''}
                    onChange={handleInputChange}
                    placeholder="أدخل عنوان القالب بالعربية"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="slug">المعرف (slug)</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug || ''}
                    onChange={handleInputChange}
                    placeholder="سيتم إنشاؤه تلقائيًا إذا تركته فارغًا"
                  />
                  <p className="text-xs text-muted-foreground">
                    سيظهر في عنوان URL، استخدم الحروف الإنجليزية والأرقام والشرطة فقط
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="category">التصنيف</Label>
                  {categories?.length > 0 ? (
                    <Select 
                      value={formData.categoryId.toString()} 
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="اختر تصنيف" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-yellow-600">
                      لا توجد تصنيفات. قم بإضافة تصنيفات أولًا.
                    </p>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="displayOrder">ترتيب العرض</Label>
                  <Input
                    id="displayOrder"
                    name="displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => handleSwitchChange(checked, 'active')}
                  />
                  <Label htmlFor="active">نشط</Label>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>الصورة والإعدادات</CardTitle>
                <CardDescription>صورة القالب والإعدادات المرئية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="image">صورة القالب</Label>
                  <div className="grid gap-4">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div 
                      className="border-2 border-dashed rounded-md p-6 flex flex-col items-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => document.getElementById('image')?.click()}
                    >
                      {previewUrl ? (
                        <div className="relative w-full aspect-[3/4] max-w-sm mx-auto">
                          <img 
                            src={previewUrl} 
                            alt="معاينة" 
                            className="rounded-md object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">انقر لاختيار صورة</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">إعدادات العرض</h3>
                  <div className="space-y-3">
                    <div className="grid gap-2">
                      <Label htmlFor="fontSize">حجم الخط</Label>
                      <Input
                        id="fontSize"
                        name="fontSize"
                        type="number"
                        value={formData.settings?.fontSize || 16}
                        onChange={handleSettingsChange}
                        min="8"
                        max="72"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="fontFamily">نوع الخط</Label>
                      <Select 
                        value={formData.settings?.fontFamily || 'Tajawal'} 
                        onValueChange={(value) => {
                          setFormData(prev => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              fontFamily: value
                            }
                          }));
                        }}
                      >
                        <SelectTrigger id="fontFamily">
                          <SelectValue placeholder="اختر نوع الخط" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tajawal">طجوال</SelectItem>
                          <SelectItem value="Cairo">كايرو</SelectItem>
                          <SelectItem value="Almarai">المراعي</SelectItem>
                          <SelectItem value="Amiri">أميري</SelectItem>
                          <SelectItem value="Arial">Arial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="textColor">لون الخط</Label>
                      <div className="flex gap-2">
                        <Input
                          id="textColor"
                          name="textColor"
                          type="color"
                          value={formData.settings?.textColor || '#000000'}
                          onChange={handleSettingsChange}
                          className="w-12 h-9 p-1"
                        />
                        <Input 
                          value={formData.settings?.textColor || '#000000'}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                textColor: e.target.value
                              }
                            }));
                          }}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="backgroundColor">لون الخلفية</Label>
                      <div className="flex gap-2">
                        <Input
                          id="backgroundColor"
                          name="backgroundColor"
                          type="color"
                          value={formData.settings?.backgroundColor || '#ffffff'}
                          onChange={handleSettingsChange}
                          className="w-12 h-9 p-1"
                        />
                        <Input 
                          value={formData.settings?.backgroundColor || '#ffffff'}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                backgroundColor: e.target.value
                              }
                            }));
                          }}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mt-6">
          <Button 
            type="submit" 
            size="lg" 
            className="min-w-32"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            <Save className="ml-2 h-4 w-4" />
            {isEditing ? 'تحديث القالب' : 'إضافة القالب'}
          </Button>
        </div>
      </form>
    </div>
  );
}