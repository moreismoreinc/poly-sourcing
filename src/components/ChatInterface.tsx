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

  const handleConversationStart = () => {
    // Auto-start conversation if not already started
  };

  const { messages, currentResponse, isLoading, conversationStarted, conversationState, sendMessage, resetChat } = useStreamingChat({
    onBriefUpdate: handleBriefUpdate,
    existingBrief,
    onConversationStart: handleConversationStart,
  });

  // Auto-start conversation on mount if no existing brief
  React.useEffect(() => {
    if (!existingBrief && !conversationStarted && messages.length === 0) {
      setTimeout(() => {
        sendMessage("I'd like to create a product brief. Can you help me get started with some questions?", true);
      }, 500);
    }
  }, [existingBrief, conversationStarted, messages.length, sendMessage]);

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
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
      {/* Chat Messages */}
      <div className="flex-1 bg-background rounded-lg border border-border mb-4 flex flex-col">
        {/* Progress Header */}
        {conversationState.phase === 'QUESTIONING' && !existingBrief && (
          <div className="border-b border-border p-4 bg-muted/30">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Product Brief Interview</span>
              <span className="text-primary font-medium">
                Question {Math.min(conversationState.currentQuestion + 1, 4)}/4
              </span>
            </div>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min((conversationState.currentQuestion + 1) / 4 * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
        
        {conversationState.phase === 'GENERATING' && (
          <div className="border-b border-border p-4 bg-primary/5">
            <div className="flex items-center gap-2 text-sm text-primary">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="font-medium">Generating your product brief...</span>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-foreground'
              }`}>
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}
          
          {/* Show streaming response */}
          {currentResponse && (
            <div className="flex justify-start">
              <div className="max-w-[80%] p-4 rounded-lg bg-muted text-foreground">
                <div className="text-sm whitespace-pre-wrap">
                  <StreamingText text={currentResponse} />
                </div>
              </div>
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
          {conversationStarted && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                resetChat();
              }}
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