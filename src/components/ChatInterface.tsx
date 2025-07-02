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
  const [showWelcome, setShowWelcome] = useState(!existingBrief);

  const handleBriefUpdate = (brief: ProductBrief | null) => {
    if (brief) {
      onBriefGenerated(brief, '', {});
    }
  };

  const handleConversationStart = () => {
    setShowWelcome(false);
  };

  const { messages, currentResponse, isLoading, conversationStarted, sendMessage, resetChat } = useStreamingChat({
    onBriefUpdate: handleBriefUpdate,
    existingBrief,
    onConversationStart: handleConversationStart,
  });

  const startInitialConversation = async () => {
    if (!user && !existingBrief) {
      onAuthRequired?.();
      return;
    }

    if (existingBrief) {
      await sendMessage(`I have a product brief for "${existingBrief.product_name}". How can I help you edit or improve it?`, true);
    } else {
      await sendMessage("I'd like to create a product brief. Can you help me get started?", true);
    }
  };

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
      {/* Welcome State */}
      {showWelcome && messages.length === 0 && !currentResponse && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-6">🧃</div>
            <h3 className="text-2xl font-bold text-foreground mb-4">
              {existingBrief ? 'Edit Your Product Brief' : 'Create a Product Brief'}
            </h3>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {existingBrief 
                ? 'I can help you refine and improve your existing product brief through conversation.'
                : 'I\'ll help you create a detailed product brief through a natural conversation about your idea.'
              }
            </p>
            <Button 
              onClick={startInitialConversation}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8"
            >
              {existingBrief ? 'Start Editing' : 'Let\'s Start'}
            </Button>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      {(conversationStarted || messages.length > 0 || currentResponse) && (
        <>
          <div className="flex-1 bg-background rounded-lg border border-border mb-4 flex flex-col">
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
                    setShowWelcome(true);
                  }}
                  className="h-12 px-4 rounded-full"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatInterface;
