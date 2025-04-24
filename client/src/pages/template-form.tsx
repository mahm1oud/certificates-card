import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import WeddingForm from "@/components/forms/wedding-form";
import EngagementForm from "@/components/forms/engagement-form";
import GraduationForm from "@/components/forms/graduation-form";
import EidForm from "@/components/forms/eid-form";
import RamadanForm from "@/components/forms/ramadan-form";
import { apiRequest } from "@/lib/queryClient";
import { getCategoryName } from "@/lib/utils";

const TemplateForm = () => {
  const { category, templateId } = useParams();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: template, isLoading } = useQuery({
    queryKey: [`/api/templates/${category}/${templateId}`],
    enabled: !!category && !!templateId,
    retry: 3,
    onError: (error) => {
      console.error("Error fetching template:", error);
      toast({
        title: "خطأ في تحميل القالب",
        description: "حدث خطأ أثناء تحميل القالب، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  });
  
  const [formData, setFormData] = useState({});

  const handleFormChange = (data: any) => {
    setFormData(data);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await apiRequest('POST', '/api/cards/generate', {
        templateId,
        category,
        formData
      });
      
      const data = await response.json();
      
      setLocation(`/preview/${category}/${templateId}/${data.cardId}`);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء البطاقة، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
      console.error(error);
    }
  };

  const renderFormByCategory = () => {
    if (isLoading) {
      return <div className="p-6 text-center">جاري تحميل القالب...</div>;
    }
    
    if (!template) {
      console.error("Template not loaded for category:", category, "templateId:", templateId);
      return (
        <div className="p-6 text-center bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-500 mb-2">تعذر تحميل القالب</p>
          <p className="text-sm text-gray-600">
            حدث خطأ أثناء تحميل القالب، الرجاء العودة واختيار قالب آخر.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setLocation("/")}
          >
            العودة إلى القوالب
          </Button>
        </div>
      );
    }

    // تحديد نوع النموذج المناسب
    let CategoryForm;
    switch (category) {
      case "wedding":
        CategoryForm = WeddingForm;
        break;
      case "engagement":
        CategoryForm = EngagementForm;
        break;
      case "graduation":
        CategoryForm = GraduationForm;
        break;
      case "eid":
        CategoryForm = EidForm;
        break;
      case "ramadan":
        CategoryForm = RamadanForm;
        break;
      case "other":
        // استخدام نموذج الزفاف كافتراضي للفئة "other"
        CategoryForm = WeddingForm;
        break;
      default:
        // إذا لم نجد نموذج مناسب، استخدم واحد افتراضي
        CategoryForm = WeddingForm;
    }

    // تأكد من وجود النموذج قبل عرضه
    if (CategoryForm) {
      return <CategoryForm onChange={handleFormChange} template={template} />;
    }

    return (
      <div className="p-6 text-center">
        نوع البطاقة غير مدعوم. الرجاء العودة واختيار قالب آخر.
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Button
        variant="ghost"
        className="mb-6 flex items-center text-primary hover:text-primary/80 font-medium"
        onClick={() => setLocation("/")}
      >
        <i className="fas fa-arrow-right ml-2"></i>
        العودة إلى القوالب
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Template preview */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="relative pb-[140%]">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">جاري التحميل...</div>
            ) : (
              <img 
                src={template?.imageUrl} 
                alt={template?.title} 
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}
          </div>
        </div>
        
        {/* Form inputs */}
        <div>
          <h2 className="text-2xl font-bold text-neutral-800 mb-6">
            تخصيص بطاقة {getCategoryName(category || '')}
          </h2>
          
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {renderFormByCategory()}
            
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full px-6 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                معاينة البطاقة
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TemplateForm;
