
import { ProductInput, ProductBrief } from '@/types/ProductBrief';

// This service will integrate with OpenAI/Claude APIs
// For now, it returns a mock response to demonstrate the UI

const UNIFIED_PROMPT = `You are an expert industrial designer and product strategist. Given a product concept, generate a comprehensive, manufacturable product brief in JSON format.

Think like a real industrial designer who:
- Only uses common, manufacturable materials and finishes
- Infers category and positioning logically
- Creates realistic dimensions and pricing
- Considers real-world certifications and variants

Input format:
{
  "product_name": "[string]",
  "use_case": "[string]", 
  "aesthetic": "[string]"
}

You must return ONLY valid JSON matching this exact schema:
{
  "product_name": "[string]",
  "product_id": "[string, slug-style]",
  "category": "[supplement | skincare | wearable | etc.]",
  "positioning": "[budget | mid-range | premium]",
  "intended_use": "[copied from input]",
  "form_factor": "[descriptive shape + structure]",
  "dimensions": {
    "height_mm": [int],
    "diameter_mm": [int],
    "width_mm": [optional int],
    "depth_mm": [optional int]
  },
  "materials": {
    "jar": "[string]",
    "cap": "[string]",
    "label": "[string]"
  },
  "finishes": {
    "jar": "[string]",
    "cap": "[string]",
    "label": "[string]"
  },
  "color_scheme": {
    "base": "[main visible color]",
    "accents": ["[optional color 1]", "[optional color 2]"]
  },
  "natural_imperfections": null,
  "target_aesthetic": "[copied from input]",
  "target_price_usd": [decimal],
  "certifications": ["FDA", "cruelty-free", ...],
  "variants": ["30ct", "60ct", "sugar-free"],
  "notes": "[text about packaging, regulatory, or label needs]"
}

Before returning, validate that:
- Materials and finishes are compatible
- Dimensions match the form factor
- All required fields are populated and internally consistent`;

export const generateProductBrief = async (input: ProductInput): Promise<ProductBrief> => {
  console.log('Generating product brief for:', input);
  
  // TODO: Replace with actual API call to OpenAI/Claude
  // For now, return a realistic mock response based on the input
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate mock response based on input
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
  
  return mockBrief;
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
