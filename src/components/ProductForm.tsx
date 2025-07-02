
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { ProductInput } from '@/types/ProductBrief';

interface ProductFormProps {
  onSubmit: (input: ProductInput) => void;
  isLoading: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<ProductInput>({
    product_name: '',
    use_case: '',
    aesthetic: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof ProductInput, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200 shadow-xl">
      <CardHeader className="text-center pb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-6 w-6 text-blue-600" />
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Product Brief Generator
          </CardTitle>
        </div>
        <CardDescription className="text-slate-600">
          Transform your product concept into a structured, studio-ready brief
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="product_name" className="text-sm font-medium text-slate-700">
              Product Name
            </Label>
            <Input
              id="product_name"
              type="text"
              placeholder="e.g., Sleep Gummies"
              value={formData.product_name}
              onChange={(e) => handleInputChange('product_name', e.target.value)}
              className="bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="use_case" className="text-sm font-medium text-slate-700">
              Use Case
            </Label>
            <Textarea
              id="use_case"
              placeholder="e.g., help people relax before bed"
              value={formData.use_case}
              onChange={(e) => handleInputChange('use_case', e.target.value)}
              className="bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500 min-h-[80px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aesthetic" className="text-sm font-medium text-slate-700">
              Aesthetic Vision
            </Label>
            <Textarea
              id="aesthetic"
              placeholder="e.g., clean and calming"
              value={formData.aesthetic}
              onChange={(e) => handleInputChange('aesthetic', e.target.value)}
              className="bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500 min-h-[80px]"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !formData.product_name || !formData.use_case || !formData.aesthetic}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 transition-all duration-200 transform hover:scale-[1.02]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Brief...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Product Brief
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProductForm;
