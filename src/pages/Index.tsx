
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ProductBrief } from '@/types/ProductBrief';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ChatInterface from '@/components/ChatInterface';
import ProductPreview from '@/components/ProductPreview';
import AuthDialog from '@/components/AuthDialog';
import PastProjects from '@/components/PastProjects';
import { saveProject } from '@/services/projectService';

const Index = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [productBrief, setProductBrief] = useState<ProductBrief | null>(null);
  const [showChat, setShowChat] = useState(false);

  const handleBriefGenerated = async (brief: ProductBrief, rawAiOutput?: string, openaiRequestDetails?: any) => {
    setProductBrief(brief);
    setShowChat(true);
    
    // Auto-save project if user is authenticated
    if (user) {
      try {
        await saveProject(brief, rawAiOutput, openaiRequestDetails);
        toast.success('Project saved successfully!');
      } catch (error) {
        console.error('Error saving project:', error);
        toast.error('Failed to save project');
      }
    }
  };

  const handleStartOver = () => {
    setProductBrief(null);
    setShowChat(false);
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

  const handleProjectSelect = (brief: ProductBrief) => {
    setProductBrief(brief);
    setShowChat(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!showChat && !productBrief) {
    // Initial landing state - Geneering inspired design
    return (
      <div className="min-h-screen bg-background">
        {/* Header - Geneering style */}
        <div className="absolute top-6 left-6 z-10">
          <Button 
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 py-2"
            onClick={() => navigate('/auth')}
          >
            LET'S GO
          </Button>
        </div>

        {/* Main Content - Centered like Geneering */}
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="text-center max-w-4xl mx-auto space-y-12">
            {/* Hero Text */}
            <div className="space-y-6">
              <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                Got an idea for a product?
              </p>
              
              <h1 className="text-6xl md:text-8xl font-black tracking-tight text-foreground">
                geneering
              </h1>
              
              <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                Make it a reality using AI.
              </p>
            </div>
            
            {/* Chat Interface - Clean and minimal */}
            <div className="w-full max-w-2xl mx-auto">
              <div className="bg-card border border-border rounded-xl shadow-sm">
                <ChatInterface 
                  onBriefGenerated={handleBriefGenerated} 
                  requireAuth={false}
                  onAuthRequired={() => navigate('/auth')}
                />
              </div>
            </div>

            {/* Tagline */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground font-medium">The Product Co-pilot</p>
              <p className="text-xs text-muted-foreground">
                Built for founders and operators.
              </p>
              <p className="text-xs text-muted-foreground">
                Generate product concepts and documents needed to go from idea to production.
              </p>
            </div>

            {/* Past Projects Section - Only show if user is logged in */}
            {user && (
              <div className="w-full max-w-6xl mx-auto pt-16">
                <PastProjects onProjectSelect={handleProjectSelect} />
              </div>
            )}
          </div>
        </div>

        {/* User info in top right if logged in */}
        {user && (
          <div className="absolute top-6 right-6 z-10">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                {user.email}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Split view with chat and results - Geneering style
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header - Clean minimal style */}
      <div className="bg-card border-b border-border flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                geneering
              </h1>
              {productBrief && (
                <span className="text-sm text-muted-foreground">
                  {productBrief.product_name}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
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
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartOver}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Start Over
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Clean layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel - 1/3 width */}
        <div className="w-1/3 border-r border-border bg-card">
          <ChatInterface onBriefGenerated={handleBriefGenerated} />
        </div>

        {/* Results Panel - 2/3 width */}
        <div className="w-2/3 bg-muted/30">
          {productBrief && <ProductPreview brief={productBrief} />}
        </div>
      </div>
    </div>
  );
};

export default Index;
