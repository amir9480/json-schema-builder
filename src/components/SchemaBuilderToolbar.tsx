import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Eye, Upload, Download, Settings, Save, FolderOpen, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils"; // Import cn for conditional class names

interface SchemaBuilderToolbarProps {
  onAddField: () => void;
  onClearSchemaTrigger: () => void;
  onImportSchemaTrigger: () => void;
  onManageTypesTrigger: () => void;
  onExportSchemaTrigger: () => void;
  onSaveSchemaTrigger: () => void;
  onLoadSchemaTrigger: () => void;
  onAIGenerateSchemaTrigger: () => void;
  hasSchemaFields: boolean;
  hasUnsavedChanges: boolean; // New prop
}

const SchemaBuilderToolbar: React.FC<SchemaBuilderToolbarProps> = ({
  onAddField,
  onClearSchemaTrigger,
  onImportSchemaTrigger,
  onManageTypesTrigger,
  onExportSchemaTrigger,
  onSaveSchemaTrigger,
  onLoadSchemaTrigger,
  onAIGenerateSchemaTrigger,
  hasSchemaFields,
  hasUnsavedChanges, // Destructure new prop
}) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-semibold">
          Define Your Schema Fields
          {hasUnsavedChanges && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="ml-2 inline-block h-3 w-3 rounded-full bg-yellow-500 animate-pulse" aria-label="Unsaved changes"></span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Unsaved changes</p>
              </TooltipContent>
            </Tooltip>
          )}
        </h2>
      </div>
      <div className="flex flex-wrap gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="default" size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={onClearSchemaTrigger}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Clear All Fields</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="default" size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={onSaveSchemaTrigger}>
              <Save className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save Schema</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="default" size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={onLoadSchemaTrigger}>
              <FolderOpen className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Load Schema</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="default" size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={onImportSchemaTrigger}>
              <Upload className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Import JSON</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="default" size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={onAIGenerateSchemaTrigger}>
              <Sparkles className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Generate with AI</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground" size="icon" onClick={onManageTypesTrigger}>
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Manage Reusable Types</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground" size="icon" onClick={onExportSchemaTrigger}>
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export Generated JSON Schema</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export default SchemaBuilderToolbar;