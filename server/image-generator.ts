import type { Template } from "@shared/schema";
import path from "path";
import fs from "fs";
import { createCanvas, loadImage, registerFont } from "canvas";
import { formatDate, formatTime } from "./lib/utils";
import crypto from "crypto";

// Define font fallbacks for Arabic text
// We'll use system fonts that support Arabic characters
const ARABIC_FONTS = {
  // Primary font choices
  CAIRO: 'Cairo, Arial, sans-serif',
  CAIRO_BOLD: 'Cairo, Arial Bold, sans-serif',
  TAJAWAL: 'Tajawal, Tahoma, sans-serif',
  TAJAWAL_BOLD: 'Tajawal, Tahoma, sans-serif',
  AMIRI: 'Amiri, Times New Roman, serif',
  AMIRI_BOLD: 'Amiri, Times New Roman, serif',
  
  // Fallbacks that are commonly available on most systems
  SANS: 'Arial, Tahoma, sans-serif',
  SANS_BOLD: 'Arial Bold, Tahoma Bold, sans-serif',
  SERIF: 'Times New Roman, serif',
  SERIF_BOLD: 'Times New Roman Bold, serif',
};

// Attempt to register fonts with absolute paths, but prepare to use system fonts if it fails
try {
  const fontsDir = path.resolve(process.cwd(), 'fonts');
  console.log("Fonts directory:", fontsDir);
  
  // Check if font files exist
  console.log("Checking font files exist:");
  
  const cairoRegular = path.join(fontsDir, 'Cairo-Regular.ttf');
  const cairoBold = path.join(fontsDir, 'Cairo-Bold.ttf');
  const tajawalRegular = path.join(fontsDir, 'Tajawal-Regular.ttf');
  
  console.log(`Cairo Regular: ${fs.existsSync(cairoRegular)} Size: ${fs.existsSync(cairoRegular) ? fs.statSync(cairoRegular).size : 'Not found'}`);
  console.log(`Cairo Bold: ${fs.existsSync(cairoBold)} Size: ${fs.existsSync(cairoBold) ? fs.statSync(cairoBold).size : 'Not found'}`);
  console.log(`Tajawal Regular: ${fs.existsSync(tajawalRegular)} Size: ${fs.existsSync(tajawalRegular) ? fs.statSync(tajawalRegular).size : 'Not found'}`);
  
  // Register the Cairo font family
  if (fs.existsSync(cairoRegular)) {
    registerFont(cairoRegular, { family: 'Cairo' });
    console.log("Cairo Regular font registered successfully");
  }
  
  if (fs.existsSync(cairoBold)) {
    registerFont(cairoBold, { family: 'Cairo', weight: 'bold' });
    console.log("Cairo Bold font registered successfully");
  }
  
  // Register the Tajawal font family
  if (fs.existsSync(tajawalRegular)) {
    registerFont(tajawalRegular, { family: 'Tajawal' });
    console.log("Tajawal Regular font registered successfully");
  }
  
  const tajawalBold = path.join(fontsDir, 'Tajawal-Bold.ttf');
  if (fs.existsSync(tajawalBold)) {
    registerFont(tajawalBold, { family: 'Tajawal', weight: 'bold' });
    console.log("Tajawal Bold font registered successfully");
  }
  
  // Register the Amiri font family (elegant serif Arabic font)
  const amiriRegular = path.join(fontsDir, 'Amiri-Regular.ttf');
  if (fs.existsSync(amiriRegular)) {
    registerFont(amiriRegular, { family: 'Amiri' });
    console.log("Amiri Regular font registered successfully");
  }
  
  const amiriBold = path.join(fontsDir, 'Amiri-Bold.ttf');
  if (fs.existsSync(amiriBold)) {
    registerFont(amiriBold, { family: 'Amiri', weight: 'bold' });
    console.log("Amiri Bold font registered successfully");
  }
  
  console.log("All Arabic fonts registered successfully");
} catch (e: any) {
  console.warn("Error in font registration process:", e.message || e);
}

/**
 * Generate a card image with the provided template and form data
 * 
 * @param template The template to use for the card
 * @param formData The user input data to overlay on the template
 * @param quality Quality setting for the generated image ('preview', 'download', 'low', 'medium', 'high')
 * @returns Path to the generated image
 */
