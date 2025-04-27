import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Copy, 
  Share2, 
  Loader2,
  Check,
  Download
} from 'lucide-react';
import { SocialMediaFormats, type SocialMediaFormat } from './social-media-formats';
import { useTranslation } from '@/lib/i18n';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { downloadImage } from '@/lib/utils';

interface ShareOptionsProps {
  cardId: string | number;
  imageUrl: string;
}

const ShareOptions: React.FC<ShareOptionsProps> = ({ cardId, imageUrl }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('instagram');
  const [selectedFormatData, setSelectedFormatData] = useState<SocialMediaFormat | null>(null);
  const [socialImageUrl, setSocialImageUrl] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  
  // Mutation for generating social media image
  const { mutate, isPending } = useMutation({
    mutationFn: async ({ format }: { format: string }) => {
      return apiRequest('POST', `/api/cards/${cardId}/social`, {
        format,
        options: {
          quality: 'high',
          watermark: false
        }
      });
    },
    onSuccess: (data) => {
      if (data && data.imageUrl) {
        setSocialImageUrl(data.imageUrl);
      }
    }
  });
  
  // Handle format selection
  const handleFormatSelect = React.useCallback((format: string, formatData: SocialMediaFormat) => {
    setSelectedFormat(format);
    setSelectedFormatData(formatData);
    setSocialImageUrl(null);
    
    // Generate social media image for the selected format
    mutate({ format });
  }, [mutate]);
  
  // Handle copy link
  const handleCopyLink = () => {
    if (socialImageUrl) {
      const fullUrl = `${window.location.origin}${socialImageUrl}`;
      navigator.clipboard.writeText(fullUrl)
        .then(() => {
          setCopyStatus('copied');
          setTimeout(() => setCopyStatus('idle'), 3000);
        })
        .catch(error => {
          console.error('Could not copy text: ', error);
        });
    }
  };
  
  // Handle download
  const handleDownload = () => {
    if (socialImageUrl) {
      const fileName = `card-${selectedFormat}-${cardId}.png`;
      downloadImage(socialImageUrl, fileName);
    }
  };
  
  // Share to social networks
  const shareToFacebook = () => {
    if (socialImageUrl) {
      const url = encodeURIComponent(`${window.location.origin}${socialImageUrl}`);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    }
  };
  
  const shareToTwitter = () => {
    if (socialImageUrl) {
      const url = encodeURIComponent(`${window.location.origin}${socialImageUrl}`);
      const text = encodeURIComponent(t('share.twitterText'));
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => setIsOpen(true)}
      >
        <Share2 className="h-4 w-4" />
        {t('share.share')}
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('share.title')}</DialogTitle>
            <DialogDescription>
              {t('share.description')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <SocialMediaFormats 
              onFormatSelect={handleFormatSelect}
              selectedFormat={selectedFormat}
              cardImageUrl={imageUrl}
            />
            
            {isPending && (
              <div className="flex justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
            
            {socialImageUrl && !isPending && (
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <div className="text-sm font-medium mb-2">{t('share.preview')}</div>
                  <div className="flex justify-center">
                    <img 
                      src={socialImageUrl} 
                      alt="Social Media Version" 
                      className="max-w-full max-h-[300px] object-contain" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={handleCopyLink}
                  >
                    {copyStatus === 'copied' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copyStatus === 'copied' ? t('share.copied') : t('share.copyLink')}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                    {t('share.download')}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-[#1877F2] text-white hover:bg-[#0b5ed7]"
                    onClick={shareToFacebook}
                  >
                    <Facebook className="h-4 w-4" />
                    {t('share.facebook')}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-[#1DA1F2] text-white hover:bg-[#0c85d0]"
                    onClick={shareToTwitter}
                  >
                    <Twitter className="h-4 w-4" />
                    {t('share.twitter')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareOptions;