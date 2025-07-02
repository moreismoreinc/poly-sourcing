-- Add column to store raw OpenAI output from prompt generation
ALTER TABLE public.projects 
ADD COLUMN raw_ai_output TEXT;