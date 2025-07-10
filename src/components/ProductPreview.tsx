
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProductBriefDisplay from './ProductBriefDisplay';

interface ProductPreviewProps {
  brief: Record<string, any>;
  productName?: string;
  generatedImages?: string[];
}

const ProductPreview = ({ brief, productName, generatedImages = [] }: ProductPreviewProps) => {
  return (
    <div className="flex flex-col h-full">
      {/* Main Content Layout */}
      <div className="flex-1 p-6 bg-muted/30 overflow-hidden">
        <div className="h-full flex gap-6">
          {/* Center: Spec Sheet (editable output) */}
          <div className="flex-1 min-h-0">
            <Card className="h-full bg-card shadow-none rounded-lg flex flex-col">
              <CardContent className="flex-1 p-6 overflow-y-auto min-h-0">
                <ProductBriefDisplay brief={brief} productName={productName} />
              </CardContent>
            </Card>
          </div>

          {/* Right Side: Mockups */}
          <div className="flex-1 flex flex-col">
            {/* Product Mockup */}
            <Card className="h-full bg-card shadow-none rounded-lg overflow-hidden">
              <CardContent className="h-full p-0">
                {generatedImages.length > 0 ? (
                  <div className="h-full bg-background rounded-lg overflow-hidden">
                    <img 
                      src={generatedImages[0]} 
                      alt={`${productName} mockup`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-full bg-muted rounded-lg overflow-hidden relative">
                    {/* Animated generating background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-transparent animate-shimmer"></div>
                    </div>
                    
                    {/* Generating dots animation */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <div className="text-4xl mb-4 animate-bounce">🎨</div>
                        <div className="flex items-center justify-center gap-1 mb-2">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        </div>
                        <p className="text-sm font-medium">Generating mockup...</p>
                        <p className="text-xs">This may take a moment</p>
                      </div>
                    </div>
                    
                    {/* Grid overlay for tech feel */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="h-full w-full" style={{
                        backgroundImage: `
                          linear-gradient(rgba(var(--primary) / 0.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(var(--primary) / 0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: '20px 20px'
                      }}></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Technical Drawing - Hidden for now, keeping structure */}
            <Card className="hidden flex-1 bg-card shadow-none rounded-lg overflow-hidden">
              <CardContent className="h-full p-0">
                {generatedImages.length > 1 ? (
                  <div className="h-full bg-background rounded-lg overflow-hidden">
                    <img 
                      src={generatedImages[1]} 
                      alt={`${productName} technical drawing`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-full bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <div className="text-4xl mb-2">📐</div>
                      <p className="text-sm font-medium">Technical Drawing</p>
                      <p className="text-xs">Coming Soon</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPreview;
