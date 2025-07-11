import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
// Removed ProductBrief import - using dynamic JSON data

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type ConversationPhase = 'QUESTIONING' | 'GENERATING' | 'EDITING';

interface ConversationState {
  phase: ConversationPhase;
  currentQuestion: number;
  answers: Record<string, string>;
  questionsCompleted: boolean;
}

interface UseStreamingChatProps {
  onBriefUpdate?: (brief: Record<string, any> | null, productName?: string, projectId?: string, generatedImages?: string[]) => void;
  existingBrief?: Record<string, any> | null;
  onConversationStart?: () => void;
  projectId?: string | null;
  imageGenerationEnabled?: boolean;
}

export const useStreamingChat = ({ onBriefUpdate, existingBrief, onConversationStart, projectId, imageGenerationEnabled = true }: UseStreamingChatProps = {}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [conversationStarted, setConversationStarted] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>({
    phase: existingBrief ? 'EDITING' : 'QUESTIONING',
    currentQuestion: 0,
    answers: {},
    questionsCompleted: !!existingBrief
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const extractBriefFromResponse = useCallback((text: string): Record<string, any> | null => {
    const briefMatch = text.match(/<BRIEF>(.*?)<\/BRIEF>/s);
    if (briefMatch) {
      try {
        return JSON.parse(briefMatch[1]);
      } catch (error) {
        console.error('Error parsing brief JSON:', error);
      }
    }
    return null;
  }, []);

  // Load messages from database for a given project
  const loadMessagesFromDB = useCallback(async (currentProjectId: string) => {
    try {
      console.log('Loading messages for project:', currentProjectId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found, cannot load messages');
        return;
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('project_id', currentProjectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      console.log('Loaded messages from DB:', data);
      if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at)
        }));
        console.log('Setting loaded messages:', loadedMessages);
        setMessages(loadedMessages);
        setConversationStarted(true);
      } else {
        console.log('No messages found for project');
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  }, []);

  // Save message to database
  const saveMessageToDB = useCallback(async (message: Message, currentProjectId?: string) => {
    if (!currentProjectId) {
      console.log('No project ID provided, cannot save message:', message.content.substring(0, 50));
      return;
    }
    
    try {
      console.log('Saving message to DB:', {
        projectId: currentProjectId,
        role: message.role,
        content: message.content.substring(0, 100) + '...'
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found, cannot save message');
        return;
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          project_id: currentProjectId,
          user_id: user.id,
          role: message.role,
          content: message.content
        })
        .select();

      if (error) {
        console.error('Error saving message:', error);
      } else {
        console.log('Message saved successfully:', data);
      }
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  }, []);

  // Load messages when projectId changes
  useEffect(() => {
    if (projectId) {
      loadMessagesFromDB(projectId);
    } else {
      // Clear messages when no project is selected
      setMessages([]);
      setConversationStarted(false);
    }
  }, [projectId, loadMessagesFromDB]);

  const sendMessage = useCallback(async (content: string, isInitial = false) => {
    if (isLoading) return;

    let currentProjectId = projectId;

    // Create project immediately on first message for new conversations
    if (!conversationStarted) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: newProject, error } = await supabase
            .from('projects')
            .insert({
              user_id: user.id,
              product_name: 'New Project', // Temporary name
              product_brief: { status: 'draft' }, // Minimal brief
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating project:', error);
            return; // Don't proceed if project creation fails
          } else if (newProject) {
            currentProjectId = newProject.id;
            console.log('Created new project with ID:', currentProjectId);
            // Notify parent component of new project ID immediately
            onBriefUpdate?.(null, 'New Project', newProject.id);
          }
        }
      } catch (error) {
        console.error('Error creating initial project:', error);
        return; // Don't proceed if project creation fails
      }
    }

    // Mark conversation as started
    if (!conversationStarted) {
      setConversationStarted(true);
      onConversationStart?.();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setCurrentResponse('');

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      // Use Supabase client to invoke the edge function
      // Get current user for project saving
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('streaming-chat', {
        body: {
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          existingBrief,
          conversationState,
          userId: user?.id || null,
          imageGenerationEnabled,
          projectId: currentProjectId // Pass the current project ID
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Since we can't stream with supabase.functions.invoke, we'll get the complete response
      if (data) {
        let accumulatedResponse = data.content || '';
        setCurrentResponse(accumulatedResponse);

        // Complete the response
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: accumulatedResponse,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        setCurrentResponse('');

        // Save both user and assistant messages to database
        if (data.savedProject?.id || currentProjectId) {
          const saveProjectId = data.savedProject?.id || currentProjectId;
          console.log('Saving messages with project ID:', saveProjectId);
          await saveMessageToDB(userMessage, saveProjectId);
          await saveMessageToDB(assistantMessage, saveProjectId);
        } else {
          console.error('No project ID available for saving messages');
        }

        // Use saved project data if available, otherwise extract from response
        if (data.savedProject && onBriefUpdate) {
          onBriefUpdate(data.savedProject.product_brief, data.savedProject.product_name, data.savedProject.id, data.generatedImages);
        } else {
          // Fallback to extracting from response text
          const extractedBrief = extractBriefFromResponse(accumulatedResponse);
          if (extractedBrief && onBriefUpdate) {
            onBriefUpdate(extractedBrief, data.productName, data.savedProject?.id, data.generatedImages);
          }
        }

        // Update conversation state
        if (data.conversationState) {
          setConversationState(data.conversationState);
        }

      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sending message:', error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, isLoading, existingBrief, onBriefUpdate, extractBriefFromResponse, conversationStarted, onConversationStart, projectId]);

  const resetChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setConversationStarted(false);
    setIsLoading(false);
    setConversationState({
      phase: existingBrief ? 'EDITING' : 'QUESTIONING',
      currentQuestion: 0,
      answers: {},
      questionsCompleted: !!existingBrief
    });
  }, [existingBrief]);

  return {
    messages,
    currentResponse,
    isLoading,
    conversationStarted,
    conversationState,
    sendMessage,
    resetChat,
  };
};