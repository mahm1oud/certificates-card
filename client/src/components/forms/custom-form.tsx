import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTemplateForm } from "@/hooks/use-template-form";

interface CustomFormProps {
  onChange: (data: any) => void;
  template: any;
}

const CustomForm = ({ onChange, template }: CustomFormProps) => {
  // التحقق من وجود الحقول المطلوبة في القالب
  const templateFields = template?.fields || ["sender", "recipient", "message"];
  
  // إنشاء حالة افتراضية تعتمد على الحقول المتاحة في القالب
  const initialState: Record<string, string> = {};
  templateFields.forEach((field: string) => {
    initialState[field] = "";
  });

  const { formData, updateFormField } = useTemplateForm(initialState);

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  // رسم حقول النموذج بشكل ديناميكي بناءً على الحقول المحددة في القالب
  return (
    <div className="space-y-4">
      {templateFields.includes("sender") && (
        <div className="form-group">
          <Label htmlFor="sender" className="block text-sm font-medium text-neutral-700 mb-1">
            اسم المرسل
          </Label>
          <Input
            id="sender"
            name="sender"
            value={formData.sender || ""}
            onChange={(e) => updateFormField("sender", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="أدخل اسمك"
            required
          />
        </div>
      )}

      {templateFields.includes("recipient") && (
        <div className="form-group">
          <Label htmlFor="recipient" className="block text-sm font-medium text-neutral-700 mb-1">
            اسم المستلم
          </Label>
          <Input
            id="recipient"
            name="recipient"
            value={formData.recipient || ""}
            onChange={(e) => updateFormField("recipient", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="أدخل اسم الشخص الذي تريد إرسال البطاقة له"
            required
          />
        </div>
      )}
      
      {templateFields.includes("message") && (
        <div className="form-group">
          <Label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-1">
            رسالة البطاقة
          </Label>
          <Textarea
            id="message"
            name="message"
            value={formData.message || ""}
            onChange={(e) => updateFormField("message", e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="اكتب رسالتك هنا..."
            required
          />
        </div>
      )}
      
      {templateFields.includes("event") && (
        <div className="form-group">
          <Label htmlFor="event" className="block text-sm font-medium text-neutral-700 mb-1">
            المناسبة
          </Label>
          <Input
            id="event"
            name="event"
            value={formData.event || ""}
            onChange={(e) => updateFormField("event", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="أدخل اسم المناسبة"
            required
          />
        </div>
      )}
      
      {templateFields.includes("date") && (
        <div className="form-group">
          <Label htmlFor="date" className="block text-sm font-medium text-neutral-700 mb-1">
            التاريخ
          </Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={formData.date || ""}
            onChange={(e) => updateFormField("date", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
            required
          />
        </div>
      )}
      
      {templateFields.includes("time") && (
        <div className="form-group">
          <Label htmlFor="time" className="block text-sm font-medium text-neutral-700 mb-1">
            الوقت
          </Label>
          <Input
            id="time"
            name="time"
            type="time"
            value={formData.time || ""}
            onChange={(e) => updateFormField("time", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
            required
          />
        </div>
      )}
      
      {templateFields.includes("occasion") && (
        <div className="form-group">
          <Label htmlFor="occasion" className="block text-sm font-medium text-neutral-700 mb-1">
            المناسبة
          </Label>
          <Input
            id="occasion"
            name="occasion"
            value={formData.occasion || ""}
            onChange={(e) => updateFormField("occasion", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="أدخل نوع المناسبة"
            required
          />
        </div>
      )}
    </div>
  );
};

export default CustomForm;