// Tools configuration for OpenAI Responses API
export const TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current market data, competitor analysis, product research, and manufacturing information",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query for market research or product information"
          },
          focus: {
            type: "string",
            enum: ["market_research", "competitor_analysis", "manufacturing", "pricing", "materials", "regulations"],
            description: "Focus area for the search"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_product_mockup",
      description: "Generate AI-powered product mockups and visual references using DALL-E",
      parameters: {
        type: "object",
        properties: {
          product_name: {
            type: "string",
            description: "Name of the product to generate mockup for"
          },
          product_description: {
            type: "string",
            description: "Detailed description of the product including materials, colors, and form factor"
          },
          mockup_type: {
            type: "string",
            enum: ["product_photography", "technical_drawing", "lifestyle_context", "packaging_design"],
            description: "Type of mockup to generate"
          },
          aesthetic_style: {
            type: "string",
            description: "Aesthetic style description (e.g., 'modern minimalist', 'luxury premium', 'natural organic')"
          },
          background_style: {
            type: "string",
            enum: ["white_background", "lifestyle_context", "technical_drawing", "packaging_context"],
            description: "Background style for the mockup"
          }
        },
        required: ["product_name", "product_description", "mockup_type"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "research_manufacturing_data",
      description: "Look up manufacturing processes, material costs, and production feasibility for products",
      parameters: {
        type: "object",
        properties: {
          product_category: {
            type: "string",
            description: "Category of product (e.g., supplement, skincare, food, wearable)"
          },
          materials: {
            type: "array",
            items: {
              type: "string"
            },
            description: "List of materials to research"
          },
          production_volume: {
            type: "string",
            enum: ["small_batch", "medium_scale", "large_scale"],
            description: "Expected production volume"
          },
          research_focus: {
            type: "string",
            enum: ["cost_analysis", "feasibility", "suppliers", "regulations", "certifications"],
            description: "Focus of the research"
          }
        },
        required: ["product_category", "research_focus"]
      }
    }
  }
];

// Tool execution functions
export async function executeWebSearch(query: string, focus?: string): Promise<any> {
  console.log(`Executing web search: ${query} (focus: ${focus})`);
  
  // This would integrate with a real search API
  // For now, return mock data that would be useful for product development
  return {
    query,
    focus,
    results: [
      {
        title: "Market Research Results",
        snippet: "Relevant market data and competitor analysis",
        url: "https://example.com/market-research"
      }
    ],
    summary: "Mock search results for product development research"
  };
}

