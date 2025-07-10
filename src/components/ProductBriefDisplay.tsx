
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { File, Info, Package, Palette, Settings, DollarSign, Shield, Beaker, ChefHat } from 'lucide-react';

interface ProductBriefDisplayProps {
  brief: Record<string, any>;
  productName?: string;
}

// Helper function to format field names for display
const formatFieldName = (key: string): string => {
  // Handle special cases first
  const specialCases: Record<string, string> = {
    'product_id': 'Product ID',
    'product_name': 'Product Name',
    'target_price_usd': 'Target Price (USD)',
    'form_factor': 'Form Factor',
    'intended_use': 'Intended Use',
    'target_aesthetic': 'Target Aesthetic',
    'color_scheme': 'Color Scheme',
    'natural_imperfections': 'Natural Imperfections',
    'manufacturing_notes': 'Manufacturing Notes',
    'regulatory_compliance': 'Regulatory Compliance',
    'quality_control': 'Quality Control',
    'shelf_life': 'Shelf Life',
    'storage_requirements': 'Storage Requirements',
    'allergen_information': 'Allergen Information',
    'nutritional_profile': 'Nutritional Profile'
  };

  if (specialCases[key]) return specialCases[key];

  // Convert snake_case and camelCase to readable format
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
};

// Get icon for field based on its key
const getFieldIcon = (key: string) => {
  const iconMap: Record<string, any> = {
    'product_name': Package,
    'product_id': File,
    'price': DollarSign,
    'target_price_usd': DollarSign,
    'materials': Settings,
    'finishes': Palette,
    'color_scheme': Palette,
    'certifications': Shield,
    'recipe': ChefHat,
    'quality_control': Beaker,
    'manufacturing_notes': Settings,
    'regulatory_compliance': Shield
  };

  return iconMap[key] || Info;
};

// Check if a field should be collapsible (complex objects/arrays)
const isCollapsibleField = (value: any): boolean => {
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) return value.length > 3;
    return Object.keys(value).length > 2;
  }
  return false;
};

// Helper function to convert text to sentence case
const toSentenceCase = (text: string): string => {
  if (!text || typeof text !== 'string') return text;
  
  return text
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase())
    .replace(/\.\s+\w/g, (match) => match.toUpperCase());
};

// Render simple field value
const renderSimpleValue = (value: any): React.ReactNode => {
  if (value === null || value === undefined) return <span className="text-muted-foreground">Not specified</span>;
  
  if (typeof value === 'boolean') {
    return <Badge variant={value ? "default" : "secondary"}>{value ? 'Yes' : 'No'}</Badge>;
  }
  
  if (typeof value === 'number') {
    return <span className="font-medium">{value.toLocaleString()}</span>;
  }
  
  if (typeof value === 'string') {
    // Handle URLs
    if (value.startsWith('http')) {
      return <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{value}</a>;
    }
    return <span className="font-medium">{toSentenceCase(value)}</span>;
  }
  
  if (Array.isArray(value) && value.length <= 3) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((item, idx) => (
          <Badge key={idx} variant="outline">{toSentenceCase(String(item))}</Badge>
        ))}
      </div>
    );
  }
  
  return <span className="font-medium">{toSentenceCase(String(value))}</span>;
};

