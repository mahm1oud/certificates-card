import { pgTable, text, serial, integer, boolean, timestamp, json, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User schema - المستخدمين
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"), // تم جعل هذا الحقل اختياريًا لدعم تسجيل الدخول من خلال مواقع التواصل الاجتماعي
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLogin: timestamp("last_login"),
  active: boolean("active").default(true).notNull(),
  // حقول خاصة بتسجيل الدخول من خلال مواقع التواصل الاجتماعي
  profileImageUrl: text("profile_image_url"), // رابط صورة الملف الشخصي
  provider: text("provider"), // المزود (google, facebook, twitter, linkedin)
  providerId: text("provider_id"), // معرف المستخدم لدى المزود
  providerData: json("provider_data").default({}), // بيانات إضافية من المزود
  verifiedEmail: boolean("verified_email").default(false), // هل تم التحقق من البريد الإلكتروني
  locale: text("locale").default("ar"), // لغة المستخدم المفضلة
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  role: true,
  active: true,
  profileImageUrl: true,
  provider: true,
  providerId: true,
  providerData: true,
  verifiedEmail: true,
  locale: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Category schema - التصنيفات
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar"), // Arabic name
  slug: text("slug").notNull().unique(),
  description: text("description"),
  descriptionAr: text("description_ar"), // Arabic description
  displayOrder: integer("display_order").notNull().default(0),
  icon: text("icon"), // Category icon
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  nameAr: true,
  slug: true,
  description: true,
  descriptionAr: true,
  displayOrder: true,
  icon: true,
  active: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Template schema - القوالب
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleAr: text("title_ar"), // Arabic title
  slug: text("slug").notNull(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  displayOrder: integer("display_order").notNull().default(0),
  fields: json("fields").notNull().default([]).$type<string[]>(), // Fields that this template requires
  defaultValues: json("default_values").default({}), // Default values for fields
  settings: json("settings").default({}), // Font, color, position settings
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTemplateSchema = createInsertSchema(templates).pick({
  title: true,
  titleAr: true,
  slug: true,
  categoryId: true,
  imageUrl: true,
  thumbnailUrl: true,
  displayOrder: true,
  fields: true,
  defaultValues: true,
  settings: true,
  active: true,
});

export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;

// Template Fields schema - حقول القوالب
export const templateFields = pgTable("template_fields", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => templates.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  label: text("label").notNull(),
  labelAr: text("label_ar"), // Arabic label
  type: text("type").notNull().default("text"), // text, textarea, date, checkbox, radio, select, image
  required: boolean("required").default(false).notNull(),
  defaultValue: text("default_value"),
  placeholder: text("placeholder"),
  placeholderAr: text("placeholder_ar"),
  options: json("options").default([]), // For select, radio
  position: json("position").default({}), // x, y, width, height (in %)
  style: json("style").default({}), // font, size, color, alignment, etc.
  displayOrder: integer("display_order").default(0).notNull(),
});

export const insertTemplateFieldSchema = createInsertSchema(templateFields).pick({
  templateId: true,
  name: true,
  label: true,
  labelAr: true,
  type: true,
  required: true,
  defaultValue: true,
  placeholder: true,
  placeholderAr: true,
  options: true,
  position: true,
  style: true,
  displayOrder: true,
});

export type InsertTemplateField = z.infer<typeof insertTemplateFieldSchema>;
export type TemplateField = typeof templateFields.$inferSelect;

// Fonts schema - الخطوط
export const fonts = pgTable("fonts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar"),
  family: text("family").notNull(),
  type: text("type").notNull().default("google"), // google, custom, system
  url: text("url"),
  active: boolean("active").default(true).notNull(),
  isRtl: boolean("is_rtl").default(false).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFontSchema = createInsertSchema(fonts).pick({
  name: true,
  nameAr: true,
  family: true,
  type: true,
  url: true,
  active: true,
  isRtl: true,
  displayOrder: true,
});

export type InsertFont = z.infer<typeof insertFontSchema>;
export type Font = typeof fonts.$inferSelect;

// Card schema - البطاقات المولدة من القوالب
export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => templates.id),
  userId: integer("user_id").references(() => users.id),
  formData: json("form_data").notNull(),
  imageUrl: text("image_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastAccessed: timestamp("last_accessed"),
  quality: text("quality").default("medium"), // low, medium, high
  publicId: text("public_id").unique(), // For public access
  accessCount: integer("access_count").default(0).notNull(),
  settings: json("settings").default({}), // Card-specific settings
  status: text("status").default("active").notNull(), // active, draft, deleted
});

export const insertCardSchema = createInsertSchema(cards).pick({
  templateId: true,
  userId: true,
  formData: true,
  imageUrl: true,
  thumbnailUrl: true,
  categoryId: true,
  quality: true,
  publicId: true,
  settings: true,
  status: true,
});

export type InsertCard = z.infer<typeof insertCardSchema>;
export type Card = typeof cards.$inferSelect;

