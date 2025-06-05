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
  AlertDialogTrigger,
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
import { XCircle, Pencil } from "lucide-react"; // Import Pencil icon
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
  const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false);
  const [schemaToRename, setSchemaToRename] = React.useState<string | null>(null);
  const [newSchemaName, setNewSchemaName] = React.useState("");

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

  const handleRenameSchema = () => {
    if (!schemaToRename) return;

    const trimmedNewName = newSchemaName.trim();
    if (!trimmedNewName) {
      showError("New schema name cannot be empty.");
      return;
    }
    if (trimmedNewName === schemaToRename) {
      showError("New name is the same as the old name.");
      return;
    }
    if (savedSchemaNames.includes(trimmedNewName)) {
      showError(`A schema with the name "${trimmedNewName}" already exists. Please choose a different name.`);
      return;
    }

    try {
      // Get old data
      const oldFields = localStorage.getItem(`dyad_schema_${schemaToRename}_fields`);
      const oldReusableTypes = localStorage.getItem(`dyad_schema_${schemaToRename}_reusableTypes`);

      // Save with new name
      if (oldFields) localStorage.setItem(`dyad_schema_${trimmedNewName}_fields`, oldFields);
      if (oldReusableTypes) localStorage.setItem(`dyad_schema_${trimmedNewName}_reusableTypes`, oldReusableTypes);

      // Delete old entries
      localStorage.removeItem(`dyad_schema_${schemaToRename}_fields`);
      localStorage.removeItem(`dyad_schema_${schemaToRename}_reusableTypes`);

      // Update saved names index
      const updatedNames = savedSchemaNames.map(name =>
        name === schemaToRename ? trimmedNewName : name
      );
      setSavedSchemaNames(updatedNames);
      localStorage.setItem(LOCAL_STORAGE_SAVED_SCHEMAS_INDEX_KEY, JSON.stringify(updatedNames));

      showSuccess(`Schema "${schemaToRename}" renamed to "${trimmedNewName}" successfully!`);
      setIsRenameDialogOpen(false);
      setSchemaToRename(null);
      setNewSchemaName("");
      if (selectedLoadSchemaName === schemaToRename) {
        setSelectedLoadSchemaName(trimmedNewName); // Update selection if renamed
      }
    } catch (error) {
      console.error("Failed to rename schema:", error);
      showError("Failed to rename schema. Please try again.");
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
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-500 hover:text-blue-600"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent select from closing
                              setSchemaToRename(name);
                              setNewSchemaName(name);
                              setIsRenameDialogOpen(true);
                            }}
                            aria-label={`Rename ${name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-500 hover:text-red-600"
                                onClick={(e) => e.stopPropagation()} // Prevent select from closing
                                aria-label={`Delete ${name}`}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the saved schema "{name}".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteSavedSchema(name)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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

      {/* Rename Schema Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Schema</DialogTitle>
            <DialogDescription>
              Enter a new name for "{schemaToRename}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="new-schema-name">New Schema Name</Label>
            <Input
              id="new-schema-name"
              value={newSchemaName}
              onChange={(e) => setNewSchemaName(e.target.value)}
              placeholder="e.g., UpdatedProductSchema"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRenameSchema}>Rename</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SchemaSaveLoadDialogs;