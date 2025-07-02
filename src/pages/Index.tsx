
import React, { useState } from 'react';
import { toast } from 'sonner';
import { ProductBrief } from '@/types/ProductBrief';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import ChatInterface from '@/components/ChatInterface';
import ProductPreview from '@/components/ProductPreview';

const Index = () => {
  const [productBrief, setProductBrief] = useState<ProductBrief | null>(null);
  const [showChat, setShowChat] = useState(false);

  const handleBriefGenerated = (brief: ProductBrief) => {
    setProductBrief(brief);
    setShowChat(true);
  };

  const handleStartOver = () => {
    setProductBrief(null);
    setShowChat(false);
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

  if (!showChat && !productBrief) {
    // Initial landing state - single chat input
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
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
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center mb-8 max-w-2xl">
              <h2 className="text-5xl font-bold text-slate-800 mb-4">
                Transform Ideas into 
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Reality</span>
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed mb-8">
                Tell me about your product idea and I'll generate a complete brief with specifications, materials, and dimensions.
              </p>
            </div>
            
            {/* Single Chat Input */}
            <div className="w-full max-w-2xl">
              <div className="bg-white rounded-xl shadow-lg border border-slate-200">
                <div className="p-1">
                  <ChatInterface onBriefGenerated={handleBriefGenerated} />
                </div>
              </div>
            </div>
          </div>
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
  }

  // Split view with chat and results
  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 flex-shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Geneering
              </h1>
              {productBrief && (
                <span className="text-sm text-slate-600">
                  {productBrief.product_name}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {productBrief && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartOver}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Start Over
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="w-1/2 border-r border-slate-200 bg-white">
          <ChatInterface onBriefGenerated={handleBriefGenerated} />
        </div>

        {/* Results Panel */}
        <div className="w-1/2 bg-slate-50">
          {productBrief && <ProductPreview brief={productBrief} />}
        </div>
      </div>
    </div>
  );
};

export default Index;
