
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
// Removed ProductBrief import - using dynamic JSON data from database
import { useAuth } from '@/hooks/useAuth';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { useProjectImages } from '@/hooks/useProjectImages';
import SingleInputStart from '@/components/SingleInputStart';
import SplitViewChat from '@/components/SplitViewChat';
import RecentProjects from '@/components/RecentProjects';
import { getMostRecentProject, getProjectById } from '@/services/projectService';
import { useEffect } from 'react';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [productBrief, setProductBrief] = useState<Record<string, any> | null>(null);
  const [productName, setProductName] = useState<string>('');
  const [showSplitView, setShowSplitView] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  // Hook to fetch and poll for project images
  const { images: projectImages } = useProjectImages({ 
    projectId: currentProjectId,
    enabled: !!currentProjectId 
  });

  // Use project images from database when available, fallback to passed images
  const displayImages = projectImages.length > 0 ? projectImages : generatedImages;

  const handleBriefUpdate = async (brief: Record<string, any> | null, name?: string, projectId?: string, images?: string[]) => {
    if (brief) {
      setProductBrief(brief);
      if (name) setProductName(name);
      if (projectId) setCurrentProjectId(projectId);
      if (images) setGeneratedImages(images);
    }
  };

  const { messages, currentResponse, isLoading, conversationStarted, conversationState, sendMessage, resetChat } = useStreamingChat({
    onBriefUpdate: handleBriefUpdate,
    existingBrief: productBrief,
    onConversationStart: () => setShowSplitView(true),
  });

  const handleProjectSelect = (brief: Record<string, any>, name: string, projectId: string) => {
    setProductBrief(brief);
    setProductName(name);
    setCurrentProjectId(projectId);
    setGeneratedImages([]); // Reset images when loading existing project
    setShowSplitView(true);
  };


  const handleStartConversation = async (message: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Clear any existing project data when starting a new conversation
    setProductBrief(null);
    setProductName('');
    setCurrentProjectId(null);
    setGeneratedImages([]);
    
    setShowSplitView(true);
    await sendMessage(message, true);
  };

  const handleStartOver = () => {
    setProductBrief(null);
    setProductName('');
    setCurrentProjectId(null);
    setGeneratedImages([]);
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

  // Show single input start screen with recent projects below
  if (!showSplitView) {
    return (
      <div className="min-h-screen bg-background">
        <SingleInputStart 
          onStartConversation={handleStartConversation}
          isLoading={isLoading}
        />
        <RecentProjects 
          onProjectSelect={handleProjectSelect}
        />
      </div>
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
      generatedImages={displayImages}
      onSendMessage={sendMessage}
      onResetChat={resetChat}
      onStartOver={handleStartOver}
      onDownload={handleDownload}
    />
  );
};

export default Index;
