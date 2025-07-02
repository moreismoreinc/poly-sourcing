-- Add version control to projects table
ALTER TABLE projects ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE projects ADD COLUMN parent_project_id UUID REFERENCES projects(id);
CREATE INDEX idx_projects_parent_id ON projects(parent_project_id);
CREATE INDEX idx_projects_version ON projects(version);