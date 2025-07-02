import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, RotateCcw } from 'lucide-react';
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

// Typewriter component
const TypewriterText = ({ text, speed = 30, onComplete }: { text: string; speed?: number; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    
    if (!text) return;

    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  return (
    <span className="text-left">
      {displayedText}
      {!isComplete && <span className="animate-pulse">|</span>}
    </span>
  );
};

const ChatInterface = ({ onBriefGenerated, requireAuth = false, onAuthRequired }: ChatInterfaceProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<ConversationStep>(ConversationStep.GREETING);
  const [collectedData, setCollectedData] = useState<Partial<EnhancedProductInput>>({});
  const [currentDisplayMessage, setCurrentDisplayMessage] = useState<string>('');
  const [showInput, setShowInput] = useState(false);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize conversation
  useEffect(() => {
    if (messages.length === 0) {
      startConversation();
    }
  }, []);

  // Focus input when it becomes available
  useEffect(() => {
    if (showInput && isTypingComplete && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput, isTypingComplete]);

  const startConversation = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'assistant',
      content: "🧃 What product do you want to make?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    setCurrentDisplayMessage(welcomeMessage.content);
    setCurrentStep(ConversationStep.PRODUCT_NAME);
    setIsTypingComplete(false);
  };

  const getNextQuestion = (step: ConversationStep): string => {
    switch (step) {
      case ConversationStep.USE_CASE:
        return `Great! Who will use it and how will it be used?`;
      
      case ConversationStep.REQUIREMENTS:
        return `Any specific requirements the product needs to fit?`;
      
      case ConversationStep.AESTHETICS:
        return `OK! Finally, what's your design inspo? Brands, aesthetics, packaging styles...`;
      
      default:
        return '';
    }
  };

  const displayMessage = (content: string, enableInputAfter: boolean = true) => {
    setCurrentDisplayMessage(content);
    setShowInput(false);
    setIsTypingComplete(false);
    setInput('');
    
    // Will be handled by typewriter onComplete
    if (enableInputAfter) {
      // Input availability handled by typewriter completion
    }
  };

  const onTypewriterComplete = () => {
    setIsTypingComplete(true);
    setShowInput(true);
  };

  const handleUserResponse = async (response: string) => {
    setShowInput(false);
    setIsTypingComplete(false);

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
        displayMessage('🔥 Hold on, we\'re cooking!', false);
        setTimeout(() => {
          generateBrief(updatedData as EnhancedProductInput);
        }, 2000);
      }, 1000);
    } else {
      // Ask next question after a delay
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
        displayMessage(nextQuestion);
      }, 1000);
    }
  };

  const generateBrief = async (data: EnhancedProductInput) => {
    // Check authentication
    if (!user) {
      displayMessage('Perfect! I have all the information I need. To generate and save your product brief, please sign in first.', false);
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
      
      const successMessage = `🎉 Done! I've created a brief for "${brief.product_name}" - a ${brief.category} product. Check the details on the right!`;

      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: successMessage,
        timestamp: new Date()
      }]);

      displayMessage(successMessage);
      onBriefGenerated(brief, rawAiOutput, openaiRequestDetails);
      setCurrentStep(ConversationStep.COMPLETE);
      toast.success('Product brief generated successfully!');
      
    } catch (error) {
      console.error('Error generating product brief:', error);
      const errorMessage = 'Sorry, I encountered an error. Let\'s try again or start over.';
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      }]);
      
      displayMessage(errorMessage);
      setCurrentStep(ConversationStep.COMPLETE);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !showInput || !isTypingComplete) return;

    if (currentStep === ConversationStep.COMPLETE) {
      // Reset conversation for new product
      if (input.toLowerCase().includes('yes') || input.toLowerCase().includes('new') || input.toLowerCase().includes('another')) {
        setMessages([]);
        setCollectedData({});
        setCurrentStep(ConversationStep.GREETING);
        setInput('');
        setShowInput(false);
        setIsTypingComplete(false);
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
    setCurrentDisplayMessage('');
    setShowInput(false);
    setIsTypingComplete(false);
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

  return (
    <div className="min-h-screen bg-gradient-lovable flex flex-col items-center justify-center p-8">
      {/* Header */}
      <div className="text-center mb-16 max-w-4xl">
        <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Build something <span className="text-white/95">🧃 Lovable</span>
        </h1>
        <p className="text-xl md:text-2xl text-white/70 font-light">
          Create apps and websites by chatting with AI
        </p>
      </div>

      {/* Chat Input Container */}
      <div className="w-full max-w-4xl">
        <div className="relative bg-chat-input rounded-3xl border border-white/20 shadow-2xl backdrop-blur-sm overflow-hidden">
          {/* Typewriter Display - Shows inside input area */}
          <div className="relative px-8 py-6 min-h-[80px] flex items-center">
            {currentDisplayMessage && !showInput && (
              <div className="text-chat-input-foreground text-xl leading-relaxed w-full">
                {isLoading ? (
                  <div className="flex items-center gap-4">
                    <Loader2 className="h-6 w-6 animate-spin text-white/60 flex-shrink-0" />
                    <TypewriterText 
                      text={currentDisplayMessage} 
                      speed={40} 
                      onComplete={onTypewriterComplete}
                    />
                  </div>
                ) : (
                  <TypewriterText 
                    text={currentDisplayMessage} 
                    speed={30}
                    onComplete={onTypewriterComplete}
                  />
                )}
              </div>
            )}

            {/* Input Field - Appears after typewriter */}
            {showInput && isTypingComplete && (
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={getPlaceholderText()}
                className="w-full bg-transparent border-none text-xl text-chat-input-foreground placeholder:text-chat-input-placeholder focus:ring-0 focus:border-none p-0 shadow-none"
                disabled={isLoading}
              />
            )}

            {/* Control Buttons */}
            <div className={`absolute bottom-6 right-6 flex gap-3 transition-opacity duration-300 ${
              showInput && isTypingComplete ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}>
              <Button 
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading || !showInput || !isTypingComplete}
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm rounded-xl px-4 py-2"
                variant="outline"
              >
                <Send className="h-4 w-4" />
              </Button>
              {messages.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetConversation}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm rounded-xl px-4 py-2"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Additional spacing for workspace/supabase indicators if needed */}
        <div className="flex justify-center items-center gap-4 mt-8 opacity-60">
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <div className="w-2 h-2 bg-white/30 rounded-full"></div>
            <span>Workspace</span>
          </div>
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <div className="w-2 h-2 bg-green-400/60 rounded-full"></div>
            <span>Supabase</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
