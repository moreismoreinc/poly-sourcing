import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, RotateCcw, ArrowLeft, Download, User, LogOut } from 'lucide-react';
import { ProductBrief } from '@/types/ProductBrief';
import ProductPreview from '@/components/ProductPreview';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConversationState {
  phase: 'QUESTIONING' | 'GENERATING' | 'EDITING';
  currentQuestion: number;
  answers: Record<string, string>;
  questionsCompleted: boolean;
}

interface SplitViewChatProps {
  messages: Message[];
  currentResponse: string;
  isLoading: boolean;
  conversationState: ConversationState;
  productBrief: ProductBrief | null;
  onSendMessage: (message: string) => void;
  onResetChat: () => void;
  onStartOver: () => void;
  onDownload: () => void;
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

const SplitViewChat = ({ 
  messages, 
  currentResponse, 
  isLoading, 
  conversationState,
  productBrief, 
  onSendMessage, 
  onResetChat,
  onStartOver,
  onDownload
}: SplitViewChatProps) => {
  const { user, signOut } = useAuth();
  const [input, setInput] = useState('');

  const handleSendMessage = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border flex-shrink-0">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                geneering
              </h1>
              {productBrief && (
                <span className="text-sm text-muted-foreground">
                  {productBrief.product_name}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {user && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
                  <User className="h-4 w-4" />
                  {user.email}
                </div>
              )}
              
              {productBrief && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onStartOver}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Start Over
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel - 1/3 width */}
        <div className="w-1/3 border-r border-border bg-background flex flex-col">
          <div className="flex-1 flex flex-col h-full">
            {/* Progress Header */}
            {conversationState.phase === 'QUESTIONING' && (
              <div className="border-b border-border p-4 bg-muted/30 flex-shrink-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Product Brief Interview</span>
                  <span className="text-primary font-medium">
                    Question {Math.min(conversationState.currentQuestion + 1, 2)}/2
                  </span>
                </div>
                <div className="mt-2 w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min((conversationState.currentQuestion + 1) / 2 * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
            
            {conversationState.phase === 'GENERATING' && (
              <div className="border-b border-border p-4 bg-primary/5 flex-shrink-0">
                <div className="flex items-center gap-2 text-sm text-primary">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="font-medium">Generating your product brief...</span>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-foreground'
                  }`}>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}
              
              {/* Show streaming response */}
              {currentResponse && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] p-3 rounded-lg bg-muted text-foreground">
                    <div className="text-sm whitespace-pre-wrap">
                      <StreamingText text={currentResponse} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-4 flex-shrink-0">
              <div className="flex gap-2 items-center">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Continue the conversation..."
                  className="flex-1 h-10 text-sm bg-background border-border focus:border-foreground focus:ring-foreground/20 rounded-lg px-3"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  size="sm"
                  className="h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResetChat}
                  className="h-10 px-3 rounded-lg"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel - 2/3 width */}
        <div className="w-2/3 bg-muted/30">
          {productBrief ? (
            <ProductPreview brief={productBrief} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-4">📋</div>
                <p>Your product brief will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SplitViewChat;