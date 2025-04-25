import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import arTranslations from '../translations/ar.json';
import enTranslations from '../translations/en.json';

// أنواع البيانات
type LocaleType = 'ar' | 'en';
type TranslationsType = typeof arTranslations;

interface I18nContextType {
  locale: LocaleType;
  translations: TranslationsType;
  setLocale: (locale: LocaleType) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  dir: () => 'rtl' | 'ltr';
  langName: () => string;
}

// إنشاء السياق
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// مزود السياق
export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // تحديد اللغة الافتراضية (العربية)
  const [locale, setLocale] = useState<LocaleType>('ar');
  const [translations, setTranslations] = useState<TranslationsType>(arTranslations);

  // تحديث الترجمات عند تغيير اللغة
  useEffect(() => {
    const loadTranslations = async () => {
      if (locale === 'ar') {
        setTranslations(arTranslations);
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'ar';
      } else if (locale === 'en') {
        setTranslations(enTranslations);
        document.documentElement.dir = 'ltr';
        document.documentElement.lang = 'en';
      }
    };
    
    loadTranslations();
    
    // حفظ اللغة المحددة في التخزين المحلي
    localStorage.setItem('locale', locale);
  }, [locale]);

  // استرجاع اللغة المفضلة من التخزين المحلي عند التحميل
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as LocaleType | null;
    if (savedLocale && (savedLocale === 'ar' || savedLocale === 'en')) {
      setLocale(savedLocale);
    }
  }, []);

  // دالة للحصول على ترجمة من خلال المفتاح
  const t = (key: string, variables?: Record<string, string | number>): string => {
    // تقسيم المفتاح (مثال: "app.menu.home" إلى ["app", "menu", "home"])
    const keys = key.split('.');
    // البحث عن القيمة في كائن الترجمات
    let translation: any = translations;
    
    for (const k of keys) {
      translation = translation && translation[k];
      if (!translation) break;
    }
    
    // إذا لم يتم العثور على الترجمة، إرجاع المفتاح الأصلي
    if (!translation || typeof translation !== 'string') {
      console.warn(`Translation not found for key: ${key}`);
      return key;
    }
    
    // استبدال المتغيرات إن وجدت (مثال: "Hello {{name}}" و variables = { name: "John" })
    if (variables) {
      return Object.entries(variables).reduce((text, [varKey, varValue]) => {
        return text.replace(new RegExp(`{{${varKey}}}`, 'g'), String(varValue));
      }, translation);
    }
    
    return translation;
  };

  // دالة لتحديد اتجاه النص بناءً على اللغة الحالية
  const dir = (): 'rtl' | 'ltr' => {
    return locale === 'ar' ? 'rtl' : 'ltr';
  };

  // دالة للحصول على اسم اللغة الحالية
  const langName = (): string => {
    return locale === 'ar' ? 'العربية' : 'English';
  };

  // توفير السياق للتطبيق
  return (
    <I18nContext.Provider value={{ locale, translations, setLocale, t, dir, langName }}>
      {children}
    </I18nContext.Provider>
  );
};

// هوك لاستخدام الترجمة في المكونات
export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};

// مكون لتبديل اللغة
export const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale, langName } = useTranslation();
  
  const toggleLanguage = () => {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  };
  
  return (
    <button 
      onClick={toggleLanguage}
      className="px-3 py-1 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-100"
    >
      {langName()}
    </button>
  );
};