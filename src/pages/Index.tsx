
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
// Removed ProductBrief import - using dynamic JSON data from database
import { useAuth } from '@/hooks/useAuth';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import SingleInputStart from '@/components/SingleInputStart';
import SplitViewChat from '@/components/SplitViewChat';
import { getMostRecentProject, getProjectById } from '@/services/projectService';
import { useEffect } from 'react';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [productBrief, setProductBrief] = useState<Record<string, any> | null>(null);
  const [productName, setProductName] = useState<string>('');
  const [showSplitView, setShowSplitView] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const handleBriefUpdate = async (brief: Record<string, any> | null, name?: string, projectId?: string) => {
    if (brief) {
      setProductBrief(brief);
      if (name) setProductName(name);
      if (projectId) setCurrentProjectId(projectId);
    }
  };

  const { messages, currentResponse, isLoading, conversationStarted, conversationState, sendMessage, resetChat } = useStreamingChat({
    onBriefUpdate: handleBriefUpdate,
    onConversationStart: () => setShowSplitView(true),
  });

  // Load most recent project on mount only if no conversation is active
  useEffect(() => {
    const loadRecentProject = async () => {
      if (user && !conversationStarted && !showSplitView) {
        const project = await getMostRecentProject();
        if (project) {
          setProductBrief(project.product_brief as Record<string, any>);
          setProductName(project.product_name);
          setCurrentProjectId(project.id);
          setShowSplitView(true);
        }
      }
    };
    
    loadRecentProject();
  }, [user, conversationStarted, showSplitView]);

  const handleStartConversation = async (message: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Clear any existing project data when starting a new conversation
    setProductBrief(null);
    setProductName('');
    setCurrentProjectId(null);
    
    setShowSplitView(true);
    await sendMessage(message, true);
  };

  const handleStartOver = () => {
    setProductBrief(null);
    setProductName('');
    setCurrentProjectId(null);
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
