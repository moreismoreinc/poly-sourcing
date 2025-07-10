import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.50.2/+esm';
import { ENHANCED_SYSTEM_PROMPT, TEMPLATES, PRICE_RANGES, AVAILABLE_CATEGORIES, type ProductCategory } from './constants.ts';
import { TOOLS, executeTool, executeProductMockup } from './tools.ts';

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

const OVERALL_SYSTEM_PROMPT = `
You are Geneering, an AI product development expert. Your goal is to help users design manufacturing-ready products by guiding them through a friendly, iterative conversation.

You operate in three phases:
1. Questioning — gather initial product concept and reference brand.
2. Generating — create a detailed product brief as JSON.
3. Editing — help refine and finalize the product brief to ensure it is manufacturable and meets user needs.

Adapt your responses based on the current phase and always aim to be clear, helpful, and precise.
`;

// CRITICAL: Fallback system prompt to ensure OpenAI always gets basic instructions
const FALLBACK_SYSTEM_PROMPT = `
You are Geneering, an AI product development expert helping users create manufacturing-ready products.

Always be helpful, clear, and professional in your responses. Focus on practical, manufacturable solutions.
`;

const QUESTIONING_PROMPT = `You are a product development expert conducting a streamlined interview to create a comprehensive product brief. 

CURRENT CONVERSATION STATE: {{STATE}}

Your role:
1. Ask the 2 core questions below, one at a time, and ask only those two questions then respond once
2. Accept any reasonable answer - don't ask follow-ups
3. Keep responses short and encouraging

The 2 core questions you must cover:
1. Product concept: What they want to make (determines the WHAT - product type, function, content)
2. Reference brand/product: What inspires their approach (determines the HOW - aesthetics, quality level, positioning style)

Current question to ask: {{CURRENT_QUESTION}}

If this is the first question, ask about their product concept.
If this is the second question, ask about their reference brand or product.

On completion of this phase, you MUST immediately do 4 things in sequence: 
1. YOU MUST first show you have understood the task by paraphrasing what the user has told you in a message.
2. YOU MUST explain the research approach: "I'll research similar products and analyze [reference brand]'s approach to understand the market and aesthetic direction."
3. YOU MUST tell the user you will start generating the product brief, specifically "Let me generate a product brief based on this research to get us started." DO NOT respond with the product brief in the message to the user. 
4. YOU MUST automatically start the Generating phase with research integration.

`;

const EDITING_PROMPT = `You are in the EDITING phase, helping refine this existing product brief:

{{BRIEF}}

Help the user make improvements based on their feedback. Be conversational and explain your reasoning for any changes.`;

const GENERATING_PROMPT_BASE = `You are now in the GENERATING phase. Based on the conversation below, create a detailed product brief as JSON.

CONVERSATION HISTORY:
{{CONVERSATION_HISTORY}}

ENHANCED PRODUCT TEMPLATE (Use this as your guide):
{{ENHANCED_TEMPLATE}}

IMPORTANT: You must respond with ONLY valid JSON. No markdown code blocks, no explanations, just the JSON object.`;

// AI-powered category detection
async function detectCategoryWithAI(productName: string, useCase: string, openAIApiKey: string): Promise<ProductCategory> {
  const categorizationPrompt = `You are a product categorization expert. Based on the product name and use case provided, determine which category best fits this product.

Available categories: ${AVAILABLE_CATEGORIES.join(', ')}

Product Name: ${productName}
Use Case: ${useCase}

Rules:
1. Choose ONLY from the available categories listed above
2. Consider the primary function, target market, and manufacturing requirements
3. If uncertain between categories, pick the most specific one that fits
4. Respond with ONLY the category name, no explanation

Category:`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using a faster, cheaper model for categorization
        messages: [
          {
            role: 'system',
            content: 'You are a product categorization expert. Respond with only the category name, no additional text.'
          },
          {
            role: 'user',
            content: categorizationPrompt
          }
        ],
        temperature: 0.1, // Low temperature for consistent categorization
        max_tokens: 20 // We only need a short response
      }),
    });

    if (!response.ok) {
      console.error('OpenAI categorization API error:', response.status);
      return 'wellness'; // Fallback to default
    }

    const data = await response.json();
    const suggestedCategory = data.choices[0]?.message?.content?.trim().toLowerCase();
    
    console.log('AI suggested category:', suggestedCategory);
    
    // Validate the AI's response against available categories
    if (AVAILABLE_CATEGORIES.includes(suggestedCategory as ProductCategory)) {
      return suggestedCategory as ProductCategory;
    } else {
      console.log('AI suggested invalid category, falling back to wellness');
      return 'wellness';
    }
    
  } catch (error) {
    console.error('Error in AI categorization:', error);
    // Fallback to original keyword-based detection
    return detectCategoryFallback(productName, useCase);
  }
}

