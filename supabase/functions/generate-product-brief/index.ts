import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Product category templates based on your Python system
const TEMPLATES = {
  supplement: `Supplement: {product_name} - {use_case}
Style: {aesthetic} | Positioning: {positioning}

Generate JSON:
{"product_name": "{product_name}", "product_id": "{product_id}", "category": "supplement", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "bottle with screw-on cap", 
"dimensions": {"height_mm": 85, "diameter_mm": 65},
"materials": {"jar": "BPA-free HDPE plastic", "cap": "Polypropylene", "label": "Waterproof vinyl"},
"finishes": {"jar": "Matte finish", "cap": "Smooth gloss", "label": "Semi-gloss with UV coating"},
"color_scheme": {"base": "primary_color", "accents": ["accent1", "accent2"]},
"natural_imperfections": null,
"target_price_usd": {price_range},
"certifications": ["FDA", "GMP", "Third-party tested"],
"variants": ["30ct", "60ct", "90ct"],
"notes": "Requires child-resistant cap for safety. Label must include supplement facts panel and FDA disclaimer."}`,

  skincare: `Skincare: {product_name} - {use_case}
Style: {aesthetic} | Positioning: {positioning}

Generate JSON:
{"product_name": "{product_name}", "product_id": "{product_id}", "category": "skincare", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "pump bottle with precise dispensing", 
"dimensions": {"height_mm": 120, "diameter_mm": 45},
"materials": {"container": "Glass", "pump": "PP plastic", "label": "Premium paper"},
"finishes": {"container": "Frosted glass", "pump": "Matte black", "label": "Soft-touch lamination"},
"color_scheme": {"base": "elegant_neutral", "accents": ["luxury_accent"]},
"natural_imperfections": null,
"target_price_usd": {price_range},
"certifications": ["Dermatologist tested", "Cruelty-free", "Hypoallergenic"],
"variants": ["30ml", "50ml", "100ml"],
"notes": "Airless pump for product preservation. SPF labeling if applicable. Patch test recommendation."}`,

  food: `Food: {product_name} - {use_case}
Style: {aesthetic} | Positioning: {positioning}

Generate JSON:
{"product_name": "{product_name}", "product_id": "{product_id}", "category": "food", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "resealable pouch with easy open", 
"dimensions": {"height_mm": 150, "width_mm": 100, "depth_mm": 50},
"materials": {"container": "Food-grade plastic", "closure": "Zip seal", "label": "Food-safe vinyl"},
"finishes": {"container": "Clear", "closure": "Matching", "label": "High-gloss food safe"},
"color_scheme": {"base": "appetizing_color", "accents": ["fresh_accent"]},
"natural_imperfections": null,
"target_price_usd": {price_range},
"certifications": ["FDA", "USDA Organic", "Non-GMO"],
"variants": ["Small", "Family size", "Bulk"],
"notes": "Nutrition facts panel required. Best by date prominently displayed. Storage instructions included."}`,

  wearable: `Wearable: {product_name} - {use_case}
Style: {aesthetic} | Positioning: {positioning}

Generate JSON:
{"product_name": "{product_name}", "product_id": "{product_id}", "category": "wearable", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "band with adjustable sizing", 
"dimensions": {"height_mm": 45, "width_mm": 40, "depth_mm": 12},
"materials": {"body": "Aluminum", "strap": "Silicone", "display": "Glass"},
"finishes": {"body": "Anodized", "strap": "Soft-touch", "display": "Anti-glare"},
"color_scheme": {"base": "neutral_tech", "accents": ["accent_color"]},
"natural_imperfections": null,
"target_price_usd": {price_range},
"certifications": ["FCC", "Water resistant", "Skin safe"],
"variants": ["S/M", "M/L", "Color options"],
"notes": "Battery life and charging specifications. Water resistance rating. Skin contact materials hypoallergenic."}`,

  wellness: `Health & Wellness: {product_name} - {use_case}
Style: {aesthetic} | Positioning: {positioning}

Generate JSON:
{"product_name": "{product_name}", "product_id": "{product_id}", "category": "health & wellness", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "ergonomic design with user-friendly interface", 
"dimensions": {"height_mm": 100, "diameter_mm": 70},
"materials": {"body": "Medical-grade plastic", "components": "BPA-free materials", "label": "Durable vinyl"},
"finishes": {"body": "Smooth medical grade", "components": "Easy-clean", "label": "Tamper-evident"},
"color_scheme": {"base": "clean_white", "accents": ["trust_blue"]},
"natural_imperfections": null,
"target_price_usd": {price_range},
"certifications": ["FDA approved", "Medical device", "Quality tested"],
"variants": ["Standard", "Travel size", "Professional"],
"notes": "Medical disclaimers required. Usage instructions prominent. Safety warnings clearly displayed."}`
};

