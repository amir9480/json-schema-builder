import React from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import FieldEditor, { SchemaField } from "./FieldEditor";
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
import { showSuccess, showError } from "@/utils/toast";

interface ManageReusableTypesProps {
  reusableTypes: SchemaField[];
  setReusableTypes: React.Dispatch<React.SetStateAction<SchemaField[]>>;
  onClose: () => void;
}

const ManageReusableTypes: React.FC<ManageReusableTypesProps> = ({
  reusableTypes,
  setReusableTypes,
  onClose,
}) => {
  const [activeAdvancedFieldId, setActiveAdvancedFieldId] = React.useState<string | null>(null);

  const addReusableType = () => {
    const newType: SchemaField = {
      id: uuidv4(),
      name: `NewType${reusableTypes.length + 1}`,
      type: "object", // Reusable types are always objects
      isMultiple: false,
      isRequired: false, // Reusable types themselves are not 'required' in the same sense
      children: [],
    };
    setReusableTypes((prev) => [...prev, newType]);
    showSuccess("New reusable type added!");
  };

  const handleReusableTypeChange = (updatedType: SchemaField) => {
    setReusableTypes((prev) =>
      prev.map((type) => (type.id === updatedType.id ? updatedType : type)),
    );
  };

  const removeReusableType = (typeId: string) => {
    setReusableTypes((prev) => prev.filter((type) => type.id !== typeId));
    showSuccess("Reusable type removed!");
  };

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-semibold">Manage Reusable Types</h2>
      <p className="text-muted-foreground">
        Define object schemas here that can be reused as references ($ref) in your main schema.
      </p>

      {reusableTypes.length === 0 ? (
        <p className="text-muted-foreground text-center">
          No reusable types defined yet. Click "Add New Reusable Type" to get started.
        </p>
      ) : (
        <div className="space-y-4">
          {reusableTypes.map((type) => (
            <div key={type.id} className="border p-4 rounded-md bg-gray-50 dark:bg-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {type.name || "Unnamed Reusable Type"}
                </h3>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the reusable type "{type.name || "Unnamed Type"}" and all its properties. Any fields in your main schema referencing this type will become invalid.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeReusableType(type.id)} className="bg-red-500 hover:bg-red-600 text-white">
                        Delete Type
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <FieldEditor
                field={type}
                onFieldChange={handleReusableTypeChange}
                onAddField={(parentId) => {
                  // Logic to add child field to a reusable type
                  setReusableTypes((prev) =>
                    prev.map((rt) =>
                      rt.id === type.id
                        ? {
                            ...rt,
                            children: rt.children
                              ? [...rt.children, { id: uuidv4(), name: "", type: "string", isMultiple: false, isRequired: true }]
                              : [{ id: uuidv4(), name: "", type: "string", isMultiple: false, isRequired: true }],
                          }
                        : rt,
                    ),
                  );
                }}
                onRemoveField={(fieldId) => {
                  // Logic to remove child field from a reusable type
                  setReusableTypes((prev) =>
                    prev.map((rt) =>
                      rt.id === type.id
                        ? {
                            ...rt,
                            children: rt.children?.filter((child) => child.id !== fieldId),
                          }
                        : rt,
                    ),
                  );
                }}
                isRoot={true} // Treat reusable types as root for their own editing context
                level={0}
                activeAdvancedFieldId={activeAdvancedFieldId}
                setActiveAdvancedFieldId={setActiveAdvancedFieldId}
                reusableTypes={reusableTypes} // Pass reusable types for nested refs
              />
            </div>
          ))}
        </div>
      )}

      <Button onClick={addReusableType} className="w-full">
        <PlusCircle className="h-4 w-4 mr-2" /> Add New Reusable Type
      </Button>
      <Button variant="outline" onClick={onClose} className="w-full mt-4">
        Close
      </Button>
    </div>
  );
};

export default ManageReusableTypes;