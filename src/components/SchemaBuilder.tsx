import React, { useState, useEffect, useCallback } from "react";
import { SchemaField } from "./FieldEditor";
import ManageReusableTypes from "./ManageReusableTypes";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { showSuccess, showError } from "@/utils/toast";
import { convertFullJsonSchemaToSchemaFieldsAndReusableTypes } from "@/utils/schemaConverter";

// Import new components
import SchemaBuilderToolbar from "./SchemaBuilderToolbar";
import SchemaImportDialog from "./SchemaImportDialog";
import SchemaExportDialog from "./SchemaExportDialog";
import SchemaClearConfirmation from "./SchemaClearConfirmation";
import SchemaSaveLoadDialogs from "./SchemaSaveLoadDialogs";
import SchemaAIGenerateDialog from "./SchemaAIGenerateDialog";
import SchemaMergeReplaceConfirmation from "./SchemaMergeReplaceConfirmation";
import FieldRefineDialog from "./FieldRefineDialog";
import SchemaFieldList from "./SchemaFieldList";

interface SchemaBuilderProps {}

const LOCAL_STORAGE_FIELDS_KEY = "jsonSchemaBuilderFields";
const LOCAL_STORAGE_REUSABLE_TYPES_KEY = "jsonSchemaBuilderReusableTypes";
const LOCAL_STORAGE_SAVED_SCHEMAS_INDEX_KEY = "jsonSchemaBuilderSavedSchemasIndex";

