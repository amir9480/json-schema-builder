import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface SchemaImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  importJsonInput: string;
  onImportJsonInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onImportSchema: () => void;
}

const SchemaImportDialog: React.FC<SchemaImportDialogProps> = ({
  isOpen,
  onOpenChange,
  importJsonInput,
  onImportJsonInputChange,
  onImportSchema,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import JSON Schema</DialogTitle>
          <DialogDescription>
            Paste your JSON Schema below to import it into the builder.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Label htmlFor="json-input">Paste your JSON Schema here:</Label>
          <Textarea
            id="json-input"
            value={importJsonInput}
            onChange={onImportJsonInputChange}
            placeholder='{ "type": "object", "properties": { "name": { "type": "string" } } }'
            rows={10}
            className="font-mono"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onImportSchema}>Import</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SchemaImportDialog;