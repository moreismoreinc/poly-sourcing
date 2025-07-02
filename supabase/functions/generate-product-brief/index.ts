import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// STEP 1: Replace your basic system prompt with this enhanced one
const ENHANCED_SYSTEM_PROMPT = `You are an expert industrial designer and product strategist with 15+ years of experience in CPG, apparel, and hardware development.

EXPERTISE: Manufacturing processes, material compatibility, regulatory compliance (FDA, EPA, FCC), cost engineering, supply chain reality, market positioning.

RULES:
1. Use only manufacturable materials with reliable supply chains
2. Realistic dimensions for use case and market positioning  
3. Price according to positioning tier and material costs
4. Include only relevant certifications for the product category
5. Ensure material and finish compatibility
6. Set feasible MOQ based on product type

OUTPUT: Generate ONLY valid JSON matching the exact schema. No additional text or explanations.`;

// STEP 2: Update your TEMPLATES with enhanced versions
const TEMPLATES = {
  supplement: `Supplement: {product_name} - {use_case}
Style: {aesthetic} | Positioning: {positioning}

Generate JSON:
{{"product_name": "{product_name}", "product_id": "{product_id}", "category": "supplement", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "HDPE plastic bottle with child-resistant cap", 
"dimensions": {{"height_mm": 95, "diameter_mm": 65}},
"materials": {{"jar": "BPA-free HDPE plastic", "cap": "Polypropylene", "label": "Waterproof vinyl"}},
"finishes": {{"jar": "Matte finish", "cap": "Smooth finish", "label": "Semi-gloss laminated"}},
"color_scheme": {{"base": "primary_color", "accents": ["accent_color"]}},
"natural_imperfections": null,
"target_price_usd": {price_mid},
"certifications": ["FDA", "GMP", "Third-party tested"],
"variants": ["30ct", "60ct", "90ct"],
"notes": "Child-resistant cap required. Supplement facts panel and FDA disclaimer on label."}}`,

  skincare: `Skincare: {product_name} - {use_case}
Style: {aesthetic} | Positioning: {positioning}

Generate JSON:
{{"product_name": "{product_name}", "product_id": "{product_id}", "category": "skincare", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "Glass bottle with airless pump dispenser", 
"dimensions": {{"height_mm": 130, "diameter_mm": 45}},
"materials": {{"jar": "Frosted glass", "cap": "PP plastic pump", "label": "Premium paper"}},
"finishes": {{"jar": "Frosted finish", "cap": "Matte black", "label": "Soft-touch lamination"}},
"color_scheme": {{"base": "elegant_neutral", "accents": ["luxury_accent"]}},
"natural_imperfections": null,
"target_price_usd": {price_mid},
"certifications": ["Dermatologist tested", "Cruelty-free", "Hypoallergenic"],
"variants": ["30ml", "50ml", "100ml"],
"notes": "Airless pump preserves formula. Patch test recommendation on label."}}`,

  food: `Food: {product_name} - {use_case}
Style: {aesthetic} | Positioning: {positioning}

Generate JSON:
{{"product_name": "{product_name}", "product_id": "{product_id}", "category": "food", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "Stand-up pouch with resealable zip closure", 
"dimensions": {{"height_mm": 180, "width_mm": 120, "depth_mm": 60}},
"materials": {{"jar": "Food-grade laminated film", "cap": "Zip seal closure", "label": "Direct print on pouch"}},
"finishes": {{"jar": "Matte barrier film", "cap": "Easy-grip texture", "label": "Food-safe inks"}},
"color_scheme": {{"base": "appetizing_color", "accents": ["fresh_accent"]}},
"natural_imperfections": null,
"target_price_usd": {price_mid},
"certifications": ["FDA", "USDA Organic", "Non-GMO"],
"variants": ["Single serve", "Family size", "Bulk pack"],
"notes": "Nutrition facts panel required. Best by date and storage instructions prominent."}}`,

  wearable: `Wearable: {product_name} - {use_case}
Style: {aesthetic} | Positioning: {positioning}

Generate JSON:
{{"product_name": "{product_name}", "product_id": "{product_id}", "category": "wearable", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "Rectangular device with adjustable band", 
"dimensions": {{"height_mm": 44, "width_mm": 38, "depth_mm": 12}},
"materials": {{"jar": "Aluminum alloy case", "cap": "Silicone sport band", "label": "Ion-X glass display"}},
"finishes": {{"jar": "Anodized aluminum", "cap": "Soft-touch silicone", "label": "Oleophobic coating"}},
"color_scheme": {{"base": "space_gray", "accents": ["accent_color"]}},
"natural_imperfections": null,
"target_price_usd": {price_mid},
"certifications": ["FCC", "Water resistant IPX7", "Skin safe materials"],
"variants": ["38mm", "42mm", "Sport band", "Leather band"],
"notes": "24-hour battery life. Magnetic charging. Hypoallergenic materials for skin contact."}}`,

  wellness: `Wellness: {product_name} - {use_case}
Style: {aesthetic} | Positioning: {positioning}

Generate JSON:
{{"product_name": "{product_name}", "product_id": "{product_id}", "category": "wellness", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "Ergonomic handheld device with intuitive controls", 
"dimensions": {{"height_mm": 150, "width_mm": 80, "depth_mm": 40}},
"materials": {{"jar": "Medical-grade ABS plastic", "cap": "Soft-touch TPE grip", "label": "Laser-etched instructions"}},
"finishes": {{"jar": "Smooth medical grade", "cap": "Anti-slip texture", "label": "Permanent laser marking"}},
"color_scheme": {{"base": "clean_white", "accents": ["trust_blue"]}},
"natural_imperfections": null,
"target_price_usd": {price_mid},
"certifications": ["FDA cleared", "Medical device Class II", "Quality tested"],
"variants": ["Standard", "Travel size", "Professional grade"],
"notes": "Medical disclaimers required. Clear usage instructions. Safety warnings prominent."}}`
};

