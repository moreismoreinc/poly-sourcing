
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, User, Bot, LogIn } from 'lucide-react';
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

const ChatInterface = ({ onBriefGenerated, requireAuth = false, onAuthRequired }: ChatInterfaceProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const parseUserInput = (input: string): ProductInput => {
    // Simple parsing logic - in a real app, you might use NLP or more sophisticated parsing
    const lines = input.split('\n').filter(line => line.trim());
    
    if (lines.length === 1) {
      // Single line input - assume it's product name and use case combined
      return {
        product_name: lines[0].split(' ')[0] + ' ' + (lines[0].split(' ')[1] || ''),
        use_case: lines[0],
        aesthetic: 'modern and clean'
      };
    }

    return {
      product_name: lines[0] || 'Custom Product',
      use_case: lines[1] || input,
      aesthetic: lines[2] || 'modern and clean'
    };
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Check authentication requirement for brief generation
    if (!user) {
      const authPromptMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I understand you want to create a product brief! To generate and save your brief, please sign in first. This will also allow you to access your past projects.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, authPromptMessage]);
      setInput('');
      onAuthRequired?.();
      return;
    }

    setIsLoading(true);

    try {
      const productInput = parseUserInput(input);
      console.log('Parsed input:', productInput);
      
      const { productBrief: brief, rawAiOutput, openaiRequestDetails } = await generateProductBrief(productInput);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I've generated a product brief for "${brief.product_name}". The brief includes detailed specifications for a ${brief.category} product positioned as ${brief.positioning}. Check out the details in the panel on the right!`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      onBriefGenerated(brief, rawAiOutput, openaiRequestDetails);
      toast.success('Product brief generated successfully!');
    } catch (error) {
      console.error('Error generating product brief:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error while generating the product brief. Please try again with a different description.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to generate product brief. Please try again.');
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 mt-8">
            <Bot className="mx-auto h-12 w-12 mb-4 text-slate-400" />
            <p className="text-lg font-medium mb-2">Hey! I'm your product brief generator.</p>
            <p className="text-sm">Describe a product you'd like to create and I'll generate a detailed brief for you.</p>
          </div>
        )}
        
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
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-900'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
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
            <div className="bg-slate-100 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-slate-600">Generating product brief...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your product idea... (e.g., 'Sleep gummies to help people relax before bed with a clean and calming aesthetic')"
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
