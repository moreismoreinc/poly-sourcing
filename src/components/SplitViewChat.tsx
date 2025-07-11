import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, RotateCcw, ArrowLeft, Download, User, LogOut, Settings } from 'lucide-react';
// Removed ProductBrief import as we're now using dynamic JSON data
import ProductPreview from '@/components/ProductPreview';
import { useAuth } from '@/hooks/useAuth';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
  productBrief: Record<string, any> | null;
  productName?: string;
  generatedImages?: string[];
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
      <span>|</span>
    </span>
  );
};

// Dynamic AI status component
const DynamicAIStatus = ({ conversationState }: { conversationState: ConversationState }) => {
  const [currentStage, setCurrentStage] = useState(0);
  
  // Extract product details from answers
  const productName = conversationState.answers['product_idea'] || conversationState.answers['idea'] || 'product';
  const referenceBrand = conversationState.answers['reference_brand'] || conversationState.answers['brand'] || '';
  
  // Define the stages with dynamic content
  const stages = [
    `Researching ${productName}...`,
    referenceBrand ? `Analyzing ${referenceBrand} positioning...` : 'Analyzing market positioning...',
    'Determining target audience...',
    'Researching materials and specifications...',
    'Drafting product brief...',
    'Finalizing recommendations...'
  ];
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % stages.length);
    }, 4000); // Change every 4 seconds (slower)
    
    return () => clearInterval(interval);
  }, [stages.length]);
  
  return (
    <div className="text-center text-muted-foreground relative">
      {/* Glowing text with typewriter effect */}
      <div className="relative mb-6">
        <div className="text-5xl font-geneering filter drop-shadow-lg animate-typewriter" style={{color: '#f3f3f3'}}>geneering</div>
      </div>
      
      {/* Dynamic text with fade transition */}
      <div className="h-12 flex flex-col justify-center">
        <p className="text-base font-semibold tracking-wide mb-2 animate-fade-pulse">Generating your product brief...</p>
        <p 
          key={currentStage}
          className="text-sm opacity-75 animate-fade-pulse transition-opacity duration-500"
        >
          {stages[currentStage]}
        </p>
      </div>
    </div>
  );
};

// Typing indicator component
const TypingIndicator = () => {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] p-3 rounded-lg bg-muted text-foreground">
        <div className="flex items-center gap-1">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SplitViewChat = ({ 
  messages, 
  currentResponse, 
  isLoading, 
  conversationState,
  productBrief,
  productName, 
  generatedImages = [],
  onSendMessage, 
  onResetChat,
  onStartOver,
  onDownload
}: SplitViewChatProps) => {
  const { user, signOut } = useAuth();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentResponse]);

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
              <h1 className="text-5xl text-foreground tracking-tight font-geneering" style={{color: '#f3f3f3'}}>
                geneering
              </h1>
              {productName && (
                <div className="absolute left-1/2 transform -translate-x-1/2">
                  <span className="text-sm text-muted-foreground">
                    {productName}
                  </span>
                </div>
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
            

            {/* Messages */}
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4 py-4">
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
                
                {/* Show typing indicator when loading but no response yet */}
                {isLoading && !currentResponse && (
                  <TypingIndicator />
                )}
                
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
                
                {/* Invisible anchor for auto-scrolling */}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

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
            <ProductPreview brief={productBrief} productName={productName} generatedImages={generatedImages} />
          ) : (!productBrief && isLoading && conversationState.currentQuestion >= 1) ? (
            <div className="h-full bg-gradient-to-br from-muted via-muted/80 to-muted overflow-hidden relative">
              {/* Multi-layered animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-muted/50 via-primary/5 to-muted/50"></div>
              
              {/* Primary shimmer wave */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-shimmer-fast"></div>
              
              {/* Secondary shimmer wave (offset) */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer-slow [animation-delay:-1s]"></div>
              
              {/* Scanning lines effect */}
              <div className="absolute inset-0">
                <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-scan-vertical"></div>
                <div className="absolute h-full w-0.5 bg-gradient-to-t from-transparent via-primary/20 to-transparent animate-scan-horizontal [animation-delay:-0.5s]"></div>
              </div>
              
              {/* Dynamic grid overlay */}
              <div className="absolute inset-0 opacity-20 animate-grid-glow" style={{
                backgroundImage: `
                  linear-gradient(rgba(var(--primary) / 0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(var(--primary) / 0.3) 1px, transparent 1px)
                `,
                backgroundSize: '24px 24px'
              }}></div>
              
              {/* Central content */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-radial from-transparent via-background/5 to-transparent">
                <DynamicAIStatus conversationState={conversationState} />
              </div>
              
            </div>
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
