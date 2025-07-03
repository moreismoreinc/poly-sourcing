
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductBrief } from '@/types/ProductBrief';
import ProductBriefDisplay from './ProductBriefDisplay';

interface ProductPreviewProps {
  brief: ProductBrief;
}

const ProductPreview = ({ brief }: ProductPreviewProps) => {
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
        
        {/* Raw JSON Data */}
        <div className="p-4 border-b bg-slate-50">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Raw JSON Data</h3>
          <pre className="bg-white p-3 rounded-lg border text-xs overflow-auto max-h-48 text-slate-700">
            {JSON.stringify(brief, null, 2)}
          </pre>
        </div>
        
        {/* Product Brief below JSON */}
        <div className="p-4">
          <ProductBriefDisplay brief={brief} />
        </div>
      </div>
    </div>
  );
};

export default ProductPreview;
