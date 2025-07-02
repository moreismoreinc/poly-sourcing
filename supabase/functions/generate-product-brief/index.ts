import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ENHANCED_SYSTEM_PROMPT } from './constants.ts';
import { detectCategory, inferPositioning, buildPrompt } from './utils.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product_name, use_case, aesthetic } = await req.json();

    // Input validation
    if (!product_name || !use_case || !aesthetic) {
      throw new Error('Missing required fields: product_name, use_case, aesthetic');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build the enhanced prompt
    const prompt = buildPrompt(product_name, use_case, aesthetic);
    const category = detectCategory(product_name, use_case);
    const positioning = inferPositioning(aesthetic);

    console.log(`Generating ${category} product (${positioning}) for: ${product_name}`);
    console.log('Enhanced prompt:', prompt);

    const requestBody = {
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: ENHANCED_SYSTEM_PROMPT
        },
        { 
          role: 'user', 
          content: prompt 
        }
      ],
      temperature: 0.8,
      max_tokens: 1200,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    console.log('Raw OpenAI response:', generatedText);

    // Enhanced JSON parsing
    let productBrief;
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        productBrief = JSON.parse(jsonMatch[0]);
        
        // Add generation metadata
        productBrief.generation_metadata = {
          detected_category: category,
          inferred_positioning: positioning,
          template_used: category,
          generation_timestamp: new Date().toISOString()
        };
        
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response for debugging:', generatedText);
      throw new Error('Failed to parse product brief JSON');
    }

    // Enhanced response with metadata
    return new Response(JSON.stringify({ 
      success: true,
      productBrief,
      rawAiOutput: generatedText,
      openaiRequestDetails: {
        request_body: requestBody,
        timestamp: new Date().toISOString()
      },
      template_info: {
        built_prompt: prompt,
        category_detected: category,
        positioning_inferred: positioning,
        template_used: category
      },
      metadata: {
        category_detected: category,
        positioning_inferred: positioning,
        template_efficiency: "75% token reduction vs full schema"
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-product-brief function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