export async function generateCardImage(
  template: Template, 
  formData: any, 
  quality: 'preview' | 'download' | 'low' | 'medium' | 'high' = 'medium'
): Promise<string> {
  try {
    console.log("Starting card image generation for template:", template.id, template.title);
    console.log("Form data type:", typeof formData, "is array?", Array.isArray(formData));
    
    // Define the output path variable at the beginning of the function
    let outputPath: string;
    
    // Set canvas dimensions based on quality for performance
    let width, height;
    
    // Lower resolution for preview for faster rendering
    if (quality === 'preview') {
      width = 600;  // Half resolution for previews
      height = 840;
    } else {
      width = 1200;
      height = 1680;
    }
    
    // Create canvas with higher resolution
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    
    // Set high-quality rendering
    ctx.imageSmoothingEnabled = true;
    // Note: imageSmoothingQuality might not be available in all canvas implementations
    (ctx as any).imageSmoothingQuality = 'high';
    
    // Validate template image URL
    if (!template.imageUrl) {
      throw new Error("Template image URL is missing");
    }
    
    // Check if the image URL is relative or absolute
    let imageUrl;
    try {
      imageUrl = template.imageUrl.startsWith('http') 
        ? template.imageUrl 
        : `${process.env.BASE_URL || 'http://localhost:5000'}${template.imageUrl}`;
      
      console.log(`Attempting to load template image from ${imageUrl}`);
    } catch (urlError) {
      console.error("Failed to construct image URL:", urlError);
      throw new Error("Invalid template image URL");
    }
    
    // Setup a white background as fallback in case the image fails to load
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    let image;
    try {
      image = await loadImage(imageUrl);
      console.log("Template image loaded successfully");
    } catch (imageError) {
      console.error("Failed to load template image:", imageError);
      // Continue with white background instead of failing
      console.log("Using white background as fallback for template image");
    }
    
    // Extract template settings
    const templateSettings = template.settings as Record<string, any> || {};
    
    // Get template aspect ratio settings or default to preserved (null)
    const aspectRatio = (templateSettings.aspectRatio as string) || null;
    // Get orientation settings (portrait or landscape)
    const orientation = (templateSettings.orientation as string) || 'portrait';
    
    // Calculate drawing dimensions while preserving aspect ratio
    let drawWidth = width;
    let drawHeight = height;
    let offsetX = 0;
    let offsetY = 0;
    
    if (aspectRatio === 'original' && image) {
      // Maintain original image aspect ratio
      const origRatio = image.width / image.height;
      
      // Determine if we need to adjust width or height
      if (orientation === 'portrait') {
        // Portrait mode - fit to width
        drawWidth = width;
        drawHeight = width / origRatio;
        
        // Center vertically if needed
        if (drawHeight < height) {
          offsetY = (height - drawHeight) / 2;
        } else if (drawHeight > height) {
          // Early generation and return for specific crop case
          // Set quality and format based on options
          let outputQuality: number;
          let imageFormat: string = "image/png";
          
          // Set quality based on parameter
          switch(quality) {
            case 'preview':
              outputQuality = 0.6; // Lower quality for preview (<1MB)
              imageFormat = "image/jpeg";
              break;
            case 'download':
              outputQuality = 0.9; // Higher quality for download (up to 2MB)
              break;
            case 'low':
              outputQuality = 0.4;
              imageFormat = "image/jpeg";
              break;
            case 'medium':
              outputQuality = 0.7;
              break;
            case 'high':
              outputQuality = 0.9;
              break;
            default:
              outputQuality = 0.8; // Default quality
          }
          
          // Generate unique filename with appropriate extension
          const extension = imageFormat === "image/jpeg" ? "jpg" : "png";
          const filename = `${crypto.randomBytes(16).toString("hex")}_${quality}.${extension}`;
          outputPath = path.join(process.cwd(), "uploads", filename);
          
          // Crop excess height (centering the visible portion)
          const cropOffset = (drawHeight - height) / 2;
          ctx.save();
          ctx.rect(0, 0, width, height);
          ctx.clip();
          ctx.drawImage(image as any, 0, -cropOffset, drawWidth, drawHeight);
          ctx.restore();
          
          // Generate buffer based on format with appropriate settings
          let buffer;
          if (imageFormat === "image/jpeg") {
            buffer = canvas.toBuffer("image/jpeg", { 
              quality: outputQuality,
              progressive: true
            });
          } else {
            buffer = canvas.toBuffer("image/png", {
              compressionLevel: quality === 'download' ? 0 : 4, // Lower compression level for download
              filters: 0x1F, // Use all PNG filters for best quality 
              resolution: quality === 'preview' ? 150 : 300, // Higher DPI for download
              palette: undefined, // No palette to avoid color reduction
            });
          }
          
          fs.writeFileSync(outputPath, buffer);
          return outputPath;
        }
      } else {
        // Landscape mode - fit to height
        drawHeight = height;
        drawWidth = height * origRatio;
        
        // Center horizontally if needed
        if (drawWidth < width) {
          offsetX = (width - drawWidth) / 2;
        } else if (drawWidth > width) {
          // Early generation and return for specific crop case
          // Set quality and format based on options
          let outputQuality: number;
          let imageFormat: string = "image/png";
          
          // Set quality based on parameter
          switch(quality) {
            case 'preview':
              outputQuality = 0.6; // Lower quality for preview (<1MB)
              imageFormat = "image/jpeg";
              break;
            case 'download':
              outputQuality = 0.9; // Higher quality for download (up to 2MB)
              break;
            case 'low':
              outputQuality = 0.4;
              imageFormat = "image/jpeg";
              break;
            case 'medium':
              outputQuality = 0.7;
              break;
            case 'high':
              outputQuality = 0.9;
              break;
            default:
              outputQuality = 0.8; // Default quality
          }
          
          // Generate unique filename with appropriate extension
          const extension = imageFormat === "image/jpeg" ? "jpg" : "png";
          const filename = `${crypto.randomBytes(16).toString("hex")}_${quality}.${extension}`;
          outputPath = path.join(process.cwd(), "uploads", filename);

          // Crop excess width (centering the visible portion)
          const cropOffset = (drawWidth - width) / 2;
          ctx.save();
          ctx.rect(0, 0, width, height);
          ctx.clip();
          ctx.drawImage(image as any, -cropOffset, 0, drawWidth, drawHeight);
          ctx.restore();
          
          // Generate buffer based on format with appropriate settings
          let buffer;
          if (imageFormat === "image/jpeg") {
            buffer = canvas.toBuffer("image/jpeg", { 
              quality: outputQuality,
              progressive: true
            });
          } else {
            buffer = canvas.toBuffer("image/png", {
              compressionLevel: quality === 'download' ? 0 : 4, // Lower compression level for download
              filters: 0x1F, // Use all PNG filters for best quality 
              resolution: quality === 'preview' ? 150 : 300, // Higher DPI for download
              palette: undefined, // No palette to avoid color reduction
            });
          }
          
          fs.writeFileSync(outputPath, buffer);
          return outputPath;
        }
      }
    } else if (aspectRatio === 'square') {
      // Force square aspect ratio
      const size = Math.min(width, height);
      drawWidth = size;
      drawHeight = size;
      
      // Center the square
      offsetX = (width - size) / 2;
      offsetY = (height - size) / 2;
    } else if (aspectRatio === 'custom' && templateSettings.customRatio) {
      // Apply custom aspect ratio
      const [customWidth, customHeight] = (templateSettings.customRatio as string).split(':').map(Number);
      const customRatio = customWidth / customHeight;
      
      if (orientation === 'portrait') {
        drawWidth = width;
        drawHeight = width / customRatio;
        
        // Center vertically if needed
        if (drawHeight < height) {
          offsetY = (height - drawHeight) / 2;
        } else if (drawHeight > height) {
          // Crop excess height
          offsetY = -(drawHeight - height) / 2;
          drawHeight = height;
        }
      } else {
        drawHeight = height;
        drawWidth = height * customRatio;
        
        // Center horizontally if needed
        if (drawWidth < width) {
          offsetX = (width - drawWidth) / 2;
        } else if (drawWidth > width) {
          // Crop excess width
          offsetX = -(drawWidth - width) / 2;
          drawWidth = width;
        }
      }
    }
    
    // Draw template image with calculated dimensions
    console.log(`Drawing image with dimensions: ${drawWidth}x${drawHeight}, offset: ${offsetX},${offsetY}`);
    if (image) {
      ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    }
    
    // Add semi-transparent overlay for better text visibility if needed
    if (!templateSettings.noOverlay) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(0, 0, width, height);
    }
    
    // Default text properties (will be overridden by field settings)
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";  // اللون الافتراضي أبيض
    ctx.direction = "rtl";
    ctx.textBaseline = "middle";
    
    // إعداد الظل للنص وفقًا لإعدادات القالب
    if (templateSettings.textShadow !== false) {
      ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
      ctx.shadowBlur = 5;
    } else {
      ctx.shadowBlur = 0;  // إيقاف ظل النص إذا تم تعطيله في الإعدادات
    }
    
    // إصلاح مشكلة عرض ألوان النص
    const fixTextColor = templateSettings.fixTextColor !== false;
    
    // طباعة معلومات الحقول المستخدمة
    console.log("Form Data:", formData);
    
    // جلب بيانات حقول القالب
    try {
      // جلب حقول القالب من قاعدة البيانات (إلا إذا كانت موجودة بالفعل)
      let fields = [];
      
      // Safely access template fields property if it exists
      const templateFields = (template as any).templateFields;
      
      if (Array.isArray(templateFields) && templateFields.length > 0) {
        fields = templateFields;
        console.log(`Using ${fields.length} template fields provided with the template object`);
      } else {
        // جلب حقول القالب من قاعدة البيانات
        const { db } = await import('./db');
        const { templateFields } = await import('@shared/schema');
        
        // استعلام الحقول للقالب
        fields = await db.query.templateFields.findMany({
          where: (templateFields, { eq }) => eq(templateFields.templateId, template.id)
        });
        
        console.log(`Fetched ${fields.length} template fields from database for template ID ${template.id}`);
      }
      
      // الحقول المُدخلة - مع الإعدادات المخصصة لكل حقل
      if (formData && fields.length > 0) {
        console.log(`Applying custom field positions and styles for ${fields.length} fields`);
        drawCustomFieldsWithStyles(ctx, formData, width, height, fields);
      } else if (formData) {
        console.log(`No custom fields found, using default layout`);
        drawCustomFields(ctx, formData, width, height);
      }
    } catch (error) {
      console.warn(`Error fetching template fields: ${error}. Using default field styles.`);
      
      // استخدام الطريقة الافتراضية إذا فشل استعلام الحقول
      if (formData) {
        drawCustomFields(ctx, formData, width, height);
      }
    }
    
    // Set quality and format based on options
    let outputQuality: number;
    let imageFormat: string = "image/png";
    
    // Set quality based on parameter
    switch(quality) {
      case 'preview':
        outputQuality = 0.3; // Very low quality for fast preview (<500KB)
        imageFormat = "image/jpeg";
        break;
      case 'download':
        outputQuality = 0.9; // Higher quality for download (up to 2MB)
        break;
      case 'low':
        outputQuality = 0.4;
        imageFormat = "image/jpeg";
        break;
      case 'medium':
        outputQuality = 0.7;
        imageFormat = "image/jpeg"; // Use JPEG for medium quality too for better performance
        break;
      case 'high':
        outputQuality = 0.9;
        break;
      default:
        outputQuality = 0.5; // Default lower quality
        imageFormat = "image/jpeg";
    }
    
    // Generate unique filename with appropriate extension
    const extension = imageFormat === "image/jpeg" ? "jpg" : "png";
    const filename = `${crypto.randomBytes(16).toString("hex")}_${quality}.${extension}`;
    outputPath = path.join(process.cwd(), "uploads", filename);
    
    // Generate buffer based on format with appropriate settings
    let buffer;
    if (imageFormat === "image/jpeg") {
      buffer = canvas.toBuffer("image/jpeg", { 
        quality: outputQuality,
        progressive: true
      });
    } else {
      buffer = canvas.toBuffer("image/png", {
        compressionLevel: quality === 'download' ? 0 : 4, // Lower compression level for download
        filters: 0x1F, // Use all PNG filters for best quality 
        resolution: quality === 'preview' ? 150 : 300, // Higher DPI for download
        palette: undefined, // No palette to avoid color reduction
      });
    }
    
    fs.writeFileSync(outputPath, buffer);
    
    return outputPath;
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("فشل في إنشاء الصورة");
  }
}