const PRICE_RANGES = {
  budget: { supplement: [15, 25], skincare: [12, 30], food: [8, 20], wearable: [25, 60], wellness: [20, 40] },
  'mid-range': { supplement: [25, 45], skincare: [30, 70], food: [20, 40], wearable: [60, 150], wellness: [40, 100] },
  premium: { supplement: [45, 80], skincare: [70, 200], food: [40, 80], wearable: [150, 400], wellness: [100, 300] }
};

function detectCategory(productName: string, useCase: string): string {
  const name = productName.toLowerCase();
  const use = useCase.toLowerCase();
  
  if (name.includes('gummies') || name.includes('supplement') || use.includes('vitamin') || use.includes('nutrition')) {
    return 'supplement';
  }
  if (name.includes('cream') || name.includes('serum') || use.includes('skin') || name.includes('beauty')) {
    return 'skincare';
  }
  if (name.includes('snack') || name.includes('food') || use.includes('eat') || use.includes('taste')) {
    return 'food';
  }
  if (name.includes('band') || name.includes('watch') || name.includes('tracker') || use.includes('wear')) {
    return 'wearable';
  }
  
  return 'wellness';
}

function inferPositioning(aesthetic: string): 'budget' | 'mid-range' | 'premium' {
  const aes = aesthetic.toLowerCase();
  
  if (aes.includes('luxury') || aes.includes('premium') || aes.includes('sophisticated') || aes.includes('high-end')) {
    return 'premium';
  }
  if (aes.includes('affordable') || aes.includes('simple') || aes.includes('basic') || aes.includes('budget')) {
    return 'budget';
  }
  
  return 'mid-range';
}

function generateProductId(productName: string): string {
  return productName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function buildPrompt(productName: string, useCase: string, aesthetic: string): string {
  const category = detectCategory(productName, useCase);
  const positioning = inferPositioning(aesthetic);
  const productId = generateProductId(productName);
  
  const priceRange = PRICE_RANGES[positioning][category] || [20, 50];
  const priceStr = `${priceRange[0]}-${priceRange[1]}`;
  
  const template = TEMPLATES[category] || TEMPLATES.wellness;
  
  return template
    .replace(/{product_name}/g, productName)
    .replace(/{product_id}/g, productId)
    .replace(/{use_case}/g, useCase)
    .replace(/{aesthetic}/g, aesthetic)
    .replace(/{positioning}/g, positioning)
    .replace(/{price_range}/g, priceStr);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product_name, use_case, aesthetic } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build the enhanced prompt
    const prompt = buildPrompt(product_name, use_case, aesthetic);

    console.log('Generated prompt:', prompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert product designer. Generate ONLY valid JSON matching the exact schema provided. No additional text or explanations.' 
          },
          { 
            role: 'user', 
            content: prompt 
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    console.log('Raw OpenAI response:', generatedText);

    // Parse the JSON response
    let productBrief;
    try {
      // Clean the response to extract JSON
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        productBrief = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      throw new Error('Failed to parse product brief JSON');
    }

    return new Response(JSON.stringify({ productBrief }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-product-brief function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});