// Render complex object content
const renderComplexContent = (obj: any): React.ReactNode => {
  if (Array.isArray(obj)) {
    return (
      <div className="space-y-2">
        {obj.map((item, idx) => (
          <div key={idx} className="p-3 bg-muted/50 rounded-lg">
            {typeof item === 'object' ? (
              <div className="space-y-2">
                {Object.entries(item).map(([subKey, subValue]) => (
                  <div key={subKey} className="flex justify-between items-start gap-4">
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatFieldName(subKey)}:
                    </span>
                    <span className="text-sm font-medium text-right">{renderSimpleValue(subValue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <Badge variant="outline">{toSentenceCase(String(item))}</Badge>
            )}
          </div>
        ))}
      </div>
    );
  }
  
  if (typeof obj === 'object' && obj !== null) {
    return (
      <div className="space-y-3">
        {Object.entries(obj).map(([subKey, subValue]) => (
          <div key={subKey} className="space-y-2">
            <div className="flex justify-between items-start gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                {formatFieldName(subKey)}:
              </span>
              <div className="text-right flex-1">
                {isCollapsibleField(subValue) ? (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value={subKey} className="border-none">
                      <AccordionTrigger className="text-xs font-medium py-1 px-2 bg-muted/50 rounded hover:no-underline">
                        View Details
                      </AccordionTrigger>
                      <AccordionContent className="pt-2">
                        {renderComplexContent(subValue)}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : (
                  renderSimpleValue(subValue)
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return renderSimpleValue(obj);
};

const ProductBriefDisplay: React.FC<ProductBriefDisplayProps> = ({ brief, productName }) => {
  if (!brief || Object.keys(brief).length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card className="bg-card shadow-none rounded-lg">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No product brief data available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // More inclusive field categorization to ensure all fields are displayed
  const basicFields = ['product_name', 'category', 'positioning', 'intended_use', 'target_aesthetic', 'form_factor'];
  const specFields = ['dimensions', 'materials', 'finishes', 'color_scheme', 'natural_imperfections', 'size', 'weight', 'texture'];
  const businessFields = ['target_price_usd', 'price', 'cost', 'certifications', 'variants', 'market', 'brand'];
  const complexFields = ['recipe', 'quality_control', 'manufacturing_notes', 'regulatory_compliance', 'ingredients', 'instructions', 'specifications'];
  
  const categorizeFields = () => {
    const categories = {
      basic: [] as [string, any][],
      specifications: [] as [string, any][],
      business: [] as [string, any][],
      complex: [] as [string, any][],
      other: [] as [string, any][]
    };
    
    const allFields = Object.entries(brief).filter(([key]) => key !== 'product_id');
    
    allFields.forEach(([key, value]) => {
      if (basicFields.includes(key)) {
        categories.basic.push([key, value]);
      } else if (specFields.includes(key)) {
        categories.specifications.push([key, value]);
      } else if (businessFields.includes(key)) {
        categories.business.push([key, value]);
      } else if (complexFields.includes(key) || isCollapsibleField(value)) {
        categories.complex.push([key, value]);
      } else {
        categories.other.push([key, value]);
      }
    });
    
    // Debug: Log all categories to ensure nothing is missing
    console.log('Displaying product brief fields:', {
      totalAvailableFields: allFields.length,
      basic: categories.basic.map(([k]) => k),
      specifications: categories.specifications.map(([k]) => k),
      business: categories.business.map(([k]) => k),
      complex: categories.complex.map(([k]) => k),
      other: categories.other.map(([k]) => k),
      totalDisplayedFields: categories.basic.length + categories.specifications.length + categories.business.length + categories.complex.length + categories.other.length
    });
    
    return categories;
  };

  const categories = categorizeFields();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <Card className="bg-primary text-primary-foreground border-0 shadow-none rounded-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <CardTitle className="text-3xl font-bold">
                {productName || brief.product_name || 'Product Brief'}
              </CardTitle>
              <CardDescription className="text-primary-foreground/80 text-lg mt-2">
                Generated Product Specifications
              </CardDescription>
            </div>
            <div className="text-right">
              <File className="h-8 w-8 text-primary-foreground/80" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Basic Information */}
      {categories.basic.length > 0 && (
        <Card className="bg-card shadow-none rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.basic.map(([key, value], index) => (
              <div key={key}>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatFieldName(key)}:
                  </span>
                  <div className="text-right flex-1">
                    {renderSimpleValue(value)}
                  </div>
                </div>
                {index < categories.basic.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Specifications */}
      {categories.specifications.length > 0 && (
        <Card className="bg-card shadow-none rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.specifications.map(([key, value], index) => (
              <div key={key}>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatFieldName(key)}:
                  </span>
                  <div className="text-right flex-1">
                    {isCollapsibleField(value) ? (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value={key} className="border-none">
                          <AccordionTrigger className="text-sm font-medium py-2 px-3 bg-muted/30 rounded hover:no-underline">
                            View Details
                          </AccordionTrigger>
                          <AccordionContent className="pt-3">
                            {renderComplexContent(value)}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : (
                      renderSimpleValue(value)
                    )}
                  </div>
                </div>
                {index < categories.specifications.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Business Information */}
      {categories.business.length > 0 && (
        <Card className="bg-card shadow-none rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.business.map(([key, value], index) => (
              <div key={key}>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatFieldName(key)}:
                  </span>
                  <div className="text-right flex-1">
                    {isCollapsibleField(value) ? (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value={key} className="border-none">
                          <AccordionTrigger className="text-sm font-medium py-2 px-3 bg-muted/30 rounded hover:no-underline">
                            View Details
                          </AccordionTrigger>
                          <AccordionContent className="pt-3">
                            {renderComplexContent(value)}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : (
                      renderSimpleValue(value)
                    )}
                  </div>
                </div>
                {index < categories.business.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Complex/Technical Information */}
      {categories.complex.length > 0 && (
        <Card className="bg-card shadow-none rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-primary" />
              Technical Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full space-y-2">
              {categories.complex.map(([key, value]) => {
                const IconComponent = getFieldIcon(key);
                return (
                  <AccordionItem key={key} value={key} className="border border-border rounded-lg">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-4 w-4 text-primary" />
                        <span className="font-medium">{formatFieldName(key)}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {renderComplexContent(value)}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Other Fields */}
      {categories.other.length > 0 && (
        <Card className="bg-card shadow-none rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.other.map(([key, value], index) => (
              <div key={key}>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatFieldName(key)}:
                  </span>
                  <div className="text-right flex-1">
                    {isCollapsibleField(value) ? (
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value={key} className="border-none">
                          <AccordionTrigger className="text-sm font-medium py-2 px-3 bg-muted/30 rounded hover:no-underline">
                            View Details
                          </AccordionTrigger>
                          <AccordionContent className="pt-3">
                            {renderComplexContent(value)}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    ) : (
                      renderSimpleValue(value)
                    )}
                  </div>
                </div>
                {index < categories.other.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductBriefDisplay;
