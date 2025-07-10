
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
                  <div className="h-full bg-gradient-to-br from-muted via-muted/80 to-muted rounded-lg overflow-hidden relative">
                    {/* Multi-layered animated background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-muted/50 via-primary/5 to-muted/50 animate-pulse"></div>
                    
                    {/* Primary shimmer wave */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-shimmer-fast"></div>
                    
                    {/* Secondary shimmer wave (offset) */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer-slow [animation-delay:-1s]"></div>
                    
                    {/* Scanning lines effect */}
                    <div className="absolute inset-0">
                      <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-scan-vertical"></div>
                      <div className="absolute h-full w-0.5 bg-gradient-to-t from-transparent via-primary/20 to-transparent animate-scan-horizontal [animation-delay:-0.5s]"></div>
                    </div>
                    
                    {/* Dynamic grid overlay */}
                    <div className="absolute inset-0 opacity-20 animate-grid-glow" style={{
                      backgroundImage: `
                        linear-gradient(rgba(var(--primary) / 0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(var(--primary) / 0.3) 1px, transparent 1px)
                      `,
                      backgroundSize: '24px 24px'
                    }}></div>
                    
                    {/* Central content */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-radial from-transparent via-background/5 to-transparent">
                      <div className="text-center text-muted-foreground relative">
                        {/* Glowing icon */}
                        <div className="relative mb-6">
                          <div className="text-5xl animate-bounce-slow filter drop-shadow-lg">🎨</div>
                          <div className="absolute inset-0 text-5xl animate-bounce-slow opacity-30 blur-sm scale-110">🎨</div>
                        </div>
                        
                        {/* Animated dots with glow */}
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <div className="w-3 h-3 bg-primary rounded-full animate-pulse-glow [animation-delay:-0.4s] shadow-lg shadow-primary/50"></div>
                          <div className="w-3 h-3 bg-primary rounded-full animate-pulse-glow [animation-delay:-0.2s] shadow-lg shadow-primary/50"></div>
                          <div className="w-3 h-3 bg-primary rounded-full animate-pulse-glow shadow-lg shadow-primary/50"></div>
                        </div>
                        
                        {/* Text with subtle glow */}
                        <p className="text-base font-semibold tracking-wide mb-2 animate-fade-pulse">Generating mockup...</p>
                        <p className="text-sm opacity-75 animate-fade-pulse [animation-delay:-0.5s]">AI is creating your product visualization</p>
                      </div>
                    </div>
                    
                    {/* Corner highlights */}
                    <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-transparent animate-corner-glow"></div>
                    <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-primary/20 to-transparent animate-corner-glow [animation-delay:-1s]"></div>
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