// Keep the original function as a fallback
function detectCategoryFallback(productName: string, useCase: string): ProductCategory {
  const name = productName.toLowerCase();
  const use = useCase.toLowerCase();
  
  // Supplement detection
  if (name.includes('gummies') || name.includes('supplement') || name.includes('vitamin') || 
      name.includes('protein') || name.includes('capsule') || name.includes('pill') ||
      use.includes('vitamin') || use.includes('supplement') || use.includes('nutrition')) {
    return AVAILABLE_CATEGORIES.includes('supplement') ? 'supplement' : 'wellness';
  }
  
  // Skincare detection
  if (name.includes('cream') || name.includes('serum') || name.includes('lotion') || 
      name.includes('cleanser') || name.includes('moisturizer') || name.includes('sunscreen') ||
      use.includes('skin') || use.includes('face') || use.includes('anti-aging')) {
    return AVAILABLE_CATEGORIES.includes('skincare') ? 'skincare' : 'wellness';
  }
  
  // Food detection
  if (name.includes('snack') || name.includes('bar') || name.includes('drink') || 
      name.includes('sauce') || name.includes('tea') || name.includes('coffee') ||
      use.includes('eat') || use.includes('drink') || use.includes('snack')) {
    return AVAILABLE_CATEGORIES.includes('food') ? 'food' : 'wellness';
  }
  
  // Wearable detection
  if (name.includes('band') || name.includes('watch') || name.includes('tracker') || 
      name.includes('ring') || name.includes('glasses') || name.includes('headband') ||
      use.includes('wear') || use.includes('track') || use.includes('monitor')) {
    return AVAILABLE_CATEGORIES.includes('wearable') ? 'wearable' : 'wellness';
  }
  
  // Beauty detection
  if (name.includes('lipstick') || name.includes('mascara') || name.includes('foundation') || 
      name.includes('eyeshadow') || name.includes('brush') || name.includes('makeup') ||
      use.includes('makeup') || use.includes('beauty') || use.includes('cosmetic')) {
    return AVAILABLE_CATEGORIES.includes('beauty') ? 'beauty' : 'wellness';
  }
  
  // Clothing detection
  if (name.includes('shirt') || name.includes('dress') || name.includes('pants') || 
      name.includes('jacket') || name.includes('shoes') || name.includes('hat') ||
      use.includes('wear') || use.includes('clothing') || use.includes('fashion')) {
    return AVAILABLE_CATEGORIES.includes('clothing') ? 'clothing' : 'wellness';
  }
  
  // Tools detection
  if (name.includes('tool') || name.includes('device') || name.includes('gadget') || 
      name.includes('opener') || name.includes('cutter') || name.includes('screwdriver') ||
      use.includes('tool') || use.includes('fix') || use.includes('build')) {
    return AVAILABLE_CATEGORIES.includes('tools') ? 'tools' : 'wellness';
  }
  
  // Default to wellness for health, fitness, therapy, etc.
  return 'wellness';
}

