import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import SchemaFormPreview from "./SchemaFormPreview";
import { SchemaField } from "./FieldEditor";

interface SchemaPreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  schemaFields: SchemaField[];
  reusableTypes: SchemaField[];
}

const SchemaPreviewDialog: React.FC<SchemaPreviewDialogProps> = ({
  isOpen,
  onOpenChange,
  schemaFields,
  reusableTypes,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto"> {/* Increased width */}
        <DialogHeader>
          <DialogTitle>Schema Form Preview</DialogTitle>
          <DialogDescription>
            This is a visual representation of how your defined schema fields might appear in a form.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {schemaFields.length > 0 ? (
            <SchemaFormPreview fields={schemaFields} reusableTypes={reusableTypes} />
          ) : (
            <p className="text-muted-foreground text-center">
              Add some fields to see a preview.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SchemaPreviewDialog;