// Certificates schema - الشهادات
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleAr: text("title_ar"),
  templateId: integer("template_id").notNull().references(() => templates.id),
  userId: integer("user_id").references(() => users.id),
  certificateType: text("certificate_type").notNull().default("appreciation"), // appreciation, training, education, teacher
  formData: json("form_data").notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiryDate: date("expiry_date"),
  status: text("status").default("active").notNull(), // active, expired, revoked
  issuedTo: text("issued_to"),
  issuedToGender: text("issued_to_gender").default("male"), // male, female - للقواعد النحوية العربية
  verificationCode: text("verification_code").unique(),
  publicId: text("public_id").unique(),
});

export const insertCertificateSchema = createInsertSchema(certificates).pick({
  title: true,
  titleAr: true,
  templateId: true,
  userId: true,
  certificateType: true,
  formData: true,
  imageUrl: true,
  expiryDate: true,
  status: true,
  issuedTo: true,
  issuedToGender: true,
  verificationCode: true,
  publicId: true,
});

export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificates.$inferSelect;

// Certificate Batches schema - مجموعات الشهادات (للإنشاء الجماعي)
export const certificateBatches = pgTable("certificate_batches", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  userId: integer("user_id").references(() => users.id),
  templateId: integer("template_id").notNull().references(() => templates.id),
  status: text("status").default("pending").notNull(), // pending, processing, completed, failed
  totalItems: integer("total_items").default(0).notNull(),
  processedItems: integer("processed_items").default(0).notNull(),
  sourceType: text("source_type").default("excel").notNull(), // excel, csv, manual
  sourceData: text("source_data"), // Path to source file
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertCertificateBatchSchema = createInsertSchema(certificateBatches).pick({
  title: true,
  userId: true,
  templateId: true,
  status: true,
  totalItems: true,
  sourceType: true,
  sourceData: true,
});

export type InsertCertificateBatch = z.infer<typeof insertCertificateBatchSchema>;
export type CertificateBatch = typeof certificateBatches.$inferSelect;

// Certificate Batch Items schema - عناصر مجموعات الشهادات
export const certificateBatchItems = pgTable("certificate_batch_items", {
  id: serial("id").primaryKey(),
  batchId: integer("batch_id").notNull().references(() => certificateBatches.id, { onDelete: "cascade" }),
  certificateId: integer("certificate_id").references(() => certificates.id),
  status: text("status").default("pending").notNull(), // pending, processing, completed, failed
  formData: json("form_data").notNull(),
  errorMessage: text("error_message"),
  rowNumber: integer("row_number"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const insertCertificateBatchItemSchema = createInsertSchema(certificateBatchItems).pick({
  batchId: true,
  certificateId: true,
  status: true,
  formData: true,
  errorMessage: true,
  rowNumber: true,
});

export type InsertCertificateBatchItem = z.infer<typeof insertCertificateBatchItemSchema>;
export type CertificateBatchItem = typeof certificateBatchItems.$inferSelect;

// Settings schema - إعدادات النظام
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: json("value").notNull(),
  category: text("category").default("general").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
});

export const insertSettingSchema = createInsertSchema(settings).pick({
  key: true,
  value: true,
  category: true,
  description: true,
  updatedBy: true,
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

// تعريف العلاقات بعد تعريف جميع الجداول
// Define relations after all tables are defined

export const usersRelations = relations(users, ({ many }) => ({
  cards: many(cards),
  certificates: many(certificates),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  templates: many(templates),
}));

export const templatesRelations = relations(templates, ({ one, many }) => ({
  category: one(categories, { fields: [templates.categoryId], references: [categories.id] }),
  cards: many(cards),
  templateFields: many(templateFields),
  certificates: many(certificates),
}));

export const templateFieldsRelations = relations(templateFields, ({ one }) => ({
  template: one(templates, { fields: [templateFields.templateId], references: [templates.id] }),
}));

export const cardsRelations = relations(cards, ({ one }) => ({
  template: one(templates, { fields: [cards.templateId], references: [templates.id] }),
  user: one(users, { fields: [cards.userId], references: [users.id] }),
  category: one(categories, { fields: [cards.categoryId], references: [categories.id] }),
}));

export const certificatesRelations = relations(certificates, ({ one, many }) => ({
  template: one(templates, { fields: [certificates.templateId], references: [templates.id] }),
  user: one(users, { fields: [certificates.userId], references: [users.id] }),
  batchItems: many(certificateBatchItems),
}));

export const certificateBatchesRelations = relations(certificateBatches, ({ one, many }) => ({
  user: one(users, { fields: [certificateBatches.userId], references: [users.id] }),
  template: one(templates, { fields: [certificateBatches.templateId], references: [templates.id] }),
  items: many(certificateBatchItems),
}));

export const certificateBatchItemsRelations = relations(certificateBatchItems, ({ one }) => ({
  batch: one(certificateBatches, { fields: [certificateBatchItems.batchId], references: [certificateBatches.id] }),
  certificate: one(certificates, { fields: [certificateBatchItems.certificateId], references: [certificates.id] }),
}));
