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
import SchemaFormPreview from "./SchemaFormPreview";
import SchemaDataGenerator from "./SchemaDataGenerator";
import PythonCodeGenerator from "./PythonCodeGenerator";
import JavaScriptCodeGenerator from "./JavaScriptCodeGenerator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface SchemaExportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  schemaFields: SchemaField[];
  reusableTypes: SchemaField[];
  initialTab?: string;
}

const LOCAL_STORAGE_SELECTED_EXPORT_TAB_KEY = "jsonSchemaBuilderSelectedExportTab";
const LOCAL_STORAGE_SELECTED_DEV_EXPORT_TYPE_KEY = "jsonSchemaBuilderSelectedDevExportType"; // Renamed key for dropdown

const SchemaExportDialog: React.FC<SchemaExportDialogProps> = ({
  isOpen,
  onOpenChange,
  schemaFields,
  reusableTypes,
  initialTab = "json-schema",
}) => {
  const [selectedTab, setSelectedTab] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(LOCAL_STORAGE_SELECTED_EXPORT_TAB_KEY) || initialTab;
    }
    return initialTab;
  });
  const [selectedDevExportType, setSelectedDevExportType] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(LOCAL_STORAGE_SELECTED_DEV_EXPORT_TYPE_KEY) || "curl-command";
    }
    return "curl-command";
  });
  const [generatedJsonSchema, setGeneratedJsonSchema] = React.useState<any>(null);
  const [generatedFormData, setGeneratedFormData] = React.useState<Record<string, any> | undefined>(undefined);

  React.useEffect(() => {
    if (isOpen) {
      setGeneratedJsonSchema(buildFullJsonSchema(schemaFields, reusableTypes));
    }
  }, [isOpen, schemaFields, reusableTypes]);

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

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_SELECTED_DEV_EXPORT_TYPE_KEY, selectedDevExportType);
    }
  }, [selectedDevExportType]);

  const handleDataGenerationComplete = () => {
    setSelectedTab("form-preview");
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="json-schema">JSON Schema</TabsTrigger>
              <TabsTrigger value="form-preview">Form Preview</TabsTrigger>
              <TabsTrigger value="generate-data">Generate Data (AI)</TabsTrigger>
              <TabsTrigger value="for-developers">For Developers</TabsTrigger>
            </TabsList>
            <TabsContent value="json-schema" className="mt-4">
              {generatedJsonSchema ? (
                <SchemaDisplay jsonSchema={generatedJsonSchema} />
              ) : (
                <p className="text-muted-foreground text-center">Generating schema...</p>
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
            <TabsContent value="for-developers" className="mt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dev-export-type-select">Select Export Type</Label>
                  <Select value={selectedDevExportType} onValueChange={setSelectedDevExportType}>
                    <SelectTrigger id="dev-export-type-select">
                      <SelectValue placeholder="Select a code type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="curl-command">cURL Command</SelectItem>
                      <SelectItem value="python-code">Python Code</SelectItem>
                      <SelectItem value="javascript-code">JavaScript Code</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {generatedJsonSchema ? (
                  <>
                    {selectedDevExportType === "curl-command" && (
                      <CurlCommandGenerator jsonSchema={generatedJsonSchema} />
                    )}
                    {selectedDevExportType === "python-code" && (
                      <PythonCodeGenerator jsonSchema={generatedJsonSchema} />
                    )}
                    {selectedDevExportType === "javascript-code" && (
                      <JavaScriptCodeGenerator jsonSchema={generatedJsonSchema} />
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-center">
                    Build your schema first to generate code.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SchemaExportDialog;