// دالة جديدة لرسم الحقول المخصصة مع أنماط مخصصة
function drawCustomFieldsWithStyles(ctx: any, formData: any, width: number, height: number, fields: any[]) {
  // إعداد إصلاح لون النص الأسود
  const fixTextColor = true; // Default to true for backward compatibility
  // الحصول على أسماء الحقول
  const fieldNames = Object.keys(formData);
  if (fieldNames.length === 0) return;
  
  console.log(`Drawing ${fieldNames.length} custom fields on image with custom styles`);
  
  // إنشاء خريطة للحقول للوصول السريع
  const fieldMap = new Map();
  fields.forEach(field => {
    fieldMap.set(field.name, field);
  });
  
  // معلمات لتحديد موضع النص
  let spaceBetweenFields = height * 0.1;
  if (fieldNames.length > 5) {
    spaceBetweenFields = height * 0.7 / fieldNames.length;
  }
  
  let startY = height * 0.2;
  
  // تتبع الموضع المستخدم لكل حقل لتجنب التداخل
  const usedPositions: { x: number, y: number, height: number, width: number }[] = [];
  
  // رسم كل حقل
  fieldNames.forEach((fieldName, index) => {
    const text = formData[fieldName];
    if (!text) return;
    
    // البحث عن إعدادات الحقل
    const fieldConfig = fieldMap.get(fieldName);
    
    // حفظ حالة السياق الحالية
    ctx.save();
    
    // تطبيق إعدادات الحقل إذا وجدت
    if (fieldConfig) {
      console.log(`Applying custom style for field ${fieldName}:`, fieldConfig.style);
      
      // استخراج إعدادات النص من حقل style
      const style = fieldConfig.style || {};
      
      // تحديد نوع الخط وحجمه
      // الخطوط المتاحة: Cairo, Tajawal, Amiri
      const fontFamily = style.fontFamily || 'Cairo';
      const fontSize = style.fontSize || 45; // زيادة حجم الخط مع زيادة دقة الصورة
      const fontWeight = style.fontWeight || '';
      
      // تعيين الخط المناسب مع الحفاظ على أصل الخط
      if (fontFamily === 'Amiri') {
        // خط اميري يناسب النصوص التقليدية والرسمية
        ctx.font = fontWeight === 'bold' ? 
          `${fontSize}px ${ARABIC_FONTS.AMIRI_BOLD}` : 
          `${fontSize}px ${ARABIC_FONTS.AMIRI}`;
      } else if (fontFamily === 'Tajawal') {
        // خط تجوال يناسب النصوص العصرية
        ctx.font = fontWeight === 'bold' ? 
          `${fontSize}px ${ARABIC_FONTS.TAJAWAL_BOLD}` : 
          `${fontSize}px ${ARABIC_FONTS.TAJAWAL}`;
      } else {
        // خط القاهرة كخط افتراضي
        ctx.font = fontWeight === 'bold' ? 
          `${fontSize}px ${ARABIC_FONTS.CAIRO_BOLD}` : 
          `${fontSize}px ${ARABIC_FONTS.CAIRO}`;
      }
      
      // تحديد لون النص مع الحفاظ على اللون الأصلي
      if (style.color) {
        ctx.fillStyle = style.color;
        // نحافظ على ظل النص إذا كان هناك حاجة لذلك
        if (style.shadow === false) {
          ctx.shadowBlur = 0;
        }
      }
      
      // تحديد محاذاة النص
      if (style.align) {
        ctx.textAlign = style.align as CanvasTextAlign;
        console.log(`Setting text alignment for ${fieldName} to: ${style.align}`);
      }
      
      // تحديد مكان النص
      let posX = width / 2; // مركز افتراضي
      let posY = 0;
      
      // استخدام الموضع المخصص إذا كان متوفراً
      if (fieldConfig.position) {
        if (fieldConfig.position.x !== undefined) {
          // تحويل النسبة المئوية (0-100) إلى موضع فعلي على الصورة
          posX = (fieldConfig.position.x / 100) * width;
          console.log(`Field ${fieldName} position X: ${fieldConfig.position.x}% => ${Math.round(posX)}px`);
        }
        if (fieldConfig.position.y !== undefined) {
          // تحويل النسبة المئوية (0-100) إلى موضع فعلي على الصورة
          posY = (fieldConfig.position.y / 100) * height;
          console.log(`Field ${fieldName} position Y: ${fieldConfig.position.y}% => ${Math.round(posY)}px`);
        } else {
          // استخدام موضع تلقائي بناءً على الحقول السابقة لتجنب التداخل
          posY = findAvailableYPosition(usedPositions, posX, parseInt(fontSize as string), startY, spaceBetweenFields, index);
        }
      } else {
        // استخدام موضع تلقائي بناءً على الحقول السابقة لتجنب التداخل
        posY = findAvailableYPosition(usedPositions, posX, parseInt(fontSize as string), startY, spaceBetweenFields, index);
      }
      
      // حساب عرض النص لاستخدامه في تتبع المواضع المستخدمة
      const textWidth = ctx.measureText(text).width;
      
      // رسم النص مع التفاف الكلمات بشكل محسن
      const maxWidth = style.maxWidth ? (style.maxWidth / 100) * width : width - 100;
      const lines = wrapText(ctx, text, maxWidth);
      
      // تعديل الموضع إذا كان هناك أكثر من سطر لتجنب التداخل
      let currentY = posY;
      const lineHeight = parseInt(fontSize as string) + 5;
      const totalTextHeight = lineHeight * lines.length;
      
      for (const line of lines) {
        // إصلاح مشكلة لون النص الأسود الذي يظهر باللون الأبيض
        if (fixTextColor && style.color && style.color.toLowerCase() === '#000000') {
          // حفظ سياق الرسم الحالي
          ctx.save();
          
          // إزالة الظل للنص الأسود
          ctx.shadowBlur = 0;
          
          // استخدام طريقة الرسم الصحيحة للون الأسود
          ctx.fillStyle = 'rgb(0, 0, 0)';
          ctx.fillText(line, posX, currentY);
          
          // استعادة سياق الرسم الأصلي
          ctx.restore();
        } else {
          // رسم النص بالطريقة العادية
          ctx.fillText(line, posX, currentY);
        }
        
        currentY += lineHeight;
      }
      
      // تسجيل الموضع المستخدم لهذا الحقل
      usedPositions.push({
        x: posX - (textWidth / 2),
        y: posY - (parseInt(fontSize as string) / 2),
        width: textWidth,
        height: totalTextHeight
      });
      
    } else {
      // استخدام الإعدادات الافتراضية إذا لم يتم العثور على إعدادات مخصصة
      const fontSize = fieldNames.length > 5 ? 26 : 30;
      ctx.font = `${fontSize}px ${ARABIC_FONTS.CAIRO}`;
      
      // حساب الموضع مع تجنب التداخل
      const posX = width / 2;
      const posY = findAvailableYPosition(usedPositions, posX, fontSize, startY, spaceBetweenFields, index);
      
      // حساب عرض النص لاستخدامه في تتبع المواضع المستخدمة
      const textWidth = ctx.measureText(text).width;
      
      // رسم النص مع التفاف محسن
      const lines = wrapText(ctx, text, width - 100);
      let currentY = posY;
      const lineHeight = fontSize + 5;
      const totalTextHeight = lineHeight * lines.length;
      
      for (const line of lines) {
        // إصلاح مشكلة لون النص الأسود الذي يظهر باللون الأبيض
        if (fixTextColor && ctx.fillStyle && ctx.fillStyle.toString().toLowerCase() === '#000000') {
          // حفظ سياق الرسم الحالي
          ctx.save();
          
          // إزالة الظل للنص الأسود
          ctx.shadowBlur = 0;
          
          // استخدام طريقة الرسم الصحيحة للون الأسود
          ctx.fillStyle = 'rgb(0, 0, 0)';
          ctx.fillText(line, posX, currentY);
          
          // استعادة سياق الرسم الأصلي
          ctx.restore();
        } else {
          // رسم النص بالطريقة العادية
          ctx.fillText(line, posX, currentY);
        }
        
        currentY += lineHeight;
      }
      
      // تسجيل الموضع المستخدم لهذا الحقل
      usedPositions.push({
        x: posX - (textWidth / 2),
        y: posY - (fontSize / 2),
        width: textWidth,
        height: totalTextHeight
      });
    }
    
    // استعادة حالة السياق الأصلية
    ctx.restore();
  });
}

