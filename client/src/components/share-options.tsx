import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Share, Copy, Check } from "lucide-react";
import { useState } from "react";

interface ShareOptionsProps {
  cardId: string;
  cardType?: 'card' | 'certificate';
}

const ShareOptions = ({ cardId, cardType = 'card' }: ShareOptionsProps) => {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  
  // Determine the view path based on the card type
  const viewPath = cardType === 'certificate' ? 'certificate' : 'view';
  const shareUrl = `${window.location.origin}/${viewPath}/${cardId}`;
  
  console.log(`Share URL for ${cardType}: ${shareUrl}`);
  
  const handleShare = (platform: string) => {
    let shareLink = '';
    const shareText = cardType === 'certificate' 
      ? 'شارك هذه الشهادة' 
      : 'شارك هذه البطاقة';
    
    switch (platform) {
      case 'whatsapp':
        shareLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ": " + shareUrl)}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl).then(() => {
          setIsCopied(true);
          toast({
            title: "تم نسخ الرابط",
            description: `تم نسخ رابط ال${cardType === 'certificate' ? 'شهادة' : 'بطاقة'} إلى الحافظة`,
          });
          
          setTimeout(() => {
            setIsCopied(false);
          }, 2000);
        });
        return;
    }
    
    console.log(`Opening share link: ${shareLink}`);
    window.open(shareLink, '_blank');
  };

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h4 className="text-lg font-medium text-neutral-800 mb-4">مشاركة البطاقة عبر</h4>
      
      <div className="flex flex-wrap gap-4 justify-center">
        <Button
          onClick={() => handleShare('whatsapp')}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-[#25D366] text-white hover:opacity-90 transition-opacity"
          title="WhatsApp"
        >
          <i className="fab fa-whatsapp text-xl"></i>
        </Button>
        
        <Button
          onClick={() => handleShare('facebook')}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-[#1877F2] text-white hover:opacity-90 transition-opacity"
          title="Facebook"
        >
          <i className="fab fa-facebook-f text-xl"></i>
        </Button>
        
        <Button
          onClick={() => handleShare('twitter')}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-[#1DA1F2] text-white hover:opacity-90 transition-opacity"
          title="Twitter"
        >
          <i className="fab fa-twitter text-xl"></i>
        </Button>
        
        <Button
          onClick={() => handleShare('linkedin')}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-[#0A66C2] text-white hover:opacity-90 transition-opacity"
          title="LinkedIn"
        >
          <i className="fab fa-linkedin-in text-xl"></i>
        </Button>
        
        <Button
          onClick={() => handleShare('copy')}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-700 text-white hover:opacity-90 transition-opacity"
          title="نسخ الرابط"
        >
          <i className="fas fa-link text-xl"></i>
        </Button>
      </div>
    </div>
  );
};

export default ShareOptions;
