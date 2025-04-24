import type { Template } from "@shared/schema";
import path from "path";
import fs from "fs";
import { createCanvas, loadImage, registerFont } from "canvas";
import { formatDate, formatTime } from "@/lib/utils";
import crypto from "crypto";

// Register Arabic fonts if available
try {
  registerFont(path.join(process.cwd(), "fonts", "Cairo-Regular.ttf"), { family: "Cairo" });
  registerFont(path.join(process.cwd(), "fonts", "Tajawal-Regular.ttf"), { family: "Tajawal" });
} catch (e) {
  console.warn("Could not register custom fonts, using system fonts instead");
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
    // Set canvas dimensions
    const width = 800;
    const height = 1120;
    
    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    
    // Load template image
    // Check if the image URL is relative or absolute
    const imageUrl = template.imageUrl.startsWith('http') 
      ? template.imageUrl 
      : `${process.env.BASE_URL || 'http://localhost:5000'}${template.imageUrl}`;
    
    console.log(`Loading template image from ${imageUrl}`);
    const image = await loadImage(imageUrl);
    
    // Draw template image
    ctx.drawImage(image, 0, 0, width, height);
    
    // Add semi-transparent overlay for better text visibility if needed
    if (!template.settings?.noOverlay) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(0, 0, width, height);
    }
    
    // Default text properties (will be overridden by field settings)
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.direction = "rtl";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 5;
    
    // طباعة معلومات الحقول المستخدمة
    console.log("Form Data:", formData);
    
    // جلب بيانات حقول القالب
    try {
      // جلب حقول القالب من قاعدة البيانات
      const { db } = await import('./db');
      const { templateFields } = await import('@shared/schema');
      
      // استعلام الحقول للقالب
      const fields = await db.query.templateFields.findMany({
        where: (templateFields, { eq }) => eq(templateFields.templateId, template.id)
      });
      
      console.log(`Found ${fields.length} template fields for template ID ${template.id}`);
      
      // الحقول المُدخلة - مع الإعدادات المخصصة لكل حقل
      if (formData) {
        drawCustomFieldsWithStyles(ctx, formData, width, height, fields);
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
    
    // Save image to file
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);
    
    return outputPath;
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("فشل في إنشاء الصورة");
  }
}

// دالة جديدة لرسم الحقول المخصصة مع أنماط مخصصة
function drawCustomFieldsWithStyles(ctx: any, formData: any, width: number, height: number, fields: any[]) {
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
      const fontFamily = style.fontFamily || 'Cairo';
      const fontSize = style.fontSize || 30;
      const fontWeight = style.fontWeight || '';
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      
      // تحديد لون النص
      if (style.color) {
        ctx.fillStyle = style.color;
      }
      
      // تحديد مكان النص
      let posX = width / 2; // مركز افتراضي
      let posY = 0;
      
      // استخدام الموضع المخصص إذا كان متوفراً
      if (fieldConfig.position) {
        if (fieldConfig.position.x !== undefined) {
          posX = fieldConfig.position.x * width;
        }
        if (fieldConfig.position.y !== undefined) {
          posY = fieldConfig.position.y * height;
        } else {
          // استخدام موضع تلقائي
          posY = startY + (index * spaceBetweenFields);
        }
      } else {
        // استخدام موضع تلقائي
        posY = startY + (index * spaceBetweenFields);
      }
      
      // رسم النص مع التفاف الكلمات
      const lines = wrapText(ctx, text, width - 100);
      let currentY = posY;
      
      for (const line of lines) {
        ctx.fillText(line, posX, currentY);
        currentY += parseInt(fontSize) + 5;
      }
    } else {
      // استخدام الإعدادات الافتراضية إذا لم يتم العثور على إعدادات مخصصة
      const fontSize = fieldNames.length > 5 ? 26 : 30;
      ctx.font = `${fontSize}px Cairo`;
      
      // رسم النص
      const lines = wrapText(ctx, text, width - 100);
      let currentY = startY + (index * spaceBetweenFields);
      
      for (const line of lines) {
        ctx.fillText(line, width / 2, currentY);
        currentY += fontSize + 5;
      }
    }
    
    // استعادة حالة السياق الأصلية
    ctx.restore();
  });
}

