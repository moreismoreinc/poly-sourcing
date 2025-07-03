
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProductBriefDisplay from './ProductBriefDisplay';

interface ProductPreviewProps {
  brief: Record<string, any>;
  productName?: string;
}

const ProductPreview = ({ brief, productName }: ProductPreviewProps) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white p-4 flex-shrink-0">
        <h2 className="text-xl font-semibold text-slate-800">Product Brief & Mockups</h2>
        <p className="text-sm text-slate-600">Generated specifications and visual previews</p>
      </div>

      {/* Content - Single scrollable pane */}
      <div className="flex-1 overflow-y-auto">
        {/* Mockups at the top */}
        <div className="bg-white p-4 border-b">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <div className="text-4xl mb-2">📦</div>
                    <p className="text-sm">Mockup rendering</p>
                    <p className="text-xs">Coming in Phase 2</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <div className="text-4xl mb-2">🏠</div>
                    <p className="text-sm">Context mockup</p>
                    <p className="text-xs">Coming in Phase 2</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Product Brief below mockups */}
        <div className="p-4">
          <ProductBriefDisplay brief={brief} productName={productName} />
        </div>
      </div>
    </div>
  );
};

export default ProductPreview;
