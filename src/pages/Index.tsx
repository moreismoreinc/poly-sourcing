
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ProductBrief } from '@/types/ProductBrief';
import { useAuth } from '@/hooks/useAuth';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import SingleInputStart from '@/components/SingleInputStart';
import SplitViewChat from '@/components/SplitViewChat';
import { saveProject } from '@/services/projectService';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [productBrief, setProductBrief] = useState<ProductBrief | null>(null);
  const [showSplitView, setShowSplitView] = useState(false);

  const handleBriefUpdate = async (brief: ProductBrief | null) => {
    if (brief) {
      setProductBrief(brief);
      
      // Auto-save project if user is authenticated
      if (user) {
        try {
          await saveProject(brief, '', {});
          toast.success('Project saved successfully!');
        } catch (error) {
          console.error('Error saving project:', error);
          toast.error('Failed to save project');
        }
      }
    }
  };

  const { messages, currentResponse, isLoading, conversationStarted, conversationState, sendMessage, resetChat } = useStreamingChat({
    onBriefUpdate: handleBriefUpdate,
    onConversationStart: () => setShowSplitView(true),
  });

  const handleStartConversation = async (message: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    setShowSplitView(true);
    await sendMessage(message, true);
  };

  const handleStartOver = () => {
    setProductBrief(null);
    setShowSplitView(false);
    resetChat();
  };

  const handleDownload = () => {
    if (!productBrief) return;
    
    const dataStr = JSON.stringify(productBrief, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${productBrief.product_id}-brief.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Product brief downloaded!');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show single input start screen
  if (!showSplitView) {
    return (
      <SingleInputStart 
        onStartConversation={handleStartConversation}
        isLoading={isLoading}
      />
    );
  }

  // Show split view with conversation and brief
  return (
    <SplitViewChat
      messages={messages}
      currentResponse={currentResponse}
      isLoading={isLoading}
      conversationState={conversationState}
      productBrief={productBrief}
      onSendMessage={sendMessage}
      onResetChat={resetChat}
      onStartOver={handleStartOver}
      onDownload={handleDownload}
    />
  );
};

export default Index;