// دالة لإيجاد موضع Y مناسب لا يتداخل مع الحقول السابقة
function findAvailableYPosition(
  usedPositions: Array<{ x: number, y: number, height: number, width: number }>,
  posX: number,
  fontSize: number,
  startY: number,
  spaceBetweenFields: number,
  index: number
): number {
  // البداية بالموضع الافتراضي
  let posY = startY + (index * spaceBetweenFields);
  
  // البحث عن موضع لا يتداخل مع الحقول السابقة
  let overlap = true;
  let attempts = 0;
  const maxAttempts = 10; // لتجنب العمليات الطويلة
  
  while (overlap && attempts < maxAttempts) {
    overlap = false;
    
    // مراجعة المواضع المستخدمة
    for (const usedPos of usedPositions) {
      // حساب المسافة الرأسية بين الموضع الحالي والموضع المستخدم
      const verticalDistance = Math.abs(posY - (usedPos.y + usedPos.height / 2));
      
      // إذا كان الموضع قريب جدًا من حقل موجود، زيادة الموضع لأسفل
      if (verticalDistance < fontSize * 1.2) {
        posY += fontSize * 1.5; // زيادة المسافة لتجنب التداخل
        overlap = true;
        break;
      }
    }
    
    attempts++;
  }
  
  return posY;
}

