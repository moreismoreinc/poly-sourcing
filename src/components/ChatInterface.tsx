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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      content: "Hi! I'm here to help you create a detailed product brief. Let's start with a few questions to understand exactly what you want to build.\n\n**What product do you want to make?**\n\nDescribe the product you have in mind (e.g., \"Sleep gummies\", \"Fitness tracker\", \"Anti-aging cream\", \"Ergonomic office chair\")",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    setCurrentStep(ConversationStep.PRODUCT_NAME);
  };

  const getNextQuestion = (step: ConversationStep): string => {
    switch (step) {
      case ConversationStep.USE_CASE:
        return `Great! Now tell me:\n\n**Who will use "${collectedData.product_name}" and how will it be used?**\n\nDescribe the target users and their specific use cases (e.g., \"Athletes who need quick recovery after workouts\", \"Busy professionals who want to track their daily activity\", \"People with sensitive skin who need gentle anti-aging treatment\")`;
      
      case ConversationStep.REQUIREMENTS:
        return `Perfect! Next question:\n\n**What specific requirements does this product need to have?**\n\nThink about functional requirements, performance specs, size constraints, regulatory needs, etc. (e.g., \"Must be portable, child-safe, FDA approved\", \"Waterproof, 7-day battery life, heart rate monitoring\", \"Fragrance-free, SPF 30, non-comedogenic\")`;
      
      case ConversationStep.AESTHETICS:
        return `Excellent! Final question:\n\n**What are your design inspirations and aesthetic preferences?**\n\nDescribe the look, feel, and style you want. Reference brands, packaging styles, or aesthetic directions (e.g., \"Clean and minimal like Apple products\", \"Luxury skincare like La Mer - elegant glass packaging\", \"Bold and energetic like Nike - vibrant colors and dynamic design\", \"Scandinavian minimalism with natural materials\")`;
      
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
      // All data collected, generate the brief
      await generateBrief(updatedData as EnhancedProductInput);
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
        content: 'Perfect! I have all the information I need. To generate and save your product brief, please sign in first. This will also allow you to access your past projects.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, authPromptMessage]);
      onAuthRequired?.();
      return;
    }

    setIsLoading(true);
    setCurrentStep(ConversationStep.GENERATING);

    // Show generating message
    const generatingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: `Perfect! I'm now generating a comprehensive product brief for "${data.product_name}". This will take a moment...`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, generatingMessage]);

    try {
      // Transform enhanced input to match your existing API
      const productInput: ProductInput = {
        product_name: data.product_name,
        use_case: data.use_case,
        aesthetic: data.aesthetic,
        // Add requirements as additional context - you may need to update your ProductInput type
        requirements: data.requirements
      } as any;

      console.log('Enhanced product input:', productInput);
      
      const { productBrief: brief, rawAiOutput, openaiRequestDetails } = await generateProductBrief(productInput);
      
      const successMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: `🎉 **Product brief generated successfully!**\n\nI've created a comprehensive brief for "${brief.product_name}" - a ${brief.category} product positioned as ${brief.positioning}.\n\nThe brief includes:\n• Detailed specifications and materials\n• Realistic dimensions and pricing\n• Relevant certifications and variants\n• Manufacturing considerations\n\nCheck out the complete details in the panel on the right! Would you like to create another product brief?`,
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
        content: 'Sorry, I encountered an error while generating the product brief. Let me try again or we can start over with different information.',
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

  const getStepNumber = (): number => {
    const stepOrder = [
      ConversationStep.GREETING,
      ConversationStep.PRODUCT_NAME,
      ConversationStep.USE_CASE,
      ConversationStep.REQUIREMENTS,
      ConversationStep.AESTHETICS,
      ConversationStep.GENERATING,
      ConversationStep.COMPLETE
    ];
    return stepOrder.indexOf(currentStep);
  };

  const getProgressPercentage = (): number => {
    const stepNumber = getStepNumber();
    if (stepNumber <= 1) return 0;
    if (stepNumber >= 5) return 100;
    return ((stepNumber - 1) / 4) * 100;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'assistant' && (
              <div className="flex-shrink-0">
                <Bot className="h-8 w-8 p-1.5 bg-blue-100 text-blue-600 rounded-full" />
              </div>
            )}
            
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-900'
              }`}
            >
              <div className="text-sm whitespace-pre-line">{message.content}</div>
              <p className="text-xs opacity-70 mt-2">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {message.type === 'user' && (
              <div className="flex-shrink-0">
                <User className="h-8 w-8 p-1.5 bg-slate-200 text-slate-600 rounded-full" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              <Bot className="h-8 w-8 p-1.5 bg-blue-100 text-blue-600 rounded-full" />
            </div>
            <div className="bg-slate-100 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-slate-600">Generating comprehensive product brief...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Progress indicator */}
      {currentStep !== ConversationStep.GREETING && currentStep !== ConversationStep.COMPLETE && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>
              Step {Math.max(1, getStepNumber() - 1)} of 4
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetConversation}
              className="text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Start Over
            </Button>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ 
                width: `${getProgressPercentage()}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t bg-white p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getPlaceholderText()}
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
