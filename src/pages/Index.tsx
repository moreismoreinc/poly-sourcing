
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
    // Initial landing state - single chat input with past projects
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-background border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                  geneering
                </h1>
                <div className="text-sm text-muted-foreground hidden sm:block tracking-wide uppercase">
                  Product Brief Generator • Phase 1
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {user ? (
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
                ) : (
                  <Button
                    size="sm"
                    onClick={() => navigate('/auth')}
                    className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6"
                  >
                    <LogIn className="h-4 w-4" />
                    LET'S GO
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-400px)]">
            <div className="text-center mb-16 max-w-3xl">
              <p className="text-sm text-muted-foreground mb-4 tracking-wider uppercase">
                Got an idea for a product?
              </p>
              <h2 className="text-6xl font-bold text-foreground mb-8 tracking-tight leading-tight">
                Make it a reality using AI.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Generate product concepts and documents needed to go from idea to production. Built for founders and operators.
              </p>
            </div>
            
            {/* Single Chat Input */}
            <div className="w-full max-w-3xl mb-16">
              <ChatInterface 
                onBriefGenerated={handleBriefGenerated} 
                requireAuth={false}
                onAuthRequired={() => navigate('/auth')}
              />
            </div>

            {/* Past Projects Section */}
            {user && (
              <div className="w-full max-w-6xl">
                <PastProjects onProjectSelect={handleProjectSelect} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-background border-t border-border mt-24">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center text-muted-foreground">
              <p className="mb-2 text-sm tracking-wide uppercase">Phase 1: Product Brief Generator</p>
              <p className="text-sm">
                Coming Next: Image Rendering • Component Breakdown • Technical Drawings • BOM Generation
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Split view with chat and results - updated proportions
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
              {productBrief && (
                <span className="text-sm text-muted-foreground">
                  {productBrief.product_name}
                </span>
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

      {/* Main Content - Updated proportions: 1/3 chat, 2/3 preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel - 1/3 width */}
        <div className="w-1/3 border-r border-border bg-background">
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
