import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.50.2/+esm';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ConversationPhase = 'QUESTIONING' | 'GENERATING' | 'EDITING';

interface ConversationState {
  phase: ConversationPhase;
  currentQuestion: number;
  answers: Record<string, string>;
  questionsCompleted: boolean;
}

const QUESTIONS = [
  {
    id: 'product_concept',
    text: 'What product do you want to make? Please describe what it is, who it\'s for, and what problem it solves.'
  },
  {
    id: 'reference_brand',
    text: 'What\'s a good reference brand or product that inspires the aesthetic, quality level, or market positioning you\'re aiming for?'
  }
];

// Enhanced system prompt with manufacturing expertise
const ENHANCED_SYSTEM_PROMPT = `You are an expert industrial designer and product strategist with 15+ years of experience in CPG, apparel, and hardware development.

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

// Category-specific templates for enhanced prompting
const TEMPLATES = {
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
const PRICE_RANGES = {
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

const OVERALL_SYSTEM_PROMPT = `
You are Geneering, an AI product development expert. Your goal is to help users design manufacturing-ready products by guiding them through a friendly, iterative conversation.

You operate in three phases:
1. Questioning — gather initial product concept and reference brand.
2. Generating — create a detailed product brief as JSON.
3. Editing — help refine and finalize the product brief to ensure it is manufacturable and meets user needs.

Adapt your responses based on the current phase and always aim to be clear, helpful, and precise.
`;

const QUESTIONING_PROMPT = `You are a product development expert conducting a streamlined interview to create a comprehensive product brief. 

CURRENT CONVERSATION STATE: {{STATE}}

Your role:
1. Ask the 2 core questions below, one at a time
2. Accept any reasonable answer - don't ask follow-ups
3. Keep responses short and encouraging

The 2 core questions you must cover:
1. Product concept: What they want to make
2. Reference brand/product: What inspires their aesthetic, quality, and or positioning

Current question to ask: {{CURRENT_QUESTION}}

If this is the first question, ask about their product concept.
If this is the second question, ask about their reference brand.

On completion of this phase, automatically start the Generating phase.  

`;

// Helper function to detect product category
function detectCategory(productName: string, useCase: string): string {
  const name = productName.toLowerCase();
  const use = useCase.toLowerCase();
  
  // Supplement detection
  if (name.includes('gummies') || name.includes('supplement') || name.includes('vitamin') || 
      name.includes('protein') || name.includes('capsule') || name.includes('pill') ||
      use.includes('vitamin') || use.includes('supplement') || use.includes('nutrition')) {
    return 'supplement';
  }
  
  // Skincare detection
  if (name.includes('cream') || name.includes('serum') || name.includes('lotion') || 
      name.includes('cleanser') || name.includes('moisturizer') || name.includes('sunscreen') ||
      use.includes('skin') || use.includes('face') || use.includes('anti-aging')) {
    return 'skincare';
  }
  
  // Food detection
  if (name.includes('snack') || name.includes('bar') || name.includes('drink') || 
      name.includes('sauce') || name.includes('tea') || name.includes('coffee') ||
      use.includes('eat') || use.includes('drink') || use.includes('snack')) {
    return 'food';
  }
  
  // Wearable detection
  if (name.includes('band') || name.includes('watch') || name.includes('tracker') || 
      name.includes('ring') || name.includes('glasses') || name.includes('headband') ||
      use.includes('wear') || use.includes('track') || use.includes('monitor')) {
    return 'wearable';
  }
  
  // Beauty detection
  if (name.includes('lipstick') || name.includes('mascara') || name.includes('foundation') || 
      name.includes('eyeshadow') || name.includes('brush') || name.includes('makeup') ||
      use.includes('makeup') || use.includes('beauty') || use.includes('cosmetic')) {
    return 'beauty';
  }
  
  // Clothing detection
  if (name.includes('shirt') || name.includes('dress') || name.includes('pants') || 
      name.includes('jacket') || name.includes('shoes') || name.includes('hat') ||
      use.includes('wear') || use.includes('clothing') || use.includes('fashion')) {
    return 'clothing';
  }
  
  // Tools detection
  if (name.includes('tool') || name.includes('device') || name.includes('gadget') || 
      name.includes('opener') || name.includes('cutter') || name.includes('screwdriver') ||
      use.includes('tool') || use.includes('fix') || use.includes('build')) {
    return 'tools';
  }
  
  // Default to wellness for health, fitness, therapy, etc.
  return 'wellness';
}

// Helper function to infer positioning from aesthetic
function inferPositioning(aesthetic: string): 'budget' | 'mid-range' | 'premium' {
  const aes = aesthetic.toLowerCase();
  
  if (aes.includes('luxury') || aes.includes('premium') || aes.includes('high-end') || 
      aes.includes('sophisticated') || aes.includes('exclusive') || aes.includes('artisanal')) {
    return 'premium';
  }
  
  if (aes.includes('affordable') || aes.includes('budget') || aes.includes('simple') || 
      aes.includes('basic') || aes.includes('economical') || aes.includes('value')) {
    return 'budget';
  }
  
  return 'mid-range';
}

// Helper function to build enhanced prompt
function buildPrompt(productName: string, useCase: string, aesthetic: string): string {
  const category = detectCategory(productName, useCase);
  const positioning = inferPositioning(aesthetic);
  const template = TEMPLATES[category] || TEMPLATES.wellness;
  
  // Get price range for this category and positioning
  const priceRange = PRICE_RANGES[positioning][category] || PRICE_RANGES[positioning].wellness;
  const priceRangeText = `$${priceRange[0]}-${priceRange[1]}`;
  
  // Generate product ID
  const productId = productName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  return template
    .replace(/{product_name}/g, productName)
    .replace(/{product_id}/g, productId)
    .replace(/{use_case}/g, useCase)
    .replace(/{aesthetic}/g, aesthetic)
    .replace(/{positioning}/g, positioning)
    .replace(/{price_range}/g, priceRangeText);
}

const GENERATING_PROMPT_BASE = `You are an expert industrial designer and product strategist. CRITICAL INSTRUCTION: You MUST output ONLY a product brief JSON wrapped in <BRIEF>...</BRIEF> tags. NO conversation. NO explanations. ONLY JSON.