export async function executeProductMockup(
  productName: string,
  productDescription: string,
  mockupType: string,
  aestheticStyle?: string,
  backgroundStyle?: string,
  projectId?: string,
  userId?: string
): Promise<any> {
  console.log(`Generating mockup for: ${productName} (type: ${mockupType})`);
  
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Build detailed prompt for image generation
  let prompt = "";
  
  switch (mockupType) {
    case "product_photography":
      prompt = `Professional product photography of ${productName}. ${productDescription}. ${aestheticStyle || 'Modern and clean'} aesthetic. High quality, studio lighting, commercial product shot style.`;
      break;
    case "technical_drawing":
      prompt = `Technical drawing illustration of ${productName}. ${productDescription}. Clean line art style, engineering blueprint aesthetic, white background, precise details.`;
      break;
    case "lifestyle_context":
      prompt = `${productName} in real-world use context. ${productDescription}. ${aestheticStyle || 'Natural and approachable'} lifestyle photography, person using the product naturally.`;
      break;
    case "packaging_design":
      prompt = `Product packaging design for ${productName}. ${productDescription}. ${aestheticStyle || 'Modern and premium'} packaging aesthetic, retail-ready presentation.`;
      break;
    default:
      prompt = `Professional product mockup of ${productName}. ${productDescription}. ${aestheticStyle || 'Modern and clean'} aesthetic.`;
  }

  // Add background style specification
  if (backgroundStyle === "white_background") {
    prompt += " Pure white background, studio lighting.";
  } else if (backgroundStyle === "technical_drawing") {
    prompt += " Technical drawing style, blueprint aesthetic.";
  } else if (backgroundStyle === "lifestyle_context") {
    prompt += " Natural environment, lifestyle context.";
  } else if (backgroundStyle === "packaging_context") {
    prompt += " Retail packaging environment.";
  }

  // Add quality and resolution specifications
  prompt += " Ultra high resolution, professional quality, detailed and realistic.";

  console.log(`Generated image prompt: ${prompt}`);

  try {
    // Generate image with DALL-E
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        response_format: 'url'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Image API Error:', errorText);
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.data[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    console.log(`Generated image URL: ${imageUrl}`);

    // Download and save image to Supabase Storage
    try {
      if (supabaseUrl && supabaseServiceKey) {
        // Import Supabase client
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.50.2/+esm');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Download image from OpenAI
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`);
        }

        const imageBlob = await imageResponse.blob();
        const imageBuffer = await imageBlob.arrayBuffer();

        // Generate filename
        const timestamp = Date.now();
        const filename = `${productName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${mockupType}-${timestamp}.png`;
        const filePath = `generated/${filename}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageBuffer, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) {
          console.error('Supabase upload error:', uploadError);
          // Return temporary URL as fallback
          return {
            image_url: imageUrl,
            prompt: prompt,
            mockup_type: mockupType,
            product_name: productName,
            success: true,
            temporary: true
          };
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        const permanentUrl = publicUrlData.publicUrl;
        console.log(`Image saved to Supabase Storage: ${permanentUrl}`);

        // Save metadata to generated_images table if projectId and userId are provided
        if (projectId && userId) {
          try {
            const { data: imageData, error: dbError } = await supabase
              .from('generated_images')
              .insert({
                project_id: projectId,
                user_id: userId,
                image_type: 'product_mockup',
                mockup_type: mockupType,
                aesthetic_style: aestheticStyle || 'modern',
                background_style: backgroundStyle || 'white_background',
                prompt: prompt,
                public_url: permanentUrl,
                file_path: filePath,
                filename: filename
              })
              .select()
              .single();

            if (dbError) {
              console.error('Error saving image metadata to database:', dbError);
            } else {
              console.log('Image metadata saved to database:', imageData?.id);
            }
          } catch (dbError) {
            console.error('Error inserting image metadata:', dbError);
          }
        }

        return {
          image_url: permanentUrl,
          prompt: prompt,
          mockup_type: mockupType,
          product_name: productName,
          success: true,
          temporary: false,
          storage_path: filePath
        };

      } else {
        console.log('Supabase not configured, returning temporary URL');
        return {
          image_url: imageUrl,
          prompt: prompt,
          mockup_type: mockupType,
          product_name: productName,
          success: true,
          temporary: true
        };
      }
    } catch (storageError) {
      console.error('Error saving to storage:', storageError);
      // Return temporary URL as fallback
      return {
        image_url: imageUrl,
        prompt: prompt,
        mockup_type: mockupType,
        product_name: productName,
        success: true,
        temporary: true
      };
    }

  } catch (error) {
    console.error('Error generating product mockup:', error);
    return {
      error: error.message,
      success: false
    };
  }
}

export async function executeManufacturingResearch(
  productCategory: string,
  materials?: string[],
  productionVolume?: string,
  researchFocus?: string
): Promise<any> {
  console.log(`Researching manufacturing data for: ${productCategory} (focus: ${researchFocus})`);
  
  // This would integrate with manufacturing databases and cost APIs
  // For now, return mock data
  return {
    product_category: productCategory,
    materials: materials || [],
    production_volume: productionVolume,
    research_focus: researchFocus,
    findings: {
      cost_estimate: "Mock cost analysis data",
      feasibility: "High feasibility for standard manufacturing",
      suppliers: ["Mock Supplier A", "Mock Supplier B"],
      certifications: ["FDA", "ISO", "GMP"]
    }
  };
}

// Tool dispatcher function
export async function executeTool(toolName: string, parameters: any): Promise<any> {
  console.log(`Executing tool: ${toolName} with parameters:`, parameters);
  
  switch (toolName) {
    case "web_search":
      return await executeWebSearch(parameters.query, parameters.focus);
    
    case "generate_product_mockup":
      return await executeProductMockup(
        parameters.product_name,
        parameters.product_description,
        parameters.mockup_type,
        parameters.aesthetic_style,
        parameters.background_style,
        parameters.project_id,
        parameters.user_id
      );
    
    case "research_manufacturing_data":
      return await executeManufacturingResearch(
        parameters.product_category,
        parameters.materials,
        parameters.production_volume,
        parameters.research_focus
      );
    
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}