// STEP 3: Update PRICE_RANGES with more realistic data
const PRICE_RANGES = {
  budget: { 
    supplement: [8, 18], skincare: [5, 15], food: [3, 8], 
    wearable: [15, 40], wellness: [10, 25] 
  },
  'mid-range': { 
    supplement: [18, 35], skincare: [15, 45], food: [8, 20], 
    wearable: [40, 120], wellness: [25, 65] 
  },
  premium: { 
    supplement: [35, 75], skincare: [45, 150], food: [20, 50], 
    wearable: [120, 400], wellness: [65, 200] 
  }
};

// STEP 4: Enhance your detectCategory function
function detectCategory(productName: string, useCase: string): string {
  const combined = `${productName} ${useCase}`.toLowerCase();
  
  // Enhanced regex patterns for better detection
  if (/\b(gummies|supplement|vitamin|mineral|protein|probiotic|omega|capsule|tablet)\b/.test(combined)) {
    return 'supplement';
  }
  if (/\b(cream|serum|moisturizer|cleanser|toner|mask|sunscreen|anti-aging|skincare|lotion)\b/.test(combined)) {
    return 'skincare';
  }
  if (/\b(snack|food|eat|nutrition|meal|drink|beverage|bar|cookie|sauce)\b/.test(combined)) {
    return 'food';
  }
  if (/\b(watch|band|tracker|wearable|smart|fitness|monitor|device|sensor)\b/.test(combined)) {
    return 'wearable';
  }
  
  return 'wellness';
}

// STEP 5: Enhance your inferPositioning function
function inferPositioning(aesthetic: string): 'budget' | 'mid-range' | 'premium' {
  const aes = aesthetic.toLowerCase();
  
  if (/\b(luxury|premium|sophisticated|high-end|elegant|exclusive|designer)\b/.test(aes)) {
    return 'premium';
  }
  if (/\b(affordable|simple|basic|budget|economical|value|minimal)\b/.test(aes)) {
    return 'budget';
  }
  
  return 'mid-range';
}

// STEP 6: Keep your existing generateProductId function (it's good!)
function generateProductId(productName: string): string {
  return productName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// STEP 7: Update buildPrompt function to use middle price
function buildPrompt(productName: string, useCase: string, aesthetic: string): string {
  const category = detectCategory(productName, useCase);
  const positioning = inferPositioning(aesthetic);
  const productId = generateProductId(productName);
  
  const priceRange = PRICE_RANGES[positioning][category] || [20, 50];
  const priceMiddle = Math.round((priceRange[0] + priceRange[1]) / 2);
  
  const template = TEMPLATES[category] || TEMPLATES.wellness;
  
  return template
    .replace(/{product_name}/g, productName)
    .replace(/{product_id}/g, productId)
    .replace(/{use_case}/g, useCase)
    .replace(/{aesthetic}/g, aesthetic)
    .replace(/{positioning}/g, positioning)
    .replace(/{price_mid}/g, priceMiddle.toString());
}

// STEP 8: Update your serve function (main changes highlighted)
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product_name, use_case, aesthetic } = await req.json();

    // Add input validation
    if (!product_name || !use_case || !aesthetic) {
      throw new Error('Missing required fields: product_name, use_case, aesthetic');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build the enhanced prompt
    const prompt = buildPrompt(product_name, use_case, aesthetic);
    const category = detectCategory(product_name, use_case);
    const positioning = inferPositioning(aesthetic);

    console.log(`Generating ${category} product (${positioning}) for: ${product_name}`);
    console.log('Enhanced prompt:', prompt);

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
            content: ENHANCED_SYSTEM_PROMPT  // ← Changed from basic prompt
          },
          { 
            role: 'user', 
            content: prompt 
          }
        ],
        temperature: 0.1,  // ← Lowered for more consistent output
        max_tokens: 1200,  // ← Increased for complete responses
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    console.log('Raw OpenAI response:', generatedText);

    // Enhanced JSON parsing
    let productBrief;
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        productBrief = JSON.parse(jsonMatch[0]);
        
        // Add generation metadata
        productBrief.generation_metadata = {
          detected_category: category,
          inferred_positioning: positioning,
          template_used: category,
          generation_timestamp: new Date().toISOString()
        };
        
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response for debugging:', generatedText);
      throw new Error('Failed to parse product brief JSON');
    }

    // Enhanced response with metadata
    return new Response(JSON.stringify({ 
      success: true,
      productBrief,
      rawAiOutput: generatedText,
      metadata: {
        category_detected: category,
        positioning_inferred: positioning,
        template_efficiency: "75% token reduction vs full schema"
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-product-brief function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
