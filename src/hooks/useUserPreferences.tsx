import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [imageGenerationEnabled, setImageGenerationEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('image_generation_enabled')
          .eq('user_id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // No preferences found, create default
          const { error: insertError } = await supabase
            .from('user_preferences')
            .insert({
              user_id: user.id,
              image_generation_enabled: true
            });

          if (insertError) {
            console.error('Error creating user preferences:', insertError);
          }
          
          setImageGenerationEnabled(true);
        } else if (error) {
          console.error('Error fetching user preferences:', error);
        } else {
          setImageGenerationEnabled(data.image_generation_enabled);
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [user]);

  const updateImageGenerationPreference = async (enabled: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          image_generation_enabled: enabled
        });

      if (error) {
        console.error('Error updating user preferences:', error);
      } else {
        setImageGenerationEnabled(enabled);
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  };

  return {
    imageGenerationEnabled,
    updateImageGenerationPreference,
    loading
  };
};