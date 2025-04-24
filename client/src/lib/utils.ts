import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string): string {
  // Format date to Arabic style
  const dateObj = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat('ar-SA', options).format(dateObj);
}

export function formatTime(time: string): string {
  // Format time (HH:MM) to Arabic style
  const [hours, minutes] = time.split(':');
  const timeObj = new Date();
  timeObj.setHours(parseInt(hours, 10));
  timeObj.setMinutes(parseInt(minutes, 10));
  
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  };
  
  return new Intl.DateTimeFormat('ar-SA', options).format(timeObj);
}

export function base64ToBlob(base64: string, type: string): Blob {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteArrays = [];

  for (let i = 0; i < byteCharacters.length; i++) {
    byteArrays.push(byteCharacters.charCodeAt(i));
  }

  const byteArray = new Uint8Array(byteArrays);
  return new Blob([byteArray], { type });
}

export function downloadImage(imageUrl: string, filename: string): Promise<void> {
  console.log(`Downloading image from: ${imageUrl}, filename: ${filename}`);
  
  // Handle case where imageUrl is a relative path
  const fullUrl = imageUrl.startsWith('http') 
    ? imageUrl 
    : `${window.location.origin}${imageUrl}`;
  
  console.log(`Full image URL: ${fullUrl}`);
  
  return new Promise<void>((resolve, reject) => {
    fetch(fullUrl)
      .then(response => {
        if (!response.ok) {
          console.error(`Error downloading image: ${response.status} ${response.statusText}`);
          throw new Error(`Error downloading image: ${response.status} ${response.statusText}`);
        }
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('Image download successful');
        resolve();
      })
      .catch(error => {
        console.error('Error downloading image:', error);
        alert('حدث خطأ أثناء تنزيل الصورة. يرجى المحاولة مرة أخرى.');
        reject(error);
      });
  });
}

export function getCategoryName(categorySlug: string): string {
  const categories: Record<string, string> = {
    'wedding': 'دعوات زفاف',
    'engagement': 'دعوات خطوبة',
    'graduation': 'تهنئة تخرج',
    'eid': 'بطاقات عيد',
    'ramadan': 'بطاقات رمضانية',
    'other': 'بطاقة مخصصة',
  };
  
  return categories[categorySlug] || 'بطاقة مخصصة';
}
