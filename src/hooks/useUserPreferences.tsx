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
        console.log('Fetching preferences for user:', user.id);
        const { data, error } = await supabase
          .from('user_preferences')
          .select('image_generation_enabled')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user preferences:', error);
        } else if (!data) {
          // No preferences found, create default
          console.log('No preferences found, creating default...');
          const { error: insertError } = await supabase
            .from('user_preferences')
            .insert({
              user_id: user.id,
              image_generation_enabled: true
            });

          if (insertError) {
            console.error('Error creating user preferences:', insertError);
          } else {
            console.log('Default preferences created successfully');
          }
          
          setImageGenerationEnabled(true);
        } else {
          console.log('Found existing preferences:', data);
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
    console.log('Updating image generation preference to:', enabled);
    if (!user) {
      console.log('No user found, cannot update preferences');
      return;
    }

    // Optimistically update the UI
    setImageGenerationEnabled(enabled);

    try {
      // First, try to update existing record
      const { data: updateData, error: updateError } = await supabase
        .from('user_preferences')
        .update({ image_generation_enabled: enabled })
        .eq('user_id', user.id)
        .select();

      if (updateError) {
        console.log('Update failed, trying insert:', updateError);
        // If update fails (no record exists), try insert
        const { data: insertData, error: insertError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            image_generation_enabled: enabled
          })
          .select();

        if (insertError) {
          console.error('Error inserting user preferences:', insertError);
          // Revert the optimistic update
          setImageGenerationEnabled(!enabled);
        } else {
          console.log('Successfully inserted preferences:', insertData);
        }
      } else {
        console.log('Successfully updated preferences:', updateData);
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
      // Revert the optimistic update
      setImageGenerationEnabled(!enabled);
    }
  };

  return {
    imageGenerationEnabled,
    updateImageGenerationPreference,
    loading
  };
};