
import React, { useState } from 'react';
import { toast } from 'sonner';
import ProductForm from '@/components/ProductForm';
import ProductBriefDisplay from '@/components/ProductBriefDisplay';
import { ProductInput, ProductBrief } from '@/types/ProductBrief';
import { generateProductBrief } from '@/services/productBriefService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [productBrief, setProductBrief] = useState<ProductBrief | null>(null);
  const [showForm, setShowForm] = useState(true);

  const handleFormSubmit = async (input: ProductInput) => {
    setIsLoading(true);
    try {
      console.log('Submitting product input:', input);
      const brief = await generateProductBrief(input);
      setProductBrief(brief);
      setShowForm(false);
      toast.success('Product brief generated successfully!');
    } catch (error) {
      console.error('Error generating product brief:', error);
      toast.error('Failed to generate product brief. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewProduct = () => {
    setProductBrief(null);
    setShowForm(true);
  };

  const handleDownload = () => {
    if (!productBrief) return;
    
    const dataStr = JSON.stringify(productBrief, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${productBrief.product_id}-brief.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Product brief downloaded!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Geneering
              </h1>
              <div className="text-sm text-slate-600 hidden sm:block">
                Product Brief Generator • Phase 1
              </div>
            </div>
            
            {!showForm && productBrief && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNewProduct}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  New Product
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {showForm ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center mb-8 max-w-2xl">
              <h2 className="text-5xl font-bold text-slate-800 mb-4">
                Transform Ideas into 
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Reality</span>
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                Take minimal product input and generate structured, studio-ready documents 
                for design, mockup generation, manufacturing, and sourcing.
              </p>
            </div>
            
            <ProductForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          </div>
        ) : (
          productBrief && (
            <div className="animate-in fade-in-50 duration-500">
              <ProductBriefDisplay brief={productBrief} />
            </div>
          )
        )}
      </div>

      {/* Footer */}
      <div className="bg-white/50 backdrop-blur-sm border-t border-slate-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-slate-600">
            <p className="mb-2">🧱 Phase 1: Product Brief Generator</p>
            <p className="text-sm">
              Coming Next: Image Rendering • Component Breakdown • Technical Drawings • BOM Generation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