const SchemaBuilder: React.FC<SchemaBuilderProps> = () => {
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]);
  const [reusableTypes, setReusableTypes] = useState<SchemaField[]>([]);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
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

  // New states for AI generation and merge/replace
  const [isAIGenerateDialogOpen, setIsAIGenerateDialogOpen] = useState(false);
  const [isMergeReplaceConfirmOpen, setIsMergeReplaceConfirmOpen] = useState(false);
  const [pendingGeneratedFields, setPendingGeneratedFields] = useState<SchemaField[]>([]);
  const [pendingGeneratedReusableTypes, setPendingGeneratedReusableTypes] = useState<SchemaField[]>([]);

  // New states for Field Refinement
  const [isFieldRefineDialogOpen, setIsFieldRefineDialogOpen] = useState(false);
  const [fieldToRefine, setFieldToRefine] = useState<SchemaField | null>(null);

  // State to control which tab opens in SchemaExportDialog
  const [exportDialogInitialTab, setExportDialogInitialTab] = useState<string>("json-schema");

  // Track initial load to determine if there are "unsaved changes"
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [initialSchemaFields, setInitialSchemaFields] = useState<string>("");
  const [initialReusableTypes, setInitialReusableTypes] = useState<string>("");

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

  const handleClearSchema = useCallback(() => {
    setSchemaFields([]);
    setReusableTypes([]); // Also clear reusable types
    setInitialSchemaFields(JSON.stringify([])); // Reset initial state
    setInitialReusableTypes(JSON.stringify([])); // Reset initial state
    showSuccess("Schema cleared successfully!");
    setIsClearConfirmOpen(false);
  }, []);

  const handleImportSchema = useCallback(() => {
    try {
      const parsedJson = JSON.parse(importJsonInput);
      const { mainFields, reusableTypes: importedReusableTypes } = convertFullJsonSchemaToSchemaFieldsAndReusableTypes(parsedJson);
      
      if (schemaFields.length > 0 || reusableTypes.length > 0) {
        setPendingGeneratedFields(mainFields);
        setPendingGeneratedReusableTypes(importedReusableTypes);
        setIsMergeReplaceConfirmOpen(true);
      } else {
        setSchemaFields(mainFields);
        setReusableTypes(importedReusableTypes);
        setInitialSchemaFields(JSON.stringify(mainFields));
        setInitialReusableTypes(JSON.stringify(importedReusableTypes));
        showSuccess("JSON schema imported successfully!");
        setIsImportDialogOpen(false);
        setImportJsonInput("");
      }
    } catch (error) {
      console.error("Failed to import JSON schema:", error);
      showError("Failed to import JSON schema. Please ensure it's valid JSON.");
    }
  }, [importJsonInput, schemaFields, reusableTypes]);

  const handleSaveSchemaByName = useCallback(() => {
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
  }, [saveSchemaName, savedSchemaNames, schemaFields, reusableTypes]);

  const handleLoadSchemaByName = useCallback(() => {
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
  }, [selectedLoadSchemaName]);

  const handleDeleteSavedSchema = useCallback((nameToDelete: string) => {
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
  }, [savedSchemaNames]);

  // Helper function to deep copy a SchemaField, generating new IDs for all children
  const deepCopyField = useCallback((field: SchemaField): SchemaField => {
    const newField: SchemaField = {
      ...field,
      id: uuidv4(), // Generate a new ID for the copied field
      parentId: undefined, // Clear parentId as it's now a root of a reusable type
    };
    if (newField.children) {
      newField.children = newField.children.map(deepCopyField); // Recursively copy children
    }
    return newField;
  }, []);

  const handleConvertToReusableType = useCallback((fieldId: string) => {
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
  }, [schemaFields, deepCopyField]);

  const handleAIGeneratedSchema = useCallback((mainFields: SchemaField[], newReusableTypes: SchemaField[]) => {
    if (schemaFields.length > 0 || reusableTypes.length > 0) {
      setPendingGeneratedFields(mainFields);
      setPendingGeneratedReusableTypes(newReusableTypes);
      setIsMergeReplaceConfirmOpen(true);
    } else {
      setSchemaFields(mainFields);
      setReusableTypes(newReusableTypes);
      setInitialSchemaFields(JSON.stringify(mainFields));
      setInitialReusableTypes(JSON.stringify(newReusableTypes));
      showSuccess("Schema generated and applied!");
    }
  }, [schemaFields, reusableTypes]);

  const handleReplaceSchema = useCallback(() => {
    setSchemaFields(pendingGeneratedFields);
    setReusableTypes(pendingGeneratedReusableTypes);
    setInitialSchemaFields(JSON.stringify(pendingGeneratedFields));
    setInitialReusableTypes(JSON.stringify(pendingGeneratedReusableTypes));
    showSuccess("Schema replaced successfully!");
    setIsMergeReplaceConfirmOpen(false);
    setPendingGeneratedFields([]);
    setPendingGeneratedReusableTypes([]);
  }, [pendingGeneratedFields, pendingGeneratedReusableTypes]);

  const handleMergeSchema = useCallback(() => {
    // Merge main fields
    const mergedFields = [...schemaFields, ...pendingGeneratedFields];
    // Merge reusable types, ensuring uniqueness by name (or ID if names can be duplicated)
    const mergedReusableTypesMap = new Map<string, SchemaField>();
    [...reusableTypes, ...pendingGeneratedReusableTypes].forEach(rt => {
      // Prioritize existing types if names clash, or merge properties if that's desired
      // For simplicity, we'll just use the last one if names clash.
      mergedReusableTypesMap.set(rt.name, rt);
    });
    const mergedReusableTypes = Array.from(mergedReusableTypesMap.values());

    setSchemaFields(mergedFields);
    setReusableTypes(mergedReusableTypes);
    setInitialSchemaFields(JSON.stringify(mergedFields));
    setInitialReusableTypes(JSON.stringify(mergedReusableTypes));
    showSuccess("Schema merged successfully!");
    setIsMergeReplaceConfirmOpen(false);
    setPendingGeneratedFields([]);
    setPendingGeneratedReusableTypes([]);
  }, [schemaFields, reusableTypes, pendingGeneratedFields, pendingGeneratedReusableTypes]);

  const handleRefineFieldWithAI = useCallback((field: SchemaField) => {
    setFieldToRefine(field);
    setIsFieldRefineDialogOpen(true);
  }, []);

  const handleFieldRefined = useCallback((refinedField: SchemaField) => {
    const updateFields = (fields: SchemaField[]): SchemaField[] => {
      return fields.map((field) => {
        if (field.id === refinedField.id) {
          return refinedField;
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
    setInitialSchemaFields(JSON.stringify(updateFields(schemaFields))); // Update initial state
    setIsFieldRefineDialogOpen(false);
    setFieldToRefine(null);
  }, [schemaFields]);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        JSON Schema Builder
      </h1>

      <div className="grid grid-cols-1 gap-8">
        <div className="space-y-6">
          <div className="sticky top-0 z-10 bg-background py-4 px-6 border-b">
            <SchemaBuilderToolbar
              onAddField={() => {
                // This addField is now handled by SchemaFieldList, but keeping it here for toolbar's direct action
                // In a real app, you might pass a specific addField for root level.
                // For now, it will trigger the SchemaFieldList's addField.
                // This is a slight redundancy but keeps the toolbar simple.
                // The SchemaFieldList's internal addField handles parentId logic.
                setSchemaFields(prev => [...prev, {
                  id: uuidv4(),
                  name: "",
                  type: "string",
                  isMultiple: false,
                  isRequired: true,
                }]);
              }}
              onClearSchemaTrigger={() => setIsClearConfirmOpen(true)}
              onImportSchemaTrigger={() => setIsImportDialogOpen(true)}
              onManageTypesTrigger={() => setIsManageTypesOpen(true)}
              onExportSchemaTrigger={() => { // Modified to open export dialog with json-schema tab
                setExportDialogInitialTab("json-schema");
                setIsExportDialogOpen(true);
              }}
              onSaveSchemaTrigger={() => setIsSaveDialogOpen(true)}
              onLoadSchemaTrigger={() => setIsLoadConfirmOpen(true)}
              onAIGenerateSchemaTrigger={() => setIsAIGenerateDialogOpen(true)} 
              hasSchemaFields={schemaFields.length > 0}
              hasUnsavedChanges={hasUnsavedChanges} // Pass the new prop
            />
          </div>

          <SchemaFieldList
            schemaFields={schemaFields}
            setSchemaFields={setSchemaFields}
            reusableTypes={reusableTypes}
            onManageReusableTypes={() => setIsManageTypesOpen(true)}
            onConvertToReusableType={handleConvertToReusableType}
            onRefineFieldWithAI={handleRefineFieldWithAI}
            onAIGenerateSchemaTrigger={() => setIsAIGenerateDialogOpen(true)}
          />

          {/* Dialogs for various actions */}
          <SchemaImportDialog
            isOpen={isImportDialogOpen}
            onOpenChange={setIsImportDialogOpen}
            importJsonInput={importJsonInput}
            onImportJsonInputChange={(e) => setImportJsonInput(e.target.value)}
            onImportSchema={handleImportSchema}
          />

          <SchemaExportDialog
            isOpen={isExportDialogOpen}
            onOpenChange={setIsExportDialogOpen}
            schemaFields={schemaFields}
            reusableTypes={reusableTypes}
            initialTab={exportDialogInitialTab} // Pass the initial tab
          />

          <SchemaClearConfirmation
            isOpen={isClearConfirmOpen}
            onOpenChange={setIsClearConfirmOpen}
            onConfirmClear={handleClearSchema}
          />

          <Dialog open={isManageTypesOpen} onOpenChange={setIsManageTypesOpen}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
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

          {/* New AI Generate Schema Dialog */}
          <SchemaAIGenerateDialog
            isOpen={isAIGenerateDialogOpen}
            onOpenChange={setIsAIGenerateDialogOpen}
            onSchemaGenerated={handleAIGeneratedSchema}
          />

          {/* New Merge/Replace Confirmation Dialog */}
          <SchemaMergeReplaceConfirmation
            isOpen={isMergeReplaceConfirmOpen}
            onOpenChange={setIsMergeReplaceConfirmOpen}
            onReplace={handleReplaceSchema}
            onMerge={handleMergeSchema}
          />

          {/* New Field Refine Dialog */}
          <FieldRefineDialog
            isOpen={isFieldRefineDialogOpen}
            onOpenChange={setIsFieldRefineDialogOpen}
            fieldToRefine={fieldToRefine}
            reusableTypes={reusableTypes}
            onFieldRefined={handleFieldRefined}
          />
        </div>
      </div>
    </div>
  );
};

export default SchemaBuilder;