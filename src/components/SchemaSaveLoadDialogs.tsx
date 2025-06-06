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
import { Button } from "@/components/ui/button";
import { XCircle, Pencil } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { SchemaField } from "./FieldEditor";
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea

interface SchemaSaveLoadDialogsProps {
  isSaveDialogOpen: boolean;
  setIsSaveDialogOpen: (open: boolean) => void;
  isLoadDialogOpen: boolean;
  setIsLoadDialogOpen: (open: boolean) => void;
  isLoadConfirmOpen: boolean;
  setIsLoadConfirmOpen: (open: boolean) => void;
  saveSchemaName: string;
  setSaveSchemaName: (name: string) => void;
  selectedLoadSchemaName: string; // Still used for internal tracking if needed, but not for Select component
  setSelectedLoadSchemaName: (name: string) => void; // Still used for internal tracking if needed
  savedSchemaNames: string[];
  setSavedSchemaNames: (names: string[]) => void;
  schemaFields: SchemaField[];
  reusableTypes: SchemaField[];
  setSchemaFields: (fields: SchemaField[]) => void;
  setReusableTypes: (types: SchemaField[]) => void;
  hasUnsavedChanges: boolean;
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
  selectedLoadSchemaName, // Keep for potential future use or internal logic
  setSelectedLoadSchemaName, // Keep for potential future use or internal logic
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

  const handleLoadSchemaByName = (schemaName: string) => {
    try {
      const loadedFields = localStorage.getItem(`dyad_schema_${schemaName}_fields`);
      const loadedReusableTypes = localStorage.getItem(`dyad_schema_${schemaName}_reusableTypes`);

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

      showSuccess(`Schema "${schemaName}" loaded successfully!`);
      setIsLoadDialogOpen(false);
      // setSelectedLoadSchemaName(""); // No longer needed for Select component
    } catch (error) {
      console.error("Failed to load schema by name:", error);
      showError("Failed to load schema. It might be corrupted.");
    }
  };

  const handleDeleteSavedSchema = (nameToDelete: string) => {
    console.log("Attempting to delete schema:", nameToDelete);
    try {
      localStorage.removeItem(`dyad_schema_${nameToDelete}_fields`);
      console.log(`Removed fields for: dyad_schema_${nameToDelete}_fields`);
      localStorage.removeItem(`dyad_schema_${nameToDelete}_reusableTypes`);
      console.log(`Removed reusable types for: dyad_schema_${nameToDelete}_reusableTypes`);

      const updatedNames = savedSchemaNames.filter((name) => name !== nameToDelete);
      setSavedSchemaNames(updatedNames);
      localStorage.setItem(LOCAL_STORAGE_SAVED_SCHEMAS_INDEX_KEY, JSON.stringify(updatedNames));
      console.log("Updated saved schema names in localStorage:", updatedNames);
      
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
    <React.Fragment>
      {/* Save Schema Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-xl"> {/* Increased width */}
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
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col"> {/* Increased width */}
          <DialogHeader>
            <DialogTitle>Load Saved Schema</DialogTitle>
            <DialogDescription>
              Select a schema to load. This will replace your current schema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 flex-1 overflow-hidden">
            <Label>Saved Schemas</Label>
            {savedSchemaNames.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No schemas saved yet.
              </p>
            ) : (
              <ScrollArea className="h-full max-h-[calc(80vh-180px)] rounded-md border">
                <div className="p-2">
                  {savedSchemaNames.map((name) => (
                    <div
                      key={name}
                      className="flex items-center justify-between p-2 mb-2 border rounded-md bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <span className="font-medium truncate flex-1 mr-2">{name}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLoadSchemaByName(name)}
                          aria-label={`Load ${name}`}
                        >
                          Load
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-blue-600"
                          onClick={(e) => {
                            // e.stopPropagation(); // Removed
                            // e.preventDefault(); // Removed
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
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                              // onClick={(e) => { // Removed onClick from here
                              //   e.stopPropagation();
                              //   e.preventDefault();
                              // }}
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
                  ))
                }
                </div>
              </ScrollArea>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-auto">
            <Button variant="outline" onClick={() => setIsLoadDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Schema Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-xl"> {/* Increased width */}
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
    </React.Fragment>
  );
};

export default SchemaSaveLoadDialogs;