// دالة لرسم الحقول المخصصة على الصورة (الإعدادات الافتراضية)
function drawCustomFields(ctx: any, formData: any, width: number, height: number) {
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
    ctx.font = `${fontSize}px Cairo`;
    
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
  ctx.font = "bold 40px Cairo";
  ctx.fillText(formData.groomName, width / 2, height * 0.25);
  
  ctx.font = "30px Cairo";
  ctx.fillText("&", width / 2, height * 0.32);
  
  ctx.font = "bold 40px Cairo";
  ctx.fillText(formData.brideName, width / 2, height * 0.38);
  
  // Add shadow to text
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 5;
  
  // Set details font
  ctx.font = "28px Tajawal";
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
    ctx.font = "22px Tajawal";
    ctx.fillText(formData.additionalNotes, width / 2, height * 0.85);
  }
}

function drawEngagementText(ctx: any, formData: any, width: number, height: number) {
  // Set main title font
  ctx.font = "bold 40px Cairo";
  ctx.fillText(formData.groomName, width / 2, height * 0.25);
  
  ctx.font = "30px Cairo";
  ctx.fillText("&", width / 2, height * 0.32);
  
  ctx.font = "bold 40px Cairo";
  ctx.fillText(formData.brideName, width / 2, height * 0.38);
  
  // Add shadow to text
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 5;
  
  // Set details font
  ctx.font = "28px Tajawal";
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
    ctx.font = "22px Tajawal";
    ctx.fillText(formData.additionalNotes, width / 2, height * 0.85);
  }
}

function drawGraduationText(ctx: any, formData: any, width: number, height: number) {
  // Set main title font
  ctx.font = "bold 45px Cairo";
  ctx.fillText("تهنئة تخرج", width / 2, height * 0.2);
  
  ctx.font = "bold 40px Cairo";
  ctx.fillText(formData.graduateName, width / 2, height * 0.3);
  
  // Add shadow to text
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 5;
  
  // Set details font
  ctx.font = "30px Tajawal";
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
    ctx.font = "24px Tajawal";
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
  ctx.font = "bold 45px Cairo";
  ctx.fillText(`عيد ${formData.eidType} مبارك`, width / 2, height * 0.25);
  
  // Add shadow to text
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 5;
  
  // Set details font
  ctx.font = "30px Tajawal";
  if (formData.recipient) {
    ctx.fillText(`إلى: ${formData.recipient}`, width / 2, height * 0.4);
  }
  
  if (formData.message) {
    ctx.font = "26px Tajawal";
    const lines = wrapText(ctx, formData.message, width - 100);
    let y = height * 0.55;
    for (const line of lines) {
      ctx.fillText(line, width / 2, y);
      y += 35;
    }
  }
  
  if (formData.sender) {
    ctx.font = "28px Tajawal";
    ctx.fillText(`من: ${formData.sender}`, width / 2, height * 0.85);
  }
}

function drawRamadanText(ctx: any, formData: any, width: number, height: number) {
  // Set main title font
  ctx.font = "bold 45px Cairo";
  ctx.fillText("رمضان كريم", width / 2, height * 0.25);
  
  // Add shadow to text
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 5;
  
  if (formData.year) {
    ctx.font = "30px Cairo";
    ctx.fillText(formData.year, width / 2, height * 0.33);
  }
  
  // Set details font
  ctx.font = "30px Tajawal";
  if (formData.recipient) {
    ctx.fillText(`إلى: ${formData.recipient}`, width / 2, height * 0.45);
  }
  
  if (formData.message) {
    ctx.font = "26px Tajawal";
    const lines = wrapText(ctx, formData.message, width - 100);
    let y = height * 0.55;
    for (const line of lines) {
      ctx.fillText(line, width / 2, y);
      y += 35;
    }
  }
  
  if (formData.sender) {
    ctx.font = "28px Tajawal";
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
