import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import FieldEditor, { SchemaField } from "./FieldEditor";
import { Button } from "@/components/ui/button";
import { GripVertical, ChevronUp, ChevronDown } from "lucide-react";
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
  isDraggable?: boolean; // New prop to control drag handle visibility
  isFirst?: boolean; // New prop to disable 'move up' for the first item
  isLast?: boolean; // New prop to disable 'move down' for the last item
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
  isDraggable = true,
  isFirst = false,
  isLast = false,
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

  const handleMoveUp = () => {
    if (onMoveField) {
      onMoveField(field.id, "up", field.parentId);
    }
  };

  const handleMoveDown = () => {
    if (onMoveField) {
      onMoveField(field.id, "down", field.parentId);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "ring-2 ring-blue-500 rounded-md")}>
      <div className="flex items-start gap-2">
        {isDraggable && (
          <div className="flex flex-col items-center justify-center h-full py-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={handleMoveUp}
              disabled={isFirst}
              aria-label="Move field up"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-grab"
              {...listeners}
              {...attributes}
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={handleMoveDown}
              disabled={isLast}
              aria-label="Move field down"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex-1">
          <FieldEditor
            field={field}
            onFieldChange={onFieldChange}
            onAddField={onAddField}
            onRemoveField={onRemoveField}
            onMoveField={onMoveField} // Pass down for nested sorting
            isRoot={isRoot}
            level={level}
            reusableTypes={reusableTypes}
            hideRefTypeOption={hideRefTypeOption}
            isDraggable={isDraggable} // Pass down to control nested drag handles
          />
        </div>
      </div>
    </div>
  );
};

export default SortableFieldEditor;