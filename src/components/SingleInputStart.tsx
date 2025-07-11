import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Send, Settings, User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface SingleInputStartProps {
  onStartConversation: (message: string) => void;
  isLoading?: boolean;
}

const SingleInputStart = ({ onStartConversation, isLoading }: SingleInputStartProps) => {
  const [input, setInput] = useState('');
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const { imageGenerationEnabled, updateImageGenerationPreference } = useUserPreferences();

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with user info and admin controls */}
      <div className="flex justify-between items-center p-6 border-b border-border">
        <div className="text-2xl font-bold text-foreground">
          Geneering
        </div>
        
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {user.email}
            </div>
          )}
          
          {/* Admin-only Image Generation Toggle */}
          {isAdmin && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="image-generation-toggle" className="text-sm text-muted-foreground cursor-pointer">
                Image Generation
              </Label>
              <Switch
                id="image-generation-toggle"
                checked={imageGenerationEnabled}
                onCheckedChange={updateImageGenerationPreference}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          )}
          
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4">
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
    </div>
  );
};

export default SingleInputStart;