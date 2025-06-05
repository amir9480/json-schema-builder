import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Eye, Upload, Download, Settings, Save, FolderOpen } from "lucide-react";
// Removed DialogTrigger and AlertDialogTrigger imports

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
    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
      <h2 className="text-2xl font-semibold">Define Your Schema Fields</h2>
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" onClick={onSaveSchemaTrigger}>
          <Save className="h-4 w-4 mr-2" /> Save Schema
        </Button>

        <Button variant="outline" onClick={onLoadSchemaTrigger}>
          <FolderOpen className="h-4 w-4 mr-2" /> Load Schema
        </Button>

        <Button variant="outline" onClick={onImportSchemaTrigger}>
          <Upload className="h-4 w-4 mr-2" /> Import JSON
        </Button>

        <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={onPreviewSchemaTrigger}>
          <Eye className="h-4 w-4 mr-2" /> Preview Fields
        </Button>

        <Button variant="outline" className="text-red-500 hover:text-red-600" onClick={onClearSchemaTrigger}>
          <Trash2 className="h-4 w-4 mr-2" /> Clear All Fields
        </Button>
      </div>
      <div className="w-full flex justify-end gap-2 mt-4">
        <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={onManageTypesTrigger}>
          <Settings className="h-4 w-4 mr-2" /> Manage Reusable Types
        </Button>
        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={onExportSchemaTrigger}>
          <Download className="h-4 w-4 mr-2" /> Export Generated JSON Schema
        </Button>
      </div>
    </div>
  );
};

export default SchemaBuilderToolbar;