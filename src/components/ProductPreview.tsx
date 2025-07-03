
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
      <div className="border-b bg-background p-4 flex-shrink-0">
        <h2 className="text-xl font-semibold text-foreground">Product Generator View</h2>
        <p className="text-sm text-muted-foreground">Generated specifications and visual previews</p>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 p-6 bg-muted/30">
        <div className="h-full flex gap-6">
          {/* Center: Spec Sheet (editable output) */}
          <div className="flex-1">
            <Card className="h-full bg-card shadow-lg rounded-2xl overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Spec Sheet
                </CardTitle>
                <p className="text-sm text-muted-foreground">(output, editable)</p>
              </CardHeader>
              <CardContent className="overflow-y-auto h-[calc(100%-80px)]">
                <ProductBriefDisplay brief={brief} productName={productName} />
              </CardContent>
            </Card>
          </div>

          {/* Right Side: Mockups */}
          <div className="w-80 flex flex-col gap-6">
            {/* Product Mockup */}
            <Card className="flex-1 bg-card shadow-lg rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Product Mockup
                </CardTitle>
                <p className="text-sm text-muted-foreground">(output only)</p>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)]">
                <div className="h-full bg-gradient-to-br from-muted to-muted/60 rounded-xl flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <div className="text-4xl mb-2">📦</div>
                    <p className="text-sm font-medium">3D Mockup</p>
                    <p className="text-xs">Coming Soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Technical Drawing */}
            <Card className="flex-1 bg-card shadow-lg rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Technical Drawing
                </CardTitle>
                <p className="text-sm text-muted-foreground">(output only)</p>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)]">
                <div className="h-full bg-gradient-to-br from-muted to-muted/60 rounded-xl flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <div className="text-4xl mb-2">📐</div>
                    <p className="text-sm font-medium">Technical Specs</p>
                    <p className="text-xs">Coming Soon</p>
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