// دالة لرسم الحقول المخصصة بتخطيط افتراضي
function drawCustomFields(ctx: any, formData: any, width: number, height: number) {
  // Get template settings if available
  const fixTextColor = true; // Default to true for backward compatibility
  // الحصول على أسماء الحقول
  const fieldNames = Object.keys(formData);
  if (fieldNames.length === 0) return;
  
  console.log(`Drawing ${fieldNames.length} custom fields on image with default layout`);
  
  // معلمات لتحديد موضع النص
  let spaceBetweenFields = height * 0.1;
  if (fieldNames.length > 5) {
    spaceBetweenFields = height * 0.7 / fieldNames.length;
  }
  
  let startY = height * 0.15;
  
  // تتبع الموضع المستخدم لكل حقل لتجنب التداخل
  const usedPositions: { x: number, y: number, height: number, width: number }[] = [];
  
  // رسم كل حقل
  fieldNames.forEach((fieldName, index) => {
    const text = formData[fieldName];
    if (!text) return;
    
    // تعيين الخط المناسب حسب عدد الحقول
    const fontSize = fieldNames.length > 5 ? 26 : 30;
    ctx.font = `${fontSize}px ${ARABIC_FONTS.CAIRO}`;
    
    // حساب الموضع مع تجنب التداخل
    const posX = width / 2;
    const posY = startY + (index * spaceBetweenFields);
    
    // حساب عرض النص لاستخدامه في تتبع المواضع المستخدمة
    const textWidth = ctx.measureText(text).width;
    
    // رسم النص مع تطبيق التفاف الكلمات
    const lines = wrapText(ctx, text, width - 100);
    let currentY = posY;
    const lineHeight = fontSize + 5;
    
    for (const line of lines) {
      // إصلاح مشكلة لون النص الأسود الذي يظهر باللون الأبيض
      if (fixTextColor && ctx.fillStyle && ctx.fillStyle.toString().toLowerCase() === '#000000') {
        // حفظ سياق الرسم الحالي
        ctx.save();
        
        // إزالة الظل للنص الأسود
        ctx.shadowBlur = 0;
        
        // استخدام طريقة الرسم الصحيحة للون الأسود
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillText(line, posX, currentY);
        
        // استعادة سياق الرسم الأصلي
        ctx.restore();
      } else {
        // رسم النص بالطريقة العادية
        ctx.fillText(line, posX, currentY);
      }
      
      currentY += lineHeight;
    }
  });
}

