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
import SchemaFormPreview from "./SchemaFormPreview"; // Import SchemaFormPreview
import SchemaDataGenerator from "./SchemaDataGenerator"; // Import SchemaDataGenerator
import PythonCodeGenerator from "./PythonCodeGenerator"; // Import PythonCodeGenerator
import JavaScriptCodeGenerator from "./JavaScriptCodeGenerator"; // Import JavaScriptCodeGenerator

interface SchemaExportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  schemaFields: SchemaField[];
  reusableTypes: SchemaField[];
  initialTab?: string; // New prop to set initial active tab
}

const LOCAL_STORAGE_SELECTED_EXPORT_TAB_KEY = "jsonSchemaBuilderSelectedExportTab";

const SchemaExportDialog: React.FC<SchemaExportDialogProps> = ({
  isOpen,
  onOpenChange,
  schemaFields,
  reusableTypes,
  initialTab = "json-schema", // Default to JSON Schema tab
}) => {
  const [selectedTab, setSelectedTab] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(LOCAL_STORAGE_SELECTED_EXPORT_TAB_KEY) || initialTab;
    }
    return initialTab;
  });
  const [generatedJsonSchema, setGeneratedJsonSchema] = React.useState<any>(null);
  const [generatedFormData, setGeneratedFormData] = React.useState<Record<string, any> | undefined>(undefined);

  // Generate schema only when the dialog opens or when schemaFields/reusableTypes change
  React.useEffect(() => {
    if (isOpen) {
      setGeneratedJsonSchema(buildFullJsonSchema(schemaFields, reusableTypes));
    }
  }, [isOpen, schemaFields, reusableTypes]);

  // Set initial tab when dialog opens if initialTab prop changes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedTab(initialTab);
    }
  }, [isOpen, initialTab]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_SELECTED_EXPORT_TAB_KEY, selectedTab);
    }
  }, [selectedTab]);

  const handleDataGenerationComplete = () => {
    setSelectedTab("form-preview"); // Switch to Form Preview tab
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schema Tools</DialogTitle>
          <DialogDescription>
            Export your schema, preview it as a form, or generate sample data.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6"> {/* Increased grid columns to accommodate new tabs */}
              <TabsTrigger value="json-schema">JSON Schema</TabsTrigger>
              <TabsTrigger value="curl-command">cURL Command</TabsTrigger>
              <TabsTrigger value="form-preview">Form Preview</TabsTrigger>
              <TabsTrigger value="generate-data">Generate Data (AI)</TabsTrigger>
              <TabsTrigger value="python-code">Python Code</TabsTrigger> {/* New Tab Trigger */}
              <TabsTrigger value="javascript-code">JavaScript Code</TabsTrigger> {/* New Tab Trigger */}
            </TabsList>
            <TabsContent value="json-schema" className="mt-4">
              {generatedJsonSchema ? (
                <SchemaDisplay jsonSchema={generatedJsonSchema} />
              ) : (
                <p className="text-muted-foreground text-center">Generating schema...</p>
              )}
            </TabsContent>
            <TabsContent value="curl-command" className="mt-4">
              {generatedJsonSchema ? (
                <CurlCommandGenerator jsonSchema={generatedJsonSchema} />
              ) : (
                <p className="text-muted-foreground text-center">Generating cURL command...</p>
              )}
            </TabsContent>
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
              {generatedJsonSchema ? (
                <SchemaDataGenerator
                  jsonSchema={generatedJsonSchema}
                  onDataGenerated={setGeneratedFormData}
                  onGenerationComplete={handleDataGenerationComplete}
                />
              ) : (
                <p className="text-muted-foreground text-center">
                  Build your schema first to generate data.
                </p>
              )}
            </TabsContent>
            <TabsContent value="python-code" className="mt-4"> {/* New Tab Content */}
              {generatedJsonSchema ? (
                <PythonCodeGenerator jsonSchema={generatedJsonSchema} />
              ) : (
                <p className="text-muted-foreground text-center">
                  Build your schema first to generate Python code.
                </p>
              )}
            </TabsContent>
            <TabsContent value="javascript-code" className="mt-4"> {/* New Tab Content */}
              {generatedJsonSchema ? (
                <JavaScriptCodeGenerator jsonSchema={generatedJsonSchema} />
              ) : (
                <p className="text-muted-foreground text-center">
                  Build your schema first to generate JavaScript code.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SchemaExportDialog;