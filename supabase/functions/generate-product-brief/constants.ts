// STEP 1: Enhanced system prompt
export const ENHANCED_SYSTEM_PROMPT = `You are an expert industrial designer and product strategist with 15+ years of experience in CPG, apparel, and hardware development.

EXPERTISE: Manufacturing processes, material compatibility, regulatory compliance (FDA, EPA, FCC), cost engineering, supply chain reality, market positioning.

RULES:
1. Use only manufacturable materials with reliable supply chains
2. Realistic dimensions for use case and market positioning  
3. Price according to positioning tier and material costs
4. Include only relevant certifications for the product category
5. Ensure material and finish compatibility
6. Set feasible MOQ based on product type

OUTPUT: Generate ONLY valid JSON matching the exact schema. No additional text or explanations.`;

// STEP 2: Fixed templates with dynamic placeholders
export const TEMPLATES = {
  supplement: `Supplement: {product_name} - {use_case}
Style: {aesthetic} | Positioning: {positioning}

Generate a realistic supplement product brief. Consider the product name, use case, and aesthetic to create appropriate:
- Specific materials based on the product type and positioning
- Realistic dimensions for the supplement format
- Colors that match the aesthetic style
- Certifications relevant to supplements
- Variants that make sense for this product

Target price range: {price_range}

Return ONLY this JSON structure with values customized for "{product_name}":
{{"product_name": "{product_name}", "product_id": "{product_id}", "category": "supplement", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "describe the bottle/container type and closure",
"dimensions": {{"height_mm": realistic_height_number, "diameter_mm": realistic_diameter_number}},
"materials": {{"jar": "appropriate_plastic_or_glass_type", "cap": "appropriate_cap_material", "label": "appropriate_label_material"}},
"finishes": {{"jar": "appropriate_jar_finish", "cap": "appropriate_cap_finish", "label": "appropriate_label_finish"}},
"color_scheme": {{"base": "color_matching_aesthetic", "accents": ["accent_color_1", "accent_color_2"]}},
"natural_imperfections": null,
"target_price_usd": price_number_in_range,
"certifications": ["supplement_relevant_certs"],
"variants": ["count_options_that_make_sense"],
"notes": "supplement-specific manufacturing and regulatory details"}}`,

  skincare: `Skincare: {product_name} - {use_case}
Style: {aesthetic} | Positioning: {positioning}

Generate a realistic skincare product brief. Consider the product name, use case, and aesthetic to create appropriate:
- Container materials suitable for skincare formulation
- Dimensions appropriate for the product type and market positioning  
- Colors and finishes that reflect the aesthetic
- Dispensing mechanism suitable for the product
- Certifications relevant to skincare

Target price range: {price_range}

Return ONLY this JSON structure with values customized for "{product_name}":
{{"product_name": "{product_name}", "product_id": "{product_id}", "category": "skincare", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "describe container type and dispensing method",
"dimensions": {{"height_mm": realistic_height_number, "diameter_mm": realistic_diameter_number}},
"materials": {{"jar": "appropriate_container_material", "cap": "appropriate_closure_material", "label": "appropriate_label_material"}},
"finishes": {{"jar": "appropriate_container_finish", "cap": "appropriate_closure_finish", "label": "appropriate_label_finish"}},
"color_scheme": {{"base": "color_matching_aesthetic", "accents": ["accent_color_matching_aesthetic"]}},
"natural_imperfections": null,
"target_price_usd": price_number_in_range,
"certifications": ["skincare_relevant_certifications"],
"variants": ["size_or_formulation_variants"],
"notes": "skincare-specific formulation and packaging details"}}`,

  food: `Food: {product_name} - {use_case}
Style: {aesthetic} | Positioning: {positioning}

Generate a realistic food product brief. Consider the product name, use case, and aesthetic to create appropriate:
- Food-safe packaging materials and barrier properties
- Package size and format suitable for the food type
- Colors that make the food appetizing and match aesthetic
- Closure type appropriate for food preservation
- Food safety certifications

Target price range: {price_range}

Return ONLY this JSON structure with values customized for "{product_name}":
{{"product_name": "{product_name}", "product_id": "{product_id}", "category": "food", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "describe package type and format",
"dimensions": {{"height_mm": realistic_height, "width_mm": realistic_width, "depth_mm": realistic_depth}},
"materials": {{"jar": "food_grade_packaging_material", "cap": "appropriate_closure_type", "label": "food_safe_label_material"}},
"finishes": {{"jar": "appropriate_package_finish", "cap": "appropriate_closure_finish", "label": "food_safe_printing"}},
"color_scheme": {{"base": "appetizing_color_matching_aesthetic", "accents": ["accent_colors"]}},
"natural_imperfections": null,
"target_price_usd": price_number_in_range,
"certifications": ["food_safety_certifications"],
"variants": ["size_or_flavor_variants"],
"notes": "food safety and packaging requirements"}}`,

  wearable: `Wearable: {product_name} - {use_case}
Style: {aesthetic} | Positioning: {positioning}

Generate a realistic wearable product brief. Consider the product name, use case, and aesthetic to create appropriate:
- Materials suitable for skin contact and durability
- Form factor and dimensions for wearable comfort
- Tech features appropriate for the use case
- Colors matching the aesthetic style
- Electronics certifications

Target price range: {price_range}

Return ONLY this JSON structure with values customized for "{product_name}":
{{"product_name": "{product_name}", "product_id": "{product_id}", "category": "wearable", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "describe wearable device type and form",
"dimensions": {{"height_mm": realistic_height, "width_mm": realistic_width, "depth_mm": realistic_thickness}},
"materials": {{"jar": "device_body_material", "cap": "strap_or_band_material", "label": "display_or_interface_material"}},
"finishes": {{"jar": "body_finish", "cap": "strap_finish", "label": "display_coating"}},
"color_scheme": {{"base": "primary_color_matching_aesthetic", "accents": ["accent_colors"]}},
"natural_imperfections": null,
"target_price_usd": price_number_in_range,
"certifications": ["electronics_and_safety_certs"],
"variants": ["size_color_or_feature_variants"],
"notes": "wearable tech specifications and features"}}`,

  wellness: `Wellness: {product_name} - {use_case}
Style: {aesthetic} | Positioning: {positioning}

Generate a realistic wellness product brief. Consider the product name, use case, and aesthetic to create appropriate:
- Materials suitable for health/wellness applications
- Form factor appropriate for the intended wellness use
- Safety features and ergonomic considerations
- Colors that convey trust and match aesthetic
- Health-related certifications

Target price range: {price_range}

Return ONLY this JSON structure with values customized for "{product_name}":
{{"product_name": "{product_name}", "product_id": "{product_id}", "category": "wellness", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "describe wellness device type and design",
"dimensions": {{"height_mm": realistic_height, "width_mm": realistic_width, "depth_mm": realistic_depth}},
"materials": {{"jar": "primary_body_material", "cap": "secondary_component_material", "label": "interface_or_grip_material"}},
"finishes": {{"jar": "body_finish", "cap": "component_finish", "label": "interface_finish"}},
"color_scheme": {{"base": "trustworthy_color_matching_aesthetic", "accents": ["appropriate_accent_colors"]}},
"natural_imperfections": null,
"target_price_usd": price_number_in_range,
"certifications": ["wellness_health_safety_certs"],
"variants": ["feature_or_size_variants"],
"notes": "wellness product safety and usage details"}}`
};

// STEP 3: Price ranges
export const PRICE_RANGES = {
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
} as const;