
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProductBrief } from '@/types/ProductBrief';
import { Package, Ruler, Palette, DollarSign, Shield, Layers } from 'lucide-react';

interface ProductBriefDisplayProps {
  brief: ProductBrief;
}

const ProductBriefDisplay: React.FC<ProductBriefDisplayProps> = ({ brief }) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold">{brief.product_name}</CardTitle>
              <CardDescription className="text-blue-100 text-lg mt-2">
                {brief.form_factor}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">${brief.target_price_usd}</div>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {brief.positioning}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Product Details */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-slate-600">Category</div>
              <div className="text-lg">{brief.category}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-600">Product ID</div>
              <div className="text-lg font-mono bg-slate-100 px-2 py-1 rounded">
                {brief.product_id}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-600">Intended Use</div>
              <div className="text-lg">{brief.intended_use}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-600">Target Aesthetic</div>
              <div className="text-lg">{brief.target_aesthetic}</div>
            </div>
          </CardContent>
        </Card>

        {/* Dimensions */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-blue-600" />
              Dimensions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-slate-600">Height</div>
                <div className="text-xl font-bold">{brief.dimensions.height_mm}mm</div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-600">Diameter</div>
                <div className="text-xl font-bold">{brief.dimensions.diameter_mm}mm</div>
              </div>
              {brief.dimensions.width_mm && (
                <div>
                  <div className="text-sm font-medium text-slate-600">Width</div>
                  <div className="text-xl font-bold">{brief.dimensions.width_mm}mm</div>
                </div>
              )}
              {brief.dimensions.depth_mm && (
                <div>
                  <div className="text-sm font-medium text-slate-600">Depth</div>
                  <div className="text-xl font-bold">{brief.dimensions.depth_mm}mm</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Materials & Finishes */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              Materials & Finishes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-slate-600 mb-2">Materials</div>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between">
                  <span>Primary:</span>
                  <span className="font-medium">{brief.materials.primary}</span>
                </div>
                {brief.materials.secondary && (
                  <div className="flex justify-between">
                    <span>Secondary:</span>
                    <span className="font-medium">{brief.materials.secondary}</span>
                  </div>
                )}
                {brief.materials.tertiary && (
                  <div className="flex justify-between">
                    <span>Tertiary:</span>
                    <span className="font-medium">{brief.materials.tertiary}</span>
                  </div>
                )}
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-sm font-medium text-slate-600 mb-2">Finishes</div>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex justify-between">
                  <span>Primary:</span>
                  <span className="font-medium">{brief.finishes.primary}</span>
                </div>
                {brief.finishes.secondary && (
                  <div className="flex justify-between">
                    <span>Secondary:</span>
                    <span className="font-medium">{brief.finishes.secondary}</span>
                  </div>
                )}
                {brief.finishes.tertiary && (
                  <div className="flex justify-between">
                    <span>Tertiary:</span>
                    <span className="font-medium">{brief.finishes.tertiary}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Colors & Variants */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-blue-600" />
              Colors & Variants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-slate-600 mb-2">Color Scheme</div>
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-slate-300"
                  style={{ backgroundColor: brief.color_scheme.base }}
                  title={brief.color_scheme.base}
                />
                <span className="font-medium">{brief.color_scheme.base}</span>
              </div>
              {brief.color_scheme.accents.length > 0 && (
                <div className="flex items-center gap-2">
                  {brief.color_scheme.accents.map((color, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <div 
                        className="w-4 h-4 rounded-full border border-slate-300"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                      <span className="text-sm">{color}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Separator />
            <div>
              <div className="text-sm font-medium text-slate-600 mb-2">Variants</div>
              <div className="flex flex-wrap gap-2">
                {brief.variants.map((variant, index) => (
                  <Badge key={index} variant="outline" className="bg-slate-50">
                    {variant}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certifications & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {brief.certifications.map((cert, index) => (
                <Badge key={index} className="bg-green-100 text-green-800 border-green-200">
                  {cert}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">{brief.notes}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductBriefDisplay;
