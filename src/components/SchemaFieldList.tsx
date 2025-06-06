import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { SchemaField } from "./FieldEditor";
import SortableFieldEditor from "./SortableFieldEditor";
import { v4 as uuidv4 } from "uuid";
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
import GenerateSchemaPromptCard from "./GenerateSchemaPromptCard";

interface SchemaFieldListProps {
  schemaFields: SchemaField[];
  setSchemaFields: React.Dispatch<React.SetStateAction<SchemaField[]>>;
  reusableTypes: SchemaField[];
  onManageReusableTypes: () => void;
  onConvertToReusableType: (fieldId: string) => void;
  onRefineFieldWithAI: (field: SchemaField) => void;
  onAIGenerateSchemaTrigger: () => void;
}

const SchemaFieldList: React.FC<SchemaFieldListProps> = ({
  schemaFields,
  setSchemaFields,
  reusableTypes,
  onManageReusableTypes,
  onConvertToReusableType,
  onRefineFieldWithAI,
  onAIGenerateSchemaTrigger,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const addField = useCallback((parentId?: string) => {
    const newField: SchemaField = {
      id: uuidv4(),
      name: "",
      type: "string",
      isMultiple: false,
      isRequired: true,
      parentId: parentId,
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
  }, [setSchemaFields]);

  const addNestedField = useCallback((
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
  }, []);

  const handleFieldChange = useCallback((updatedField: SchemaField) => {
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
  }, [schemaFields, setSchemaFields]);

  const removeField = useCallback((fieldId: string) => {
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
  }, [schemaFields, setSchemaFields]);

  const findParentAndReorder = useCallback((
    fields: SchemaField[],
    activeId: string,
    overId: string,
  ): SchemaField[] => {
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      if (field.id === activeId || field.id === overId) {
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
    return fields;
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSchemaFields((prevFields) => {
        const updatedFields = findParentAndReorder(prevFields, active.id as string, over?.id as string);
        return updatedFields;
      });
    }
  }, [findParentAndReorder, setSchemaFields]);

  const moveField = useCallback((fieldId: string, direction: "up" | "down", parentId?: string) => {
    const updateFields = (fields: SchemaField[]): SchemaField[] => {
      const index = fields.findIndex(f => f.id === fieldId);
      if (index === -1) {
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

      if (newIndex === index) return fields;

      return arrayMove(fields, index, newIndex);
    };

    setSchemaFields((prevFields) => {
      if (parentId) {
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
        return updateFields(prevFields);
      }
    });
  }, [setSchemaFields]);

  return (
    <>
      {schemaFields.length === 0 ? (
        <GenerateSchemaPromptCard onAIGenerateSchemaTrigger={onAIGenerateSchemaTrigger} />
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
                  onManageReusableTypes={onManageReusableTypes}
                  onConvertToReusableType={onConvertToReusableType}
                  onRefineFieldWithAI={onRefineFieldWithAI}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      <Button onClick={() => addField()} className="w-full">
        <PlusCircle className="h-4 w-4 mr-2" /> Add New Field
      </Button>
    </>
  );
};

export default SchemaFieldList;