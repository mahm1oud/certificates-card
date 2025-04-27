import { useParams, useLocation } from "wouter";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import ShareOptions from "@/components/share-options";
import { downloadImage } from "@/lib/utils";
import { Loader2, Eye, Download, X, RefreshCw, Save, Trash } from "lucide-react";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import KonvaImageGenerator from "@/components/konva-image-generator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// تعريف نوع البطاقة
interface Card {
  id: number;
  publicId: string;
  templateId: number;
  categoryId: number;
  imageUrl: string;
  thumbnailUrl?: string;
  formData?: Record<string, any>;
  status: string;
  template?: {
    id: number;
    title: string;
    titleAr?: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    category?: {
      id: number;
      name: string;
      nameAr?: string;
      slug: string;
    }
  };
  category?: {
    id: number;
    name: string;
    nameAr?: string;
    slug: string;
  };
}

interface TemplateField {
  id: number;
  name: string;
  label: string;
  labelAr?: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  placeholder?: string;
  options?: any[];
  position?: { x: number; y: number };
  style?: Record<string, any>;
}

const CardPreview = () => {
  const params = useParams();
  const { category, templateId, cardId } = params;
  console.log("URL Params:", params);
  const [_, setLocation] = useLocation();
  const [isShareOptionsVisible, setIsShareOptionsVisible] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [hasRegenerated, setHasRegenerated] = useState(false);
  
  // استخدام React Query لجلب بيانات البطاقة
  const { data: card, isLoading: isLoadingCard, error: cardError } = useQuery<Card>({
    queryKey: [`/api/cards/${cardId}`],
    queryFn: getQueryFn<Card>({ on401: "redirect-to-login" }),
    enabled: !!cardId,
    retry: 1
  });

  // جلب حقول القالب (باستخدام المسار العام الذي لا يتطلب مصادقة)
  const { data: templateFields = [], isLoading: isLoadingFields } = useQuery<TemplateField[]>({
    queryKey: [`/api/templates/${card?.templateId}/public-fields`],
    queryFn: getQueryFn<TemplateField[]>({ on401: "returnNull" }),
    enabled: !!card?.templateId,
    retry: 3,
    staleTime: 60000 // تخزين مؤقت لمدة دقيقة واحدة لتجنب التحميل المتكرر
  });
  
  // تسجيل وصول للتشخيص
  useEffect(() => {
    if (card) {
      console.log("Card data loaded:", {
        id: card.id,
        publicId: card.publicId,
        templateId: card.templateId,
        imageUrl: card.imageUrl,
        formData: card.formData
      });
    }
  }, [card]);
  
  useEffect(() => {
    if (templateFields && templateFields.length > 0) {
      console.log("Template fields loaded:", templateFields);
    } else if (card?.templateId) {
      console.log("No template fields found for template ID:", card.templateId);
    }
  }, [templateFields, card?.templateId]);

  // التحقق من الصورة وتوليدها إذا لزم الأمر
  useEffect(() => {
    if (card && card.imageUrl) {
      // التحقق من صحة رابط الصورة
      fetch(card.imageUrl, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            console.log("Image URL not valid, will regenerate");
            setPreviewUrl(null);
          } else {
            setPreviewUrl(card.imageUrl);
          }
        })
        .catch(() => {
          console.log("Error fetching image, will regenerate");
          setPreviewUrl(null);
        });
    } else {
      setPreviewUrl(null);
    }
  }, [card]);

  // توليد صورة البطاقة
  const handleImageGenerated = async (imageDataUrl: string) => {
    try {
      console.log("Image generated successfully, data URL length:", imageDataUrl.length);
      setIsLoadingImage(false);
      setPreviewUrl(imageDataUrl);

      // حفظ الصورة الجديدة على الخادم إذا تم إعادة التوليد
      if (isRegenerating && card) {
        console.log("Uploading regenerated image to server...");
        
        try {
          const response = await apiRequest<{ success: boolean; imageUrl: string }>(
            'POST',
            `/api/cards/${card.id}/update-image`,
            { imageData: imageDataUrl },
            { 
              timeout: 20000, // زيادة زمن الانتظار إلى 20 ثانية
            }
          );

          if (response && response.imageUrl) {
            console.log("Image updated successfully, new URL:", response.imageUrl);
            
            // تحديث التخزين المؤقت
            queryClient.setQueryData<Card>([`/api/cards/${cardId}`], (oldData) => {
              return oldData ? {
                ...oldData,
                imageUrl: response.imageUrl
              } : oldData;
            });
            
            setPreviewUrl(response.imageUrl);
            
            toast({
              title: "تم تحديث الصورة",
              description: "تم إعادة توليد صورة البطاقة بنجاح"
            });
          } else {
            // إذا نجح الطلب ولكن لم يتم استلام عنوان URL جديد
            console.warn("Image update succeeded but no URL returned");
            // الاستمرار في استخدام عنوان URL المؤقت
          }
        } catch (uploadError) {
          console.error("Error uploading regenerated image:", uploadError);
          // لا نريد إظهار خطأ للمستخدم هنا لأن الصورة المولدة ستستخدم محليًا على أي حال
          console.log("Using locally generated image as fallback");
        }
        
        setIsRegenerating(false);
        setHasRegenerated(true);
      }
    } catch (error) {
      console.error("Error in image generation process:", error);
      setIsLoadingImage(false);
      setIsRegenerating(false);
      
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث صورة البطاقة",
        variant: "destructive"
      });
    }
  };

  // معالجة أخطاء توليد الصورة
  const handleImageError = (error: Error) => {
    console.error("Error generating image:", error);
    setIsLoadingImage(false);
    setIsRegenerating(false);
    
    toast({
      title: "خطأ في توليد الصورة",
      description: error.message || "حدث خطأ أثناء توليد صورة البطاقة",
      variant: "destructive"
    });
  };

  // إعادة توليد الصورة
  const handleRegenerateImage = () => {
    setIsRegenerating(true);
    setPreviewUrl(null); // إزالة الصورة الحالية
  };

  const handleViewFullCard = () => {
    // استخدام المعرف العام (publicId) بدلاً من معرف البطاقة الداخلي
    if (card && card.publicId) {
      console.log(`Navigating to view card with publicId: ${card.publicId}`);
      setLocation(`/view/${card.publicId}`);
    } else {
      console.error("Cannot view card: missing publicId");
    }
  };

  // إضافة خيارات الجودة
  const [selectedQuality, setSelectedQuality] = useState<'low' | 'medium' | 'high' | 'download'>('medium');
  const [showQualitySelector, setShowQualitySelector] = useState(false);

  // حفظ البطاقة
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  
  // حفظ البطاقة في نماذجي
  const saveCardMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/cards/${card?.id}/save`, {});
      return response;
    },
    onSuccess: () => {
      toast({
        title: "تم الحفظ",
        description: "تم حفظ البطاقة في نماذجك بنجاح",
      });
      setIsSaveDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "خطأ في الحفظ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء حفظ البطاقة",
        variant: "destructive"
      });
    }
  });

  // حذف البطاقة
  const deleteCardMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/cards/${card?.id}`, {});
      return response;
    },
    onSuccess: () => {
      toast({
        title: "تم الحذف",
        description: "تم حذف البطاقة بنجاح",
      });
      setIsSaveDialogOpen(false);
      setLocation(`/cards/${category || 'other'}/${templateId}`);
    },
    onError: (error) => {
      toast({
        title: "خطأ في الحذف",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء حذف البطاقة",
        variant: "destructive"
      });
    }
  });

  // تنزيل البطاقة بجودة محددة
  const downloadCardMutation = useMutation({
    mutationFn: async (quality: 'low' | 'medium' | 'high' | 'download') => {
      const response = await apiRequest('POST', `/api/cards/${card?.id}/download`, {
        quality
      });
      return response;
    },
    onSuccess: (data) => {
      if (data?.imageUrl) {
        const fileName = `بطاقة-${card?.id || 'custom'}-${selectedQuality}.png`;
        downloadImage(data.imageUrl, fileName);
      } else {
        handleFallbackDownload();
      }
    },
    onError: () => {
      handleFallbackDownload();
    }
  });

  // تنزيل احتياطي إذا فشلت عملية التنزيل بالجودة المحددة
  const handleFallbackDownload = () => {
    const imageToDownload = previewUrl || (card && card.imageUrl);
    
    if (imageToDownload) {
      const fileName = `بطاقة-${card?.id || 'custom'}.png`;
      downloadImage(imageToDownload, fileName);
    } else {
      toast({
        title: "تعذر التحميل",
        description: "الصورة غير متوفرة للتحميل حالياً",
        variant: "destructive"
      });
    }
  };

  // التنزيل مع خيارات الجودة
  const handleDownloadCard = () => {
    if (showQualitySelector) {
      // استخدام الجودة المحددة
      downloadCardMutation.mutate(selectedQuality);
      setShowQualitySelector(false);
    } else {
      // عرض خيارات الجودة
      setShowQualitySelector(true);
    }
  };

  const isLoading = isLoadingCard || isLoadingFields || (previewUrl === null && !cardError);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto mx-4 p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          جاري تحميل البطاقة...
        </div>
      </div>
    );
  }

  if (cardError || !card) {
    return (
      <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto mx-4 p-6 text-center">
          <p className="text-red-500 mb-4">حدث خطأ أثناء تحميل البطاقة</p>
          <Button onClick={() => window.history.back()}>العودة</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto mx-4">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-neutral-800">معاينة البطاقة</h3>
          <Button
            variant="ghost"
            size="icon"
            className="text-neutral-500 hover:text-neutral-700"
            onClick={() => setLocation(`/cards/${category || 'other'}/${templateId}`)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-6">
          <div className="bg-gray-100 rounded-lg p-4 flex justify-center">
            <div className="relative w-full max-w-md overflow-hidden">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt={card.template?.title || "البطاقة المخصصة"} 
                  className="w-full h-auto object-contain rounded-md shadow-md max-h-[80vh]"
                  style={{ aspectRatio: '3/4' }}
                  loading="lazy"
                />
              ) : (
                // إذا لم تكن هناك صورة متاحة، استخدم Konva لتوليد واحدة
                <div className="rounded-md shadow-md bg-white" style={{ aspectRatio: '3/4' }}>
                  <KonvaImageGenerator
                    templateImage={card.template?.imageUrl || ''}
                    fields={templateFields}
                    formData={card.formData || {}}
                    width={400}
                    height={600}
                    onImageGenerated={handleImageGenerated}
                    onError={handleImageError}
                    className="max-h-[80vh]"
                  />
                </div>
              )}
              
              {/* زر إعادة توليد الصورة */}
              {!isRegenerating && !isLoadingImage && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute bottom-2 right-2 opacity-80 hover:opacity-100"
                  onClick={handleRegenerateImage}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  إعادة توليد
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-4 mt-8">
            {/* أزرار الإجراءات الرئيسية */}
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                variant="default"
                onClick={handleViewFullCard}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                عرض البطاقة
              </Button>
              
              {showQualitySelector ? (
                <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-md">
                  <Select value={selectedQuality} onValueChange={(value: any) => setSelectedQuality(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="اختر الجودة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">جودة منخفضة</SelectItem>
                      <SelectItem value="medium">جودة متوسطة</SelectItem>
                      <SelectItem value="high">جودة عالية</SelectItem>
                      <SelectItem value="download">أقصى جودة</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="secondary" 
                    onClick={handleDownloadCard}
                    disabled={downloadCardMutation.isPending}
                  >
                    {downloadCardMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    تنزيل
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  onClick={handleDownloadCard}
                  className="flex items-center gap-2"
                  disabled={!previewUrl && !card.imageUrl}
                >
                  <Download className="h-4 w-4" />
                  تحميل البطاقة
                </Button>
              )}
              
              <ShareOptions 
                cardId={card.id || card.publicId} 
                imageUrl={previewUrl || card.imageUrl} 
              />
            </div>
            
            {/* أزرار الحفظ والحذف */}
            <div className="flex flex-wrap gap-4 justify-center border-t border-gray-200 pt-4 mt-2">
              <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    حفظ البطاقة
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>حفظ البطاقة</DialogTitle>
                    <DialogDescription>
                      هل ترغب في حفظ هذه البطاقة في نماذجك للرجوع إليها لاحقاً؟
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsSaveDialogOpen(false)}
                    >
                      إلغاء
                    </Button>
                    <Button 
                      onClick={() => saveCardMutation.mutate()}
                      disabled={saveCardMutation.isPending}
                    >
                      {saveCardMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      حفظ البطاقة
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-2 text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => deleteCardMutation.mutate()}
                disabled={deleteCardMutation.isPending}
              >
                {deleteCardMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash className="h-4 w-4" />
                )}
                عدم الحفظ
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardPreview;
