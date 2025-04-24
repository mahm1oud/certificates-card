import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ShareOptions from "@/components/share-options";
import { downloadImage } from "@/lib/utils";
import { Loader2, Eye, Download, Share2, X } from "lucide-react";

const CardPreview = () => {
  const { cardId } = useParams();
  const [_, setLocation] = useLocation();
  const [isShareOptionsVisible, setIsShareOptionsVisible] = useState(false);
  
  const { data: card, isLoading, error } = useQuery({
    queryKey: [`/api/cards/${cardId}`],
  });

  const handleViewFullCard = () => {
    setLocation(`/view/${cardId}`);
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
            onClick={() => setLocation(`/cards/${card.category?.slug || 'other'}/${card.templateId}`)}
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
          
          {isShareOptionsVisible && (
            <ShareOptions cardId={cardId} />
          )}
        </div>
      </div>
    </div>
  );
};

export default CardPreview;