// Smart positioning detection with AI
async function inferPositioningWithAI(aesthetic: string, productName: string, openAIApiKey: string): Promise<'budget' | 'mid-range' | 'premium'> {
  const positioningPrompt = `You are a brand positioning expert. Based on the aesthetic description and product name, determine the market positioning.

Available positions: budget, mid-range, premium

Product Name: ${productName}
Aesthetic Description: ${aesthetic}

Consider:
- Language used (luxury, premium, high-end vs affordable, basic, simple)
- Target market indicators
- Quality expectations
- Price point implications

Respond with ONLY one of: budget, mid-range, premium

Position:`;

  try {
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
            content: 'You are a brand positioning expert. Respond with only the position level, no additional text.'
          },
          {
            role: 'user',
            content: positioningPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      }),
    });

    if (!response.ok) {
      console.error('OpenAI positioning API error:', response.status);
      return inferPositioningFallback(aesthetic);
    }

    const data = await response.json();
    const suggestedPosition = data.choices[0]?.message?.content?.trim().toLowerCase();
    
    console.log('AI suggested positioning:', suggestedPosition);
    
    // Validate response
    if (['budget', 'mid-range', 'premium'].includes(suggestedPosition)) {
      return suggestedPosition as 'budget' | 'mid-range' | 'premium';
    } else {
      return inferPositioningFallback(aesthetic);
    }
    
  } catch (error) {
    console.error('Error in AI positioning:', error);
    return inferPositioningFallback(aesthetic);
  }
}