// حالات خاصة حسب نوع البطاقة
function drawWeddingText(ctx: any, formData: any, width: number, height: number) {
  // أسماء العروسين
  ctx.font = `bold 50px ${ARABIC_FONTS.CAIRO_BOLD}`;
  ctx.textAlign = "center";
  
  const nameY = height * 0.4;
  
  if (formData.bride && formData.groom) {
    ctx.fillText(`${formData.groom} & ${formData.bride}`, width / 2, nameY);
  } else if (formData.names) {
    ctx.fillText(formData.names, width / 2, nameY);
  }
  
  // تاريخ الزفاف
  if (formData.date) {
    ctx.font = `45px ${ARABIC_FONTS.CAIRO}`;
    ctx.fillText(formatDate(formData.date), width / 2, nameY + 80);
  }
  
  // مكان الحفل
  if (formData.venue) {
    ctx.font = `35px ${ARABIC_FONTS.CAIRO}`;
    ctx.fillText(formData.venue, width / 2, nameY + 140);
  }
  
  // وقت الحفل
  if (formData.time) {
    ctx.font = `35px ${ARABIC_FONTS.CAIRO}`;
    ctx.fillText(formatTime(formData.time), width / 2, nameY + 190);
  }
}

function drawEngagementText(ctx: any, formData: any, width: number, height: number) {
  // محتوى مشابه لبطاقة الزفاف
  drawWeddingText(ctx, formData, width, height);
}

