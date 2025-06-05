import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Eye, Upload, Download, Settings, Save, FolderOpen } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Import Tooltip components

interface SchemaBuilderToolbarProps {
  onAddField: () => void;
  onClearSchemaTrigger: () => void;
  onImportSchemaTrigger: () => void;
  onPreviewSchemaTrigger: () => void;
  onManageTypesTrigger: () => void;
  onExportSchemaTrigger: () => void;
  onSaveSchemaTrigger: () => void;
  onLoadSchemaTrigger: () => void;
  hasSchemaFields: boolean;
}

const SchemaBuilderToolbar: React.FC<SchemaBuilderToolbarProps> = ({
  onAddField,
  onClearSchemaTrigger,
  onImportSchemaTrigger,
  onPreviewSchemaTrigger,
  onManageTypesTrigger,
  onExportSchemaTrigger,
  onSaveSchemaTrigger,
  onLoadSchemaTrigger,
  hasSchemaFields,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">Define Your Schema Fields</h2>
      <div className="flex flex-wrap gap-2 justify-end"> {/* Consolidated into one row */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={onSaveSchemaTrigger}>
              <Save className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save Schema</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={onLoadSchemaTrigger}>
              <FolderOpen className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Load Schema</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={onImportSchemaTrigger}>
              <Upload className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Import JSON</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="default" size="icon" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={onPreviewSchemaTrigger}>
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Preview Fields</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600" onClick={onClearSchemaTrigger}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Clear All Fields</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" size="icon" onClick={onManageTypesTrigger}>
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Manage Reusable Types</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white" size="icon" onClick={onExportSchemaTrigger}>
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