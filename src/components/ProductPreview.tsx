
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
      <div className="border-b bg-white p-4">
        <h2 className="text-xl font-semibold text-slate-800">Product Brief & Mockups</h2>
        <p className="text-sm text-slate-600">Generated specifications and visual previews</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Product Brief */}
        <ProductBriefDisplay brief={brief} />
        
        {/* Mockups Placeholder */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">Product Mockups</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Studio Shot</CardTitle>
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
              <CardHeader>
                <CardTitle className="text-base">Lifestyle Shot</CardTitle>
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
      </div>
    </div>
  );
};

export default ProductPreview;