CONVERSATION HISTORY: {{CONVERSATION_HISTORY}}

Your task is to take the user's input from the conversation history and create a detailed product brief using the enhanced template provided below.

OUTPUT REQUIREMENTS:
- ONLY output JSON wrapped in <BRIEF>...</BRIEF> tags
- NO other text before or after the tags
- NO conversational messages
- NO explanations or confirmations

{{ENHANCED_TEMPLATE}}

GENERATE THE JSON NOW. NOTHING ELSE.`;

const EDITING_PROMPT = `You are a product development expert helping to refine an existing product brief through conversation.

CURRENT BRIEF: {{BRIEF}}

Your role:
1. Help users edit and improve their product brief conversationally
2. Make specific changes based on user requests
3. Ask clarifying questions when changes need more detail
4. Reference specific sections when making edits
5. Always end with updated JSON in <BRIEF>...</BRIEF> tags

Be conversational and helpful while making precise edits to the brief.`;

function analyzeConversationState(messages: any[], existingBrief: any): ConversationState {
  // If we have an existing brief, we're in editing mode
  if (existingBrief) {
    return {
      phase: 'EDITING',
      currentQuestion: 0,
      answers: {},
      questionsCompleted: true
    };
  }

  // If no messages, start questioning
  if (messages.length === 0) {
    return {
      phase: 'QUESTIONING',
      currentQuestion: 0,
      answers: {},
      questionsCompleted: false
    };
  }

  const userMessages = messages.filter(m => m.role === 'user');
  const userMessageCount = userMessages.length;

  console.log('=== CONVERSATION ANALYSIS ===');
  console.log('Total messages:', messages.length);
  console.log('User messages:', userMessageCount);
  console.log('User message contents:', userMessages.map(m => m.content.substring(0, 50) + '...'));

  // Determine phase based on user message count
  if (userMessageCount === 1) {
    // After first user message, ask second question
    return {
      phase: 'QUESTIONING',
      currentQuestion: 1,
      answers: {},
      questionsCompleted: false
    };
  } else if (userMessageCount >= 2) {
    // After second user message, generate brief
    return {
      phase: 'GENERATING',
      currentQuestion: 0,
      answers: {},
      questionsCompleted: true
    };
  } else {
    // Initial state - ask first question
    return {
      phase: 'QUESTIONING',
      currentQuestion: 0,
      answers: {},
      questionsCompleted: false
    };
  }
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// Helper function to extract product name from first user message
function extractProductNameFromConversation(messages: any[]): string {
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return 'Untitled Product';
  
  const content = firstUserMessage.content.toLowerCase();
  
  // Try to extract product name using common patterns
  let productName = 'Untitled Product';
  
  // Pattern 1: "I want to make/create [product]"
  let match = content.match(/(?:i want to|want to|planning to|going to|need to)\s+(?:make|create|build|develop|design)\s+(?:a|an|some)?\s*([^.!?]+)/);
  if (match) {
    productName = match[1].trim();
  }
  
  // Pattern 2: "It's [product]" or "It is [product]"
  if (!match) {
    match = content.match(/(?:it'?s|it is)\s+(?:a|an)?\s*([^.!?]+)/);
    if (match) {
      productName = match[1].trim();
    }
  }
  
  // Pattern 3: Direct product mention at start
  if (!match) {
    match = content.match(/^(?:a|an)?\s*([^.!?]+?)(?:\s+(?:for|that|which))/);
    if (match) {
      productName = match[1].trim();
    }
  }
  
  // Clean up the extracted name
  productName = productName
    .replace(/\b(?:for|that|which|to|the|a|an)\b.*$/i, '') // Remove trailing words
    .replace(/^\b(?:the|a|an)\s+/i, '') // Remove leading articles
    .trim();
  
  // Capitalize first letter of each word
  productName = productName.replace(/\b\w/g, l => l.toUpperCase());
  
  // Fallback if still empty
  if (!productName || productName.length < 2) {
    productName = 'Untitled Product';
  }
  
  return productName;
}

// Helper function to save project with version control
async function saveProjectWithVersion(userId: string, productBrief: any, rawAiOutput: string, parentProjectId?: string) {
  try {
    // If this is an update to existing project, create new version
    let version = 1;
    if (parentProjectId) {
      const { data: latestVersion } = await supabase
        .from('projects')
        .select('version')
        .eq('parent_project_id', parentProjectId)
        .order('version', { ascending: false })
        .limit(1)
        .single();
      
      version = (latestVersion?.version || 0) + 1;
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        product_name: productBrief.product_name || 'Untitled Product',
        product_brief: productBrief,
        raw_ai_output: rawAiOutput,
        version: version,
        parent_project_id: parentProjectId || null,
        openai_request_details: {
          timestamp: new Date().toISOString(),
          conversation_length: 0
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving project:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in saveProjectWithVersion:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, existingBrief, conversationState, userId } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Analyze conversation state
    const state = conversationState || analyzeConversationState(messages, existingBrief);
    
    console.log('=== CONVERSATION STATE DEBUG ===');
    console.log('Phase:', state.phase);
    console.log('Current question:', state.currentQuestion);
    console.log('Questions completed:', state.questionsCompleted);
    console.log('Total user messages:', messages.filter(m => m.role === 'user').length);
    console.log('Message count:', messages.length);
    console.log('Has existing brief:', !!existingBrief);
    
    let systemPrompt = '';
    
    if (state.phase === 'EDITING' && existingBrief) {
      systemPrompt = OVERALL_SYSTEM_PROMPT + '\n' + EDITING_PROMPT.replace('{{BRIEF}}', JSON.stringify(existingBrief, null, 2));
    } else if (state.phase === 'QUESTIONING') {
      const currentQ = QUESTIONS[state.currentQuestion];
      systemPrompt = OVERALL_SYSTEM_PROMPT + '\n' + QUESTIONING_PROMPT
        .replace('{{STATE}}', JSON.stringify(state, null, 2))
        .replace('{{CURRENT_QUESTION}}', currentQ ? currentQ.text : 'All questions completed');
    } else if (state.phase === 'GENERATING') {
      const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const extractedProductName = extractProductNameFromConversation(messages);
      console.log('Extracted product name:', extractedProductName);
      
      // Extract use case and aesthetic from conversation
      const userMessages = messages.filter(m => m.role === 'user');
      const useCase = userMessages[0]?.content || 'general use';
      const aesthetic = userMessages[1]?.content || 'modern';
      
      // Build enhanced prompt using category-specific template
      const enhancedTemplate = buildPrompt(extractedProductName, useCase, aesthetic);
      console.log('Enhanced prompt built for category:', detectCategory(extractedProductName, useCase));
      
      systemPrompt = GENERATING_PROMPT_BASE
        .replace('{{CONVERSATION_HISTORY}}', conversationHistory)
        .replace('{{ENHANCED_TEMPLATE}}', enhancedTemplate);
    }

    console.log('=== SYSTEM PROMPT ===');
    console.log('Phase:', state.phase);
    console.log('Prompt length:', systemPrompt.length);
    console.log('First 200 chars:', systemPrompt.substring(0, 200));

    // Convert messages to the proper format for Responses API
    const userMessages = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        instructions: systemPrompt,
        input: userMessages,
        tools: [
          {
            type: 'web_search'
          }
        ],
        temperature: 0.7,
        max_output_tokens: 2000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    // Handle Responses API format correctly
    let content = '';
    let generatedImages: string[] = [];

    if (data.output && data.output.length > 0) {
      // Extract text content from output messages
      for (const outputItem of data.output) {
        if (outputItem.type === 'message' && outputItem.content) {
          for (const contentPart of outputItem.content) {
            if (contentPart.type === 'output_text') {
              content += contentPart.text;
            }
          }
        }
      }
    } else {
      console.error('Unexpected response format:', data);
      throw new Error('No output received from OpenAI API');
    }

    // Web search results would be available in tool call outputs if any
    if (data.output) {
      for (const outputItem of data.output) {
        if (outputItem.type === 'tool_call' && outputItem.tool_type === 'web_search') {
          console.log('Web search results:', outputItem.result);
        }
      }
    }

    // Extract product brief if present with fallback parsing
    let savedProject = null;
    let finalContent = content;
    console.log('=== DEBUG: Checking for product brief ===');
    console.log('Content length:', content.length);
    console.log('Has userId:', !!userId);
    console.log('Content preview:', content.substring(0, 200));
    console.log('Looking for <BRIEF> tags...');
    
    let briefMatch = content.match(/<BRIEF>(.*?)<\/BRIEF>/s);
    console.log('Brief match found:', !!briefMatch);
    
    // Fallback: try parsing markdown code blocks if no BRIEF tags found
    if (!briefMatch) {
      console.log('No BRIEF tags found, trying markdown fallback...');
      const markdownMatch = content.match(/```json\s*(.*?)\s*```/s);
      if (markdownMatch) {
        console.log('Found markdown JSON block, converting to BRIEF format');
        briefMatch = [markdownMatch[0], markdownMatch[1]];
      }
    }
    
    if (briefMatch && userId) {
      try {
        console.log('Matched brief content:', briefMatch[1].substring(0, 200));
        const productBrief = JSON.parse(briefMatch[1]);
        console.log('Successfully parsed product brief:', productBrief.product_name);
        
        // Save or update project with version control
        const parentProjectId = existingBrief?.id || null;
        console.log('Saving with parentProjectId:', parentProjectId);
        savedProject = await saveProjectWithVersion(userId, productBrief, content, parentProjectId);
        
        if (savedProject) {
          console.log(`Project saved with version ${savedProject.version}, ID: ${savedProject.id}`);
          
          // If this was the GENERATING phase, add welcome message for EDITING phase
          if (state.phase === 'GENERATING') {
            finalContent = `Perfect! I've generated your product brief for "${productBrief.product_name}". You can now review it in the preview panel and tell me what you'd like to edit or improve. What changes would you like to make?`;
          }
        } else {
          console.log('saveProjectWithVersion returned null');
        }
      } catch (error) {
        console.error('Error processing product brief:', error);
      }
    } else {
      console.log('No brief match or userId missing - briefMatch:', !!briefMatch, 'userId:', !!userId);
    }

    // Update conversation state for next interaction
    let updatedState;
    if (state.phase === 'GENERATING' && savedProject) {
      // Successfully generated brief, move to editing
      updatedState = {
        ...state,
        phase: 'EDITING' as ConversationPhase,
        questionsCompleted: true
      };
    } else if (state.phase === 'QUESTIONING' && state.currentQuestion === 1) {
      // Completed second question, move to generating
      updatedState = {
        ...state,
        phase: 'GENERATING' as ConversationPhase,
        questionsCompleted: true
      };
    } else if (state.phase === 'QUESTIONING' && state.currentQuestion === 0) {
      // First question answered, move to second question
      updatedState = {
        ...state,
        currentQuestion: 1
      };
    } else {
      // Default: keep current state
      updatedState = state;
    }

    console.log('=== UPDATED STATE ===');
    console.log('Updated phase:', updatedState.phase);
    console.log('Updated currentQuestion:', updatedState.currentQuestion);

    // Extract product name for response if we have a saved project
    let responseProductName = '';
    if (savedProject && savedProject.product_name) {
      responseProductName = savedProject.product_name;
    } else if (briefMatch) {
      try {
        const productBrief = JSON.parse(briefMatch[1]);
        responseProductName = productBrief.product_name || '';
      } catch (error) {
        console.log('Could not parse brief for product name');
      }
    }

    return new Response(JSON.stringify({ 
      content: finalContent,
      conversationState: updatedState,
      savedProject: savedProject,
      generatedImages: generatedImages,
      productName: responseProductName
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in streaming-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
