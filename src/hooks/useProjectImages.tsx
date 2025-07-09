import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseProjectImagesProps {
  projectId: string | null;
  enabled?: boolean;
}

export const useProjectImages = ({ projectId, enabled = true }: UseProjectImagesProps) => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId || !enabled) {
      setImages([]);
      return;
    }

    let intervalId: NodeJS.Timeout;
    
    const fetchImages = async () => {
      try {
        setLoading(true);
        
        // Fetch images from generated_images table
        const { data: generatedImages, error } = await supabase
          .from('generated_images')
          .select('public_url, created_at')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching generated images:', error);
          return;
        }

        const imageUrls = generatedImages?.map(img => img.public_url) || [];
        setImages(imageUrls);
        
        // If we have images, stop polling
        if (imageUrls.length > 0) {
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Error in fetchImages:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchImages();

    // Poll for images every 3 seconds if we don't have any yet
    if (images.length === 0) {
      intervalId = setInterval(fetchImages, 3000);
    }

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [projectId, enabled, images.length]);

  return { images, loading };
};