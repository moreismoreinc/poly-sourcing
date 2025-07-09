import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Clock, Package, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  product_name: string;
  product_brief: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface RecentProjectsProps {
  onProjectSelect: (brief: Record<string, any>, productName: string, projectId: string) => void;
}

const RecentProjects = ({ onProjectSelect }: RecentProjectsProps) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecentProjects();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchRecentProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6); // Show only the 6 most recent

      if (error) {
        console.error('Error fetching recent projects:', error);
        toast.error('Failed to load recent projects');
      } else {
        // Cast the product_brief from Json to Record<string, any>
        const typedProjects = (data || []).map(project => ({
          ...project,
          product_brief: project.product_brief as Record<string, any>
        }));
        setProjects(typedProjects);
      }
    } catch (error) {
      console.error('Error fetching recent projects:', error);
      toast.error('Failed to load recent projects');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getProductDescription = (brief: Record<string, any>) => {
    // Try to extract a description from various possible fields
    return brief.description || 
           brief.intended_use || 
           brief.product_description || 
           brief.overview ||
           'Product brief available';
  };

  const getProductCategory = (brief: Record<string, any>) => {
    return brief.category || 
           brief.product_category ||
           'Product';
  };

  const getProductPrice = (brief: Record<string, any>) => {
    return brief.target_price_usd || 
           brief.price_range || 
           brief.estimated_price ||
           null;
  };

  if (!user) {
    return (
      <div className="py-16 bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Sign in to see your recent projects
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Your Product Journey
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Once you create product briefs, they'll appear here for easy access and iteration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-16 bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Recent Projects
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Your Product Journey
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-5 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="h-6 bg-muted rounded w-16"></div>
                      <div className="h-6 bg-muted rounded w-12"></div>
                    </div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                    <div className="h-10 bg-muted rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="py-16 bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Recent Projects
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Your Product Journey
            </h2>
            <div className="max-w-md mx-auto">
              <Package className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
              <p className="text-muted-foreground text-lg mb-8">
                Create your first product brief to see it here for future reference and iteration.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-muted/30">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Recent Projects
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Your Product Journey
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Continue working on your product briefs or create new ones to bring your ideas to life.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="hover:shadow-lg transition-all duration-300 cursor-pointer group hover:scale-105 bg-card"
              onClick={() => onProjectSelect(project.product_brief, project.product_name, project.id)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {project.product_name}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(project.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {getProductCategory(project.product_brief)}
                  </Badge>
                  {getProductPrice(project.product_brief) && (
                    <Badge variant="outline" className="text-xs">
                      ${getProductPrice(project.product_brief)}
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {getProductDescription(project.product_brief)}
                </p>
                
                <Button
                  size="sm"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  variant="outline"
                >
                  Continue Project
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentProjects;