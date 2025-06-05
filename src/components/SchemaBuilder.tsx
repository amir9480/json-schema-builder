import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Eye, Upload, Download, Settings } from "lucide-react"; // Added Settings icon
import FieldEditor, { SchemaField, SchemaFieldType } from "./FieldEditor";
import SchemaDisplay from "./SchemaDisplay";
import SchemaFormPreview from "./SchemaFormPreview";
import ManageReusableTypes from "./ManageReusableTypes"; // Import the new component
import { v4 as uuidv4 } from "uuid";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription, // Import DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { showSuccess, showError } from "@/utils/toast";
import { jsonSchemaToSchemaFields } from "@/utils/schemaConverter";

interface SchemaBuilderProps {}

const SchemaBuilder: React.FC<SchemaBuilderProps> = () => {
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]);
  const [reusableTypes, setReusableTypes] = useState<SchemaField[]>([]); // New state for reusable types
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isManageTypesOpen, setIsManageTypesOpen] = useState(false); // New state for manage types modal
  const [importJsonInput, setImportJsonInput] = useState("");
  // Removed activeAdvancedFieldId and setActiveAdvancedFieldId as they are now managed locally in FieldEditor

  // Load schema and reusable types from local storage on initial mount
  useEffect(() => {
    const savedSchema = localStorage.getItem("jsonSchemaBuilderFields");
    if (savedSchema) {
      try {
        setSchemaFields(JSON.parse(savedSchema));
      } catch (e) {
        console.error("Failed to parse saved schema from local storage:", e);
        showError("Failed to load saved schema. It might be corrupted.");
      }
    }
    const savedReusableTypes = localStorage.getItem("jsonSchemaBuilderReusableTypes");
    if (savedReusableTypes) {
      try {
        setReusableTypes(JSON.parse(savedReusableTypes));
      } catch (e) {
        console.error("Failed to parse saved reusable types from local storage:", e);
        showError("Failed to load saved reusable types. It might be corrupted.");
      }
    }
  }, []);

  // Save schema and reusable types to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("jsonSchemaBuilderFields", JSON.stringify(schemaFields));
  }, [schemaFields]);

  useEffect(() => {
    localStorage.setItem("jsonSchemaBuilderReusableTypes", JSON.stringify(reusableTypes));
  }, [reusableTypes]);

  const addField = (parentId?: string) => {
    const newField: SchemaField = {
      id: uuidv4(),
      name: "",
      type: "string",
      isMultiple: false,
      isRequired: true, // Default to required
    };

    if (parentId) {
      setSchemaFields((prevFields) =>
        prevFields.map((field) =>
          field.id === parentId
            ? {
                ...field,
                children: field.children ? [...field.children, newField] : [newField],
              }
            : field.type === "object" && field.children
            ? { ...field, children: updateNestedFields(field.children, parentId, newField) }
            : field,
        ),
      );
    } else {
      setSchemaFields((prevFields) => [...prevFields, newField]);
    }
  };

  const updateNestedFields = (
    fields: SchemaField[],
    parentId: string,
    newField: SchemaField,
  ): SchemaField[] => {
    return fields.map((field) => {
      if (field.id === parentId) {
        return {
          ...field,
          children: field.children ? [...field.children, newField] : [newField],
        };
      } else if (field.type === "object" && field.children) {
        return {
          ...field,
          children: updateNestedFields(field.children, parentId, newField),
        };
      }
      return field;
    });
  };

  const handleFieldChange = (updatedField: SchemaField) => {
    const updateFields = (fields: SchemaField[]): SchemaField[] => {
      return fields.map((field) => {
        if (field.id === updatedField.id) {
          return updatedField;
        } else if (field.type === "object" && field.children) {
          return {
            ...field,
            children: updateFields(field.children),
          };
        }
        return field;
      });
    };
    setSchemaFields(updateFields(schemaFields));
  };

  const removeField = (fieldId: string) => {
    const filterFields = (fields: SchemaField[]): SchemaField[] => {
      return fields.filter((field) => {
        if (field.id === fieldId) {
          return false;
        }
        if (field.type === "object" && field.children) {
          field.children = filterFields(field.children);
        }
        return true;
      });
    };
    setSchemaFields(filterFields(schemaFields));
  };

  const handleClearSchema = () => {
    setSchemaFields([]);
    showSuccess("Schema cleared successfully!");
    setIsClearConfirmOpen(false); // Close the dialog after clearing
  };

  const handleImportSchema = () => {
    try {
      const parsedJson = JSON.parse(importJsonInput);
      const convertedFields = jsonSchemaToSchemaFields(parsedJson);
      setSchemaFields(convertedFields);
      showSuccess("JSON schema imported successfully!");
      setIsImportDialogOpen(false); // Close dialog on success
      setImportJsonInput(""); // Clear input
    } catch (error) {
      console.error("Failed to import JSON schema:", error);
      showError("Failed to import JSON schema. Please ensure it's valid JSON.");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        JSON Schema Builder
      </h1>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Define Your Schema Fields</h2>
            <div className="flex gap-2">
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" /> Import JSON
                  </Button>
                </DialogTrigger>
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
                      onChange={(e) => setImportJsonInput(e.target.value)}
                      placeholder='{ "type": "object", "properties": { "name": { "type": "string" } } }'
                      rows={10}
                      className="font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleImportSchema}>Import</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogTrigger asChild>
                  <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Eye className="h-4 w-4 mr-2" /> Preview Fields
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
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

              <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-red-500 hover:text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" /> Clear All Fields
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all your defined schema fields.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearSchema} className="bg-red-500 hover:bg-red-600 text-white">
                      Clear Schema
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {schemaFields.length === 0 ? (
            <p className="text-muted-foreground">
              Start by adding your first field.
            </p>
          ) : (
            <div className="space-y-4">
              {schemaFields.map((field) => (
                <FieldEditor
                  key={field.id}
                  field={field}
                  onFieldChange={handleFieldChange}
                  onAddField={addField}
                  onRemoveField={removeField}
                  reusableTypes={reusableTypes} // Pass reusable types to FieldEditor
                />
              ))}
            </div>
          )}
          <Button onClick={() => addField()} className="w-full">
            <PlusCircle className="h-4 w-4 mr-2" /> Add New Field
          </Button>

          {/* New Manage Reusable Types Button and Modal */}
          <Dialog open={isManageTypesOpen} onOpenChange={setIsManageTypesOpen}>
            <DialogTrigger asChild>
              <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white">
                <Settings className="h-4 w-4 mr-2" /> Manage Reusable Types
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Manage Reusable Types</DialogTitle>
                <DialogDescription>
                  Define and organize reusable object schemas for your main schema.
                </DialogDescription>
              </DialogHeader>
              <ManageReusableTypes
                reusableTypes={reusableTypes}
                setReusableTypes={setReusableTypes}
                onClose={() => setIsManageTypesOpen(false)}
              />
            </DialogContent>
          </Dialog>

          {/* Export JSON Schema Button and Modal */}
          <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white">
                <Download className="h-4 w-4 mr-2" /> Export Generated JSON Schema
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Generated JSON Schema</DialogTitle>
                <DialogDescription>
                  Copy the generated JSON Schema below.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <SchemaDisplay schemaFields={schemaFields} reusableTypes={reusableTypes} /> {/* Pass reusable types */}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default SchemaBuilder;