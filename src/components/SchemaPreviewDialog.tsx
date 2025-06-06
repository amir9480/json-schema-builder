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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components
import { buildFullJsonSchema } from "@/utils/jsonSchemaBuilder"; // Import to build schema for data generation
import SchemaDataGenerator from "./SchemaDataGenerator"; // Import the new data generator

interface SchemaPreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  schemaFields: SchemaField[];
  reusableTypes: SchemaField[];
}

const LOCAL_STORAGE_SELECTED_PREVIEW_TAB_KEY = "jsonSchemaBuilderSelectedPreviewTab";

const SchemaPreviewDialog: React.FC<SchemaPreviewDialogProps> = ({
  isOpen,
  onOpenChange,
  schemaFields,
  reusableTypes,
}) => {
  const [selectedTab, setSelectedTab] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(LOCAL_STORAGE_SELECTED_PREVIEW_TAB_KEY) || "form-preview";
    }
    return "form-preview";
  });
  const [generatedFormData, setGeneratedFormData] = React.useState<Record<string, any> | undefined>(undefined);
  const [fullJsonSchema, setFullJsonSchema] = React.useState<any>(null);

  // Generate full JSON schema when dialog opens or schema fields/reusable types change
  React.useEffect(() => {
    if (isOpen) {
      setFullJsonSchema(buildFullJsonSchema(schemaFields, reusableTypes));
    }
  }, [isOpen, schemaFields, reusableTypes]);

  // Persist selected tab to local storage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_SELECTED_PREVIEW_TAB_KEY, selectedTab);
    }
  }, [selectedTab]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto"> {/* Increased height */}
        <DialogHeader>
          <DialogTitle>Schema Preview & Data Generation</DialogTitle>
          <DialogDescription>
            Visualize your schema as a form or generate sample data using AI.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="form-preview">Form Preview</TabsTrigger>
              <TabsTrigger value="generate-data">Generate Data (AI)</TabsTrigger>
            </TabsList>
            <TabsContent value="form-preview" className="mt-4">
              {schemaFields.length > 0 ? (
                <SchemaFormPreview fields={schemaFields} reusableTypes={reusableTypes} formData={generatedFormData} />
              ) : (
                <p className="text-muted-foreground text-center">
                  Add some fields to see a preview.
                </p>
              )}
            </TabsContent>
            <TabsContent value="generate-data" className="mt-4">
              {fullJsonSchema ? (
                <SchemaDataGenerator jsonSchema={fullJsonSchema} onDataGenerated={setGeneratedFormData} />
              ) : (
                <p className="text-muted-foreground text-center">
                  Build your schema first to generate data.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SchemaPreviewDialog;