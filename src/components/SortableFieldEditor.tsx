import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import FieldEditor, { SchemaField } from "./FieldEditor";
import { cn } from "@/lib/utils";

interface SortableFieldEditorProps {
  field: SchemaField;
  onFieldChange: (field: SchemaField) => void;
  onAddField?: (parentId: string) => void;
  onRemoveField?: (fieldId: string) => void;
  onMoveField?: (fieldId: string, direction: "up" | "down", parentId?: string) => void;
  isRoot?: boolean;
  level?: number;
  reusableTypes?: SchemaField[];
  hideRefTypeOption?: boolean;
  isFirst?: boolean; // New prop to disable 'move up' for the first item
  isLast?: boolean; // New prop to disable 'move down' for the last item
  onManageReusableTypes?: () => void;
  onConvertToReusableType?: (fieldId: string) => void;
}

const SortableFieldEditor: React.FC<SortableFieldEditorProps> = ({
  field,
  onFieldChange,
  onAddField,
  onRemoveField,
  onMoveField,
  isRoot = false,
  level = 0,
  reusableTypes = [],
  hideRefTypeOption = false,
  isFirst = false,
  isLast = false,
  onManageReusableTypes,
  onConvertToReusableType,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0, // Bring dragged item to front
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "ring-2 ring-blue-500 rounded-md")}>
      <FieldEditor
        field={field}
        onFieldChange={onFieldChange}
        onAddField={onAddField}
        onRemoveField={onRemoveField}
        onMoveField={onMoveField}
        isRoot={isRoot}
        level={level}
        reusableTypes={reusableTypes}
        hideRefTypeOption={hideRefTypeOption}
        dragHandleAttributes={attributes} // Pass drag attributes
        dragHandleListeners={listeners} // Pass drag listeners
        isFirstItem={isFirst} // Pass isFirst
        isLastItem={isLast} // Pass isLast
        onManageReusableTypes={onManageReusableTypes}
        onConvertToReusableType={onConvertToReusableType}
      />
    </div>
  );
};

export default SortableFieldEditor;