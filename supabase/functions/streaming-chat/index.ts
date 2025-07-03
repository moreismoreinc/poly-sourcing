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

const GENERATING_PROMPT = `CRITICAL INSTRUCTION: You MUST generate a product brief JSON immediately based on the conversation history.

CONVERSATION HISTORY: {{CONVERSATION_HISTORY}}

Do the following in order:
1. Generate a comprehensive product brief JSON wrapped in <BRIEF>...</BRIEF> tags
2. After the brief, add a short message saying "I've created your product brief based on our conversation!"
3. Then add: "Let me know if you'd like to make any edits or changes to any part of it."

Example format for the brief:
<BRIEF>
{
  "product_name": "Clarity Mind Gummies",
  "product_id": "clarity-mind-gummies",
  "category": "supplement",
  "positioning": "premium",
  "intended_use": "Daily cognitive enhancement and mental clarity support",
  "form_factor": "Chewable gummy supplement",
  "target_aesthetic": "Clean, modern, sophisticated wellness brand",
  "dimensions": {
    "height_mm": 85,
    "diameter_mm": 65,
    "width_mm": 65,
    "depth_mm": 65
  },
  "materials": {
    "primary": "Food-grade HDPE plastic",
    "secondary": "Tamper-evident aluminum seal",
    "tertiary": "Premium matte paper label"
  },
  "finishes": {
    "primary": "Matte black container",
    "secondary": "Glossy aluminum foil seal",
    "tertiary": "Soft-touch label with UV spot coating"
  },
  "color_scheme": {
    "base": "#1a1a1a",
    "accents": ["#ffffff", "#f8f9fa"]
  },
  "natural_imperfections": null,
  "target_price_usd": 45,
  "certifications": ["FDA Facility", "cGMP", "Third-party tested"],
  "variants": ["30-count", "60-count"],
  "notes": "Premium positioning with clean, minimalist design targeting health-conscious professionals"
}
</BRIEF>

Generate the brief now, then confirm it's created and ask about edits.`;

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
      systemPrompt = OVERALL_SYSTEM_PROMPT + '\n' + GENERATING_PROMPT
        .replace('{{CONVERSATION_HISTORY}}', conversationHistory);
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

    // Extract product brief if present
    let savedProject = null;
    console.log('=== DEBUG: Checking for product brief ===');
    console.log('Content length:', content.length);
    console.log('Has userId:', !!userId);
    console.log('Content preview:', content.substring(0, 200));
    console.log('Looking for <BRIEF> tags...');
    
    const briefMatch = content.match(/<BRIEF>(.*?)<\/BRIEF>/s);
    console.log('Brief match found:', !!briefMatch);
    
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
    const updatedState = {
      ...state,
      phase: state.phase === 'GENERATING' ? 'EDITING' : state.phase,
      currentQuestion: state.currentQuestion
    };

    console.log('=== UPDATED STATE ===');
    console.log('Updated phase:', updatedState.phase);
    console.log('Updated currentQuestion:', updatedState.currentQuestion);

    return new Response(JSON.stringify({ 
      content,
      conversationState: updatedState,
      savedProject: savedProject,
      generatedImages: generatedImages
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
