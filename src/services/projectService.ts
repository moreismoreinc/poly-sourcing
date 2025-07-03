
import { supabase } from '@/integrations/supabase/client';
import { ProductBrief } from '@/types/ProductBrief';

export interface Project {
  id: string;
  user_id: string;
  product_name: string;
  product_brief: ProductBrief;
  raw_ai_output?: string;
  openai_request_details?: any;
  created_at: string;
  updated_at: string;
  version?: number;
  parent_project_id?: string;
}

export const saveProject = async (productBrief: ProductBrief, rawAiOutput?: string, openaiRequestDetails?: any): Promise<Project> => {
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

  return {
    ...data,
    product_brief: data.product_brief as unknown as ProductBrief
  };
};

export const updateProject = async (projectId: string, productBrief: ProductBrief): Promise<Project> => {
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

  return {
    ...data,
    product_brief: data.product_brief as unknown as ProductBrief
  };
};

export const getUserProjects = async (): Promise<Project[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }

    return (data || []).map(project => ({
      ...project,
      product_brief: project.product_brief as unknown as ProductBrief
    }));
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

export const getProjectById = async (id: string): Promise<Project | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching project:', error);
      return null;
    }

    return {
      ...data,
      product_brief: data.product_brief as unknown as ProductBrief
    };
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
};
