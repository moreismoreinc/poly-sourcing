// Enhanced system prompt with manufacturing expertise
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

FAILURE PREVENTION RULES:
1. No theoretical materials or unproven processes
2. No dimensions requiring custom packaging systems
3. No price points ignoring material/manufacturing costs
4. No claims requiring extensive testing without realistic budget/timeline
5. No processes requiring specialized equipment unavailable to contract manufacturers
6. When uncertain about manufacturability, default to simpler, proven approaches

OUTPUT: Generate ONLY valid JSON matching the exact schema. No additional text or explanations.`;

// Available product categories
export const AVAILABLE_CATEGORIES = [
  'supplement',
  'skincare', 
  'food',
  'wearable',
  'wellness',
  'beauty',
  'clothing',
  'tools'
] as const;

// Type for available categories
export type ProductCategory = typeof AVAILABLE_CATEGORIES[number];

// Category-specific templates for enhanced prompting
export const TEMPLATES: Record<ProductCategory, string> = {
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
- Complete manufacturing recipe with exact ingredients, quantities, and production instructions suitable for contract manufacturing

CONTRACT MANUFACTURER REQUIREMENTS:
You MUST base all formulations on established commercial products that already exist in the market. 

MANDATORY CONSTRAINTS:
1. ONLY use ingredient ratios from proven commercial formulations (reference similar products on store shelves)
2. ONLY specify manufacturing processes that use standard food industry equipment
3. ONLY include quality control parameters that are routinely measured in commercial facilities
4. ONLY suggest formulations that have been successfully manufactured at scale by multiple companies

REFERENCE DATABASE - Use these proven formulation ranges:

SALAD DRESSINGS (like ranch, Italian, French):
- Oil content: 20-35% (NEVER exceed 35% - emulsion instability)
- Vinegar/acid: 8-15% (for preservation and flavor)
- Water: 25-45% (for proper viscosity)
- Emulsifiers: 0.5-2% (mustard, egg, lecithin)
- Thickeners: 0.1-0.5% (xanthan gum standard)
- Salt: 1-3% (flavor and preservation)
- Sugar: 2-8% (balance acidity)

SAUCES (like ketchup, barbecue, hot sauce):
- Tomato base: 60-80% (for tomato-based)
- Vinegar: 5-12% (preservation)
- Sugar: 8-20% (flavor balance)
- Salt: 2-4% (preservation and taste)
- Spices: 1-3% total
- Thickeners: 0.1-0.3% if needed

SNACK BARS:
- Nuts/seeds: 30-50%
- Dried fruit: 15-30%
- Binding syrup: 15-25%
- Protein powder: 10-20% if protein bar
- Salt: 0.3-0.8%

BEVERAGES:
- Water base: 85-95%
- Sweeteners: 8-12% (sugar/alternative)
- Acid: 0.1-0.3% (citric acid typical)
- Flavoring: 0.5-2%
- Preservatives: 0.05-0.1%

MANDATORY PROCESS CONSTRAINTS:
- Mixing: Use only standard industrial mixers (planetary, ribbon, high-shear)
- Heating: Standard jacketed kettles or heat exchangers (no specialized equipment)
- Filling: Gravity or piston fillers (standard in all co-packers)
- Pasteurization: Only if product requires it and co-packer has capability

QUALITY CONTROL - ONLY specify these standard tests:
- pH measurement (all facilities have pH meters)
- Viscosity (standard viscometers)
- Moisture content (standard ovens)
- Salt content (conductivity meters)
- Temperature monitoring (standard thermometers)
- Visual inspection (standard practice)

FAIL-SAFE RULES:
❌ NEVER specify ingredient percentages outside proven commercial ranges
❌ NEVER require specialized equipment not found in standard co-packers
❌ NEVER suggest novel ingredient combinations without commercial precedent
❌ NEVER specify quality tests requiring specialized lab equipment
❌ NEVER create emulsions with >35% oil content
❌ NEVER specify pH outside safe ranges (below 3.8 for shelf stability or above 4.6 without other preservation)

✅ ALWAYS reference existing commercial products as formulation basis
✅ ALWAYS use ingredient ranges from the reference database above
✅ ALWAYS specify standard food industry equipment
✅ ALWAYS include proven preservation systems
✅ ALWAYS validate emulsion ratios against commercial standards

VALIDATION CHECKLIST - Before outputting any formulation:
1. Can I buy a similar product at the grocery store? (If no, it's probably too experimental)
2. Are all ingredient percentages within proven commercial ranges?
3. Does the process use only standard co-packer equipment?
4. Are all quality tests standard in commercial facilities?
5. Is the preservation system proven and FDA-compliant?


JSON Response (customize for this specific food product):
{{"product_name": "{product_name}", "product_id": "{product_id}", "category": "food", "positioning": "{positioning}",
"intended_use": "{use_case}", "target_aesthetic": "{aesthetic}",
"form_factor": "package_format_for_this_food_type",
"dimensions": {{"height_mm": realistic_height, "width_mm": realistic_width, "depth_mm": realistic_depth}},
"recipe": {{
  "batch_size": "production_batch_size_with_units",
  "ingredients": [
    {{"name": "ingredient_name", "quantity": "exact_amount_with_units", "percentage": "percentage_of_total_weight", "function": "purpose_in_formulation", "supplier_spec": "food_grade_specification"}},
    {{"name": "ingredient_name_2", "quantity": "exact_amount_with_units", "percentage": "percentage_of_total_weight", "function": "purpose_in_formulation", "supplier_spec": "food_grade_specification"}}
  ],
  "manufacturing_instructions": "Step-by-step manufacturing process suitable for contract manufacturing: 1. Preparation phase with specific temperatures, times, and equipment requirements. 2. Mixing/processing phase with exact parameters (speed, temperature, duration). 3. Quality control checkpoints with specific tests and tolerances. 4. Packaging phase with sterility and sealing requirements. 5. Final inspection and labeling specifications.",
  "quality_control": {{
    "critical_control_points": ["temperature_control", "moisture_content", "ph_levels", "specific_quality_parameters"],
    "testing_requirements": ["microbiological_testing", "nutritional_analysis", "shelf_life_testing"],
    "acceptance_criteria": "specific_measurable_quality_standards"
  }},
  "shelf_life": "duration_with_storage_conditions",
  "storage_requirements": "specific_temperature_humidity_light_requirements",
  "allergen_information": ["list_of_allergens_present"],
  "nutritional_profile": "approximate_calories_macros_per_serving"
}},
"materials": {{"packaging": "food_safe_package_material_with_barrier_properties", "sealing": "closure_or_seal_type", "graphics": "printing_substrate"}},
"finishes": {{"packaging": "package_surface_finish", "sealing": "closure_finish", "graphics": "print_finish_type"}},
"color_scheme": {{"base": "appetizing_color_matching_aesthetic", "accents": ["colors_for_this_style"]}},
"natural_imperfections": null,
"target_price_usd": realistic_price_in_range,
"certifications": ["FDA_registration", "HACCP_compliance", "relevant_food_safety_certifications"],
"variants": ["size_or_flavor_variants_with_recipe_modifications"],
"manufacturing_notes": "specific_equipment_requirements_minimum_order_quantities_and_production_considerations",
"regulatory_compliance": "FDA_nutritional_labeling_requirements_and_claims_substantiation"}}`,

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
export const PRICE_RANGES: Record<'budget' | 'mid-range' | 'premium', Record<ProductCategory, [number, number]>> = {
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
};
