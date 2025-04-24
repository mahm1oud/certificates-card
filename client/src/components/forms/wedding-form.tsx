import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTemplateForm } from "@/hooks/use-template-form";

interface WeddingFormProps {
  onChange: (data: any) => void;
  template: any;
}

const WeddingForm = ({ onChange, template }: WeddingFormProps) => {
  const { formData, updateFormField } = useTemplateForm({
    groomName: '',
    brideName: '',
    weddingDate: '',
    weddingTime: '',
    weddingLocation: '',
    additionalNotes: ''
  });

  useEffect(() => {
    onChange(formData);
  }, [formData, onChange]);

  return (
    <div className="space-y-4">
      <div className="form-group">
        <Label htmlFor="groom-name" className="block text-sm font-medium text-neutral-700 mb-1">
          اسم العريس
        </Label>
        <Input
          id="groom-name"
          name="groomName"
          value={formData.groomName}
          onChange={(e) => updateFormField('groomName', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="أدخل اسم العريس"
          required
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="bride-name" className="block text-sm font-medium text-neutral-700 mb-1">
          اسم العروس
        </Label>
        <Input
          id="bride-name"
          name="brideName"
          value={formData.brideName}
          onChange={(e) => updateFormField('brideName', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="أدخل اسم العروس"
          required
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="wedding-date" className="block text-sm font-medium text-neutral-700 mb-1">
          تاريخ الزفاف
        </Label>
        <Input
          type="date"
          id="wedding-date"
          name="weddingDate"
          value={formData.weddingDate}
          onChange={(e) => updateFormField('weddingDate', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          required
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="wedding-time" className="block text-sm font-medium text-neutral-700 mb-1">
          وقت الزفاف
        </Label>
        <Input
          type="time"
          id="wedding-time"
          name="weddingTime"
          value={formData.weddingTime}
          onChange={(e) => updateFormField('weddingTime', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          required
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="wedding-location" className="block text-sm font-medium text-neutral-700 mb-1">
          مكان الزفاف
        </Label>
        <Input
          id="wedding-location"
          name="weddingLocation"
          value={formData.weddingLocation}
          onChange={(e) => updateFormField('weddingLocation', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="أدخل مكان الزفاف"
          required
        />
      </div>
      
      <div className="form-group">
        <Label htmlFor="additional-notes" className="block text-sm font-medium text-neutral-700 mb-1">
          ملاحظات إضافية
        </Label>
        <Textarea
          id="additional-notes"
          name="additionalNotes"
          value={formData.additionalNotes}
          onChange={(e) => updateFormField('additionalNotes', e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="أي ملاحظات إضافية ترغب في إضافتها"
        />
      </div>
    </div>
  );
};

export default WeddingForm;
