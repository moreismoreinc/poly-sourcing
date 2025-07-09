-- Add new fields to generated_images table for advanced JSON-based image generation
ALTER TABLE public.generated_images 
ADD COLUMN subject_json JSONB,
ADD COLUMN complete_prompt_json JSONB,
ADD COLUMN image_width INTEGER DEFAULT 768,
ADD COLUMN image_height INTEGER DEFAULT 960;