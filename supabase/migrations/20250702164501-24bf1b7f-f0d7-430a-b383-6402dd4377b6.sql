-- Add column to store OpenAI request details
ALTER TABLE public.projects 
ADD COLUMN openai_request_details jsonb;