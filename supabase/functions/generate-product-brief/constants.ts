// Enhanced system prompt
export const ENHANCED_SYSTEM_PROMPT = `You are an expert industrial designer and product strategist with 15+ years of experience in CPG, apparel, and hardware development.

EXPERTISE: Manufacturing processes, material compatibility, regulatory compliance (FDA, EPA, FCC), cost engineering, supply chain reality, market positioning.

RULES:
1. Use only manufacturable materials with reliable supply chains
2. Realistic dimensions for use case and market positioning  
3. Price according to positioning tier and material costs
4. Include only relevant certifications for the product category
5. Ensure material and finish compatibility
6. Set feasible MOQ based on product type
7. Analyze each product individually - avoid generic responses
8. Match aesthetic style authentically, not stereotypical category colors

OUTPUT: Generate ONLY valid JSON matching the exact schema. No additional text or explanations.`;

// Fixed templates with more creative, product-specific prompting
export const TEMPLATES = {
  supplement: `Create supplement: {product_name} for {use_case}
Style: {aesthetic} | Market: {positioning} | Budget: {price_range}

Design this specific supplement with packaging that reflects the "{aesthetic}" style and suits this particular supplement type.

Consider the supplement format and create appropriate:
- Container type that suits this specific supplement (pills, powder, liquid, etc.)
- Materials that preserve this formulation and match the positioning tier
- Colors and design that embody the "{aesthetic}" style, not generic supplement colors
- Size appropriate for this supplement type and market tier

JSON Response (customize for this specific supplement):
{{"product_name": "{product_name}", "product_id": "{product_id}", "category": "supplement", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "container_type_for_this_supplement",
"dimensions": {{"height_mm": realistic_height, "diameter_mm": realistic_diameter}},
"materials": {{"container": "appropriate_container_material", "closure": "appropriate_closure_type", "labeling": "label_material"}},
"finishes": {{"container": "container_surface_finish", "closure": "closure_finish", "labeling": "label_finish"}},
"color_scheme": {{"base": "color_matching_this_aesthetic", "accents": ["accent_colors_for_this_style"]}},
"natural_imperfections": null,
"target_price_usd": realistic_price_in_range,
"certifications": ["supplement_industry_certifications"],
"variants": ["logical_supplement_variants"],
"notes": "supplement_specific_manufacturing_considerations"}}`,

  skincare: `Create skincare: {product_name} for {use_case}
Style: {aesthetic} | Market: {positioning} | Budget: {price_range}

Design this specific skincare product with packaging that reflects the "{aesthetic}" style and suits this particular skincare type.

Consider the skincare formulation and create appropriate:
- Container format that preserves this specific formulation type
- Dispensing method suitable for this product consistency and use
- Materials that protect the formulation and match the market positioning
- Design that embodies the "{aesthetic}" style, not generic beauty packaging

JSON Response (customize for this specific skincare product):
{{"product_name": "{product_name}", "product_id": "{product_id}", "category": "skincare", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "container_and_dispensing_design_for_this_product",
"dimensions": {{"height_mm": realistic_height, "diameter_mm": realistic_diameter}},
"materials": {{"vessel": "container_material", "dispensing": "applicator_or_pump_material", "branding": "label_material"}},
"finishes": {{"vessel": "container_finish", "dispensing": "applicator_finish", "branding": "branding_finish"}},
"color_scheme": {{"base": "color_matching_this_aesthetic", "accents": ["colors_for_this_style"]}},
"natural_imperfections": null,
"target_price_usd": realistic_price_in_range,
"certifications": ["skincare_relevant_certifications"],
"variants": ["size_or_formula_variants"],
"notes": "skincare_specific_packaging_considerations"}}`,

  food: `Create food product: {product_name} for {use_case}
Style: {aesthetic} | Market: {positioning} | Budget: {price_range}

Design this specific food product with packaging that reflects the "{aesthetic}" style and suits this particular food type.

Consider the food type and create appropriate:
- Package format that preserves this specific food and enables proper consumption
- Materials with appropriate barrier properties for this food type
- Colors and design that make this food appealing and match the "{aesthetic}" style
- Size appropriate for this food type and consumption pattern

JSON Response (customize for this specific food product):
{{"product_name": "{product_name}", "product_id": "{product_id}", "category": "food", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "package_format_for_this_food_type",
"dimensions": {{"height_mm": realistic_height, "width_mm": realistic_width, "depth_mm": realistic_depth}},
"materials": {{"packaging": "food_safe_package_material", "sealing": "closure_or_seal_type", "graphics": "printing_substrate"}},
"finishes": {{"packaging": "package_surface_finish", "sealing": "closure_finish", "graphics": "print_finish_type"}},
"color_scheme": {{"base": "appetizing_color_matching_aesthetic", "accents": ["colors_for_this_style"]}},
"natural_imperfections": null,
"target_price_usd": realistic_price_in_range,
"certifications": ["food_safety_certifications"],
"variants": ["size_or_flavor_variants"],
"notes": "food_safety_and_preservation_requirements"}}`,

  wearable: `Create wearable: {product_name} for {use_case}
Style: {aesthetic} | Market: {positioning} | Budget: {price_range}

Design this specific wearable device with form and materials that reflect the "{aesthetic}" style and suit this particular wearable type.

Consider the wearable function and create appropriate:
- Form factor that enables this specific wearable's functionality
- Materials suitable for skin contact and the intended use environment
- Tech integration appropriate for this device type and market tier
- Design that embodies the "{aesthetic}" style, not generic tech device appearance

JSON Response (customize for this specific wearable):
{{"product_name": "{product_name}", "product_id": "{product_id}", "category": "wearable", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "device_form_for_this_wearable_type",
"dimensions": {{"height_mm": realistic_height, "width_mm": realistic_width, "depth_mm": realistic_thickness}},
"materials": {{"housing": "device_body_material", "contact": "skin_contact_material", "interface": "display_or_control_material"}},
"finishes": {{"housing": "body_surface_finish", "contact": "comfort_finish", "interface": "interface_treatment"}},
"color_scheme": {{"base": "color_matching_this_aesthetic", "accents": ["accent_colors_for_this_style"]}},
"natural_imperfections": null,
"target_price_usd": realistic_price_in_range,
"certifications": ["wearable_tech_certifications"],
"variants": ["size_color_or_feature_variants"],
"notes": "wearable_specific_technology_and_comfort_features"}}`,

  wellness: `Create wellness product: {product_name} for {use_case}
Style: {aesthetic} | Market: {positioning} | Budget: {price_range}

Design this specific wellness product with materials, form, and features that reflect the "{aesthetic}" style and suit this particular wellness application.

Consider what this product actually is and how it's used:
- A massage tool needs different materials than a meditation device
- An exercise accessory needs different dimensions than a therapy tool
- A beauty tool needs different features than a health monitor
- Colors should match the "{aesthetic}" style, not default to medical white/blue

JSON Response (customize ALL values for this specific wellness product):
{{"product_name": "{product_name}", "product_id": "{product_id}", "category": "wellness", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "design_specific_to_this_products_function",
"dimensions": {{"height_mm": appropriate_height, "width_mm": appropriate_width, "depth_mm": appropriate_depth}},
"materials": {{"primary": "main_material_for_this_product_type", "secondary": "accent_or_component_material", "grip": "handle_or_contact_surface_material"}},
"finishes": {{"primary": "primary_surface_finish", "secondary": "secondary_component_finish", "grip": "grip_or_texture_finish"}},
"color_scheme": {{"base": "color_that_matches_this_aesthetic", "accents": ["colors_that_suit_this_style"]}},
"natural_imperfections": null,
"target_price_usd": realistic_price_in_range,
"certifications": ["certifications_specific_to_this_wellness_product_type"], 
"variants": ["variants_that_make_sense_for_this_product"],
"notes": "design_features_specific_to_this_products_wellness_function"}}`,

  // Additional categories for expanded coverage
  beauty: `Create beauty product: {product_name} for {use_case}
Style: {aesthetic} | Market: {positioning} | Budget: {price_range}

Design this specific beauty product with packaging that reflects the "{aesthetic}" style and suits this particular beauty application.

Consider the beauty product type and create appropriate:
- Package format that protects this specific formulation or tool
- Materials that maintain product integrity and match market positioning
- Design that embodies the "{aesthetic}" style and appeals to the target market
- Features appropriate for this beauty product's application method

JSON Response (customize for this specific beauty product):
{{"product_name": "{product_name}", "product_id": "{product_id}", "category": "beauty", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "design_for_this_beauty_product_type",
"dimensions": {{"height_mm": realistic_height, "width_mm": realistic_width, "depth_mm": realistic_depth}},
"materials": {{"primary": "main_component_material", "secondary": "accent_material", "applicator": "application_tool_material"}},
"finishes": {{"primary": "primary_finish", "secondary": "accent_finish", "applicator": "applicator_finish"}},
"color_scheme": {{"base": "color_matching_this_aesthetic", "accents": ["colors_for_this_style"]}},
"natural_imperfections": null,
"target_price_usd": realistic_price_in_range,
"certifications": ["beauty_industry_certifications"],
"variants": ["shade_size_or_feature_variants"],
"notes": "beauty_specific_application_and_performance_features"}}`,

  clothing: `Create clothing: {product_name} for {use_case}
Style: {aesthetic} | Market: {positioning} | Budget: {price_range}

Design this specific garment with materials and construction that reflect the "{aesthetic}" style and suit this particular clothing type.

Consider the garment type and create appropriate:
- Fabric choices that suit this garment's function and aesthetic style
- Construction methods appropriate for this clothing type and market tier
- Design details that embody the "{aesthetic}" style
- Sizing and fit appropriate for this garment type

JSON Response (customize for this specific garment):
{{"product_name": "{product_name}", "product_id": "{product_id}", "category": "clothing", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "garment_type_and_silhouette",
"dimensions": {{"height_mm": garment_length, "width_mm": garment_width, "depth_mm": garment_thickness_or_ease}},
"materials": {{"fabric": "main_fabric_choice", "lining": "lining_material", "hardware": "closures_and_details"}},
"finishes": {{"fabric": "fabric_treatment", "lining": "lining_finish", "hardware": "hardware_finish"}},
"color_scheme": {{"base": "color_matching_this_aesthetic", "accents": ["accent_colors_for_this_style"]}},
"natural_imperfections": null,
"target_price_usd": realistic_price_in_range,
"certifications": ["textile_certifications"],
"variants": ["size_color_or_style_variants"],
"notes": "garment_construction_and_care_details"}}`,

  tools: `Create tool: {product_name} for {use_case}
Style: {aesthetic} | Market: {positioning} | Budget: {price_range}

Design this specific tool with materials and features that reflect the "{aesthetic}" style and optimize this particular tool's function.

Consider the tool type and create appropriate:
- Materials that provide durability for this tool's specific use
- Ergonomic design suited to this tool's operation method
- Features that enhance performance for this specific application
- Design that embodies the "{aesthetic}" style while maintaining functionality

JSON Response (customize for this specific tool):
{{"product_name": "{product_name}", "product_id": "{product_id}", "category": "tools", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "tool_design_for_this_specific_function",
"dimensions": {{"height_mm": tool_length, "width_mm": tool_width, "depth_mm": tool_thickness}},
"materials": {{"body": "main_tool_material", "handle": "grip_material", "components": "working_component_materials"}},
"finishes": {{"body": "body_surface_finish", "handle": "grip_texture", "components": "component_finish"}},
"color_scheme": {{"base": "color_matching_this_aesthetic", "accents": ["accent_colors_for_this_style"]}},
"natural_imperfections": null,
"target_price_usd": realistic_price_in_range,
"certifications": ["tool_safety_certifications"],
"variants": ["size_power_or_feature_variants"],
"notes": "tool_specific_performance_and_safety_features"}}`
};

// Enhanced price ranges with more categories
export const PRICE_RANGES = {
  budget: { 
    supplement: [8, 18], skincare: [5, 15], food: [3, 8], 
    wearable: [15, 40], wellness: [10, 25], beauty: [4, 12],
    clothing: [15, 35], tools: [8, 25]
  },
  'mid-range': { 
    supplement: [18, 35], skincare: [15, 45], food: [8, 20], 
    wearable: [40, 120], wellness: [25, 65], beauty: [12, 40],
    clothing: [35, 85], tools: [25, 75]
  },
  premium: { 
    supplement: [35, 75], skincare: [45, 150], food: [20, 50], 
    wearable: [120, 400], wellness: [65, 200], beauty: [40, 150],
    clothing: [85, 300], tools: [75, 250]
  }
} as const;
