import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { SchemaField } from "./FieldEditor";

interface SchemaSaveLoadDialogsProps {
  isSaveDialogOpen: boolean;
  setIsSaveDialogOpen: (open: boolean) => void;
  isLoadDialogOpen: boolean;
  setIsLoadDialogOpen: (open: boolean) => void;
  isLoadConfirmOpen: boolean;
  setIsLoadConfirmOpen: (open: boolean) => void;
  saveSchemaName: string;
  setSaveSchemaName: (name: string) => void;
  selectedLoadSchemaName: string;
  setSelectedLoadSchemaName: (name: string) => void;
  savedSchemaNames: string[];
  setSavedSchemaNames: (names: string[]) => void;
  schemaFields: SchemaField[];
  reusableTypes: SchemaField[];
  setSchemaFields: (fields: SchemaField[]) => void;
  setReusableTypes: (types: SchemaField[]) => void;
  hasUnsavedChanges: boolean; // New prop to indicate if there are unsaved changes
}

const LOCAL_STORAGE_SAVED_SCHEMAS_INDEX_KEY = "jsonSchemaBuilderSavedSchemasIndex";

const SchemaSaveLoadDialogs: React.FC<SchemaSaveLoadDialogsProps> = ({
  isSaveDialogOpen,
  setIsSaveDialogOpen,
  isLoadDialogOpen,
  setIsLoadDialogOpen,
  isLoadConfirmOpen,
  setIsLoadConfirmOpen,
  saveSchemaName,
  setSaveSchemaName,
  selectedLoadSchemaName,
  setSelectedLoadSchemaName,
  savedSchemaNames,
  setSavedSchemaNames,
  schemaFields,
  reusableTypes,
  setSchemaFields,
  setReusableTypes,
  hasUnsavedChanges,
}) => {

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
      const updatedNames = savedSchemaNames.filter((name) => name !== nameToDelete);
      setSavedSchemaNames(updatedNames);
      localStorage.setItem(LOCAL_STORAGE_SAVED_SCHEMAS_INDEX_KEY, JSON.stringify(updatedNames));
      showSuccess(`Schema "${nameToDelete}" deleted successfully!`);
      if (selectedLoadSchemaName === nameToDelete) {
        setSelectedLoadSchemaName(""); // Clear selection if deleted
      }
    } catch (error) {
      console.error("Failed to delete saved schema:", error);
      showError("Failed to delete schema. Please try again.");
    }
  };

  const handleOpenLoadDialog = () => {
    if (hasUnsavedChanges) {
      setIsLoadConfirmOpen(true);
    } else {
      setIsLoadDialogOpen(true);
    }
  };

  const handleConfirmLoad = () => {
    setIsLoadConfirmOpen(false);
    setIsLoadDialogOpen(true);
  };

  return (
    <>
      {/* Save Schema Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
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

      {/* Load Schema Confirmation Dialog */}
      <AlertDialog open={isLoadConfirmOpen} onOpenChange={setIsLoadConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Current Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in your current schema. Loading a new schema will overwrite your current work. Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLoad}>
              Discard and Load
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Actual Load Schema Dialog */}
      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
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
    </>
  );
};

export default SchemaSaveLoadDialogs;