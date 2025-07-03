
import { supabase } from '@/integrations/supabase/client';
import { ProductBrief } from '@/types/ProductBrief';

export const saveProject = async (productBrief: ProductBrief, rawAiOutput?: string, openaiRequestDetails?: any) => {
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
      raw_ai_output: rawAiOutput,
      openai_request_details: openaiRequestDetails
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

export const getMostRecentProject = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching most recent project:', error);
    return null;
  }

  return data;
};

export const getProjectById = async (projectId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching project by ID:', error);
    return null;
  }

  return data;
};
