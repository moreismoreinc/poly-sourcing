import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface SingleInputStartProps {
  onStartConversation: (message: string) => void;
  isLoading?: boolean;
}

const SingleInputStart = ({ onStartConversation, isLoading }: SingleInputStartProps) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onStartConversation(input);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        <div className="text-6xl mb-8">🧃</div>
        <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
          Create a Product Brief
        </h1>
        <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
          Tell me about your product idea and I'll guide you through creating a comprehensive brief.
        </p>
        
        <div className="flex gap-3 items-center bg-background border border-border rounded-xl p-4 shadow-lg">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your product idea..."
            className="flex-1 h-14 text-lg bg-transparent border-none focus:ring-0 focus:border-none px-6"
            disabled={isLoading}
            autoFocus
          />
          <Button 
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            size="lg"
            className="h-14 px-8 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mt-6">
          I'll ask you 4 quick questions to create your brief
        </p>
      </div>
    </div>
  );
};

export default SingleInputStart;