function drawGraduationText(ctx: any, formData: any, width: number, height: number) {
  // اسم الطالب
  ctx.font = `bold 50px ${ARABIC_FONTS.CAIRO_BOLD}`;
  ctx.textAlign = "center";
  
  const nameY = height * 0.4;
  
  if (formData.student) {
    ctx.fillText(formData.student, width / 2, nameY);
  }
  
  // الشهادة أو التخصص
  if (formData.degree) {
    ctx.font = `45px ${ARABIC_FONTS.CAIRO}`;
    ctx.fillText(formData.degree, width / 2, nameY + 80);
  }
  
  // الجامعة أو المدرسة
  if (formData.institution) {
    ctx.font = `35px ${ARABIC_FONTS.CAIRO}`;
    ctx.fillText(formData.institution, width / 2, nameY + 140);
  }
  
  // سنة التخرج
  if (formData.year) {
    ctx.font = `45px ${ARABIC_FONTS.CAIRO_BOLD}`;
    ctx.fillText(formData.year, width / 2, nameY + 190);
  }
}

function drawEidText(ctx: any, formData: any, width: number, height: number) {
  // تهنئة العيد
  ctx.font = `bold 50px ${ARABIC_FONTS.AMIRI_BOLD}`;
  ctx.textAlign = "center";
  
  const greetingY = height * 0.4;
  
  if (formData.greeting) {
    ctx.fillText(formData.greeting, width / 2, greetingY);
  } else {
    ctx.fillText("عيد مبارك", width / 2, greetingY);
  }
  
  // من (المرسل)
  if (formData.from) {
    ctx.font = `40px ${ARABIC_FONTS.CAIRO}`;
    ctx.fillText(`من: ${formData.from}`, width / 2, greetingY + 80);
  }
  
  // إلى (المستقبل)
  if (formData.to) {
    ctx.font = `40px ${ARABIC_FONTS.CAIRO}`;
    ctx.fillText(`إلى: ${formData.to}`, width / 2, greetingY + 140);
  }
  
  // رسالة إضافية
  if (formData.message) {
    ctx.font = `30px ${ARABIC_FONTS.AMIRI}`;
    const lines = wrapText(ctx, formData.message, width - 150);
    let messageY = greetingY + 210;
    
    for (const line of lines) {
      ctx.fillText(line, width / 2, messageY);
      messageY += 40;
    }
  }
}

function drawRamadanText(ctx: any, formData: any, width: number, height: number) {
  // محتوى مشابه لبطاقة العيد
  drawEidText(ctx, formData, width, height);
}

// Utility function to wrap text
function wrapText(ctx: any, text: string, maxWidth: number): string[] {
  if (!text) return [];
  
  // Split the text into words
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];
  
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  
  lines.push(currentLine);
  return lines;
}

// Certificate generation
export async function generateCertificateImage(template: Template, formData: any): Promise<string> {
  // For now, redirect to card image generation with the same function
  return generateCardImage(template, formData, 'download');
}