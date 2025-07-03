import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Edit2, Sparkles } from 'lucide-react';

interface ProjectNamingProps {
  generatedName: string;
  isLoading: boolean;
  onProceed: (finalName: string) => void;
}

const ProjectNaming = ({ generatedName, isLoading, onProceed }: ProjectNamingProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [customName, setCustomName] = useState(generatedName);

  const handleProceed = () => {
    onProceed(isEditing ? customName : generatedName);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleProceed();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Generating your project name...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card shadow-none rounded-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl font-bold">Project Named!</CardTitle>
          </div>
          <CardDescription>
            I've generated a creative name for your project. You can use it or customize it before we continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="bg-muted rounded-lg p-4 mb-4">
              {isEditing ? (
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-center text-lg font-semibold bg-background"
                  autoFocus
                />
              ) : (
                <h2 className="text-xl font-bold text-foreground">{generatedName}</h2>
              )}
            </div>
            
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="mb-4"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Customize Name
              </Button>
            )}
            
            {isEditing && (
              <div className="flex gap-2 justify-center mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setCustomName(generatedName);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Save
                </Button>
              </div>
            )}
          </div>

          <Button 
            onClick={handleProceed}
            className="w-full"
            size="lg"
          >
            Continue with this name
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectNaming;