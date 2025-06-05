import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { SchemaField } from "./FieldEditor";
import SortableFieldEditor from "./SortableFieldEditor";
import ManageReusableTypes from "./ManageReusableTypes";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger, // Added DialogTrigger here
} from "@/components/ui/dialog";
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

// Import new components
import SchemaBuilderToolbar from "./SchemaBuilderToolbar";
import SchemaImportDialog from "./SchemaImportDialog";
import SchemaPreviewDialog from "./SchemaPreviewDialog";
import SchemaExportDialog from "./SchemaExportDialog";
import SchemaClearConfirmation from "./SchemaClearConfirmation";
import SchemaSaveLoadDialogs from "./SchemaSaveLoadDialogs";

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
  const [isLoadConfirmOpen, setIsLoadConfirmOpen] = useState(false);

  // Track initial load to determine if there are "unsaved changes"
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [initialSchemaFields, setInitialSchemaFields] = useState<string>("");
  const [initialReusableTypes, setInitialReusableTypes] = useState<string>("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Load schema and reusable types from local storage on initial mount
  useEffect(() => {
    const savedSchema = localStorage.getItem(LOCAL_STORAGE_FIELDS_KEY);
    const savedReusableTypes = localStorage.getItem(LOCAL_STORAGE_REUSABLE_TYPES_KEY);
    const savedNames = localStorage.getItem(LOCAL_STORAGE_SAVED_SCHEMAS_INDEX_KEY);

    if (savedSchema) {
      try {
        const parsedSchema = JSON.parse(savedSchema);
        setSchemaFields(parsedSchema);
        setInitialSchemaFields(JSON.stringify(parsedSchema));
      } catch (e) {
        console.error("Failed to parse saved schema from local storage:", e);
        showError("Failed to load saved schema. It might be corrupted.");
      }
    }
    if (savedReusableTypes) {
      try {
        const parsedReusableTypes = JSON.parse(savedReusableTypes);
        setReusableTypes(parsedReusableTypes);
        setInitialReusableTypes(JSON.stringify(parsedReusableTypes));
      } catch (e) {
        console.error("Failed to parse saved reusable types from local storage:", e);
        showError("Failed to load saved reusable types. It might be corrupted.");
      }
    }

    if (savedNames) {
      try {
        setSavedSchemaNames(JSON.parse(savedNames));
      } catch (e) {
        console.error("Failed to parse saved schema names from local storage:", e);
        showError("Failed to load saved schema names. It might be corrupted.");
      }
    }
    setInitialLoadComplete(true);
  }, []);

  // Save current schema and reusable types to local storage whenever they change (autosave for current session)
  useEffect(() => {
    if (initialLoadComplete) { // Only autosave after initial load
      localStorage.setItem(LOCAL_STORAGE_FIELDS_KEY, JSON.stringify(schemaFields));
    }
  }, [schemaFields, initialLoadComplete]);

  useEffect(() => {
    if (initialLoadComplete) { // Only autosave after initial load
      localStorage.setItem(LOCAL_STORAGE_REUSABLE_TYPES_KEY, JSON.stringify(reusableTypes));
    }
  }, [reusableTypes, initialLoadComplete]);

  // Save the index of saved schema names
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SAVED_SCHEMAS_INDEX_KEY, JSON.stringify(savedSchemaNames));
  }, [savedSchemaNames]);

  // Determine if there are unsaved changes
  const hasUnsavedChanges = initialLoadComplete && (
    JSON.stringify(schemaFields) !== initialSchemaFields ||
    JSON.stringify(reusableTypes) !== initialReusableTypes
  );

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
    setInitialSchemaFields(JSON.stringify([])); // Reset initial state
    setInitialReusableTypes(JSON.stringify([])); // Reset initial state
    showSuccess("Schema cleared successfully!");
    setIsClearConfirmOpen(false);
  };

  const handleImportSchema = () => {
    try {
      const parsedJson = JSON.parse(importJsonInput);
      const convertedFields = jsonSchemaToSchemaFields(parsedJson);
      setSchemaFields(convertedFields);
      setReusableTypes([]); // Clear reusable types on import, as they are not part of standard JSON Schema
      setInitialSchemaFields(JSON.stringify(convertedFields)); // Update initial state
      setInitialReusableTypes(JSON.stringify([])); // Update initial state
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
      const updatedNames = [...savedSchemaNames, saveSchemaName.trim()];
      setSavedSchemaNames(updatedNames);
      localStorage.setItem(LOCAL_STORAGE_SAVED_SCHEMAS_INDEX_KEY, JSON.stringify(updatedNames));
      
      // Update initial state to reflect saved changes
      setInitialSchemaFields(JSON.stringify(schemaFields));
      setInitialReusableTypes(JSON.stringify(reusableTypes));

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

      let newFields: SchemaField[] = [];
      let newReusableTypes: SchemaField[] = [];

      if (loadedFields) {
        newFields = JSON.parse(loadedFields);
        setSchemaFields(newFields);
      } else {
        setSchemaFields([]);
      }

      if (loadedReusableTypes) {
        newReusableTypes = JSON.parse(loadedReusableTypes);
        setReusableTypes(newReusableTypes);
      } else {
        setReusableTypes([]);
      }

      // Update initial state to reflect loaded schema
      setInitialSchemaFields(JSON.stringify(newFields));
      setInitialReusableTypes(JSON.stringify(newReusableTypes));

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
      const updatedNames = savedSchemaNames.filter((name) => name !== nameToDelete);
      setSavedSchemaNames(updatedNames);
      localStorage.setItem(LOCAL_STORAGE_SAVED_SCHEMAS_INDEX_KEY, JSON.stringify(updatedNames));
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
          <SchemaBuilderToolbar
            onAddField={() => addField()}
            onClearSchemaTrigger={() => setIsClearConfirmOpen(true)}
            onImportSchemaTrigger={() => setIsImportDialogOpen(true)}
            onPreviewSchemaTrigger={() => setIsPreviewOpen(true)}
            onManageTypesTrigger={() => setIsManageTypesOpen(true)}
            onExportSchemaTrigger={() => setIsExportDialogOpen(true)}
            onSaveSchemaTrigger={() => setIsSaveDialogOpen(true)}
            onLoadSchemaTrigger={() => setIsLoadConfirmOpen(true)} // Trigger confirmation first
            hasSchemaFields={schemaFields.length > 0}
          />

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
                      onConvertToReusableType={handleConvertToReusableType}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
          <Button onClick={() => addField()} className="w-full">
            <PlusCircle className="h-4 w-4 mr-2" /> Add New Field
          </Button>

          {/* Dialogs for various actions */}
          <SchemaImportDialog
            isOpen={isImportDialogOpen}
            onOpenChange={setIsImportDialogOpen}
            importJsonInput={importJsonInput}
            onImportJsonInputChange={(e) => setImportJsonInput(e.target.value)}
            onImportSchema={handleImportSchema}
          />

          <SchemaPreviewDialog
            isOpen={isPreviewOpen}
            onOpenChange={setIsPreviewOpen}
            schemaFields={schemaFields}
            reusableTypes={reusableTypes}
          />

          <SchemaExportDialog
            isOpen={isExportDialogOpen}
            onOpenChange={setIsExportDialogOpen}
            schemaFields={schemaFields}
            reusableTypes={reusableTypes}
          />

          <SchemaClearConfirmation
            isOpen={isClearConfirmOpen}
            onOpenChange={setIsClearConfirmOpen}
            onConfirmClear={handleClearSchema}
          />

          <Dialog open={isManageTypesOpen} onOpenChange={setIsManageTypesOpen}>
            <DialogTrigger asChild>
              {/* This trigger is now handled by SchemaBuilderToolbar, but keeping it here for context if needed */}
              {/* <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white">
                <Settings className="h-4 w-4 mr-2" /> Manage Reusable Types
              </Button> */}
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

          <SchemaSaveLoadDialogs
            isSaveDialogOpen={isSaveDialogOpen}
            setIsSaveDialogOpen={setIsSaveDialogOpen}
            isLoadDialogOpen={isLoadDialogOpen}
            setIsLoadDialogOpen={setIsLoadDialogOpen}
            isLoadConfirmOpen={isLoadConfirmOpen}
            setIsLoadConfirmOpen={setIsLoadConfirmOpen}
            saveSchemaName={saveSchemaName}
            setSaveSchemaName={setSaveSchemaName}
            selectedLoadSchemaName={selectedLoadSchemaName}
            setSelectedLoadSchemaName={setSelectedLoadSchemaName}
            savedSchemaNames={savedSchemaNames}
            setSavedSchemaNames={setSavedSchemaNames}
            schemaFields={schemaFields}
            reusableTypes={reusableTypes}
            setSchemaFields={setSchemaFields}
            setReusableTypes={setReusableTypes}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </div>
      </div>
    </div>
  );
};

export default SchemaBuilder;