import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

export type SchemaFieldType =
  | "string"
  | "int"
  | "date"
  | "datetime"
  | "float"
  | "currency"
  | "object"
  | "ref"; // New type for references

export interface SchemaField {
  id: string;
  name: string;
  type: SchemaFieldType;
  isMultiple: boolean;
  isRequired: boolean;
  title?: string;
  description?: string;
  example?: string;
  children?: SchemaField[]; // For 'object' type
  refId?: string; // New: ID of the reusable type it references, if type is 'ref'
}

interface FieldEditorProps {
  field: SchemaField;
  onFieldChange: (field: SchemaField) => void;
  onAddField?: (parentId: string) => void;
  onRemoveField?: (fieldId: string) => void;
  isRoot?: boolean;
  level?: number;
  activeAdvancedFieldId: string | null;
  setActiveAdvancedFieldId: (id: string | null) => void;
  reusableTypes?: SchemaField[]; // New prop to pass reusable types
  hideRefTypeOption?: boolean; // New prop to hide 'ref' type option
}

const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  onFieldChange,
  onAddField,
  onRemoveField,
  isRoot = false,
  level = 0,
  activeAdvancedFieldId,
  setActiveAdvancedFieldId,
  reusableTypes = [], // Default to empty array
  hideRefTypeOption = false, // Default to false
}) => {
  const isAdvancedOpen = field.id === activeAdvancedFieldId;

  // Define a set of colors to cycle through for nested objects
  const borderColors = [
    "border-blue-400",
    "border-green-400",
    "border-purple-400",
    "border-yellow-400",
    "border-red-400",
  ];
  const bgColors = [
    "bg-blue-50/30",
    "bg-green-50/30",
    "bg-purple-50/30",
    "bg-yellow-50/30",
    "bg-red-50/30",
  ];
  const textColors = [
    "text-blue-600",
    "text-green-600",
    "text-purple-600",
    "text-yellow-600",
    "text-red-600",
  ];
  const hoverBgColors = [
    "hover:bg-blue-100",
    "hover:bg-green-100",
    "hover:bg-purple-100",
    "hover:bg-yellow-100",
    "hover:bg-red-100",
  ];

  const colorIndex = level % borderColors.length;
  const currentBorderColor = borderColors[colorIndex];
  const currentBgColor = bgColors[colorIndex];
  const currentTextColor = textColors[colorIndex];
  const currentHoverBgColors = hoverBgColors[colorIndex];

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFieldChange({ ...field, name: e.target.value });
  };

  const handleTypeChange = (value: SchemaFieldType) => {
    onFieldChange({
      ...field,
      type: value,
      children: value === "object" ? field.children || [] : undefined,
      refId: value === "ref" ? field.refId : undefined, // Clear refId if not 'ref'
    });
  };

  const handleRefChange = (refId: string) => {
    onFieldChange({ ...field, refId: refId });
  };

  const handleMultipleChange = (checked: boolean) => {
    onFieldChange({ ...field, isMultiple: checked });
  };

  const handleRequiredChange = (checked: boolean) => {
    onFieldChange({ ...field, isRequired: checked });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFieldChange({ ...field, title: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFieldChange({ ...field, description: e.target.value });
  };

  const handleExampleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFieldChange({ ...field, example: e.target.value });
  };

  const paddingLeft = level * 20;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-4 border rounded-md",
        level > 0 ? currentBgColor : "bg-background", // Use specific color for nested, default for root
        currentBorderColor // Apply specific border color
      )}
      style={{ paddingLeft: `${paddingLeft + 16}px` }}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 grid gap-2">
          <Label htmlFor={`field-name-${field.id}`}>Field Name</Label>
          <Input
            id={`field-name-${field.id}`}
            value={field.name}
            onChange={handleNameChange}
            placeholder="e.g., productName"
          />
        </div>

        <div className="flex-1 grid gap-2">
          <Label htmlFor={`field-type-${field.id}`}>Type</Label>
          <Select
            value={field.type}
            onValueChange={(value: SchemaFieldType) => handleTypeChange(value)}
          >
            <SelectTrigger id={`field-type-${field.id}`}>
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="string">String</SelectItem>
              <SelectItem value="int">Integer</SelectItem>
              <SelectItem value="float">Float</SelectItem>
              <SelectItem value="currency">Currency</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="datetime">DateTime</SelectItem>
              <SelectItem value="object">Object</SelectItem>
              {!hideRefTypeOption && <SelectItem value="ref">Reference ($ref)</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        {field.type === "ref" && (
          <div className="flex-1 grid gap-2">
            <Label htmlFor={`field-ref-${field.id}`}>Select Reference</Label>
            <Select
              value={field.refId || ""}
              onValueChange={handleRefChange}
            >
              <SelectTrigger id={`field-ref-${field.id}`}>
                <SelectValue placeholder="Select a reusable type" />
              </SelectTrigger>
              <SelectContent>
                {reusableTypes.length === 0 && (
                  <SelectItem value="no-types" disabled>
                    No reusable types defined.
                  </SelectItem>
                )}
                {reusableTypes.map((rt) => (
                  <SelectItem key={rt.id} value={rt.id}>
                    {rt.name || "Unnamed Type"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center space-x-2 mt-auto pb-2">
          <Switch
            id={`multiple-switch-${field.id}`}
            checked={field.isMultiple}
            onCheckedChange={handleMultipleChange}
          />
          <Label htmlFor={`multiple-switch-${field.id}`}>Multiple</Label>
        </div>

        <div className="flex items-center space-x-2 mt-auto pb-2">
          <Switch
            id={`required-switch-${field.id}`}
            checked={field.isRequired}
            onCheckedChange={handleRequiredChange}
          />
          <Label htmlFor={`required-switch-${field.id}`}>Required</Label>
        </div>

        {!isRoot && onRemoveField && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="mt-auto"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the field "{field.name || "Unnamed Field"}" and any nested properties.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onRemoveField(field.id)} className="bg-red-500 hover:bg-red-600 text-white">
                  Delete Field
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {field.type !== "ref" && ( // Advanced options not applicable for references
        <Collapsible
          open={isAdvancedOpen}
          onOpenChange={(open) => {
            if (open) {
              setActiveAdvancedFieldId(field.id);
            } else if (activeAdvancedFieldId === field.id) {
              setActiveAdvancedFieldId(null);
            }
          }}
          className="w-full space-y-2"
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start px-0">
              {isAdvancedOpen ? (
                <ChevronUp className="h-4 w-4 mr-2" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-2" />
              )}
              Advanced options
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor={`field-title-${field.id}`}>Title (Optional)</Label>
                <Input
                  id={`field-title-${field.id}`}
                  value={field.title || ""}
                  onChange={handleTitleChange}
                  placeholder="e.g., Product Name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`field-description-${field.id}`}>Description (Optional)</Label>
                <Input
                  id={`field-description-${field.id}`}
                  value={field.description || ""}
                  onChange={handleDescriptionChange}
                  placeholder="e.g., Name of the product"
                />
              </div>
              <div className="grid gap-2 col-span-full">
                <Label htmlFor={`field-example-${field.id}`}>Example Value (Optional)</Label>
                <Input
                  id={`field-example-${field.id}`}
                  value={field.example || ""}
                  onChange={handleExampleChange}
                  placeholder="e.g., 'Laptop', 123, '2023-10-26'"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {field.type === "object" && (
        <div className="flex flex-col gap-4 mt-4 border-t pt-4">
          <h3 className="text-md font-semibold">Object Properties:</h3>
          {field.children && field.children.length > 0 ? (
            field.children.map((childField) => (
              <FieldEditor
                key={childField.id}
                field={childField}
                onFieldChange={onFieldChange}
                onAddField={onAddField}
                onRemoveField={onRemoveField}
                level={level + 1}
                activeAdvancedFieldId={activeAdvancedFieldId}
                setActiveAdvancedFieldId={setActiveAdvancedFieldId}
                reusableTypes={reusableTypes} // Pass reusable types to children
                hideRefTypeOption={hideRefTypeOption} // Pass down the prop
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No properties defined for this object.
            </p>
          )}
          {onAddField && (
            <Button
              variant="outline"
              onClick={() => onAddField(field.id)}
              className={cn(
                "w-full",
                currentBorderColor, // Match border color
                currentTextColor,   // Match text color
                currentHoverBgColors, // Match hover background color
                "hover:text-foreground" // Ensure text color on hover is readable
              )}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Add Property to {field.name || "Unnamed Object"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default FieldEditor;