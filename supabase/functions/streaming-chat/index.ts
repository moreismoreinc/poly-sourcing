import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    id: 'product_type',
    text: 'What type of product are you creating? Please describe the category and form factor (e.g., skincare jar, food container, cosmetic bottle, etc.)'
  },
  {
    id: 'target_use',
    text: 'Who is your target customer and how will they use this product? What problem does it solve for them?'
  },
  {
    id: 'price_aesthetic',
    text: 'What\'s your target price point and aesthetic vision? Are you aiming for budget-friendly, mid-range, or premium positioning?'
  },
  {
    id: 'specifications',
    text: 'Any specific materials, certifications, dimensions, or technical requirements? (This can include sustainability goals, regulatory needs, etc.)'
  }
];

const QUESTIONING_PROMPT = `You are a product development expert conducting a structured interview to create a comprehensive product brief. 

CURRENT CONVERSATION STATE: {{STATE}}

Your role:
1. Ask ONE question at a time from the structured interview
2. Wait for complete answers before proceeding
3. Ask natural follow-up questions if answers need clarification
4. Keep responses conversational and encouraging
5. When all 4 questions are answered, transition to brief generation

NEVER generate a product brief until all 4 core questions have been thoroughly answered.

The 4 core questions you must cover:
1. Product type and form factor
2. Target customer and use case  
3. Price point and aesthetic vision
4. Materials and technical specifications

Current question to ask: {{CURRENT_QUESTION}}

If the user has answered the current question, move to the next one. If all questions are complete, announce that you're generating their brief.`;

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, existingBrief, conversationState } = await req.json();

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
      systemPrompt = `You are a product development expert. The user has answered all interview questions. Now generate a comprehensive product brief based on their answers and transition to editing mode.

CONVERSATION HISTORY: ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Generate a complete product brief with realistic specifications and end with JSON wrapped in <BRIEF>...</BRIEF> tags. Then ask what they'd like to edit or improve.

Product brief schema:
{
  "product_name": "string",
  "product_id": "string", 
  "category": "string",
  "positioning": "budget|mid-range|premium",
  "intended_use": "string",
  "form_factor": "string",
  "dimensions": {
    "height_mm": number,
    "diameter_mm": number,
    "width_mm": number,
    "depth_mm": number
  },
  "materials": {
    "jar": "string",
    "cap": "string", 
    "label": "string"
  },
  "finishes": {
    "jar": "string",
    "cap": "string",
    "label": "string"
  },
  "color_scheme": {
    "base": "string",
    "accents": ["string"]
  },
  "target_aesthetic": "string",
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
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) return;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  // Send conversation state with the final message
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    content: '',
                    conversationState: {
                      ...state,
                      phase: state.phase === 'GENERATING' ? 'EDITING' : state.phase,
                      currentQuestion: state.phase === 'QUESTIONING' ? Math.min(state.currentQuestion + 1, QUESTIONS.length - 1) : state.currentQuestion
                    }
                  })}\n\n`));
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  break;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
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