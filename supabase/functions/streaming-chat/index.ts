import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.50.2/+esm';
import { ENHANCED_SYSTEM_PROMPT, TEMPLATES, PRICE_RANGES } from './constants.ts';

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

// Constants imported from local constants.ts file

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
1. Ask the 2 core questions below, one at a time, and ask only those two questions
2. Accept any reasonable answer - don't ask follow-ups
3. Keep responses short and encouraging

The 2 core questions you must cover:
1. Product concept: What they want to make
2. Reference brand/product: What inspires their aesthetic, quality, and or positioning

Current question to ask: {{CURRENT_QUESTION}}

If this is the first question, ask about their product concept.
If this is the second question, ask about their reference brand.

On completion of this phase, you MUST immediately do 2 things in sequence: 
1. Tell the user you will start generating the product brief, specifically "Gotcha, let me generating a product brief to get us started." DO NOT respond with the product brief in the message to the user. 
2. Automatically start the Generating phase.

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
  
  console.log('=== PROMPT BUILDING DEBUG ===');
  console.log('Detected category:', category);
  console.log('Inferred positioning:', positioning);
  console.log('Available templates:', Object.keys(TEMPLATES));
  
  const template = TEMPLATES[category] || TEMPLATES.wellness;
  console.log('Using template for category:', category, 'exists:', !!TEMPLATES[category]);
  
  // Get price range for this category and positioning
  const priceRange = PRICE_RANGES[positioning]?.[category] || PRICE_RANGES[positioning]?.wellness || [25, 50];
  const priceRangeText = `$${priceRange[0]}-${priceRange[1]}`;
  
  console.log('Price range:', priceRangeText);
  
  // Generate product ID
  const productId = productName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  const finalPrompt = template
    .replace(/{product_name}/g, productName)
    .replace(/{product_id}/g, productId)
    .replace(/{use_case}/g, useCase)
    .replace(/{aesthetic}/g, aesthetic)
    .replace(/{positioning}/g, positioning)
    .replace(/{price_range}/g, priceRangeText);
    
  console.log('Final prompt length:', finalPrompt.length);
  console.log('Replacements done - preview:', finalPrompt.substring(0, 200));
  
  return finalPrompt;
}

const GENERATING_PROMPT_BASE = `You are an expert industrial designer and product strategist. CRITICAL INSTRUCTION: You MUST output ONLY a valid JSON object. NO conversation. NO explanations. NO markdown formatting. ONLY JSON.

CONVERSATION HISTORY: {{CONVERSATION_HISTORY}}

Your task is to take the user's input from the conversation history and create a detailed product brief using the enhanced template provided below.

OUTPUT REQUIREMENTS:
- ONLY output valid JSON object
- NO other text before or after the JSON
- NO conversational messages
- NO explanations or confirmations
- NO markdown code blocks or formatting

{{ENHANCED_TEMPLATE}}

GENERATE THE JSON NOW. NOTHING ELSE.`;

const EDITING_PROMPT = `You are a product development expert helping to refine an existing product brief through conversation.

CURRENT BRIEF: {{BRIEF}}

Your role:
1. Help users edit and improve their product brief conversationally
2. Make specific changes based on user requests
3. Ask clarifying questions when changes need more detail
4. Reference specific sections when making edits
5. When providing an updated brief, return ONLY the JSON object without any formatting or tags

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
      
      console.log('=== GENERATING PHASE DEBUG ===');
      console.log('Product name:', extractedProductName);
      console.log('Use case:', useCase);
      console.log('Aesthetic:', aesthetic);
      
      // Build enhanced prompt using category-specific template
      const enhancedTemplate = buildPrompt(extractedProductName, useCase, aesthetic);
      console.log('Enhanced template built, length:', enhancedTemplate.length);
      console.log('First 300 chars of template:', enhancedTemplate.substring(0, 300));
      
      systemPrompt = GENERATING_PROMPT_BASE
        .replace('{{CONVERSATION_HISTORY}}', conversationHistory)
        .replace('{{ENHANCED_TEMPLATE}}', enhancedTemplate);
        
      console.log('Final system prompt length:', systemPrompt.length);
      console.log('Final system prompt preview:', systemPrompt.substring(0, 500));
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
        model: 'gpt-4.1-2025-04-14',
        instructions: systemPrompt,
        input: userMessages.filter(m => m.role === 'user'),
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
    
    console.log('=== OPENAI API RESPONSE DEBUG ===');
    console.log('Response status:', response.status);
    console.log('Response data structure:', JSON.stringify(data, null, 2));
    console.log('Data keys:', Object.keys(data));
    console.log('Has output:', !!data.output);
    console.log('Output length:', data.output?.length || 0);

    // Handle Responses API format correctly
    let content = '';
    let generatedImages: string[] = [];

    if (data.output && data.output.length > 0) {
      console.log('Processing output items...');
      // Extract text content from output messages
      for (const outputItem of data.output) {
        console.log('Output item type:', outputItem.type);
        if (outputItem.type === 'message' && outputItem.content) {
          console.log('Processing message content, parts:', outputItem.content.length);
          for (const contentPart of outputItem.content) {
            console.log('Content part type:', contentPart.type);
            if (contentPart.type === 'output_text') {
              content += contentPart.text;
              console.log('Added text, total length now:', content.length);
            }
          }
        }
      }
    } else {
      console.error('Unexpected response format - full data:', JSON.stringify(data, null, 2));
      throw new Error('No output received from OpenAI API');
    }
    
    console.log('Final extracted content length:', content.length);
    console.log('Final content preview:', content.substring(0, 300));

    // Web search results would be available in tool call outputs if any
    if (data.output) {
      for (const outputItem of data.output) {
        if (outputItem.type === 'tool_call' && outputItem.tool_type === 'web_search') {
          console.log('Web search results:', outputItem.result);
        }
      }
    }

    // Extract product brief if present with improved parsing
    let savedProject = null;
    let finalContent = content;
    console.log('=== DEBUG: Checking for product brief ===');
    console.log('Content length:', content.length);
    console.log('Has userId:', !!userId);
    console.log('Content preview:', content.substring(0, 200));
    
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

    console.log('=== UPDATED STATE ===');
    console.log('Updated phase:', updatedState.phase);
    console.log('Updated currentQuestion:', updatedState.currentQuestion);

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
