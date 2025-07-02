import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a product development expert helping users create and edit product briefs. You should:

1. Maintain conversational flow while gathering/updating product information
2. Ask relevant follow-up questions based on context
3. When editing existing briefs, reference specific sections clearly
4. Always return valid JSON for the product brief at the end of your response

Current product brief schema:
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
}

Always end your response with a JSON object wrapped in <BRIEF>...</BRIEF> tags containing the current state of the product brief.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, existingBrief } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Prepare messages with system prompt and existing brief context
    const systemMessage = {
      role: 'system',
      content: existingBrief 
        ? `${SYSTEM_PROMPT}\n\nCurrent brief state: ${JSON.stringify(existingBrief)}`
        : SYSTEM_PROMPT
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