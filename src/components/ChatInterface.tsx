import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { ProductBrief } from '@/types/ProductBrief';
import { useAuth } from '@/hooks/useAuth';
import { useStreamingChat } from '@/hooks/useStreamingChat';

interface ChatInterfaceProps {
  onBriefGenerated: (brief: ProductBrief, rawAiOutput?: string, openaiRequestDetails?: any) => void;
  requireAuth?: boolean;
  onAuthRequired?: () => void;
  existingBrief?: ProductBrief | null;
}

// Streaming text display component
const StreamingText = ({ text }: { text: string }) => {
  return (
    <span>
      {text}
      <span className="animate-pulse">|</span>
    </span>
  );
};

const ChatInterface = ({ onBriefGenerated, requireAuth = false, onAuthRequired, existingBrief }: ChatInterfaceProps) => {
  const { user } = useAuth();
  const [input, setInput] = useState('');

  const handleBriefUpdate = (brief: ProductBrief | null) => {
    if (brief) {
      onBriefGenerated(brief, '', {});
    }
  };

  const { messages, currentResponse, isLoading, sendMessage, resetChat } = useStreamingChat({
    onBriefUpdate: handleBriefUpdate,
    existingBrief,
  });

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0 && !existingBrief) {
      // Auto-send welcome message to start conversation
      setTimeout(() => {
        sendMessage("Hello! I'd like to create a product brief.");
      }, 1000);
    }
  }, [messages.length, existingBrief, sendMessage]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Check authentication for new briefs
    if (!user && !existingBrief) {
      onAuthRequired?.();
      return;
    }

    await sendMessage(input);
    setInput('');
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getPlaceholderText = (): string => {
    if (existingBrief) {
      return "Ask me to edit your product brief...";
    }
    return "Describe your product idea...";
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Messages Area */}
      <div className="bg-background rounded-lg border border-border mb-4">
        <div className="max-h-80 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-foreground'
              }`}>
                <div className="text-sm">{message.content}</div>
              </div>
            </div>
          ))}
          
          {/* Show streaming response */}
          {currentResponse && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-4 rounded-lg bg-muted text-foreground">
                <div className="text-sm">
                  <StreamingText text={currentResponse} />
                </div>
              </div>
            </div>
          )}
          
          {messages.length === 0 && !currentResponse && (
            <div className="text-center text-muted-foreground py-8">
              <div className="w-8 h-8 mx-auto mb-2 bg-muted rounded-full animate-pulse"></div>
              <p className="text-sm">Ready to help you create or edit your product brief!</p>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-background rounded-lg border border-border p-4">
        <div className="flex gap-3 items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getPlaceholderText()}
            className="flex-1 h-12 text-base bg-background border-border focus:border-foreground focus:ring-foreground/20 rounded-lg px-4"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="lg"
            className="h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium"
          >
            <Send className="h-5 w-5" />
          </Button>
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="lg"
              onClick={resetChat}
              className="h-12 px-4 rounded-full"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
