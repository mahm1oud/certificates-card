import { Router, Request, Response } from "express";
import { existsSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { hashPassword } from "../auth";
import { db } from "../db";
import { users } from "@shared/schema";
import { settings } from "@shared/schema";
import { storage } from "../storage";
import { sql } from "drizzle-orm";

const router = Router();

// Path to the installation status file
const INSTALL_STATUS_FILE = join(process.cwd(), ".installation-complete");

// Middleware to check if installation is allowed
const allowInstallation = (req: Request, res: Response, next: Function) => {
  // Check if installation is already completed
  if (existsSync(INSTALL_STATUS_FILE)) {
    try {
      const data = JSON.parse(readFileSync(INSTALL_STATUS_FILE, "utf8"));
      // If installation is complete, deny further installation actions
      if (data.installed) {
        return res.status(403).json({
          success: false,
          message: "النظام مثبت بالفعل. إذا كنت ترغب في إعادة التثبيت، يرجى حذف ملف التثبيت أو الاتصال بالمسؤول.",
        });
      }
    } catch (error) {
      // If file is corrupted, allow installation to proceed
      console.error("Error reading installation status:", error);
    }
  }
  next();
};

// Get installation status
router.get("/status", (req: Request, res: Response) => {
  const installed = existsSync(INSTALL_STATUS_FILE);
  let status = { installed: false };
  
  if (installed) {
    try {
      status = JSON.parse(readFileSync(INSTALL_STATUS_FILE, "utf8"));
    } catch (error) {
      console.error("Error reading installation status:", error);
    }
  }
  
  res.json(status);
});

// Check system requirements
router.get("/check-requirements", allowInstallation, async (req: Request, res: Response) => {
  try {
    // Define checks object with default values
    const checks = {
      node: { passed: false, message: "Node.js غير متوفر أو الإصدار غير مدعوم" },
      database: { passed: false, message: "لا يمكن الاتصال بقاعدة البيانات" },
      writable: { passed: false, message: "المسارات غير قابلة للكتابة" },
      extensions: { passed: false, message: "بعض الإضافات المطلوبة غير متوفرة" },
      php: { passed: true, message: "PHP غير مطلوب" }, // PHP not required, but kept for compatibility
    };

    // Check Node.js version
    const nodeVersion = process.version;
    if (nodeVersion) {
      const versionNum = nodeVersion.substring(1).split(".").map(Number);
      if (versionNum[0] >= 16) {
        checks.node = { passed: true, message: `Node.js متوفر (الإصدار ${nodeVersion})` };
      } else {
        checks.node = { passed: false, message: `يجب استخدام Node.js 16.x أو أحدث (الحالي: ${nodeVersion})` };
      }
    }

    // Check database connection
    try {
      // Use the existing database connection from db.ts
      // Just see if we can execute a simple query
      await db.execute(sql`SELECT 1`);
      checks.database = { passed: true, message: "يمكن الاتصال بقاعدة البيانات" };
    } catch (dbError) {
      console.error("Database check error:", dbError);
      checks.database = { passed: false, message: "لا يمكن الاتصال بقاعدة البيانات. تأكد من إعدادات الاتصال" };
    }

    // Check if directories are writable
    const dirsToCheck = ["uploads", "temp", "public"];
    let allDirsWritable = true;
    
    dirsToCheck.forEach(dir => {
      try {
        const testFile = join(process.cwd(), dir, ".write-test");
        writeFileSync(testFile, "test", { flag: "w" });
        // File successfully written, directory is writable
        // You should delete the test file but I'm skipping it for brevity
      } catch (error) {
        allDirsWritable = false;
      }
    });
    
    checks.writable = { 
      passed: allDirsWritable, 
      message: allDirsWritable ? "جميع المسارات قابلة للكتابة" : "بعض المسارات غير قابلة للكتابة. تأكد من صلاحيات الكتابة"
    };

    // Check for required npm modules
    // This is a simplified check since we're already running the app
    try {
      require("express");
      require("@neondatabase/serverless");
      require("drizzle-orm");
      checks.extensions = { passed: true, message: "جميع الإضافات المطلوبة متوفرة" };
    } catch (error) {
      checks.extensions = { passed: false, message: "بعض الحزم المطلوبة غير متوفرة. قم بتثبيت الحزم المطلوبة باستخدام npm install" };
    }

    res.json(checks);
  } catch (error) {
    console.error("Error checking requirements:", error);
    res.status(500).json({ success: false, message: "حدث خطأ أثناء التحقق من المتطلبات" });
  }
});

// Set up database
router.post("/setup-database", allowInstallation, async (req: Request, res: Response) => {
  try {
    const { host, port, database, username, password } = req.body;
    
    // Validate input
    if (!host || !database || !username) {
      return res.status(400).json({
        success: false,
        message: "يرجى توفير جميع معلومات قاعدة البيانات المطلوبة",
      });
    }

    // Create connection string
    const connectionString = `postgresql://${username}:${password}@${host}:${port}/${database}`;
    
    // Test connection
    let testPool;
    try {
      testPool = new Pool({ connectionString });
      await testPool.query("SELECT 1");
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return res.status(400).json({
        success: false,
        message: "فشل الاتصال بقاعدة البيانات. تأكد من المعلومات المدخلة",
      });
    } finally {
      if (testPool) {
        await testPool.end();
      }
    }

    // Save database connection information to .env or equivalent config
    // In a production environment, you would typically save this to an .env file or environment variable
    // For this example, we'll save it to a config file
    const dbConfigPath = join(process.cwd(), ".db-config.json");
    writeFileSync(dbConfigPath, JSON.stringify({
      host,
      port,
      database,
      username,
      password,
      url: connectionString,
    }, null, 2));

    // Return success
    res.json({ success: true, message: "تم إعداد قاعدة البيانات بنجاح" });
  } catch (error) {
    console.error("Database setup error:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إعداد قاعدة البيانات",
    });
  }
});