// Keep original positioning logic as fallback
function inferPositioningFallback(aesthetic: string): 'budget' | 'mid-range' | 'premium' {
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

// Research functions for product development
async function searchSimilarProducts(productName: string, useCase: string): Promise<any> {
  console.log(`Searching for similar products: ${productName} - ${useCase}`);
  
  // Search for similar products to understand market attributes
  const query = `${productName} similar products market analysis attributes features`;
  
  // This would integrate with a real search API (Perplexity, Google, etc.)
  // For now, return structured mock data that would be useful for product development
  return {
    query,
    product_context: {
      name: productName,
      use_case: useCase
    },
    similar_products: [
      {
        name: "Similar Product 1",
        category: "wellness",
        price_range: "$25-50",
        key_attributes: ["natural ingredients", "eco-friendly packaging", "premium quality"],
        materials: ["glass", "bamboo", "recycled plastic"],
        positioning: "premium natural wellness",
        target_market: "health-conscious consumers"
      },
      {
        name: "Similar Product 2", 
        category: "wellness",
        price_range: "$15-30",
        key_attributes: ["affordable", "convenient", "effective"],
        materials: ["plastic", "aluminum"],
        positioning: "accessible wellness",
        target_market: "mass market"
      }
    ],
    market_insights: {
      common_materials: ["glass", "plastic", "metal"],
      typical_price_ranges: ["$15-30 (budget)", "$30-60 (mid-range)", "$60+ (premium)"],
      key_differentiators: ["ingredients", "packaging", "brand story", "sustainability"],
      manufacturing_considerations: ["FDA compliance", "sustainable sourcing", "cost optimization"]
    }
  };
}

async function searchReferenceProduct(referenceBrand: string, productContext: string): Promise<any> {
  console.log(`Searching for reference product: ${referenceBrand} - ${productContext}`);
  
  // Search for the reference brand/product to understand aesthetics and positioning
  const query = `${referenceBrand} brand aesthetics design language positioning attributes`;
  
  // This would integrate with a real search API
  return {
    query,
    reference_brand: referenceBrand,
    product_context: productContext,
    brand_analysis: {
      aesthetic_language: {
        colors: ["minimalist whites", "premium metallics", "natural earth tones"],
        typography: ["clean sans-serif", "elegant serif accents"],
        materials: ["premium glass", "brushed metal", "natural wood"],
        finishes: ["matte surfaces", "subtle textures", "clean lines"]
      },
      positioning: {
        market_level: "premium",
        target_demographic: "affluent, design-conscious consumers",
        brand_values: ["quality", "sophistication", "sustainability", "innovation"],
        price_positioning: "premium pricing with value justification"
      },
      design_principles: {
        simplicity: "clean, uncluttered design",
        quality: "premium materials and craftsmanship",
        functionality: "thoughtful user experience",
        sustainability: "eco-conscious material choices"
      },
      packaging_style: {
        approach: "minimalist luxury",
        materials: ["recycled cardboard", "glass", "metal"],
        color_palette: ["neutral tones", "accent colors", "natural textures"],
        typography: ["sophisticated fonts", "clear hierarchy"]
      }
    },
    application_guidelines: {
      what_to_adopt: ["aesthetic principles", "quality standards", "design language", "material choices"],
      what_to_avoid: ["copying exact designs", "using brand names", "replicating proprietary elements"],
      adaptation_strategy: "Apply aesthetic principles and quality standards to the specific product category while maintaining authenticity"
    }
  };
}

// Updated buildPrompt function with web search-based research  
async function buildPromptWithResearch(productName: string, useCase: string, referenceBrand: string, openAIApiKey: string): Promise<string> {
  console.log('=== RESEARCH-POWERED PROMPT BUILDING ===');
  
  try {
    // Perform parallel searches for similar products and reference brand
    const [category, similarProductsData, referenceData] = await Promise.all([
      detectCategoryWithAI(productName, useCase, openAIApiKey),
      searchSimilarProducts(productName, useCase),
      searchReferenceProduct(referenceBrand, `${productName} - ${useCase}`)
    ]);
    
    console.log('AI-determined category:', category);
    console.log('Similar products research:', similarProductsData);
    console.log('Reference brand research:', referenceData);
    
    const template = TEMPLATES[category] || TEMPLATES.wellness;
    console.log('Using template for category:', category, 'exists:', !!TEMPLATES[category]);
    
    // Determine positioning from reference brand analysis
    const positioning = referenceData.brand_analysis.positioning.market_level || 'mid-range';
    
    // Get price range for this category and positioning
    const priceRange = PRICE_RANGES[positioning]?.[category] || PRICE_RANGES[positioning]?.wellness || [25, 50];
    const priceRangeText = `$${priceRange[0]}-${priceRange[1]}`;
    
    console.log('Research-determined positioning:', positioning);
    console.log('Price range:', priceRangeText);
    
    // Generate product ID
    const productId = productName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Create enhanced prompt with research data
    const researchContext = `
SIMILAR PRODUCTS RESEARCH:
${JSON.stringify(similarProductsData.market_insights, null, 2)}

REFERENCE BRAND ANALYSIS (${referenceBrand}):
Aesthetic Language: ${JSON.stringify(referenceData.brand_analysis.aesthetic_language, null, 2)}
Positioning: ${JSON.stringify(referenceData.brand_analysis.positioning, null, 2)}
Design Principles: ${JSON.stringify(referenceData.brand_analysis.design_principles, null, 2)}

APPLICATION RULES:
- Product Type: Determined by user's product concept (${productName} - ${useCase})
- Aesthetics & Quality: Inspired by ${referenceBrand}'s design principles and materials
- Positioning: Adopt ${referenceBrand}'s market positioning approach but for the ${category} category
- DO NOT copy exact designs or use brand names
- Apply aesthetic principles authentically to the specific product type`;

    const finalPrompt = template
      .replace(/{product_name}/g, productName)
      .replace(/{product_id}/g, productId)
      .replace(/{use_case}/g, useCase)
      .replace(/{aesthetic}/g, referenceBrand + ' aesthetic approach')
      .replace(/{positioning}/g, positioning)
      .replace(/{price_range}/g, priceRangeText);

    console.log('Final enhanced prompt length:', finalPrompt.length);
    
    return `${ENHANCED_SYSTEM_PROMPT}\n\n${researchContext}\n\n${finalPrompt}`;
  } catch (error) {
    console.error('Error in buildPromptWithResearch:', error);
    // Return a basic fallback prompt
    return `${ENHANCED_SYSTEM_PROMPT}\n\nCreate a product brief for: ${productName}\nUse case: ${useCase}\nAesthetic inspiration: ${referenceBrand}\n\nGenerate a comprehensive JSON product brief with all manufacturing details.`;
  }
}

// ENHANCED function to analyze conversation state with robust logging and validation
function analyzeConversationState(messages: any[], existingBrief?: any): ConversationState {
  console.log('=== ENHANCED CONVERSATION STATE ANALYSIS ===');
  console.log('Input validation:');
  console.log('- Messages array length:', messages?.length || 0);
  console.log('- Has existing brief:', !!existingBrief);
  console.log('- Messages is array:', Array.isArray(messages));
  
  // Input validation with fallback
  if (!messages || !Array.isArray(messages)) {
    console.error('CRITICAL: Invalid messages array received');
    return {
      phase: 'QUESTIONING',
      currentQuestion: 0,
      answers: {},
      questionsCompleted: false
    };
  }

  // If there's an existing brief, we're in editing mode
  if (existingBrief) {
    console.log('Existing brief detected, defaulting to EDITING phase');
    return {
      phase: 'EDITING',
      currentQuestion: 2,
      answers: {},
      questionsCompleted: true
    };
  }

  const userMessages = messages.filter(m => m && m.role === 'user');
  const userMessageCount = userMessages.length;
  const assistantMessages = messages.filter(m => m && m.role === 'assistant');

  console.log('=== MESSAGE ANALYSIS ===');
  console.log('Total messages:', messages.length);
  console.log('User messages:', userMessageCount);
  console.log('Assistant messages:', assistantMessages.length);
  
  if (userMessages.length > 0) {
    console.log('User message contents preview:', userMessages.map((m, i) => `${i}: ${m.content?.substring(0, 50)}...`));
  }

  // Check if AI has indicated it's ready to generate
  const hasTransitionMessage = assistantMessages.some(msg => 
    msg.content && (
      msg.content.includes('generating a product brief') || 
      msg.content.includes('generate a product brief') ||
      msg.content.includes('Let me generate a product brief')
    )
  );

  console.log('Has transition message:', hasTransitionMessage);

  // Enhanced phase determination with validation
  let determinedPhase: ConversationPhase;
  let currentQuestion: number;
  let questionsCompleted: boolean;

  if (userMessageCount >= 2 || hasTransitionMessage) {
    // After second user message or AI transition, generate brief
    determinedPhase = 'GENERATING';
    currentQuestion = 2;
    questionsCompleted = true;
    console.log('Determined phase: GENERATING (>=2 user messages or transition detected)');
  } else if (userMessageCount === 1) {
    // After first user message, ask second question
    determinedPhase = 'QUESTIONING';
    currentQuestion = 1;
    questionsCompleted = false;
    console.log('Determined phase: QUESTIONING (1 user message, asking question 2)');
  } else {
    // Initial state - ask first question
    determinedPhase = 'QUESTIONING';
    currentQuestion = 0;
    questionsCompleted = false;
    console.log('Determined phase: QUESTIONING (no user messages, asking question 1)');
  }

  const finalState = {
    phase: determinedPhase,
    currentQuestion: currentQuestion,
    answers: {},
    questionsCompleted: questionsCompleted
  };

  console.log('=== FINAL CONVERSATION STATE ===');
  console.log('Phase:', finalState.phase);
  console.log('Current question:', finalState.currentQuestion);
  console.log('Questions completed:', finalState.questionsCompleted);
  
  return finalState;
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

// Background function to generate images for a project
async function generateProductImagesForProject(
  project: any, 
  productBrief: any, 
  openAIApiKey: string, 
  userId: string
) {
  try {
    console.log('Generating images for project:', project.id);
    
    const productName = productBrief.product_name || 'Product';
    
    // Handle materials field - it could be an array, string, or object
    let materialsText = 'premium materials';
    if (productBrief.materials) {
      if (Array.isArray(productBrief.materials)) {
        materialsText = productBrief.materials.join(', ');
      } else if (typeof productBrief.materials === 'string') {
        materialsText = productBrief.materials;
      } else if (typeof productBrief.materials === 'object') {
        // If it's an object, try to extract meaningful values
        materialsText = Object.values(productBrief.materials).join(', ') || 'premium materials';
      }
    }
    
    const productDescription = `${productBrief.category || ''} ${productBrief.intended_use || ''} made of ${materialsText} with ${productBrief.target_aesthetic || 'modern'} aesthetic`;
    const aestheticStyle = productBrief.target_aesthetic || 'modern minimalist';
    
    // Generate product mockup with advanced JSON system
    const mockupResult = await executeProductMockup(
      productName,
      productDescription,
      'product_photography',
      aestheticStyle,
      'white_background',
      project.id,
      userId,
      productBrief  // Pass the complete product brief for JSON generation
    );
    
    if (mockupResult.success && mockupResult.image_url) {
      console.log('Successfully generated product mockup:', mockupResult.image_url);
      
      // Update project with image URL
      await supabase
        .from('projects')
        .update({
          image_urls: [mockupResult.image_url]
        })
        .eq('id', project.id);
        
      console.log('Project updated with image URL');
    } else {
      console.error('Failed to generate product mockup:', mockupResult.error);
    }
  } catch (error) {
    console.error('Error in background image generation:', error);
  }
}

// ENHANCED system prompt construction with comprehensive validation and fallbacks
function constructSystemPrompt(state: ConversationState, messages: any[], existingBrief?: any): string {
  console.log('=== SYSTEM PROMPT CONSTRUCTION WITH VALIDATION ===');
  console.log('Input state:', JSON.stringify(state, null, 2));
  console.log('Has existing brief:', !!existingBrief);
  console.log('Messages count:', messages?.length || 0);
  
  let systemPrompt = '';
  
  try {
    if (state.phase === 'EDITING' && existingBrief) {
      console.log('Constructing EDITING phase prompt');
      systemPrompt = OVERALL_SYSTEM_PROMPT + '\n' + EDITING_PROMPT.replace('{{BRIEF}}', JSON.stringify(existingBrief, null, 2));
      console.log('EDITING prompt length:', systemPrompt.length);
      
    } else if (state.phase === 'QUESTIONING') {
      console.log('Constructing QUESTIONING phase prompt');
      const currentQ = QUESTIONS[state.currentQuestion];
      systemPrompt = OVERALL_SYSTEM_PROMPT + '\n' + QUESTIONING_PROMPT
        .replace('{{STATE}}', JSON.stringify(state, null, 2))
        .replace('{{CURRENT_QUESTION}}', currentQ ? currentQ.text : 'All questions completed');
      console.log('QUESTIONING prompt length:', systemPrompt.length);
      
    } else if (state.phase === 'GENERATING') {
      console.log('Constructing GENERATING phase prompt - this is critical');
      
      const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const extractedProductName = extractProductNameFromConversation(messages);
      
      console.log('Extracted product name:', extractedProductName);
      
      // Extract use case and reference brand from conversation
      const userMessages = messages.filter(m => m.role === 'user');
      const useCase = userMessages[0]?.content || 'general use';
      const referenceBrand = userMessages[1]?.content || 'modern aesthetic';
      
      console.log('=== GENERATING PHASE DETAILS ===');
      console.log('Product name:', extractedProductName);
      console.log('Use case:', useCase);
      console.log('Reference brand:', referenceBrand);
      
      // This is where the issue might occur - the async operation
      console.log('CRITICAL: About to build research-based prompt');
      
      // Create basic fallback first
      systemPrompt = `${OVERALL_SYSTEM_PROMPT}\n\nYou are now in the GENERATING phase. Create a detailed product brief based on:\nProduct Concept: ${useCase}\nReference Brand: ${referenceBrand}\n\nIMPORTANT: Generate a comprehensive JSON product brief with all manufacturing details.\nRespond with ONLY valid JSON, no additional text.`;

      console.log('Basic GENERATING prompt created, length:', systemPrompt.length);
      
    } else {
      console.warn('Unknown phase detected, using overall system prompt');
      systemPrompt = OVERALL_SYSTEM_PROMPT;
    }
    
    // Final validation
    if (!systemPrompt || systemPrompt.trim().length === 0) {
      console.error('CRITICAL ERROR: System prompt is empty after construction!');
      systemPrompt = FALLBACK_SYSTEM_PROMPT;
      console.log('Applied emergency fallback prompt');
    }
    
    console.log('=== SYSTEM PROMPT VALIDATION COMPLETE ===');
    console.log('Final prompt length:', systemPrompt.length);
    console.log('First 200 chars:', systemPrompt.substring(0, 200) + '...');
    
    return systemPrompt;
    
  } catch (error) {
    console.error('CRITICAL ERROR in system prompt construction:', error);
    console.log('Applying emergency fallback due to construction error');
    return FALLBACK_SYSTEM_PROMPT;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== NEW REQUEST RECEIVED ===');
    const { messages, existingBrief, conversationState, userId } = await req.json();

    console.log('Request payload validation:');
    console.log('- Messages count:', messages?.length || 0);
    console.log('- Has existing brief:', !!existingBrief);
    console.log('- Has conversation state:', !!conversationState);
    console.log('- User ID present:', !!userId);

    if (!openAIApiKey) {
      console.error('CRITICAL: OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    // ENHANCED: Analyze conversation state with robust validation
    let state = conversationState || analyzeConversationState(messages, existingBrief);
    
    // Check if we need to transition to GENERATING phase
    if (state.phase === 'QUESTIONING' && state.currentQuestion === 1) {
      const userMessages = messages.filter(m => m.role === 'user');
      if (userMessages.length >= 2) {
        console.log('Detected completed questioning phase, transitioning to GENERATING');
        state = {
          ...state,
          phase: 'GENERATING' as ConversationPhase,
          questionsCompleted: true
        };
      }
    }
    
    console.log('=== FINAL CONVERSATION STATE ===');
    console.log('Phase:', state.phase);
    console.log('Current question:', state.currentQuestion);
    console.log('Questions completed:', state.questionsCompleted);
    console.log('Total user messages:', messages.filter(m => m.role === 'user').length);

    // ENHANCED: Construct system prompt with comprehensive validation
    let systemPrompt = constructSystemPrompt(state, messages, existingBrief);
    
    // GENERATING phase requires special handling for research
    if (state.phase === 'GENERATING') {
      try {
        console.log('GENERATING phase: Building enhanced research prompt');
        const userMessages = messages.filter(m => m.role === 'user');
        const useCase = userMessages[0]?.content || 'general use';
        const referenceBrand = userMessages[1]?.content || 'modern aesthetic';
        const extractedProductName = extractProductNameFromConversation(messages);
        
        const enhancedTemplate = await buildPromptWithResearch(extractedProductName, useCase, referenceBrand, openAIApiKey);
        
        const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n');
        systemPrompt = GENERATING_PROMPT_BASE
          .replace('{{CONVERSATION_HISTORY}}', conversationHistory)
          .replace('{{ENHANCED_TEMPLATE}}', enhancedTemplate);
          
        console.log('Enhanced research prompt built successfully, length:', systemPrompt.length);
      } catch (researchError) {
        console.error('Error building research prompt, using fallback:', researchError);
        // systemPrompt already has the fallback from constructSystemPrompt
      }
    }
    
    // FINAL VALIDATION before sending to OpenAI
    console.log('=== FINAL OPENAI REQUEST VALIDATION ===');
    if (!systemPrompt || systemPrompt.trim().length === 0) {
      console.error('CRITICAL: System prompt is still empty! This is the reported bug!');
      systemPrompt = FALLBACK_SYSTEM_PROMPT;
      console.log('Applied final emergency fallback');
    }
    
    console.log('Final system prompt length:', systemPrompt.length);
    console.log('System prompt preview:', systemPrompt.substring(0, 200) + '...');
    console.log('Making OpenAI request with tools count:', TOOLS.length);

    // Convert messages to proper format
    const userMessages = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    const requestPayload = {
      model: 'gpt-4.1-2025-04-14',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        ...userMessages
      ],
      // Only include tools for non-generating phases to get immediate JSON response
      ...(state.phase !== 'GENERATING' ? { tools: TOOLS, tool_choice: "auto" } : {}),
      temperature: 0.7,
      max_tokens: 2000,
      stream: false,
    };

    console.log('OpenAI request summary:', {
      model: requestPayload.model,
      messageCount: requestPayload.messages.length,
      systemMessageLength: requestPayload.messages[0].content.length,
      hasTools: !!requestPayload.tools,
      toolsCount: requestPayload.tools?.length || 0
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('=== OPENAI API ERROR ===');
      console.error('Status:', response.status);
      console.error('Error text:', errorText);
      console.error('System prompt was:', systemPrompt.substring(0, 500) + '...');
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    console.log('=== OPENAI RESPONSE ANALYSIS ===');
    console.log('Response status:', response.status);
    console.log('Has choices:', !!data.choices);
    console.log('Choices length:', data.choices?.length || 0);
    console.log('First choice role:', data.choices?.[0]?.message?.role);
    console.log('Content length:', data.choices?.[0]?.message?.content?.length || 0);

    // Handle standard Chat Completions API format
    let content = '';
    let generatedImages: string[] = [];

    if (data.choices && data.choices.length > 0) {
      console.log('Processing chat completion response...');
      
      // Extract content from the first choice
      const choice = data.choices[0];
      content = choice.message?.content || '';
      
      console.log('Extracted content length:', content.length);
      console.log('Content preview:', content.substring(0, 300) + '...');
      
      // Check if there are tool calls to execute
      if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
        console.log('Found tool calls:', choice.message.tool_calls.length);
        
        // Execute tool calls
        for (const toolCall of choice.message.tool_calls) {
          console.log('Executing tool call:', toolCall.function.name);
          
          try {
            const toolResult = await executeTool(toolCall.function.name, JSON.parse(toolCall.function.arguments));
            console.log('Tool execution result:', toolResult);
            
            // Handle different tool types
            if (toolCall.function.name === 'generate_product_mockup' && toolResult.success) {
              generatedImages.push(toolResult.image_url);
              console.log('Added generated image to results');
            } else if (toolCall.function.name === 'web_search') {
              console.log('Web search results:', toolResult);
            } else if (toolCall.function.name === 'research_manufacturing_data') {
              console.log('Manufacturing research results:', toolResult);
            }
          } catch (error) {
            console.error('Error executing tool:', toolCall.function.name, error);
          }
        }
      }
      
    } else {
      console.error('Unexpected response format - no choices:', JSON.stringify(data, null, 2));
      throw new Error('No choices received from OpenAI API');
    }

    // Extract product brief if present with improved parsing
    let savedProject = null;
    let finalContent = content;
    console.log('=== PRODUCT BRIEF EXTRACTION ===');
    console.log('Phase:', state.phase);
    console.log('Content length:', content.length);
    console.log('Has userId:', !!userId);
    
    let productBrief = null;
    
    // Try multiple parsing strategies to extract JSON
    if (state.phase === 'GENERATING' && userId) {
      console.log('In GENERATING phase, attempting to extract product brief...');
      
      // Strategy 1: Try to parse entire content as JSON
      try {
        productBrief = JSON.parse(content.trim());
        console.log('Successfully parsed entire content as JSON');
      } catch (e) {
        console.log('Content is not pure JSON, trying other strategies...');
        
        // Strategy 2: Look for JSON in markdown code blocks
        const markdownMatch = content.match(/```json\s*(.*?)\s*```/s);
        if (markdownMatch) {
          try {
            productBrief = JSON.parse(markdownMatch[1]);
            console.log('Successfully parsed JSON from markdown block');
          } catch (e) {
            console.log('Failed to parse JSON from markdown block');
          }
        }
        
        // Strategy 3: Look for JSON object patterns
        if (!productBrief) {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              productBrief = JSON.parse(jsonMatch[0]);
              console.log('Successfully parsed JSON object from content');
            } catch (e) {
              console.log('Failed to parse JSON object from content');
            }
          }
        }
      }
      
      // If we found a product brief, save it
      if (productBrief && typeof productBrief === 'object' && productBrief.product_name) {
        console.log('Successfully extracted product brief:', productBrief.product_name);
        
        // Save or update project with version control
        const parentProjectId = existingBrief?.id || null;
        console.log('Saving with parentProjectId:', parentProjectId);
        savedProject = await saveProjectWithVersion(userId, productBrief, content, parentProjectId);
        
        if (savedProject) {
          console.log(`Project saved with version ${savedProject.version}, ID: ${savedProject.id}`);
          
          // Update content for EDITING phase
          finalContent = `Perfect! I've generated your product brief for "${productBrief.product_name}". You can now review it in the preview panel and tell me what you'd like to edit or improve. What changes would you like to make?`;
          
          // Generate images in background after saving the project
          console.log('Starting background image generation...');
          await generateProductImagesForProject(savedProject, productBrief, openAIApiKey, userId);
        } else {
          console.log('saveProjectWithVersion returned null');
        }
      } else {
        console.log('No valid product brief found in content');
      }
    } else {
      console.log('Not in GENERATING phase or no userId - phase:', state.phase, 'userId:', !!userId);
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

    console.log('=== FINAL RESPONSE SUMMARY ===');
    console.log('Updated phase:', updatedState.phase);
    console.log('Updated currentQuestion:', updatedState.currentQuestion);
    console.log('Has saved project:', !!savedProject);
    console.log('Generated images count:', generatedImages.length);

    // Extract product name for response if we have a saved project
    let responseProductName = '';
    if (savedProject && savedProject.product_name) {
      responseProductName = savedProject.product_name;
    } else if (productBrief && productBrief.product_name) {
      responseProductName = productBrief.product_name;
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
    console.error('=== CRITICAL ERROR IN STREAMING-CHAT ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Timestamp:', new Date().toISOString());
    
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString(),
      debug: 'Check server logs for detailed error information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
