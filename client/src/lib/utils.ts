import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { saveAs } from 'file-saver';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// وظيفة للحصول على اسم التصنيف
export function getCategoryName(id: number | string, categories: any[] = []): string {
  if (!categories.length) return '';
  
  const category = categories.find(cat => cat.id.toString() === id.toString());
  return category ? category.name : '';
}

// وظيفة لتنزيل صورة من URL
export async function downloadImage(url: string, filename: string = 'image.png'): Promise<void> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}