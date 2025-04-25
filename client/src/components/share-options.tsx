import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Share, Copy, Check, Printer, Mail, QrCode } from "lucide-react";
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";

interface ShareOptionsProps {
  cardId?: string;
  cardType?: 'card' | 'certificate';
  imageUrl?: string;
}

const ShareOptions = ({ cardId, cardType = 'card', imageUrl }: ShareOptionsProps) => {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [isShowingQR, setIsShowingQR] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  
  // Determine the view path based on the card type
  const viewPath = cardType === 'certificate' ? 'certificate' : 'view';
  const shareUrl = cardId ? `${window.location.origin}/${viewPath}/${cardId}` : window.location.href;
  
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
      case 'email':
        if (!emailAddress) {
          toast({
            title: "بريد إلكتروني مطلوب",
            description: "الرجاء إدخال عنوان بريد إلكتروني صحيح",
            variant: "destructive",
          });
          return;
        }
        shareLink = `mailto:${emailAddress}?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareText + ": " + shareUrl)}`;
        toast({
          title: "فتح تطبيق البريد الإلكتروني",
          description: "جاري فتح تطبيق البريد الإلكتروني لإرسال الرابط",
        });
        break;
      case 'print':
        if (imageUrl) {
          // Create a temporary window for printing only the image
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>${cardType === 'certificate' ? 'شهادة' : 'بطاقة'}</title>
                  <style>
                    body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
                    img { max-width: 100%; max-height: 100vh; object-fit: contain; }
                    @media print {
                      body { height: auto; }
                    }
                  </style>
                </head>
                <body>
                  <img src="${imageUrl}" alt="${cardType === 'certificate' ? 'شهادة' : 'بطاقة'}" onload="window.print(); window.close();" />
                </body>
              </html>
            `);
            printWindow.document.close();
          }
        } else {
          window.print();
        }
        return;
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
      case 'qrcode':
        setIsShowingQR(!isShowingQR);
        return;
    }
    
    if (shareLink) {
      console.log(`Opening share link: ${shareLink}`);
      window.open(shareLink, '_blank');
    }
  };

  // Function to download QR from Google Charts API
  const downloadQRCode = () => {
    const qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(shareUrl)}`;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qrcode-${cardType}-${cardId || 'share'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "تم تنزيل رمز QR",
      description: "تم تنزيل رمز QR كصورة",
    });
  };

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h4 className="text-lg font-medium text-neutral-800 mb-4">مشاركة {cardType === 'certificate' ? 'الشهادة' : 'البطاقة'}</h4>
      
      <div className="flex flex-wrap gap-4 justify-center mb-4">
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
          {isCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
        </Button>
        
        <Button
          onClick={() => handleShare('print')}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-600 text-white hover:opacity-90 transition-opacity"
          title="طباعة"
        >
          <Printer className="h-5 w-5" />
        </Button>
        
        <Button
          onClick={() => handleShare('qrcode')}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-900 text-white hover:opacity-90 transition-opacity"
          title="رمز QR"
        >
          <QrCode className="h-5 w-5" />
        </Button>
      </div>
      
      {/* رابط المشاركة */}
      <div className="mt-4">
        <h5 className="text-sm font-medium mb-2">رابط المشاركة</h5>
        <div className="flex">
          <Input 
            value={shareUrl} 
            readOnly 
            className="ml-2 text-sm"
          />
          <Button
            variant="outline"
            onClick={() => handleShare('copy')}
            title="نسخ الرابط"
          >
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* رمز QR */}
      {isShowingQR && (
        <div className="mt-4" ref={qrRef}>
          <h5 className="text-sm font-medium mb-2">رمز QR للمشاركة</h5>
          <div className="bg-white p-4 rounded-lg flex flex-col items-center">
            <img 
              src={`https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(shareUrl)}`}
              alt="QR Code"
              className="w-48 h-48 object-contain"
            />
            <Button 
              variant="outline" 
              className="mt-2" 
              onClick={downloadQRCode}
              size="sm"
            >
              تحميل رمز QR
            </Button>
          </div>
        </div>
      )}
      
      {/* مشاركة عبر البريد الإلكتروني */}
      <div className="mt-4">
        <h5 className="text-sm font-medium mb-2">مشاركة عبر البريد الإلكتروني</h5>
        <div className="flex">
          <Input
            type="email"
            placeholder="example@example.com"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            className="ml-2"
          />
          <Button
            variant="outline"
            onClick={() => handleShare('email')}
            disabled={!emailAddress}
            title="إرسال بريد إلكتروني"
          >
            <Mail className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShareOptions;
