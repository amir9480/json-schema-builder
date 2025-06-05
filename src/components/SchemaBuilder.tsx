import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Eye, Upload, Download, Settings, Save, FolderOpen, XCircle } from "lucide-react";
import { SchemaField } from "./FieldEditor";
import SortableFieldEditor from "./SortableFieldEditor";
import SchemaDisplay from "./SchemaDisplay";
import SchemaFormPreview from "./SchemaFormPreview";
import ManageReusableTypes from "./ManageReusableTypes";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // Import Input for save dialog
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select for load dialog
import { showSuccess, showError } from "@/utils/toast";
import { jsonSchemaToSchemaFields } from "@/utils/schemaConverter";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { arrayMove } from "@dnd-kit/sortable";

interface SchemaBuilderProps {}

const LOCAL_STORAGE_FIELDS_KEY = "jsonSchemaBuilderFields";
const LOCAL_STORAGE_REUSABLE_TYPES_KEY = "jsonSchemaBuilderReusableTypes";
const LOCAL_STORAGE_SAVED_SCHEMAS_INDEX_KEY = "jsonSchemaBuilderSavedSchemasIndex";

const SchemaBuilder: React.FC<SchemaBuilderProps> = () => {
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]);
  const [reusableTypes, setReusableTypes] = useState<SchemaField[]>([]);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isManageTypesOpen, setIsManageTypesOpen] = useState(false);
  const [importJsonInput, setImportJsonInput] = useState("");

  // State for Save/Load functionality
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [saveSchemaName, setSaveSchemaName] = useState("");
  const [selectedLoadSchemaName, setSelectedLoadSchemaName] = useState("");
  const [savedSchemaNames, setSavedSchemaNames] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Load schema and reusable types from local storage on initial mount
  useEffect(() => {
    const savedSchema = localStorage.getItem(LOCAL_STORAGE_FIELDS_KEY);
    if (savedSchema) {
      try {
        setSchemaFields(JSON.parse(savedSchema));
      } catch (e) {
        console.error("Failed to parse saved schema from local storage:", e);
        showError("Failed to load saved schema. It might be corrupted.");
      }
    }
    const savedReusableTypes = localStorage.getItem(LOCAL_STORAGE_REUSABLE_TYPES_KEY);
    if (savedReusableTypes) {
      try {
        setReusableTypes(JSON.parse(savedReusableTypes));
      } catch (e) {
        console.error("Failed to parse saved reusable types from local storage:", e);
        showError("Failed to load saved reusable types. It might be corrupted.");
      }
    }

    const savedNames = localStorage.getItem(LOCAL_STORAGE_SAVED_SCHEMAS_INDEX_KEY);
    if (savedNames) {
      try {
        setSavedSchemaNames(JSON.parse(savedNames));
      } catch (e) {
        console.error("Failed to parse saved schema names from local storage:", e);
        showError("Failed to load saved schema names. It might be corrupted.");
      }
    }
  }, []);

  // Save current schema and reusable types to local storage whenever they change (autosave for current session)
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_FIELDS_KEY, JSON.stringify(schemaFields));
  }, [schemaFields]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_REUSABLE_TYPES_KEY, JSON.stringify(reusableTypes));
  }, [reusableTypes]);

  // Save the index of saved schema names
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SAVED_SCHEMAS_INDEX_KEY, JSON.stringify(savedSchemaNames));
  }, [savedSchemaNames]);

  const addField = (parentId?: string) => {
    const newField: SchemaField = {
      id: uuidv4(),
      name: "",
      type: "string",
      isMultiple: false,
      isRequired: true,
      parentId: parentId, // Add parentId for nested fields
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
            ? { ...field, children: addNestedField(field.children, parentId, newField) }
            : field,
        ),
      );
    } else {
      setSchemaFields((prevFields) => [...prevFields, newField]);
    }
  };

  const addNestedField = (
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
          children: addNestedField(field.children, parentId, newField),
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
    setReusableTypes([]); // Also clear reusable types
    showSuccess("Schema cleared successfully!");
    setIsClearConfirmOpen(false);
  };

  const handleImportSchema = () => {
    try {
      const parsedJson = JSON.parse(importJsonInput);
      const convertedFields = jsonSchemaToSchemaFields(parsedJson);
      setSchemaFields(convertedFields);
      setReusableTypes([]); // Clear reusable types on import, as they are not part of standard JSON Schema
      showSuccess("JSON schema imported successfully!");
      setIsImportDialogOpen(false);
      setImportJsonInput("");
    } catch (error) {
      console.error("Failed to import JSON schema:", error);
      showError("Failed to import JSON schema. Please ensure it's valid JSON.");
    }
  };

  const findParentAndReorder = (
    fields: SchemaField[],
    activeId: string,
    overId: string,
  ): SchemaField[] => {
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      if (field.id === activeId || field.id === overId) {
        // If activeId or overId is a top-level field, reorder at this level
        const oldIndex = fields.findIndex((f) => f.id === activeId);
        const newIndex = fields.findIndex((f) => f.id === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(fields, oldIndex, newIndex);
        }
      }
      if (field.type === "object" && field.children) {
        const reorderedChildren = findParentAndReorder(
          field.children,
          activeId,
          overId,
        );
        if (reorderedChildren !== field.children) {
          return fields.map((f) =>
            f.id === field.id ? { ...f, children: reorderedChildren } : f,
          );
        }
      }
    }
    return fields; // No change if not found or reordered
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSchemaFields((prevFields) => {
        const updatedFields = findParentAndReorder(prevFields, active.id as string, over?.id as string);
        return updatedFields;
      });
    }
  };

  const moveField = (fieldId: string, direction: "up" | "down", parentId?: string) => {
    const updateFields = (fields: SchemaField[]): SchemaField[] => {
      const index = fields.findIndex(f => f.id === fieldId);
      if (index === -1) {
        // Not found at this level, check children
        return fields.map(f => {
          if (f.type === "object" && f.children) {
            return { ...f, children: updateFields(f.children) };
          }
          return f;
        });
      }

      let newIndex = index;
      if (direction === "up") {
        newIndex = Math.max(0, index - 1);
      } else {
        newIndex = Math.min(fields.length - 1, index + 1);
      }

      if (newIndex === index) return fields; // No change

      return arrayMove(fields, index, newIndex);
    };

    setSchemaFields((prevFields) => {
      if (parentId) {
        // Find the parent object and update its children
        const findAndMoveInNested = (currentFields: SchemaField[]): SchemaField[] => {
          return currentFields.map(field => {
            if (field.id === parentId && field.type === "object" && field.children) {
              return { ...field, children: updateFields(field.children) };
            } else if (field.type === "object" && field.children) {
              return { ...field, children: findAndMoveInNested(field.children) };
            }
            return field;
          });
        };
        return findAndMoveInNested(prevFields);
      } else {
        // Move at the root level
        return updateFields(prevFields);
      }
    });
  };

  const handleSaveSchemaByName = () => {
    if (!saveSchemaName.trim()) {
      showError("Please enter a name for your schema.");
      return;
    }
    if (savedSchemaNames.includes(saveSchemaName.trim())) {
      showError(`A schema with the name "${saveSchemaName.trim()}" already exists. Please choose a different name.`);
      return;
    }

    try {
      localStorage.setItem(`dyad_schema_${saveSchemaName.trim()}_fields`, JSON.stringify(schemaFields));
      localStorage.setItem(`dyad_schema_${saveSchemaName.trim()}_reusableTypes`, JSON.stringify(reusableTypes));
      setSavedSchemaNames((prevNames) => [...prevNames, saveSchemaName.trim()]);
      showSuccess(`Schema "${saveSchemaName.trim()}" saved successfully!`);
      setIsSaveDialogOpen(false);
      setSaveSchemaName("");
    } catch (error) {
      console.error("Failed to save schema by name:", error);
      showError("Failed to save schema. Please try again.");
    }
  };

  const handleLoadSchemaByName = () => {
    if (!selectedLoadSchemaName) {
      showError("Please select a schema to load.");
      return;
    }

    try {
      const loadedFields = localStorage.getItem(`dyad_schema_${selectedLoadSchemaName}_fields`);
      const loadedReusableTypes = localStorage.getItem(`dyad_schema_${selectedLoadSchemaName}_reusableTypes`);

      if (loadedFields) {
        setSchemaFields(JSON.parse(loadedFields));
      } else {
        setSchemaFields([]);
      }

      if (loadedReusableTypes) {
        setReusableTypes(JSON.parse(loadedReusableTypes));
      } else {
        setReusableTypes([]);
      }

      showSuccess(`Schema "${selectedLoadSchemaName}" loaded successfully!`);
      setIsLoadDialogOpen(false);
      setSelectedLoadSchemaName("");
    } catch (error) {
      console.error("Failed to load schema by name:", error);
      showError("Failed to load schema. It might be corrupted.");
    }
  };

  const handleDeleteSavedSchema = (nameToDelete: string) => {
    try {
      localStorage.removeItem(`dyad_schema_${nameToDelete}_fields`);
      localStorage.removeItem(`dyad_schema_${nameToDelete}_reusableTypes`);
      setSavedSchemaNames((prevNames) => prevNames.filter((name) => name !== nameToDelete));
      showSuccess(`Schema "${nameToDelete}" deleted successfully!`);
    } catch (error) {
      console.error("Failed to delete saved schema:", error);
      showError("Failed to delete schema. Please try again.");
    }
  };

  // Helper function to deep copy a SchemaField, generating new IDs for all children
  const deepCopyField = (field: SchemaField): SchemaField => {
    const newField: SchemaField = {
      ...field,
      id: uuidv4(), // Generate a new ID for the copied field
      parentId: undefined, // Clear parentId as it's now a root of a reusable type
    };
    if (newField.children) {
      newField.children = newField.children.map(deepCopyField); // Recursively copy children
    }
    return newField;
  };

  const handleConvertToReusableType = (fieldId: string) => {
    let foundField: SchemaField | undefined;
    let parentField: SchemaField | undefined;

    // Function to find the field and its parent recursively
    const findFieldAndParent = (fields: SchemaField[], targetId: string, currentParent?: SchemaField): boolean => {
      for (const field of fields) {
        if (field.id === targetId) {
          foundField = field;
          parentField = currentParent;
          return true;
        }
        if (field.type === "object" && field.children && findFieldAndParent(field.children, targetId, field)) {
          return true;
        }
      }
      return false;
    };

    findFieldAndParent(schemaFields, fieldId);

    if (foundField) {
      // 1. Create a new reusable type from the found field
      const newReusableType = deepCopyField(foundField);
      newReusableType.name = newReusableType.name || "UnnamedType"; // Ensure a name for the reusable type
      newReusableType.type = "object"; // Reusable types are always objects
      newReusableType.isMultiple = false; // Reusable types themselves are not 'multiple'
      newReusableType.isRequired = false; // Reusable types themselves are not 'required'
      newReusableType.title = newReusableType.title || `Reusable ${newReusableType.name}`;
      newReusableType.description = newReusableType.description || `Reusable definition for ${newReusableType.name}`;

      setReusableTypes((prev) => {
        // Ensure unique name for the new reusable type
        let uniqueName = newReusableType.name;
        let counter = 1;
        while (prev.some(rt => rt.name === uniqueName)) {
          uniqueName = `${newReusableType.name}${counter++}`;
        }
        newReusableType.name = uniqueName;
        return [...prev, newReusableType];
      });

      // 2. Update the original field to be a reference to the new reusable type
      const updatedOriginalField: SchemaField = {
        ...foundField,
        type: "ref",
        refId: newReusableType.id,
        children: undefined, // A reference field does not have children directly
        // Clear other properties that don't apply to a ref type
        minValue: undefined,
        maxValue: undefined,
        minItems: undefined,
        maxItems: undefined,
        currency: undefined,
        example: undefined,
        description: undefined,
        title: foundField.title || foundField.name, // Keep original title/name for display
      };

      // Function to update the field in the schemaFields tree
      const updateFieldInSchema = (fields: SchemaField[]): SchemaField[] => {
        return fields.map((field) => {
          if (field.id === fieldId) {
            return updatedOriginalField;
          } else if (field.type === "object" && field.children) {
            return {
              ...field,
              children: updateFieldInSchema(field.children),
            };
          }
          return field;
        });
      };

      setSchemaFields(updateFieldInSchema(schemaFields));
      showSuccess(`Field "${foundField.name}" converted to reusable type "${newReusableType.name}"!`);
    } else {
      showError("Could not find the field to convert.");
    }
  };


  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        JSON Schema Builder
      </h1>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h2 className="text-2xl font-semibold">Define Your Schema Fields</h2>
            <div className="flex gap-2 flex-wrap">
              {/* Save Schema Button and Dialog */}
              <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Save className="h-4 w-4 mr-2" /> Save Schema
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Save Current Schema</DialogTitle>
                    <DialogDescription>
                      Enter a name to save your current schema and reusable types.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Label htmlFor="save-schema-name">Schema Name</Label>
                    <Input
                      id="save-schema-name"
                      value={saveSchemaName}
                      onChange={(e) => setSaveSchemaName(e.target.value)}
                      placeholder="e.g., MyProductSchema"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveSchemaByName}>Save</Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Load Schema Button and Dialog */}
              <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FolderOpen className="h-4 w-4 mr-2" /> Load Schema
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Load Saved Schema</DialogTitle>
                    <DialogDescription>
                      Select a schema to load. This will replace your current schema.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Label htmlFor="load-schema-select">Select Schema</Label>
                    <Select
                      value={selectedLoadSchemaName}
                      onValueChange={setSelectedLoadSchemaName}
                    >
                      <SelectTrigger id="load-schema-select">
                        <SelectValue placeholder="Choose a saved schema" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedSchemaNames.length === 0 ? (
                          <SelectItem value="no-schemas" disabled>
                            No schemas saved yet.
                          </SelectItem>
                        ) : (
                          savedSchemaNames.map((name) => (
                            <SelectItem key={name} value={name}>
                              <div className="flex items-center justify-between w-full">
                                <span>{name}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-red-500 hover:text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent select from closing
                                    handleDeleteSavedSchema(name);
                                  }}
                                  aria-label={`Delete ${name}`}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsLoadDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleLoadSchemaByName} disabled={!selectedLoadSchemaName}>Load</Button>
                  </div>
                </DialogContent>
              </Dialog>

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
                      This action cannot be undone. This will permanently delete all your defined schema fields and reusable types.
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={schemaFields.map((field) => field.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {schemaFields.map((field, index) => (
                    <SortableFieldEditor
                      key={field.id}
                      field={field}
                      onFieldChange={handleFieldChange}
                      onAddField={addField}
                      onRemoveField={removeField}
                      onMoveField={moveField}
                      reusableTypes={reusableTypes}
                      isFirst={index === 0}
                      isLast={index === schemaFields.length - 1}
                      onManageReusableTypes={() => setIsManageTypesOpen(true)}
                      onConvertToReusableType={handleConvertToReusableType} // Pass the new function here
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
          <Button onClick={() => addField()} className="w-full">
            <PlusCircle className="h-4 w-4 mr-2" /> Add New Field
          </Button>

          {/* Manage Reusable Types Button and Modal */}
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
                <SchemaDisplay schemaFields={schemaFields} reusableTypes={reusableTypes} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default SchemaBuilder;