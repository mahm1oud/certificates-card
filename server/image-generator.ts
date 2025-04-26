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
  
  // Check if font files exist before attempting to register
  const cairoRegPath = path.join(fontsDir, "Cairo-Regular.ttf");
  const cairoBoldPath = path.join(fontsDir, "Cairo-Bold.ttf");
  const tajawalRegPath = path.join(fontsDir, "Tajawal-Regular.ttf");
  const tajawalBoldPath = path.join(fontsDir, "Tajawal-Bold.ttf");
  const amiriRegPath = path.join(fontsDir, "Amiri-Regular.ttf");
  const amiriBoldPath = path.join(fontsDir, "Amiri-Bold.ttf");
  
  // Check that files exist
  console.log("Checking font files exist:");
  console.log("Cairo Regular:", fs.existsSync(cairoRegPath), "Size:", fs.existsSync(cairoRegPath) ? fs.statSync(cairoRegPath).size : 'N/A');
  console.log("Cairo Bold:", fs.existsSync(cairoBoldPath), "Size:", fs.existsSync(cairoBoldPath) ? fs.statSync(cairoBoldPath).size : 'N/A');
  console.log("Tajawal Regular:", fs.existsSync(tajawalRegPath), "Size:", fs.existsSync(tajawalRegPath) ? fs.statSync(tajawalRegPath).size : 'N/A');
  
  // Register each font, with better error handling for each
  try {
    registerFont(cairoRegPath, { family: "Cairo" });
    console.log("Cairo Regular font registered successfully");
  } catch (error: any) {
    console.warn("Failed to register Cairo Regular font:", error.message || error);
  }
  
  try {
    registerFont(cairoBoldPath, { family: "Cairo", weight: "bold" });
    console.log("Cairo Bold font registered successfully");
  } catch (error: any) {
    console.warn("Failed to register Cairo Bold font:", error.message || error);
  }
  
  try {
    registerFont(tajawalRegPath, { family: "Tajawal" });
    console.log("Tajawal Regular font registered successfully");
  } catch (error: any) {
    console.warn("Failed to register Tajawal Regular font:", error.message || error);
  }
  
  try {
    registerFont(tajawalBoldPath, { family: "Tajawal", weight: "bold" });
    console.log("Tajawal Bold font registered successfully");
  } catch (error: any) {
    console.warn("Failed to register Tajawal Bold font:", error.message || error);
  }
  
  try {
    registerFont(amiriRegPath, { family: "Amiri" });
    console.log("Amiri Regular font registered successfully");
  } catch (error: any) {
    console.warn("Failed to register Amiri Regular font:", error.message || error);
  }
  
  try {
    registerFont(amiriBoldPath, { family: "Amiri", weight: "bold" });
    console.log("Amiri Bold font registered successfully");
  } catch (error: any) {
    console.warn("Failed to register Amiri Bold font:", error.message || error);
  }
  
  console.log("All Arabic fonts registered successfully");
  // No need to show the global error message anymore since we have per-font error handling
} catch (e: any) {
  console.warn("Error in font registration process:", e.message || e);
}

/**
 * Generate a card image with the provided template and form data
 * 
 * @param template The template to use for the card
 * @param formData The user input data to overlay on the template
 * @returns Path to the generated image
 */
