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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CurlCommandGenerator from "./CurlCommandGenerator";
import { buildFullJsonSchema } from "@/utils/jsonSchemaBuilder";

interface SchemaExportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  schemaFields: SchemaField[];
  reusableTypes: SchemaField[];
}

const LOCAL_STORAGE_SELECTED_EXPORT_TAB_KEY = "jsonSchemaBuilderSelectedExportTab";

const SchemaExportDialog: React.FC<SchemaExportDialogProps> = ({
  isOpen,
  onOpenChange,
  schemaFields,
  reusableTypes,
}) => {
  const jsonSchema = buildFullJsonSchema(schemaFields, reusableTypes);

  const [selectedTab, setSelectedTab] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(LOCAL_STORAGE_SELECTED_EXPORT_TAB_KEY) || "json-schema";
    }
    return "json-schema";
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_SELECTED_EXPORT_TAB_KEY, selectedTab);
    }
  }, [selectedTab]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto"> {/* Increased width */}
        <DialogHeader>
          <DialogTitle>Export Schema</DialogTitle>
          <DialogDescription>
            Choose an export format for your generated schema.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
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