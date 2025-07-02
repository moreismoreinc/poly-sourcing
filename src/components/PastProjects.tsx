
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ProductBrief } from '@/types/ProductBrief';
import { Clock, Package, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  product_name: string;
  product_brief: ProductBrief;
  created_at: string;
  updated_at: string;
}

interface PastProjectsProps {
  onProjectSelect: (brief: ProductBrief) => void;
}

const PastProjects = ({ onProjectSelect }: PastProjectsProps) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load past projects');
      } else {
        // Cast the product_brief from Json to ProductBrief
        const typedProjects = (data || []).map(project => ({
          ...project,
          product_brief: project.product_brief as unknown as ProductBrief
        }));
        setProjects(typedProjects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load past projects');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800">Past Projects</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 mb-2">No past projects yet</h3>
        <p className="text-slate-600">
          Create your first product brief to see it here for future reference.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Past Projects</h3>
        <Badge variant="secondary" className="text-xs">
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                {project.product_name}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(project.created_at)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {project.product_brief.category}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  ${project.product_brief.target_price_usd}
                </Badge>
              </div>
              
              <p className="text-xs text-slate-600 line-clamp-2">
                {project.product_brief.intended_use}
              </p>
              
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => onProjectSelect(project.product_brief)}
              >
                <Eye className="h-3 w-3 mr-1" />
                View Project
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PastProjects;