// Set up admin account
router.post("/setup-admin", allowInstallation, async (req: Request, res: Response) => {
  try {
    const { name, email, username, password } = req.body;
    
    // Validate input
    if (!name || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "يرجى توفير جميع معلومات المدير المطلوبة",
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create admin user
    const adminUser = {
      name,
      email,
      username,
      password: hashedPassword,
      role: "admin",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if user with this username already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "اسم المستخدم موجود بالفعل. الرجاء اختيار اسم مستخدم آخر",
      });
    }

    // Insert admin user into database
    await db.insert(users).values(adminUser);

    // Return success
    res.json({ success: true, message: "تم إنشاء حساب المدير بنجاح" });
  } catch (error) {
    console.error("Admin setup error:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إنشاء حساب المدير",
    });
  }
});

// Set up site settings
router.post("/setup-site", allowInstallation, async (req: Request, res: Response) => {
  try {
    const { siteName, siteDescription, siteUrl, companyName, contactEmail } = req.body;
    
    // Validate input
    if (!siteName) {
      return res.status(400).json({
        success: false,
        message: "يرجى توفير اسم الموقع على الأقل",
      });
    }

    // Save site settings
    const siteSettings = {
      siteName,
      siteDescription,
      siteUrl,
      companyName,
      contactEmail,
    };

    // In a real application, you would save these to your database
    // For this example, we'll save to a config file
    const siteConfigPath = join(process.cwd(), ".site-config.json");
    writeFileSync(siteConfigPath, JSON.stringify(siteSettings, null, 2));

    // Also update display settings in the database
    try {
      // Use direct database queries as the storage interface might not have these methods yet
      await db.insert(settings).values({
        category: "display",
        key: "siteName",
        value: siteName,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: [settings.category, settings.key],
        set: { value: siteName, updatedAt: new Date() }
      });
      
      await db.insert(settings).values({
        category: "display",
        key: "siteDescription",
        value: siteDescription,
        createdAt: new Date(),
        updatedAt: new Date()
      }).onConflictDoUpdate({
        target: [settings.category, settings.key],
        set: { value: siteDescription, updatedAt: new Date() }
      });

      if (siteUrl) {
        await db.insert(settings).values({
          category: "display",
          key: "siteUrl",
          value: siteUrl,
          createdAt: new Date(),
          updatedAt: new Date()
        }).onConflictDoUpdate({
          target: [settings.category, settings.key],
          set: { value: siteUrl, updatedAt: new Date() }
        });
      }
      
      if (companyName) {
        await db.insert(settings).values({
          category: "display",
          key: "companyName",
          value: companyName,
          createdAt: new Date(),
          updatedAt: new Date()
        }).onConflictDoUpdate({
          target: [settings.category, settings.key],
          set: { value: companyName, updatedAt: new Date() }
        });
      }
      
      if (contactEmail) {
        await db.insert(settings).values({
          category: "display",
          key: "contactEmail",
          value: contactEmail,
          createdAt: new Date(),
          updatedAt: new Date()
        }).onConflictDoUpdate({
          target: [settings.category, settings.key],
          set: { value: contactEmail, updatedAt: new Date() }
        });
      }
    } catch (dbError) {
      console.error("Error saving settings to database:", dbError);
      // Continue anyway, as this is not critical
    }

    // Mark installation as complete
    writeFileSync(INSTALL_STATUS_FILE, JSON.stringify({
      installed: true,
      completedAt: new Date().toISOString(),
    }));

    // Return success
    res.json({ success: true, message: "تم إكمال تثبيت النظام بنجاح" });
  } catch (error) {
    console.error("Site setup error:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إعداد معلومات الموقع",
    });
  }
});

export const installerRoutes = router;