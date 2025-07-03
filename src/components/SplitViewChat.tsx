import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, RotateCcw, ArrowLeft, Download, User, LogOut, Edit2, Check, X } from 'lucide-react';
// Removed ProductBrief import as we're now using dynamic JSON data
import ProductPreview from '@/components/ProductPreview';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: string[];
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
  onSendMessage: (message: string) => void;
  onResetChat: () => void;
  onStartOver: () => void;
  onDownload: () => void;
  onProjectNameUpdate: (name: string) => void;
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

// Typing indicator component
const TypingIndicator = () => {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] p-3 rounded-lg bg-muted text-foreground">
        <div className="flex items-center gap-1">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
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
  onSendMessage, 
  onResetChat,
  onStartOver,
  onDownload,
  onProjectNameUpdate
}: SplitViewChatProps) => {
  const { user, signOut } = useAuth();
  const [input, setInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(productName);

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

  const handleEditName = () => {
    setEditedName(productName);
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    onProjectNameUpdate(editedName);
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditedName(productName);
    setIsEditingName(false);
  };

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
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
              {productName && (
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyPress={handleNameKeyPress}
                        className="text-sm h-8 min-w-32"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSaveName}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={handleEditName}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                    >
                      <span>{productName}</span>
                      <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
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
                     {message.images && message.images.length > 0 && (
                       <div className="mt-3 space-y-2">
                         {message.images.map((imageUrl, index) => (
                           <img 
                             key={index}
                             src={imageUrl} 
                             alt={`Generated image ${index + 1}`}
                             className="max-w-full h-auto rounded-lg border border-border"
                           />
                         ))}
                       </div>
                     )}
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
            <ProductPreview brief={productBrief} productName={productName} />
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