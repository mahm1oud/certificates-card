/**
 * مولد صور محسّن للبطاقات والشهادات
 * الإصدار 3.0 - أبريل 2025
 * 
 * ميزات هذا المولد المحسن:
 * 1. يضمن تطابق 100% بين معاينة المحرر والصورة النهائية
 * 2. يستخدم معامل قياس (Scaling Factor) للتعويض عن فرق الحجم بين الواجهة والسيرفر
 * 3. كود أكثر إيجازاً وأسهل للصيانة
 * 4. يدعم المرونة في ضبط أبعاد الصورة الناتجة
 */

import { createCanvas, loadImage } from 'canvas';
import sharp from 'sharp';
import type { Template } from "@shared/schema";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { formatDate, formatTime } from "./lib/utils";

// أنماط خطوط عربية
const ARABIC_FONTS = {
  CAIRO: 'Cairo',
  CAIRO_BOLD: 'Cairo Bold',
  TAJAWAL: 'Tajawal',
  TAJAWAL_BOLD: 'Tajawal Bold',
  AMIRI: 'Amiri',
  AMIRI_BOLD: 'Amiri Bold',
};

interface FieldConfig {
  name: string;
  position: { x: number; y: number };
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    align?: 'left' | 'center' | 'right';
    verticalPosition?: 'top' | 'middle' | 'bottom';
    maxWidth?: number;
    textShadow?: {
      enabled?: boolean;
      color?: string;
      blur?: number;
    };
  };
  defaultValue?: string;
  label?: string;
}

interface GenerateCardOptions {
  templatePath: string;
  fields: FieldConfig[];
  formData: Record<string, any>;
  outputWidth?: number;
  outputHeight?: number;
  quality?: 'preview' | 'low' | 'medium' | 'high' | 'download';
  outputFormat?: 'png' | 'jpeg';
}

/**
 * تحسين الصورة باستخدام مكتبة Sharp بشكل أكثر كفاءة
 * 
 * @param buffer بيانات الصورة
 * @param quality جودة الصورة
 * @param format تنسيق الصورة
 * @returns بيانات الصورة المحسنة
 */
async function optimizeImage(
  buffer: Buffer, 
  quality: 'preview' | 'low' | 'medium' | 'high' | 'download' = 'high', 
  format: 'png' | 'jpeg' = 'png'
): Promise<Buffer> {
  // تحديد جودة حسب الإعداد المطلوب
  let outputQuality = 80;
  
  switch (quality) {
    case 'preview': 
      outputQuality = 50; break;
    case 'low': 
      outputQuality = 70; break;
    case 'medium': 
      outputQuality = 80; break;
    case 'high': 
    case 'download': 
      outputQuality = 95; break;
  }
  
  // استخدام Sharp لضغط الصورة وتحسينها
  let sharpImg = sharp(buffer);
  
  if (format === 'jpeg') {
    sharpImg = sharpImg.jpeg({ quality: outputQuality });
  } else {
    // استخدام PNG للجودة العالية والشفافية
    sharpImg = sharpImg.png({ quality: outputQuality });
  }
  
  // ضبط الحدة والتباين للحصول على صورة واضحة
  if (quality !== 'preview') {
    sharpImg = sharpImg.sharpen();
  }
  
  return await sharpImg.toBuffer();
}

/**
 * توليد صورة بطاقة أو شهادة مع ضمان التطابق مع معاينة المحرر
 * 
 * @param options خيارات توليد الصورة
 * @returns مسار الصورة المولدة
 */
