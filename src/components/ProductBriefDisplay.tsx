
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { File, Info } from 'lucide-react';

interface ProductBriefDisplayProps {
  brief: Record<string, any>;
  productName?: string;
}

// Helper function to format variable names for display
const formatVariableName = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

// Helper function to format values for display
const formatValue = (value: any): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object' && value !== null) return JSON.stringify(value, null, 2);
  return String(value);
};

const ProductBriefDisplay: React.FC<ProductBriefDisplayProps> = ({ brief, productName }) => {
  // Get all the key-value pairs from the brief
  const briefEntries = Object.entries(brief || {});

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <Card className="bg-primary text-primary-foreground border-0 shadow-none rounded-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-bold">
                {productName || 'Product Brief'}
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

      {/* Dynamic Content Display */}
      {briefEntries.length > 0 ? (
        <Card className="bg-card shadow-none rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {briefEntries.map(([key, value], index) => (
              <div key={key} className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div className="text-sm font-medium text-muted-foreground min-w-0 sm:w-1/3">
                    {formatVariableName(key)}
                  </div>
                  <div className="text-base text-foreground sm:w-2/3 break-words">
                    {typeof value === 'object' && value !== null ? (
                      <pre className="bg-muted p-3 rounded-lg text-sm whitespace-pre-wrap font-mono overflow-x-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      <span className="font-medium">{formatValue(value)}</span>
                    )}
                  </div>
                </div>
                {index < briefEntries.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card shadow-none rounded-lg">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No product brief data available</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductBriefDisplay;
