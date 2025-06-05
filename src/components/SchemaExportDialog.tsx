import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import SchemaDisplay from "./SchemaDisplay";
import { SchemaField } from "./FieldEditor";

interface SchemaExportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  schemaFields: SchemaField[];
  reusableTypes: SchemaField[];
}

const SchemaExportDialog: React.FC<SchemaExportDialogProps> = ({
  isOpen,
  onOpenChange,
  schemaFields,
  reusableTypes,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generated JSON Schema</DialogTitle>
          <DialogDescription>
            Copy the generated JSON Schema below.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <SchemaDisplay schemaFields={schemaFields} reusableTypes={reusableTypes} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SchemaExportDialog;