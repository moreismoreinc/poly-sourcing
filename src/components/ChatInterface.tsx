import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, User, Bot, LogIn, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { ProductInput, ProductBrief } from '@/types/ProductBrief';
import { generateProductBrief } from '@/services/productBriefService';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onBriefGenerated: (brief: ProductBrief, rawAiOutput?: string, openaiRequestDetails?: any) => void;
  requireAuth?: boolean;
  onAuthRequired?: () => void;
}

// Enhanced ProductInput with more fields
interface EnhancedProductInput {
  product_name: string;
  use_case: string;
  requirements: string;
  aesthetic: string;
}

// Conversation flow states
enum ConversationStep {
  GREETING = 'greeting',
  PRODUCT_NAME = 'product_name',
  USE_CASE = 'use_case', 
  REQUIREMENTS = 'requirements',
  AESTHETICS = 'aesthetics',
  GENERATING = 'generating',
  COMPLETE = 'complete'
}

const ChatInterface = ({ onBriefGenerated, requireAuth = false, onAuthRequired }: ChatInterfaceProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<ConversationStep>(ConversationStep.GREETING);
  const [collectedData, setCollectedData] = useState<Partial<EnhancedProductInput>>({});

  // Initialize conversation
  useEffect(() => {
    if (messages.length === 0) {
      startConversation();
    }
  }, []);

  const startConversation = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'assistant',
      content: "🧃 What product do you want to make?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    setCurrentStep(ConversationStep.PRODUCT_NAME);
  };

  const getNextQuestion = (step: ConversationStep): string => {
    switch (step) {
      case ConversationStep.USE_CASE:
        return `Great! Who will use it and how will it be used?`;
      
      case ConversationStep.REQUIREMENTS:
        return `Any specific requirements the product needs to fit?`;
      
      case ConversationStep.AESTHETICS:
        return `OK! Finally, what's the your design inspo? BRands, aesthetics, packaging styles...`;
      
      default:
        return '';
    }
  };

  const handleUserResponse = async (response: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: response,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Store the response based on current step
    let updatedData = { ...collectedData };
    let nextStep = currentStep;

    switch (currentStep) {
      case ConversationStep.PRODUCT_NAME:
        updatedData.product_name = response;
        nextStep = ConversationStep.USE_CASE;
        break;
      
      case ConversationStep.USE_CASE:
        updatedData.use_case = response;
        nextStep = ConversationStep.REQUIREMENTS;
        break;
      
      case ConversationStep.REQUIREMENTS:
        updatedData.requirements = response;
        nextStep = ConversationStep.AESTHETICS;
        break;
      
      case ConversationStep.AESTHETICS:
        updatedData.aesthetic = response;
        nextStep = ConversationStep.GENERATING;
        break;
    }

    setCollectedData(updatedData);

    if (nextStep === ConversationStep.GENERATING) {
      // Show final cooking message before generating
      setTimeout(() => {
        const cookingMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `🔥 Hold on, we're cooking!`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, cookingMessage]);
      }, 500);

      // All data collected, generate the brief
      setTimeout(() => {
        generateBrief(updatedData as EnhancedProductInput);
      }, 1000);
    } else {
      // Ask next question
      setTimeout(() => {
        const nextQuestion = getNextQuestion(nextStep);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: nextQuestion,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setCurrentStep(nextStep);
      }, 500);
    }
  };

  const generateBrief = async (data: EnhancedProductInput) => {
    // Check authentication
    if (!user) {
      const authPromptMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Perfect! I have all the information I need. To generate and save your product brief, please sign in first.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, authPromptMessage]);
      onAuthRequired?.();
      return;
    }

    setIsLoading(true);
    setCurrentStep(ConversationStep.GENERATING);

    try {
      // Transform enhanced input to match your existing API
      const productInput: ProductInput = {
        product_name: data.product_name,
        use_case: data.use_case,
        aesthetic: data.aesthetic,
        requirements: data.requirements
      } as any;

      console.log('Enhanced product input:', productInput);
      
      const { productBrief: brief, rawAiOutput, openaiRequestDetails } = await generateProductBrief(productInput);
      
      const successMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: `🎉 Done! I've created a brief for "${brief.product_name}" - a ${brief.category} product. Check the details on the right!`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, successMessage]);
      onBriefGenerated(brief, rawAiOutput, openaiRequestDetails);
      setCurrentStep(ConversationStep.COMPLETE);
      toast.success('Product brief generated successfully!');
      
    } catch (error) {
      console.error('Error generating product brief:', error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Let\'s try again or start over.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setCurrentStep(ConversationStep.COMPLETE);
      toast.error('Failed to generate product brief. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    if (currentStep === ConversationStep.COMPLETE) {
      // Reset conversation for new product
      if (input.toLowerCase().includes('yes') || input.toLowerCase().includes('new') || input.toLowerCase().includes('another')) {
        setMessages([]);
        setCollectedData({});
        setCurrentStep(ConversationStep.GREETING);
        setInput('');
        startConversation();
        return;
      }
    }

    await handleUserResponse(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const resetConversation = () => {
    setMessages([]);
    setCollectedData({});
    setCurrentStep(ConversationStep.GREETING);
    setInput('');
    startConversation();
  };

  const getPlaceholderText = (): string => {
    switch (currentStep) {
      case ConversationStep.PRODUCT_NAME:
        return "e.g., Sleep gummies, Fitness tracker, Anti-aging cream...";
      case ConversationStep.USE_CASE:
        return "e.g., Athletes who need quick recovery after workouts...";
      case ConversationStep.REQUIREMENTS:
        return "e.g., Must be portable, child-safe, FDA approved...";
      case ConversationStep.AESTHETICS:
        return "e.g., Clean and minimal like Apple products...";
      case ConversationStep.COMPLETE:
        return "Type 'yes' to create another product brief...";
      default:
        return "Type your response...";
    }
  };

  // Get the most recent message (or show loading state)
  const getCurrentMessage = () => {
    if (isLoading) {
      return {
        id: 'loading',
        type: 'assistant' as const,
        content: 'Generating comprehensive product brief...',
        timestamp: new Date(),
        isLoading: true
      };
    }
    
    return messages[messages.length - 1];
  };

  const currentMessage = getCurrentMessage();

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Chat Area - Fixed Height showing only current message */}
      <div className="bg-white rounded-lg border border-slate-200 mb-6">
        {/* Current Message Display - Fixed Height */}
        <div className="h-32 p-6 flex items-center justify-center">
          {currentMessage ? (
            <div className="flex gap-4 items-start w-full max-w-2xl">
              {currentMessage.type === 'assistant' && (
                <div className="flex-shrink-0">
                  <Bot className="h-10 w-10 p-2 bg-blue-100 text-blue-600 rounded-full" />
                </div>
              )}
              
              <div className={`flex-1 ${currentMessage.type === 'user' ? 'text-right' : ''}`}>
                <div
                  className={`inline-block rounded-lg px-4 py-3 max-w-lg ${
                    currentMessage.type === 'user'
                      ? 'bg-blue-600 text-white ml-auto'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  <div className="text-base whitespace-pre-line">
                    {(currentMessage as any).isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{currentMessage.content}</span>
                      </div>
                    ) : (
                      currentMessage.content
                    )}
                  </div>
                </div>
              </div>

              {currentMessage.type === 'user' && (
                <div className="flex-shrink-0">
                  <User className="h-10 w-10 p-2 bg-slate-200 text-slate-600 rounded-full" />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-slate-500">
              <Bot className="mx-auto h-12 w-12 mb-2 text-slate-400" />
              <p>Starting conversation...</p>
            </div>
          )}
        </div>

        {/* Input Area - Prominent and Fixed */}
        <div className="border-t bg-slate-50 p-6">
          <div className="flex gap-3 items-center max-w-2xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={getPlaceholderText()}
              className="flex-1 h-12 text-base"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="lg"
              className="h-12 px-6"
            >
              <Send className="h-5 w-5" />
            </Button>
            {messages.length > 1 && (
              <Button
                variant="outline"
                size="lg"
                onClick={resetConversation}
                className="h-12 px-4"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Optional: Show conversation history in a collapsible section */}
      {messages.length > 1 && (
        <details className="bg-slate-50 rounded-lg border border-slate-200">
          <summary className="p-4 cursor-pointer text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
            View conversation history ({messages.length} messages)
          </summary>
          <div className="p-4 pt-0 max-h-60 overflow-y-auto space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded px-3 py-2 text-xs ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-900'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default ChatInterface;
