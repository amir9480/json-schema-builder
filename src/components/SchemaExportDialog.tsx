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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components
import CurlCommandGenerator from "./CurlCommandGenerator"; // Import the new component
import { buildFullJsonSchema } from "@/utils/jsonSchemaBuilder"; // Import to pass to CurlCommandGenerator

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
  const jsonSchema = buildFullJsonSchema(schemaFields, reusableTypes);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Schema</DialogTitle>
          <DialogDescription>
            Choose an export format for your generated schema.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Tabs defaultValue="json-schema" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="json-schema">JSON Schema</TabsTrigger>
              <TabsTrigger value="curl-command">cURL Command</TabsTrigger>
            </TabsList>
            <TabsContent value="json-schema" className="mt-4">
              <SchemaDisplay schemaFields={schemaFields} reusableTypes={reusableTypes} />
            </TabsContent>
            <TabsContent value="curl-command" className="mt-4">
              <CurlCommandGenerator jsonSchema={jsonSchema} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SchemaExportDialog;