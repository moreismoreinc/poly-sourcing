
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-glass backdrop-blur-md border-b border-glass-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Geneering
                </h1>
                <div className="text-sm text-slate-600 hidden sm:block">
                  Product Brief Generator • Phase 1
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {user ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
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
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/auth')}
                    className="flex items-center gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)]">
            <div className="text-center mb-8 max-w-2xl">
              <h2 className="text-5xl font-bold text-slate-800 mb-4">
                Transform Ideas into 
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Reality</span>
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed mb-8">
                Tell me about your product idea and I'll generate a complete brief with specifications, materials, and dimensions.
              </p>
            </div>
            
            {/* Single Chat Input */}
            <div className="w-full max-w-2xl mb-12">
              <div className="bg-glass backdrop-blur-lg border border-glass-border rounded-xl shadow-[var(--glass-shadow)]">
                <div className="p-1">
                  <ChatInterface 
                    onBriefGenerated={handleBriefGenerated} 
                    requireAuth={false}
                    onAuthRequired={() => navigate('/auth')}
                  />
                </div>
              </div>
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
        <div className="bg-glass backdrop-blur-sm border-t border-glass-border mt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center text-slate-600">
              <p className="mb-2">🧱 Phase 1: Product Brief Generator</p>
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
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-glass backdrop-blur-md border-b border-glass-border flex-shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Geneering
              </h1>
              {productBrief && (
                <span className="text-sm text-slate-600">
                  {productBrief.product_name}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {user && (
                <div className="flex items-center gap-2 text-sm text-slate-600 mr-4">
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
        <div className="w-1/3 border-r border-glass-border bg-glass backdrop-blur-sm">
          <ChatInterface onBriefGenerated={handleBriefGenerated} />
        </div>

        {/* Results Panel - 2/3 width */}
        <div className="w-2/3 bg-glass backdrop-blur-xs">
          {productBrief && <ProductPreview brief={productBrief} />}
        </div>
      </div>
    </div>
  );
};

export default Index;
