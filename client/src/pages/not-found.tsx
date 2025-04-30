import { useTranslation } from "../lib/i18n";
import { Link } from "wouter";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md mx-auto">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold">
          {t('notFoundPage.title', 'الصفحة غير موجودة')}
        </h2>
        <p className="text-muted-foreground">
          {t('notFoundPage.message', 'الصفحة التي تبحث عنها غير موجودة أو تمت إزالتها.')}
        </p>
        
        <div className="pt-4">
          <Link href="/">
            <Button variant="default" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('notFoundPage.backToHome', 'العودة للصفحة الرئيسية')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}