import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

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

const QUESTIONING_PROMPT = `You are a product development expert conducting a streamlined interview to create a comprehensive product brief. 

CURRENT CONVERSATION STATE: {{STATE}}

Your role:
1. Ask ONE question at a time from the structured interview
2. Wait for complete answers before proceeding
3. Ask natural follow-up questions if answers need clarification
4. Keep responses short, conversational and encouraging
5. When both core questions are answered, transition to brief generation

NEVER generate a product brief until both core questions have been thoroughly answered.

The 2 core questions you must cover:
1. Product concept: What they want to make, target audience, and problem it solves
2. Reference brand/product: What inspires their aesthetic, quality, or positioning

Current question to ask: {{CURRENT_QUESTION}}

If the user has answered the current question, move to the next one. If both questions are complete, announce that you're generating their brief.`;

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
  if (existingBrief) {
    return {
      phase: 'EDITING',
      currentQuestion: 0,
      answers: {},
      questionsCompleted: true
    };
  }

  if (messages.length === 0) {
    return {
      phase: 'QUESTIONING',
      currentQuestion: 0,
      answers: {},
      questionsCompleted: false
    };
  }

  const answers: Record<string, string> = {};
  let currentQuestion = 0;
  
  // Count user messages to determine progress
  const userMessages = messages.filter(m => m.role === 'user');
  currentQuestion = Math.min(userMessages.length - 1, QUESTIONS.length - 1);
  
  const questionsCompleted = userMessages.length > QUESTIONS.length;
  
  return {
    phase: questionsCompleted ? 'GENERATING' : 'QUESTIONING',
    currentQuestion: Math.max(0, currentQuestion),
    answers,
    questionsCompleted
  };
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

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
        product_name: productBrief.product_name,
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
    
    let systemPrompt = '';
    
    if (state.phase === 'EDITING' && existingBrief) {
      systemPrompt = EDITING_PROMPT.replace('{{BRIEF}}', JSON.stringify(existingBrief, null, 2));
    } else if (state.phase === 'QUESTIONING') {
      const currentQ = QUESTIONS[state.currentQuestion];
      systemPrompt = QUESTIONING_PROMPT
        .replace('{{STATE}}', JSON.stringify(state, null, 2))
        .replace('{{CURRENT_QUESTION}}', currentQ ? currentQ.text : 'All questions completed');
    } else if (state.phase === 'GENERATING') {
      systemPrompt = `You are a product development expert with 15+ years of experience. Based on the conversation about their product concept and reference inspirations, generate a comprehensive and detailed product brief.

CONVERSATION HISTORY: ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Using the product concept and reference brand/product mentioned, create a complete product brief with realistic specifications. Analyze the reference to infer quality level, market positioning, aesthetic style, and pricing tier. End with JSON wrapped in <BRIEF>...</BRIEF> tags, then ask what they'd like to edit or improve.

RULES:
1. Use only manufacturable materials with reliable supply chains
2. Realistic dimensions for use case and market positioning  
3. Price according to positioning tier and material costs
4. Include only relevant certifications for the product category
5. Ensure material and finish compatibility

Product brief schema (adapt based on product type):
{
  "product_name": "string",
  "product_id": "string", 
  "category": "supplement|skincare|food|wearable|wellness|beauty|clothing|tools|other",
  "positioning": "budget|mid-range|premium",
  "intended_use": "string",
  "form_factor": "string",
  "target_aesthetic": "string",
  "dimensions": {
    "height_mm": number,
    "diameter_mm": number,
    "width_mm": number,
    "depth_mm": number
  },
  "materials": {
    "primary": "string",
    "secondary": "string", 
    "tertiary": "string"
  },
  "finishes": {
    "primary": "string",
    "secondary": "string",
    "tertiary": "string"
  },
  "color_scheme": {
    "base": "string",
    "accents": ["string"]
  },
  "natural_imperfections": null,
  "target_price_usd": number,
  "certifications": ["string"],
  "variants": ["string"],
  "notes": "string"
}`;
    }

    const systemMessage = {
      role: 'system',
      content: systemPrompt
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 1500,
        stream: false, // Changed to false for simpler response
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Extract product brief if present
    let savedProject = null;
    const briefMatch = content.match(/<BRIEF>(.*?)<\/BRIEF>/s);
    if (briefMatch && userId) {
      try {
        const productBrief = JSON.parse(briefMatch[1]);
        
        // Save or update project with version control
        const parentProjectId = existingBrief ? existingBrief.project_id : null;
        savedProject = await saveProjectWithVersion(userId, productBrief, content, parentProjectId);
        
        if (savedProject) {
          console.log(`Project saved with version ${savedProject.version}`);
        }
      } catch (error) {
        console.error('Error processing product brief:', error);
      }
    }

    // Update conversation state
    const updatedState = {
      ...state,
      phase: state.phase === 'GENERATING' ? 'EDITING' : state.phase,
      currentQuestion: state.phase === 'QUESTIONING' ? Math.min(state.currentQuestion + 1, QUESTIONS.length - 1) : state.currentQuestion
    };

    return new Response(JSON.stringify({ 
      content,
      conversationState: updatedState,
      savedProject: savedProject
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
