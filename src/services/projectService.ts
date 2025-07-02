
import { supabase } from '@/integrations/supabase/client';
import { ProductBrief } from '@/types/ProductBrief';

export const saveProject = async (productBrief: ProductBrief, rawAiOutput?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to save projects');
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      product_name: productBrief.product_name,
      product_brief: JSON.parse(JSON.stringify(productBrief)),
      raw_ai_output: rawAiOutput
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving project:', error);
    throw error;
  }

  return data;
};

export const updateProject = async (projectId: string, productBrief: ProductBrief) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to update projects');
  }

  const { data, error } = await supabase
    .from('projects')
    .update({
      product_name: productBrief.product_name,
      product_brief: JSON.parse(JSON.stringify(productBrief)),
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }

  return data;
};
