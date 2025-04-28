import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DraggableFieldsPreview } from './DraggableFieldsPreview';
import { 
  Grid, 
  Info, 
  Square, 
  Ruler, 
  Layout, 
  CheckSquare, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  ToggleLeft, 
  ToggleRight,
  Layers,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface FieldsPositionEditorProps {
  isOpen: boolean;
  template: any;
  fields: any[];
  onClose: () => void;
  onSave: (updatedFields: any[]) => void;
}

export const FieldsPositionEditor: React.FC<FieldsPositionEditorProps> = ({
  isOpen,
  template,
  fields,
  onClose,
  onSave
}) => {
  const [selectedField, setSelectedField] = useState<any>(null);
  const [updatedFields, setUpdatedFields] = useState<any[]>([...fields]);
  
  // إعدادات الشبكة والتجاذب
  const [gridEnabled, setGridEnabled] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(50);
  const [snapThreshold, setSnapThreshold] = useState(15);
  
  // تحديث الحقول عند تغيير القيم من المكون الأب
  useEffect(() => {
    setUpdatedFields([...fields]);
  }, [fields]);
  
  const handleFieldPositionChange = (fieldId: number, position: { x: number, y: number }, snapToGrid?: boolean) => {
    // تحديث الحقل في القائمة المحلية
    setUpdatedFields(prevFields => 
      prevFields.map(field => 
        field.id === fieldId 
          ? { 
              ...field, 
              position: { 
                ...field.position, 
                x: position.x, 
                y: position.y,
                snapToGrid: snapToGrid !== undefined ? snapToGrid : field.position?.snapToGrid
              } 
            } 
          : field
      )
    );
  };
  
  // تغيير ترتيب طبقة الحقل المحدد
  const handleChangeLayer = (direction: 'up' | 'down') => {
    if (!selectedField) return;
    
    setUpdatedFields(prevFields => 
      prevFields.map(field => {
        if (field.id === selectedField.id) {
          const currentLayer = field.style?.layer || 1;
          // زيادة أو خفض العمق، لا يمكن أن يكون أقل من 1
          const newLayer = direction === 'up' 
            ? currentLayer + 1 
            : Math.max(1, currentLayer - 1);
          
          return { 
            ...field, 
            style: { 
              ...field.style, 
              layer: newLayer 
            } 
          };
        }
        return field;
      })
    );
  };
  
  // معالجة حفظ التغييرات
  const handleSaveChanges = () => {
    onSave(updatedFields);
  };
  
  // تحديث إعدادات المحرر في DraggableFieldsPreview
  const updateEditorSettings = {
    gridEnabled,
    snapToGrid,
    gridSize,
    snapThreshold
  };
  
  return (
    <Dialog open={isOpen === true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>تعديل مواضع الحقول</DialogTitle>
          <DialogDescription>
            يمكنك ضبط موقع كل حقل بدقة باستخدام السحب والإفلات
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <div className="p-2 mb-2 bg-gray-100 rounded flex flex-wrap items-center text-sm space-x-2 rtl:space-x-reverse">
            <div className="flex items-center ml-4">
              <Info className="w-4 h-4 ml-2" />
              <span>اسحب الحقول وأفلتها على موضعها المناسب في القالب. ستظهر بنفس المكان في البطاقة النهائية.</span>
            </div>
            
            <div className="flex items-center ml-4">
              <Grid className="w-4 h-4 ml-2" />
              <span>يمكنك ضبط إعدادات الشبكة من التحكم أسفل المحرر.</span>
            </div>
            
            <div className="flex items-center">
              <Ruler className="w-4 h-4 ml-2" />
              <span>الخطوط الزرقاء تمثل خطوط إرشادية تظهر أثناء السحب للمساعدة في المحاذاة.</span>
            </div>
          </div>
          
          <div className="h-[calc(100%-6rem)] overflow-auto">
            {template && (
              <DraggableFieldsPreview
                templateImage={template.imageUrl || ''}
                fields={updatedFields}
                selectedField={selectedField}
                onFieldPositionChange={handleFieldPositionChange}
                onSelectField={setSelectedField}
                className="border-gray-200"
                editorSettings={updateEditorSettings}
              />
            )}
          </div>
          
          {/* تحكم الشبكة والتجاذب */}
          <div className="mt-2 p-2 bg-gray-50 rounded-md flex flex-wrap items-center gap-4 rtl:space-x-reverse">
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap">إظهار الشبكة</Label>
              <Switch 
                checked={gridEnabled}
                onCheckedChange={setGridEnabled}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-xs whitespace-nowrap">تفعيل التجاذب</Label>
              <Switch 
                checked={snapToGrid}
                onCheckedChange={setSnapToGrid}
              />
            </div>
            
            <div className="flex items-center gap-2 min-w-[200px]">
              <Grid className="w-4 h-4 ml-1" />
              <Label className="text-xs whitespace-nowrap">حجم الشبكة</Label>
              <div className="flex-1">
                <Slider 
                  min={20} 
                  max={100} 
                  step={5}
                  value={[gridSize]} 
                  onValueChange={(value) => setGridSize(value[0])}
                />
              </div>
              <span className="text-xs font-mono w-8 text-center">{gridSize}px</span>
            </div>
            
            <div className="flex items-center gap-2 min-w-[200px]">
              <Move className="w-4 h-4 ml-1" />
              <Label className="text-xs whitespace-nowrap">قوة التجاذب</Label>
              <div className="flex-1">
                <Slider 
                  min={5} 
                  max={30} 
                  step={5}
                  value={[snapThreshold]} 
                  onValueChange={(value) => setSnapThreshold(value[0])}
                />
              </div>
              <span className="text-xs font-mono w-8 text-center">{snapThreshold}px</span>
            </div>
          </div>
        </div>
        
        {/* لوحة التحكم بالطبقات - تظهر فقط عند اختيار حقل */}
        {selectedField && (
          <div className="mt-2 p-2 bg-blue-50 rounded-md flex flex-wrap items-center gap-4 rtl:space-x-reverse">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 ml-1 text-blue-500" />
              <span className="text-sm font-semibold text-blue-700">التحكم بطبقات العناصر</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1 text-xs"
                onClick={() => handleChangeLayer('up')}
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>رفع للأمام</span>
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1 text-xs"
                onClick={() => handleChangeLayer('down')}
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>إرجاع للخلف</span>
              </Button>
              
              <div className="py-1 px-2 bg-white rounded border text-xs flex items-center">
                <span className="text-gray-500 ml-1">طبقة:</span>
                <span className="font-mono">{selectedField.style?.layer || 1}</span>
              </div>
              
              <div className="py-1 px-2 bg-white rounded border text-xs">
                <span className="text-gray-500 ml-1">الحقل:</span>
                <span className="font-semibold">{selectedField.label || selectedField.name}</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 mr-auto">
              <span>العناصر ذات الرقم الأعلى تظهر في المقدمة</span>
            </div>
          </div>
        )}
        
        <DialogFooter className="mt-2 flex flex-wrap items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-500 flex items-center">
              <CheckSquare className="w-4 h-4 ml-1 text-blue-500" />
              <span>التجاذب متاح للشبكة وحدود القالب ومواضع الحقول الأخرى</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="default" onClick={handleSaveChanges}>حفظ التغييرات</Button>
            <Button variant="outline" onClick={onClose}>إغلاق</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};