export async function generateCardImage(template: Template, formData: any): Promise<string> {
  try {
    // Set canvas dimensions - increased for higher quality
    const width = 1200;
    const height = 1680;
    
    // Create canvas with higher resolution
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    
    // Set high-quality rendering
    ctx.imageSmoothingEnabled = true;
    // Note: imageSmoothingQuality might not be available in all canvas implementations
    (ctx as any).imageSmoothingQuality = 'high';
    
    // Load template image
    // Check if the image URL is relative or absolute
    const imageUrl = template.imageUrl.startsWith('http') 
      ? template.imageUrl 
      : `${process.env.BASE_URL || 'http://localhost:5000'}${template.imageUrl}`;
    
    console.log(`Loading template image from ${imageUrl}`);
    const image = await loadImage(imageUrl);
    
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
    
    if (aspectRatio === 'original') {
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
          // Crop excess height (centering the visible portion)
          const cropOffset = (drawHeight - height) / 2;
          ctx.save();
          ctx.rect(0, 0, width, height);
          ctx.clip();
          ctx.drawImage(image as any, 0, -cropOffset, drawWidth, drawHeight);
          ctx.restore();
          return; // Skip regular drawing
        }
      } else {
        // Landscape mode - fit to height
        drawHeight = height;
        drawWidth = height * origRatio;
        
        // Center horizontally if needed
        if (drawWidth < width) {
          offsetX = (width - drawWidth) / 2;
        } else if (drawWidth > width) {
          // Crop excess width (centering the visible portion)
          const cropOffset = (drawWidth - width) / 2;
          ctx.save();
          ctx.rect(0, 0, width, height);
          ctx.clip();
          ctx.drawImage(image as any, -cropOffset, 0, drawWidth, drawHeight);
          ctx.restore();
          return; // Skip regular drawing
        }
      }
    } else if (aspectRatio === 'square') {
      // Force square aspect ratio
      if (width !== height) {
        // Choose the smaller dimension
        const size = Math.min(width, height);
        drawWidth = size;
        drawHeight = size;
        
        // Center the square
        offsetX = (width - size) / 2;
        offsetY = (height - size) / 2;
      }
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
    ctx.drawImage(image as any, offsetX, offsetY, drawWidth, drawHeight);
    
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
    
    // Generate unique filename
    const filename = `${crypto.randomBytes(16).toString("hex")}.png`;
    const outputPath = path.join(process.cwd(), "uploads", filename);
    
    // Save image to file with higher quality settings
    const buffer = canvas.toBuffer("image/png", {
      compressionLevel: 0, // No compression for highest quality (0-9, 0 = no compression)
      // PNG_ALL_FILTERS = 0x1F per node-canvas documentation
      filters: 0x1F, // Use all PNG filters for best quality 
      resolution: 300, // Higher DPI for better quality (standard print quality)
      palette: undefined, // No palette to avoid color reduction
    });
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
          posY = findAvailableYPosition(usedPositions, posX, parseInt(fontSize), startY, spaceBetweenFields, index);
        }
      } else {
        // استخدام موضع تلقائي بناءً على الحقول السابقة لتجنب التداخل
        posY = findAvailableYPosition(usedPositions, posX, parseInt(fontSize), startY, spaceBetweenFields, index);
      }
      
      // حساب عرض النص لاستخدامه في تتبع المواضع المستخدمة
      const textWidth = ctx.measureText(text).width;
      
      // رسم النص مع التفاف الكلمات بشكل محسن
      const maxWidth = style.maxWidth ? (style.maxWidth / 100) * width : width - 100;
      const lines = wrapText(ctx, text, maxWidth);
      
      // تعديل الموضع إذا كان هناك أكثر من سطر لتجنب التداخل
      let currentY = posY;
      const lineHeight = parseInt(fontSize) + 5;
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
        y: posY - (parseInt(fontSize) / 2),
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

// دالة لرسم الحقول المخصصة على الصورة (الإعدادات الافتراضية)
// Fix error related to fixTextColor
function drawCustomFields(ctx: any, formData: any, width: number, height: number) {
  // Get template settings if available
  const fixTextColor = true; // Default to true for backward compatibility
  // الحصول على أسماء الحقول
  const fieldNames = Object.keys(formData);
  if (fieldNames.length === 0) return;
  
  console.log(`Drawing ${fieldNames.length} custom fields on image with default styles`);
  
  // معلمات لتحديد موضع النص
  let spaceBetweenFields = height * 0.1;
  if (fieldNames.length > 5) {
    spaceBetweenFields = height * 0.7 / fieldNames.length;
  }
  
  let startY = height * 0.2;
  
  // رسم كل حقل
  fieldNames.forEach((fieldName, index) => {
    const text = formData[fieldName];
    if (!text) return;
    
    // حجم الخط يعتمد على عدد الحقول
    const fontSize = fieldNames.length > 5 ? 26 : 30;
    ctx.font = `${fontSize}px ${ARABIC_FONTS.CAIRO}`;
    
    // رسم النص
    const lines = wrapText(ctx, text, width - 100);
    let currentY = startY + (index * spaceBetweenFields);
    
    for (const line of lines) {
      ctx.fillText(line, width / 2, currentY);
      currentY += fontSize + 5;
    }
  });
}

function drawWeddingText(ctx: any, formData: any, width: number, height: number) {
  // Set main title font
  ctx.font = `40px ${ARABIC_FONTS.CAIRO_BOLD}`;
  ctx.fillText(formData.groomName, width / 2, height * 0.25);
  
  ctx.font = `30px ${ARABIC_FONTS.CAIRO}`;
  ctx.fillText("&", width / 2, height * 0.32);
  
  ctx.font = `40px ${ARABIC_FONTS.CAIRO_BOLD}`;
  ctx.fillText(formData.brideName, width / 2, height * 0.38);
  
  // Add shadow to text
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 5;
  
  // Set details font
  ctx.font = `28px ${ARABIC_FONTS.TAJAWAL}`;
  ctx.fillText("يتشرفان بدعوتكم لحضور حفل زفافهما", width / 2, height * 0.55);
  
  if (formData.weddingDate) {
    ctx.fillText(`يوم ${formatDate(formData.weddingDate)}`, width / 2, height * 0.63);
  }
  
  if (formData.weddingTime) {
    ctx.fillText(`الساعة ${formatTime(formData.weddingTime)}`, width / 2, height * 0.69);
  }
  
  if (formData.weddingLocation) {
    ctx.fillText(formData.weddingLocation, width / 2, height * 0.75);
  }
  
  if (formData.additionalNotes) {
    ctx.font = `22px ${ARABIC_FONTS.TAJAWAL}`;
    ctx.fillText(formData.additionalNotes, width / 2, height * 0.85);
  }
}

