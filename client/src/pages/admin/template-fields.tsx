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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Save, ArrowLeft, Pencil, Trash2, XCircle, ChevronUp, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

type TemplateField = {
  id: number;
  templateId: number;
  name: string;
  label: string;
  labelAr?: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  placeholder?: string;
  placeholderAr?: string;
  options?: any[];
  position?: any;
  style?: any;
  displayOrder: number;
};

type Template = {
  id: number;
  title: string;
  titleAr?: string;
  slug: string;
  categoryId: number;
  imageUrl: string;
  thumbnailUrl?: string;
  fields: string[];
  defaultValues?: any;
  settings?: any;
  active: boolean;
  category?: {
    name: string;
    nameAr?: string;
  }
};

export default function TemplateFieldsPage() {
  const { templateId } = useParams();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<TemplateField | null>(null);
  const [fieldFormData, setFieldFormData] = useState<Partial<TemplateField>>({
    name: '',
    label: '',
    labelAr: '',
    type: 'text',
    required: false,
    defaultValue: '',
    placeholder: '',
    placeholderAr: '',
    options: [],
    displayOrder: 0
  });
  const [newOption, setNewOption] = useState('');

  // Fetch template details
  const { data: template, isLoading: isTemplateLoading } = useQuery({
    queryKey: [`/api/templates/${templateId}`],
    queryFn: getQueryFn({}),
    onError: (error) => {
      toast({
        title: "خطأ في تحميل القالب",
        description: "حدث خطأ أثناء تحميل بيانات القالب",
        variant: "destructive",
      });
    }
  });

  // Fetch template fields
  const { data: fields, isLoading: isFieldsLoading, refetch: refetchFields } = useQuery({
    queryKey: [`/api/templates/${templateId}/fields`],
    queryFn: getQueryFn({}),
    onError: (error) => {
      toast({
        title: "خطأ في تحميل الحقول",
        description: "حدث خطأ أثناء تحميل حقول القالب",
        variant: "destructive",
      });
    }
  });

  // Create field mutation
  const createFieldMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/templates/${templateId}/fields`, data);
      return res.json();
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      resetFieldForm();
      refetchFields();
      toast({
        title: "تم إضافة الحقل بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في إضافة الحقل",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/admin/template-fields/${data.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      resetFieldForm();
      refetchFields();
      toast({
        title: "تم تحديث الحقل بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في تحديث الحقل",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete field mutation
  const deleteFieldMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/template-fields/${id}`);
      return res.json();
    },
    onSuccess: () => {
      refetchFields();
      toast({
        title: "تم حذف الحقل بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ في حذف الحقل",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Reorder field mutation
  const reorderFieldMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: number, direction: 'up' | 'down' }) => {
      // Simply refetch fields after a short delay to simulate reordering
      // This is a workaround until the reorder API endpoint is implemented
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true };
    },
    onSuccess: () => {
      refetchFields();
    },
    onError: (error) => {
      toast({
        title: "خطأ في إعادة ترتيب الحقل",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    
    setFieldFormData((prev) => ({
      ...prev,
      options: [...(prev.options || []), newOption]
    }));
    
    setNewOption('');
  };

  const handleRemoveOption = (index: number) => {
    setFieldFormData((prev) => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index)
    }));
  };

  const resetFieldForm = () => {
    setEditingField(null);
    setFieldFormData({
      name: '',
      label: '',
      labelAr: '',
      type: 'text',
      required: false,
      defaultValue: '',
      placeholder: '',
      placeholderAr: '',
      options: [],
      displayOrder: fields?.length ? fields.length : 0
    });
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetFieldForm();
    }
    setIsDialogOpen(open);
  };

  const openEditDialog = (field: TemplateField) => {
    setEditingField(field);
    setFieldFormData({
      ...field,
      options: field.options || []
    });
    setIsDialogOpen(true);
  };

  const handleFieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const fieldData = {
      ...fieldFormData,
      templateId: parseInt(templateId as string)
    };
    
    if (editingField) {
      updateFieldMutation.mutate({
        id: editingField.id,
        ...fieldData
      });
    } else {
      createFieldMutation.mutate(fieldData);
    }
  };

  if (isTemplateLoading || isFieldsLoading) {
    return (
      <div className="container py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">إدارة حقول القالب</h1>
          <p className="text-muted-foreground">{template?.title}</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation('/admin/templates')}>
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة للقوالب
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="ml-2 h-4 w-4" />
                إضافة حقل جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingField ? 'تعديل حقل' : 'إضافة حقل جديد'}</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleFieldSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">اسم الحقل (بالإنجليزية)</Label>
                    <Input
                      id="name"
                      value={fieldFormData.name || ''}
                      onChange={(e) => setFieldFormData({ ...fieldFormData, name: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      يستخدم في البرمجة ولا يظهر للمستخدم
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="label">عنوان الحقل</Label>
                    <Input
                      id="label"
                      value={fieldFormData.label || ''}
                      onChange={(e) => setFieldFormData({ ...fieldFormData, label: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="labelAr">عنوان الحقل (بالعربية)</Label>
                    <Input
                      id="labelAr"
                      value={fieldFormData.labelAr || ''}
                      onChange={(e) => setFieldFormData({ ...fieldFormData, labelAr: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="type">نوع الحقل</Label>
                    <Select
                      value={fieldFormData.type}
                      onValueChange={(value) => setFieldFormData({ ...fieldFormData, type: value })}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="اختر نوع الحقل" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">نص قصير</SelectItem>
                        <SelectItem value="textarea">نص طويل</SelectItem>
                        <SelectItem value="number">رقم</SelectItem>
                        <SelectItem value="date">تاريخ</SelectItem>
                        <SelectItem value="time">وقت</SelectItem>
                        <SelectItem value="checkbox">اختيار (نعم/لا)</SelectItem>
                        <SelectItem value="select">قائمة منسدلة</SelectItem>
                        <SelectItem value="radio">خيارات متعددة</SelectItem>
                        <SelectItem value="image">صورة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="required"
                      checked={fieldFormData.required}
                      onCheckedChange={(checked) => 
                        setFieldFormData({ ...fieldFormData, required: checked as boolean })
                      }
                    />
                    <Label htmlFor="required">حقل مطلوب؟</Label>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="placeholder">نص توضيحي</Label>
                    <Input
                      id="placeholder"
                      value={fieldFormData.placeholder || ''}
                      onChange={(e) => setFieldFormData({ ...fieldFormData, placeholder: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="placeholderAr">نص توضيحي (بالعربية)</Label>
                    <Input
                      id="placeholderAr"
                      value={fieldFormData.placeholderAr || ''}
                      onChange={(e) => setFieldFormData({ ...fieldFormData, placeholderAr: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="defaultValue">القيمة الافتراضية</Label>
                    <Input
                      id="defaultValue"
                      value={fieldFormData.defaultValue || ''}
                      onChange={(e) => setFieldFormData({ ...fieldFormData, defaultValue: e.target.value })}
                    />
                  </div>
                  
                  {(fieldFormData.type === 'select' || fieldFormData.type === 'radio') && (
                    <div className="grid gap-2">
                      <Label>الخيارات</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newOption}
                          onChange={(e) => setNewOption(e.target.value)}
                          placeholder="أضف خيار جديد"
                        />
                        <Button type="button" variant="secondary" onClick={handleAddOption}>
                          إضافة
                        </Button>
                      </div>
                      
                      <div className="mt-2">
                        {fieldFormData.options?.map((option, index) => (
                          <div key={index} className="flex items-center gap-2 mt-1">
                            <span className="border px-3 py-1 rounded flex-1">{option}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveOption(index)}
                            >
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        
                        {!fieldFormData.options?.length && (
                          <p className="text-sm text-muted-foreground">لا توجد خيارات حتى الآن</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    className="w-full sm:w-auto"
                    disabled={createFieldMutation.isPending || updateFieldMutation.isPending}
                  >
                    {(createFieldMutation.isPending || updateFieldMutation.isPending) && (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    )}
                    {editingField ? 'تحديث الحقل' : 'إضافة الحقل'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>حقول القالب</CardTitle>
          <CardDescription>
            عدد الحقول: {fields?.length || 0}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fields?.length ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">الترتيب</TableHead>
                    <TableHead>اسم الحقل</TableHead>
                    <TableHead>عنوان الحقل</TableHead>
                    <TableHead className="text-center">النوع</TableHead>
                    <TableHead className="text-center">مطلوب</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field: TemplateField, index: number) => (
                    <TableRow key={field.id}>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span>{field.displayOrder}</span>
                          <div className="flex items-center mt-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={index === 0 || reorderFieldMutation.isPending}
                              onClick={() => reorderFieldMutation.mutate({ id: field.id, direction: 'up' })}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={index === fields.length - 1 || reorderFieldMutation.isPending}
                              onClick={() => reorderFieldMutation.mutate({ id: field.id, direction: 'down' })}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{field.name}</TableCell>
                      <TableCell>
                        <div>
                          <div>{field.label}</div>
                          {field.labelAr && (
                            <div className="text-xs text-muted-foreground">{field.labelAr}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {field.type === 'text' && 'نص قصير'}
                        {field.type === 'textarea' && 'نص طويل'}
                        {field.type === 'number' && 'رقم'}
                        {field.type === 'date' && 'تاريخ'}
                        {field.type === 'time' && 'وقت'}
                        {field.type === 'checkbox' && 'اختيار (نعم/لا)'}
                        {field.type === 'select' && 'قائمة منسدلة'}
                        {field.type === 'radio' && 'خيارات متعددة'}
                        {field.type === 'image' && 'صورة'}
                      </TableCell>
                      <TableCell className="text-center">
                        {field.required ? (
                          <span className="text-green-600">نعم</span>
                        ) : (
                          <span className="text-muted-foreground">لا</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(field)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => {
                              if (window.confirm('هل أنت متأكد من حذف هذا الحقل؟')) {
                                deleteFieldMutation.mutate(field.id);
                              }
                            }}
                            disabled={deleteFieldMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">لا توجد حقول للقالب. قم بإضافة بعض الحقول.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}