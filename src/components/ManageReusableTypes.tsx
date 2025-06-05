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
import { arrayMove } from "@dnd-kit/sortable"; // Import arrayMove

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

  // Helper to update a field anywhere in the schema tree (used for onFieldChange)
  const updateFieldInTree = (fields: SchemaField[], updatedField: SchemaField): SchemaField[] => {
    return fields.map((field) => {
      if (field.id === updatedField.id) {
        return updatedField;
      } else if (field.type === "object" && field.children) {
        return {
          ...field,
          children: updateFieldInTree(field.children, updatedField),
        };
      }
      return field;
    });
  };

  const handleReusableTypeChange = (updatedField: SchemaField) => {
    setReusableTypes((prev) => updateFieldInTree(prev, updatedField));
  };

  // Helper to add a new field to a specific parent within a reusable type's children
  const addFieldToReusableType = (reusableTypeId: string, parentId: string) => {
    const newField: SchemaField = {
      id: uuidv4(),
      name: "",
      type: "string",
      isMultiple: false,
      isRequired: true,
    };

    setReusableTypes((prevReusableTypes) =>
      prevReusableTypes.map((rt) => {
        if (rt.id === reusableTypeId) {
          // If the parentId is the reusable type itself, add the new field directly to its children
          if (rt.id === parentId) {
            return {
              ...rt,
              children: rt.children ? [...rt.children, newField] : [newField],
            };
          }

          // Otherwise, find the nested parent and add the field
          const addNested = (fields: SchemaField[]): SchemaField[] => {
            return fields.map((field) => {
              if (field.id === parentId) {
                return {
                  ...field,
                  children: field.children ? [...field.children, newField] : [newField],
                };
              } else if (field.type === "object" && field.children) {
                return {
                  ...field,
                  children: addNested(field.children),
                };
              }
              return field;
            });
          };
          return { ...rt, children: addNested(rt.children || []) };
        }
        return rt;
      })
    );
  };

  // Helper to remove a field from anywhere within a reusable type's children
  const removeFieldFromReusableType = (reusableTypeId: string, fieldIdToRemove: string) => {
    setReusableTypes((prevReusableTypes) =>
      prevReusableTypes.map((rt) => {
        if (rt.id === reusableTypeId) {
          const filterNested = (fields: SchemaField[]): SchemaField[] => {
            return fields.filter((field) => {
              if (field.id === fieldIdToRemove) {
                return false;
              }
              if (field.type === "object" && field.children) {
                field.children = filterNested(field.children);
              }
              return true;
            });
          };
          return { ...rt, children: filterNested(rt.children || []) };
        }
        return rt;
      })
    );
  };

  // New function to handle moving fields within a reusable type's children
  const handleMoveFieldInReusableType = (
    reusableTypeId: string,
    fieldId: string,
    direction: "up" | "down",
    parentId?: string,
  ) => {
    setReusableTypes((prevReusableTypes) =>
      prevReusableTypes.map((rt) => {
        if (rt.id === reusableTypeId) {
          const updateChildren = (fields: SchemaField[]): SchemaField[] => {
            const index = fields.findIndex((f) => f.id === fieldId);
            if (index === -1) {
              // Field not found at this level, check children of objects
              return fields.map((f) => {
                if (f.type === "object" && f.children) {
                  return { ...f, children: updateChildren(f.children) };
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

          // If parentId is the reusable type itself, or undefined (meaning it's a direct child of the reusable type object)
          // then update its direct children. Otherwise, find the nested parent.
          if (!parentId || rt.id === parentId) {
            return { ...rt, children: updateChildren(rt.children || []) };
          } else {
            // Find the nested parent and update its children
            const findAndMoveInNested = (currentFields: SchemaField[]): SchemaField[] => {
              return currentFields.map((field) => {
                if (field.id === parentId && field.type === "object" && field.children) {
                  return { ...field, children: updateChildren(field.children) };
                } else if (field.type === "object" && field.children) {
                  return { ...field, children: findAndMoveInNested(field.children) };
                }
                return field;
              });
            };
            return { ...rt, children: findAndMoveInNested(rt.children || []) };
          }
        }
        return rt;
      })
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
                onAddField={(parentId) => addFieldToReusableType(type.id, parentId)}
                onRemoveField={(fieldId) => removeFieldFromReusableType(type.id, fieldId)}
                onMoveField={(fieldId, direction, parentId) => handleMoveFieldInReusableType(type.id, fieldId, direction, parentId)} // Pass the new move handler
                isRoot={true} // Treat reusable types as root for their own editing context
                level={0}
                activeAdvancedFieldId={activeAdvancedFieldId}
                setActiveAdvancedFieldId={setActiveAdvancedFieldId}
                reusableTypes={reusableTypes} // Pass reusable types for nested refs
                hideRefTypeOption={true} // Hide 'ref' type option for fields within reusable types
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