export async function generateOptimizedCardImage({
  templatePath,
  fields,
  formData,
  outputWidth = 1200,
  outputHeight = 1600,
  quality = 'high',
  outputFormat = 'png'
}: GenerateCardOptions): Promise<string> {
  // تحميل صورة القالب
  const templateImage = await loadImage(templatePath);
  
  // إنشاء كانفاس بالأبعاد المطلوبة
  const canvas = createCanvas(outputWidth, outputHeight);
  const ctx = canvas.getContext('2d');
  
  // رسم خلفية القالب
  ctx.drawImage(templateImage, 0, 0, outputWidth, outputHeight);
  
  // حساب معامل القياس لضمان التطابق بين معاينة الواجهة والسيرفر
  const clientBaseWidth = 800; // عرض الكانفاس الافتراضي في واجهة Konva
  const scaleFactor = outputWidth / clientBaseWidth;
  console.log(`Using font scale factor: ${scaleFactor} (Server canvas: ${outputWidth}px, Client preview: ${clientBaseWidth}px)`);
  
  // إعداد سياق الرسم للنص
  ctx.textBaseline = 'middle';
  
  // رسم جميع الحقول
  const fieldsMap = new Map(fields.map(field => [field.name, field]));
  
  Object.entries(formData).forEach(([fieldName, value]) => {
    if (!value || typeof value !== 'string') return;
    
    const field = fieldsMap.get(fieldName);
    if (!field) return;
    
    // حفظ حالة السياق الحالية
    ctx.save();
    
    // استخراج إعدادات النمط
    const style = field.style || {};
    
    // استخراج خصائص الخط مع تطبيق معامل القياس
    const originalFontSize = style.fontSize || 24;
    const fontSize = Math.round(originalFontSize * scaleFactor);
    const fontWeight = style.fontWeight || '';
    const fontFamily = style.fontFamily || 'Cairo';
    
    // إنشاء سلسلة الخط
    let fontString = '';
    if (fontFamily === 'Amiri') {
      fontString = fontWeight === 'bold' 
        ? `bold ${fontSize}px ${ARABIC_FONTS.AMIRI_BOLD}`
        : `${fontSize}px ${ARABIC_FONTS.AMIRI}`;
    } else if (fontFamily === 'Tajawal') {
      fontString = fontWeight === 'bold'
        ? `bold ${fontSize}px ${ARABIC_FONTS.TAJAWAL_BOLD}`
        : `${fontSize}px ${ARABIC_FONTS.TAJAWAL}`;
    } else {
      fontString = fontWeight === 'bold'
        ? `bold ${fontSize}px ${ARABIC_FONTS.CAIRO_BOLD}`
        : `${fontSize}px ${ARABIC_FONTS.CAIRO}`;
    }
    
    // تطبيق الخط
    ctx.font = fontString;
    console.log(`Field ${fieldName} font: ${fontString} (original: ${originalFontSize}px, scaled: ${fontSize}px)`);
    
    // تطبيق لون النص
    if (style.color) {
      ctx.fillStyle = style.color;
    }
    
    // تطبيق محاذاة النص
    if (style.align) {
      ctx.textAlign = style.align as CanvasTextAlign;
    } else {
      ctx.textAlign = 'center';
    }
    
    // حساب موضع النص بنفس طريقة Konva
    const xPercent = field.position.x || 50;
    const yPercent = field.position.y || 50;
    
    // تحويل النسب المئوية إلى بكسل
    const posX = Math.round((xPercent / 100) * outputWidth);
    const posY = Math.round((yPercent / 100) * outputHeight);
    
    // تطبيق ظل النص إذا كان مطلوباً
    if (style.textShadow?.enabled) {
      ctx.shadowColor = style.textShadow.color || 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = style.textShadow.blur || 3;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
    
    // حساب العرض الأقصى للنص
    const maxWidth = style.maxWidth
      ? Math.round((style.maxWidth / 100) * outputWidth)
      : Math.round(outputWidth - 100);
    
    // تطبيق لف النص
    const text = value as string;
    const lines = wrapText(ctx, text, maxWidth, fontSize);
    
    // حساب ارتفاع السطر والنص الكامل
    const lineHeightFactor = 1.3;
    const lineHeight = Math.round(fontSize * lineHeightFactor);
    const totalTextHeight = lineHeight * lines.length;
    
    // ضبط موضع البداية حسب المحاذاة العمودية
    let currentY = posY;
    
    if (style.verticalPosition === 'middle') {
      currentY = Math.round(posY - (totalTextHeight / 2) + (lineHeight / 2));
    } else if (style.verticalPosition === 'bottom') {
      currentY = Math.round(posY - totalTextHeight);
    }
    
    // رسم كل سطر
    for (const line of lines) {
      ctx.fillText(line, posX, currentY);
      currentY += lineHeight;
    }
    
    // استعادة سياق الرسم
    ctx.restore();
  });
  
  // توليد اسم فريد للملف
  const hash = crypto.createHash('md5')
    .update(JSON.stringify(formData) + Date.now())
    .digest('hex')
    .slice(0, 10);
  
  const outputFileName = `${hash}-${quality}.${outputFormat}`;
  const outputDir = path.resolve('./uploads/generated');
  
  // التأكد من وجود المجلد
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, outputFileName);
  
  // تحويل الكانفاس إلى بيانات ثنائية
  const buffer = canvas.toBuffer();
  
  // تحسين وضغط الصورة حسب إعدادات الجودة
  const optimizedBuffer = await optimizeImage(buffer, quality, outputFormat);
  
  // حفظ الصورة
  fs.writeFileSync(outputPath, optimizedBuffer);
  
  return outputPath;
}

/**
 * دالة لتقسيم النص إلى أسطر متعددة حسب العرض المحدد
 * 
 * @param ctx سياق الرسم
 * @param text النص المراد تقسيمه
 * @param maxWidth العرض الأقصى
 * @param fontSize حجم الخط
 * @returns مصفوفة من الأسطر
 */
function wrapText(ctx: any, text: string, maxWidth: number, fontSize: number = 24): string[] {
  if (!text) return [];
  if (maxWidth <= 0) return [text];
  
  // استخدام الكاش لحفظ قياسات النص
  const measureCache: Record<string, number> = {};
  const measureText = (str: string): number => {
    if (!measureCache[str]) {
      measureCache[str] = ctx.measureText(str).width;
    }
    return measureCache[str];
  };
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    
    if (measureText(testLine) <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      
      // التعامل مع الكلمات الطويلة التي تتجاوز العرض
      if (measureText(word) > maxWidth) {
        // تقسيم الكلمة الطويلة بشكل حرفي
        let partialWord = '';
        
        for (const char of word) {
          const testWord = partialWord + char;
          
          if (measureText(testWord) <= maxWidth) {
            partialWord = testWord;
          } else {
            lines.push(partialWord);
            partialWord = char;
          }
        }
        
        currentLine = partialWord;
      } else {
        currentLine = word;
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * توليد صورة شهادة باستخدام نفس آلية توليد البطاقة المحسنة
 * 
 * @param template القالب المستخدم
 * @param formData بيانات النموذج
 * @returns مسار الصورة المولدة
 */
export async function generateOptimizedCertificateImage(template: Template, formData: any): Promise<string> {
  if (!template.imagePath) {
    throw new Error('Template image path is required');
  }
  
  // استخراج حقول القالب
  const fieldsResponse = await fetch(`/api/admin/template-fields/${template.id}`);
  const fields = await fieldsResponse.json();
  
  // توليد الصورة باستخدام المولد المحسن
  return generateOptimizedCardImage({
    templatePath: template.imagePath,
    fields,
    formData,
    outputWidth: 2480, // A4 width at 300dpi
    outputHeight: 3508, // A4 height at 300dpi
    quality: 'high',
    outputFormat: 'png'
  });
}