function drawEngagementText(ctx: any, formData: any, width: number, height: number) {
  // Set main title font
  ctx.font = `40px ${ARABIC_FONTS.CAIRO_BOLD}`;
  ctx.fillText(formData.groomName, width / 2, height * 0.25);
  
  ctx.font = `30px ${ARABIC_FONTS.CAIRO}`;
  ctx.fillText("&", width / 2, height * 0.32);
  
  ctx.font = `40px ${ARABIC_FONTS.CAIRO_BOLD}`;
  ctx.fillText(formData.brideName, width / 2, height * 0.38);
  
  // Add shadow to text
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 5;
  
  // Set details font
  ctx.font = `28px ${ARABIC_FONTS.TAJAWAL}`;
  ctx.fillText("يتشرفان بدعوتكم لحضور حفل خطوبتهما", width / 2, height * 0.55);
  
  if (formData.engagementDate) {
    ctx.fillText(`يوم ${formatDate(formData.engagementDate)}`, width / 2, height * 0.63);
  }
  
  if (formData.engagementTime) {
    ctx.fillText(`الساعة ${formatTime(formData.engagementTime)}`, width / 2, height * 0.69);
  }
  
  if (formData.engagementLocation) {
    ctx.fillText(formData.engagementLocation, width / 2, height * 0.75);
  }
  
  if (formData.additionalNotes) {
    ctx.font = `22px ${ARABIC_FONTS.TAJAWAL}`;
    ctx.fillText(formData.additionalNotes, width / 2, height * 0.85);
  }
}

function drawGraduationText(ctx: any, formData: any, width: number, height: number) {
  // Set main title font
  ctx.font = `45px ${ARABIC_FONTS.CAIRO_BOLD}`;
  ctx.fillText("تهنئة تخرج", width / 2, height * 0.2);
  
  ctx.font = `40px ${ARABIC_FONTS.CAIRO_BOLD}`;
  ctx.fillText(formData.graduateName, width / 2, height * 0.3);
  
  // Add shadow to text
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 5;
  
  // Set details font
  ctx.font = `30px ${ARABIC_FONTS.TAJAWAL}`;
  if (formData.degree) {
    ctx.fillText(`بمناسبة التخرج من ${formData.degree}`, width / 2, height * 0.45);
  }
  
  if (formData.university) {
    ctx.fillText(formData.university, width / 2, height * 0.53);
  }
  
  if (formData.graduationDate) {
    ctx.fillText(`${formatDate(formData.graduationDate)}`, width / 2, height * 0.6);
  }
  
  if (formData.message) {
    ctx.font = `24px ${ARABIC_FONTS.TAJAWAL}`;
    const lines = wrapText(ctx, formData.message, width - 100);
    let y = height * 0.7;
    for (const line of lines) {
      ctx.fillText(line, width / 2, y);
      y += 35;
    }
  }
}

function drawEidText(ctx: any, formData: any, width: number, height: number) {
  // Set main title font
  ctx.font = `45px ${ARABIC_FONTS.CAIRO_BOLD}`;
  ctx.fillText(`عيد ${formData.eidType} مبارك`, width / 2, height * 0.25);
  
  // Add shadow to text
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 5;
  
  // Set details font
  ctx.font = `30px ${ARABIC_FONTS.TAJAWAL}`;
  if (formData.recipient) {
    ctx.fillText(`إلى: ${formData.recipient}`, width / 2, height * 0.4);
  }
  
  if (formData.message) {
    ctx.font = `26px ${ARABIC_FONTS.TAJAWAL}`;
    const lines = wrapText(ctx, formData.message, width - 100);
    let y = height * 0.55;
    for (const line of lines) {
      ctx.fillText(line, width / 2, y);
      y += 35;
    }
  }
  
  if (formData.sender) {
    ctx.font = `28px ${ARABIC_FONTS.TAJAWAL}`;
    ctx.fillText(`من: ${formData.sender}`, width / 2, height * 0.85);
  }
}

function drawRamadanText(ctx: any, formData: any, width: number, height: number) {
  // Set main title font
  ctx.font = `45px ${ARABIC_FONTS.CAIRO_BOLD}`;
  ctx.fillText("رمضان كريم", width / 2, height * 0.25);
  
  // Add shadow to text
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 5;
  
  if (formData.year) {
    ctx.font = `30px ${ARABIC_FONTS.CAIRO}`;
    ctx.fillText(formData.year, width / 2, height * 0.33);
  }
  
  // Set details font
  ctx.font = `30px ${ARABIC_FONTS.TAJAWAL}`;
  if (formData.recipient) {
    ctx.fillText(`إلى: ${formData.recipient}`, width / 2, height * 0.45);
  }
  
  if (formData.message) {
    ctx.font = `26px ${ARABIC_FONTS.TAJAWAL}`;
    const lines = wrapText(ctx, formData.message, width - 100);
    let y = height * 0.55;
    for (const line of lines) {
      ctx.fillText(line, width / 2, y);
      y += 35;
    }
  }
  
  if (formData.sender) {
    ctx.font = `28px ${ARABIC_FONTS.TAJAWAL}`;
    ctx.fillText(`من: ${formData.sender}`, width / 2, height * 0.85);
  }
}

// Helper function to wrap text
function wrapText(ctx: any, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    
    if (width < maxWidth) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}