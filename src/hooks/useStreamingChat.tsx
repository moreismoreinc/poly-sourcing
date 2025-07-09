import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
// Removed ProductBrief import - using dynamic JSON data

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: string[];
}

type ConversationPhase = 'QUESTIONING' | 'GENERATING' | 'EDITING';

interface ConversationState {
  phase: ConversationPhase;
  currentQuestion: number;
  answers: Record<string, string>;
  questionsCompleted: boolean;
}

interface UseStreamingChatProps {
  onBriefUpdate?: (brief: Record<string, any> | null, productName?: string, projectId?: string) => void;
  existingBrief?: Record<string, any> | null;
  onConversationStart?: () => void;
}

export const useStreamingChat = ({ onBriefUpdate, existingBrief, onConversationStart }: UseStreamingChatProps = {}) => {
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

  const sendMessage = useCallback(async (content: string, isInitial = false) => {
    if (isLoading) return;

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
          userId: user?.id || null
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
          timestamp: new Date(),
          images: data.generatedImages || []
        };

        setMessages(prev => [...prev, assistantMessage]);
        setCurrentResponse('');

        // Use saved project data if available, otherwise extract from response
        if (data.savedProject && onBriefUpdate) {
          onBriefUpdate(data.savedProject.product_brief, data.savedProject.product_name, data.savedProject.id);
        } else {
          // Fallback to extracting from response text
          const extractedBrief = extractBriefFromResponse(accumulatedResponse);
          if (extractedBrief && onBriefUpdate) {
            onBriefUpdate(extractedBrief, data.productName, data.savedProject?.id);
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
  }, [messages, isLoading, existingBrief, onBriefUpdate, extractBriefFromResponse, conversationStarted, onConversationStart]);

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