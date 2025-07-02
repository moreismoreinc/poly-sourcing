
import { ProductInput, ProductBrief } from '@/types/ProductBrief';
import { supabase } from '@/integrations/supabase/client';

export const generateProductBrief = async (input: ProductInput): Promise<{productBrief: ProductBrief, rawAiOutput?: string}> => {
  console.log('Generating product brief for:', input);
  
  try {
    // Call the edge function to generate the product brief
    const { data, error } = await supabase.functions.invoke('generate-product-brief', {
      body: {
        product_name: input.product_name,
        use_case: input.use_case,
        aesthetic: input.aesthetic
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error('Failed to generate product brief');
    }

    if (!data?.productBrief) {
      throw new Error('No product brief returned from API');
    }

    return {
      productBrief: data.productBrief,
      rawAiOutput: data.rawAiOutput
    };
  } catch (error) {
    console.error('Error generating product brief:', error);
    
    // Fallback to mock data if API fails
    const mockBrief: ProductBrief = {
      product_name: input.product_name,
      product_id: input.product_name.toLowerCase().replace(/\s+/g, '-'),
      category: inferCategory(input.product_name, input.use_case),
      positioning: inferPositioning(input.aesthetic),
      intended_use: input.use_case,
      form_factor: "Cylindrical jar with screw-on cap, compact desktop footprint",
      dimensions: {
        height_mm: 85,
        diameter_mm: 65
      },
      materials: {
        jar: "BPA-free HDPE plastic",
        cap: "Polypropylene",
        label: "Waterproof vinyl"
      },
      finishes: {
        jar: "Matte finish",
        cap: "Smooth gloss",
        label: "Semi-gloss with UV coating"
      },
      color_scheme: {
        base: inferBaseColor(input.aesthetic),
        accents: inferAccentColors(input.aesthetic)
      },
      natural_imperfections: null,
      target_aesthetic: input.aesthetic,
      target_price_usd: 24.99,
      certifications: ["FDA", "GMP", "Third-party tested"],
      variants: ["30ct", "60ct", "sugar-free"],
      notes: "Requires child-resistant cap for safety. Label must include supplement facts panel and FDA disclaimer. Consider amber tint for UV protection of contents."
    };
    
    return {
      productBrief: mockBrief,
      rawAiOutput: undefined
    };
  }
};

const inferCategory = (productName: string, useCase: string): string => {
  const name = productName.toLowerCase();
  const use = useCase.toLowerCase();
  
  if (name.includes('gummies') || name.includes('supplement') || use.includes('vitamin')) {
    return 'supplement';
  }
  if (name.includes('cream') || name.includes('serum') || use.includes('skin')) {
    return 'skincare';
  }
  if (name.includes('band') || name.includes('watch') || name.includes('wearable')) {
    return 'wearable';
  }
  
  return 'health & wellness';
};

const inferPositioning = (aesthetic: string): 'budget' | 'mid-range' | 'premium' => {
  const aes = aesthetic.toLowerCase();
  
  if (aes.includes('luxury') || aes.includes('premium') || aes.includes('sophisticated')) {
    return 'premium';
  }
  if (aes.includes('affordable') || aes.includes('simple') || aes.includes('basic')) {
    return 'budget';
  }
  
  return 'mid-range';
};

const inferBaseColor = (aesthetic: string): string => {
  const aes = aesthetic.toLowerCase();
  
  if (aes.includes('calm') || aes.includes('relax')) return '#E8F4FD';
  if (aes.includes('natural') || aes.includes('organic')) return '#F5F5DC';
  if (aes.includes('bold') || aes.includes('vibrant')) return '#FF6B6B';
  if (aes.includes('clean') || aes.includes('minimal')) return '#FFFFFF';
  
  return '#F8F9FA';
};

const inferAccentColors = (aesthetic: string): string[] => {
  const aes = aesthetic.toLowerCase();
  
  if (aes.includes('calm') || aes.includes('relax')) return ['#4A90E2', '#87CEEB'];
  if (aes.includes('natural') || aes.includes('organic')) return ['#8FBC8F', '#DEB887'];
  if (aes.includes('bold') || aes.includes('vibrant')) return ['#FFD93D', '#6BCF7F'];
  if (aes.includes('clean') || aes.includes('minimal')) return ['#6C757D'];
  
  return ['#007BFF'];
};
