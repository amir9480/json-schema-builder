import React from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CustomCollapsibleContent } from "@/components/CustomCollapsibleContent"; // Import CustomCollapsibleContent
import { PlusCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import SortableFieldEditor from "./SortableFieldEditor";
import { SchemaField } from "./FieldEditor";
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
  arrayMove,
} from "@dnd-kit/sortable";

interface FieldObjectPropertiesProps {
  field: SchemaField;
  onFieldChange: (field: SchemaField) => void;
  onAddField?: (parentId: string) => void;
  onRemoveField?: (fieldId: string) => void;
  onMoveField?: (fieldId: string, direction: "up" | "down", parentId?: string) => void;
  level: number;
  reusableTypes: SchemaField[];
  hideRefTypeOption: boolean;
  onManageReusableTypes?: () => void;
  onConvertToReusableType?: (fieldId: string) => void;
}

const FieldObjectProperties: React.FC<FieldObjectPropertiesProps> = React.memo(({
  field,
  onFieldChange,
  onAddField,
  onRemoveField,
  onMoveField,
  level,
  reusableTypes,
  hideRefTypeOption,
  onManageReusableTypes,
  onConvertToReusableType,
}) => {
  const [isObjectPropertiesOpen, setIsObjectPropertiesOpen] = React.useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const borderColors = [
    "border-blue-400",
    "border-green-400",
    "border-purple-400",
    "border-yellow-400",
    "border-red-400",
  ];

  const handleNestedDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && field.children) {
      const oldIndex = field.children.findIndex((f) => f.id === active.id);
      const newIndex = field.children.findIndex((f) => f.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newChildren = arrayMove(field.children, oldIndex, newIndex);
        onFieldChange({ ...field, children: newChildren });
      }
    }
  };

  return (
    <Collapsible
      open={isObjectPropertiesOpen}
      onOpenChange={setIsObjectPropertiesOpen}
      className="flex flex-col gap-4 mt-4 border-t pt-4"
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-start px-6 -mt-4">
          {isObjectPropertiesOpen ? (
            <ChevronUp className="h-4 w-4 mr-2" />
          ) : (
            <ChevronDown className="h-4 w-4 mr-2" />
          )}
          <h3 className="text-md font-semibold">Properties for {field.name || "Unnamed Object"}:</h3>
        </Button>
      </CollapsibleTrigger>
      <CustomCollapsibleContent className="space-y-4"> {/* Use CustomCollapsibleContent */}
        {field.children && field.children.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleNestedDragEnd}
          >
            <SortableContext
              items={field.children.map((child) => child.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {field.children.map((childField, index) => (
                  <SortableFieldEditor
                    key={childField.id}
                    field={childField}
                    onFieldChange={onFieldChange}
                    onAddField={onAddField}
                    onRemoveField={onRemoveField}
                    onMoveField={onMoveField}
                    level={level + 1}
                    reusableTypes={reusableTypes}
                    hideRefTypeOption={hideRefTypeOption}
                    isFirst={index === 0}
                    isLast={index === (field.children?.length || 0) - 1}
                    onManageReusableTypes={onManageReusableTypes}
                    onConvertToReusableType={onConvertToReusableType}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <p className="text-sm text-muted-foreground px-6">
            No properties defined for this object.
          </p>
        )}
        {onAddField && (
          <Button
            variant="outline"
            onClick={() => onAddField(field.id)}
            className={cn(
              "w-full px-6",
              level > 0 && borderColors[level % borderColors.length],
              "text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add Property to {field.name || "Unnamed Object"}
          </Button>
        )}
      </CustomCollapsibleContent>
    </Collapsible>
  );
});

FieldObjectProperties.displayName = "FieldObjectProperties";

export default FieldObjectProperties;