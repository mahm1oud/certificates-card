import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ShareOptions from "@/components/share-options";
import { downloadImage } from "@/lib/utils";
import { Loader2, Eye, Download, Share2, X } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";

// تعريف نوع البطاقة
interface Card {
  id: number;
  publicId: string;
  templateId: number;
  categoryId: number;
  imageUrl: string;
  thumbnailUrl?: string;
  status: string;
  template?: {
    id: number;
    title: string;
    titleAr?: string;
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

const CardPreview = () => {
  const params = useParams();
  const { category, templateId, cardId } = params;
  console.log("URL Params:", params);
  const [_, setLocation] = useLocation();
  const [isShareOptionsVisible, setIsShareOptionsVisible] = useState(false);
  
  // استخدام React Query لجلب بيانات البطاقة باستخدام الاستدعاء المباشر للحصول على استجابة JSON فقط
  // في حالة استخدام fetch، يمكن تسليم HTML بدلاً من JSON إذا كان المصدر هو الصفحة المعروضة
  const fetchCard = async (id: string) => {
    try {
      // إضافة معلمة timestamp لتفادي التخزين المؤقت
      const timestamp = new Date().getTime();
      const url = `/api/cards/${id}?_=${timestamp}`;
      console.log("Fetching card data from URL:", url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log("API Response Status:", response.status);
      console.log("API Response Headers:", JSON.stringify(Object.fromEntries([...response.headers]), null, 2));
      
      if (!response.ok) {
        console.error("API Error:", response.status, response.statusText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      // التحقق من نوع المحتوى
      const contentType = response.headers.get('content-type');
      console.log("Content-Type:", contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        console.error("Invalid content type", contentType);
        throw new Error("استجابة الخادم ليست من نوع JSON");
      }
      
      const data = await response.json();
      console.log("Card Data:", JSON.stringify(data, null, 2));
      
      if (!data || typeof data !== 'object') {
        console.error("Invalid card data format:", data);
        throw new Error("صيغة بيانات البطاقة غير صالحة");
      }
      
      if (!data.imageUrl) {
        console.error("Card data missing imageUrl:", data);
        throw new Error("بيانات البطاقة غير مكتملة: رابط الصورة مفقود");
      }
      
      return data as Card;
    } catch (err) {
      console.error("Error fetching card:", err);
      throw err;
    }
  };
  
  // استخدام useQuery مع وظيفة الاستدعاء المخصصة
  const { data: card, isLoading, error } = useQuery({
    queryKey: [`card-${cardId}`],
    queryFn: () => fetchCard(cardId || ''),
    enabled: !!cardId,
    retry: 1
  });

  const handleViewFullCard = () => {
    // استخدام المعرف العام (publicId) بدلاً من معرف البطاقة الداخلي
    if (card && card.publicId) {
      console.log(`Navigating to view card with publicId: ${card.publicId}`);
      setLocation(`/view/${card.publicId}`);
    } else {
      console.error("Cannot view card: missing publicId");
    }
  };

  const handleDownloadCard = () => {
    if (card) {
      const fileName = `بطاقة-${card.id || 'custom'}.png`;
      downloadImage(card.imageUrl, fileName);
    }
  };

  const toggleShareOptions = () => {
    setIsShareOptionsVisible(!isShareOptionsVisible);
  };

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

  if (error || !card) {
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
            <div className="relative w-full max-w-md">
              <img 
                src={card.imageUrl} 
                alt={card.template?.title || "البطاقة المخصصة"} 
                className="w-full h-auto rounded-md shadow-md"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <Button 
              variant="default"
              onClick={handleViewFullCard}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              عرض البطاقة
            </Button>
            
            <Button
              variant="secondary"
              onClick={handleDownloadCard}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              تحميل البطاقة
            </Button>
            
            <Button
              variant="outline"
              onClick={toggleShareOptions}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              مشاركة البطاقة
            </Button>
          </div>
          
          {isShareOptionsVisible && cardId && (
            <ShareOptions cardId={cardId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default CardPreview;
