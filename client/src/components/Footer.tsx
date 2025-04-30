import React from 'react';
import { Link } from 'wouter';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-background border-t py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-muted-foreground text-center md:text-right">
              © {currentYear} نظام بطاقة. جميع الحقوق محفوظة.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              الرئيسية
            </Link>
            <Link href="/auth" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              تسجيل الدخول
            </Link>
            <Link href="/certificates/verify/public" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              التحقق من الشهادة
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;