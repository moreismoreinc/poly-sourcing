
export interface ProductDimensions {
  height_mm: number;
  diameter_mm: number;
  width_mm?: number;
  depth_mm?: number;
}

export interface ProductMaterials {
  jar: string;
  cap: string;
  label: string;
}

export interface ProductFinishes {
  jar: string;
  cap: string;
  label: string;
}

export interface ColorScheme {
  base: string;
  accents: string[];
}

export interface ProductBrief {
  product_name: string;
  product_id: string;
  category: string;
  positioning: 'budget' | 'mid-range' | 'premium';
  intended_use: string;
  form_factor: string;
  dimensions: ProductDimensions;
  materials: ProductMaterials;
  finishes: ProductFinishes;
  color_scheme: ColorScheme;
  natural_imperfections: null;
  target_aesthetic: string;
  target_price_usd: number;
  certifications: string[];
  variants: string[];
  notes: string;
}

export interface ProductInput {
  product_name: string;
  use_case: string;
  aesthetic: string;
  requirements?: string; // Add this line
}
