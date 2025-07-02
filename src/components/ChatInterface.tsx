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
    <span>
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
    setCurrentDisplayMessage(welcomeMessage.content);
    setCurrentStep(ConversationStep.PRODUCT_NAME);
    setShowInput(true);
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

  const displayMessage = (content: string, onComplete?: () => void) => {
    setCurrentDisplayMessage(content);
    setShowInput(false);
    // Input will be shown after typewriter completes
    setTimeout(() => {
      setShowInput(true);
      onComplete?.();
    }, content.length * 30 + 500); // Account for typewriter speed + small delay
  };

  const handleUserResponse = async (response: string) => {
    // First show user's response
    setCurrentDisplayMessage(response);
    setShowInput(false);

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
        displayMessage('🔥 Hold on, we\'re cooking!', () => {
          generateBrief(updatedData as EnhancedProductInput);
        });
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
      displayMessage('Perfect! I have all the information I need. To generate and save your product brief, please sign in first.');
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
      toast.error('Failed to generate product brief. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !showInput) return;

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
    setCurrentDisplayMessage('');
    setShowInput(false);
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
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Message Display - Geneering style */}
      <div className="bg-card rounded-xl border border-border shadow-sm mb-6">
        <div className="h-40 p-8 flex items-center justify-center">
          {currentDisplayMessage ? (
            <div className="text-center max-w-2xl">
              <div className="text-lg text-foreground leading-relaxed font-medium">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <TypewriterText text={currentDisplayMessage} speed={40} />
                  </div>
                ) : (
                  <TypewriterText 
                    text={currentDisplayMessage} 
                    speed={30}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <div className="w-8 h-8 mx-auto mb-2 bg-muted rounded-full animate-pulse"></div>
              <p className="text-sm">Starting conversation...</p>
            </div>
          )}
        </div>

        {/* Input Area - Clean Geneering style */}
        <div className="border-t border-border bg-muted/30 p-6">
          <div className={`flex gap-3 items-center max-w-2xl mx-auto transition-opacity duration-300 ${showInput ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={getPlaceholderText()}
              className="flex-1 h-12 text-base bg-background border-border focus:border-ring focus:ring-ring"
              disabled={isLoading || !showInput}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading || !showInput}
              size="lg"
              className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send className="h-5 w-5" />
            </Button>
            {messages.length > 1 && (
              <Button
                variant="outline"
                size="lg"
                onClick={resetConversation}
                className="h-12 px-4 border-border"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
