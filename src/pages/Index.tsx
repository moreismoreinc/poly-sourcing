
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
// Removed ProductBrief import - using dynamic JSON data from database
import { useAuth } from '@/hooks/useAuth';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import SingleInputStart from '@/components/SingleInputStart';
import SplitViewChat from '@/components/SplitViewChat';
import { getMostRecentProject } from '@/services/projectService';
import { useEffect } from 'react';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [productBrief, setProductBrief] = useState<Record<string, any> | null>(null);
  const [productName, setProductName] = useState<string>('');
  const [showSplitView, setShowSplitView] = useState(false);

  const handleBriefUpdate = async (brief: Record<string, any> | null, name?: string) => {
    if (brief) {
      setProductBrief(brief);
      if (name) setProductName(name);
    }
  };

  const { messages, currentResponse, isLoading, conversationStarted, conversationState, sendMessage, resetChat } = useStreamingChat({
    onBriefUpdate: handleBriefUpdate,
    onConversationStart: () => setShowSplitView(true),
  });

  // Load most recent project on mount
  useEffect(() => {
    const loadRecentProject = async () => {
      if (user) {
        const project = await getMostRecentProject();
        if (project) {
          setProductBrief(project.product_brief as Record<string, any>);
          setProductName(project.product_name);
          setShowSplitView(true);
        }
      }
    };
    
    loadRecentProject();
  }, [user]);

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
    
    const exportFileDefaultName = `product-brief-${Date.now()}.json`;
    
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
      productName={productName}
      onSendMessage={sendMessage}
      onResetChat={resetChat}
      onStartOver={handleStartOver}
      onDownload={handleDownload}
    />
  );
};

export default Index;
