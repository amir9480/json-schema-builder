import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, // Keep Select for reference type selection
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn, toTitleCase } from "@/lib/utils"; // Import toTitleCase
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import DropdownMenu components
import FieldTypeIcon from "./FieldTypeIcon"; // Import the new component

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
  reusableTypes = [], // Default to empty array
  hideRefTypeOption = false, // Default to false
}) => {
  // Manage the open state of advanced options locally within each FieldEditor
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);
  // Manage the open state of object properties locally within each FieldEditor
  const [isObjectPropertiesOpen, setIsObjectPropertiesOpen] = React.useState(true); // Default to open

  // Define a set of colors to cycle through for nested objects
  const borderColors = [
    "border-blue-400",
    "border-green-400",
    "border-purple-400",
    "border-yellow-400",
    "border-red-400",
  ];

  // Define background classes for light and dark mode based on nesting level
  const getBackgroundClasses = (currentLevel: number) => {
    if (currentLevel === 0) {
      return "bg-background"; // Root level uses theme-aware background
    }
    const lightShades = ["bg-gray-50", "bg-gray-100", "bg-gray-200", "bg-gray-300"];
    const darkShades = ["dark:bg-gray-800", "dark:bg-gray-850", "dark:bg-gray-900", "dark:bg-gray-925"];
    const index = (currentLevel - 1) % lightShades.length;
    return `${lightShades[index]} ${darkShades[index]}`;
  };

  const currentBorderColor = borderColors[(level - 1) % borderColors.length];

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    onFieldChange({ ...field, name: newName });
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
    // Set title to the input value. If empty, it will be undefined/empty string.
    onFieldChange({ ...field, title: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFieldChange({ ...field, description: e.target.value });
  };

  const handleExampleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFieldChange({ ...field, example: e.target.value });
  };

  const paddingLeft = level * 20;

  // Map of SchemaFieldType to its display name for the dropdown
  const typeOptions: { value: SchemaFieldType; label: string }[] = [
    { value: "string", label: "String" },
    { value: "int", label: "Integer" },
    { value: "float", label: "Float" },
    { value: "currency", label: "Currency" },
    { value: "date", label: "Date" },
    { value: "datetime", label: "DateTime" },
    { value: "object", label: "Object" },
    { value: "ref", label: "Reference ($ref)" },
  ];

  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-4 border rounded-md",
        getBackgroundClasses(level), // Apply dynamic background classes
        level > 0 && currentBorderColor // Apply specific border color for nested levels
      )}
      style={{ paddingLeft: `${paddingLeft + 16}px` }}
    >
      <div className="flex items-center gap-4">
        {/* Field Type Icon and DropdownMenu for selection */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <FieldTypeIcon type={field.type} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-auto p-0">
            {typeOptions.map((option) => {
              if (hideRefTypeOption && option.value === "ref") return null;
              return (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={() => handleTypeChange(option.value)}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    field.type === option.value && "font-bold bg-accent text-accent-foreground"
                  )}
                >
                  <FieldTypeIcon type={option.value} className="!bg-transparent !border-none !text-foreground" />
                  <span>{option.label}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1 grid gap-2">
          <Label htmlFor={`field-name-${field.id}`}>Field Name</Label>
          <Input
            id={`field-name-${field.id}`}
            value={field.name}
            onChange={handleNameChange}
            placeholder="e.g., productName"
          />
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
          onOpenChange={setIsAdvancedOpen} // Update local state
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
                  value={field.title || ""} // Controlled input
                  onChange={handleTitleChange}
                  placeholder={field.name ? toTitleCase(field.name) : "e.g., Product Name"} // Dynamic placeholder
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
        <Collapsible
          open={isObjectPropertiesOpen}
          onOpenChange={setIsObjectPropertiesOpen}
          className="flex flex-col gap-4 mt-4 border-t pt-4"
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start px-0 -mt-4">
              {isObjectPropertiesOpen ? (
                <ChevronUp className="h-4 w-4 mr-2" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-2" />
              )}
              <h3 className="text-md font-semibold">Properties for {field.name || "Unnamed Object"}:</h3>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            {field.children && field.children.length > 0 ? (
              field.children.map((childField) => (
                <FieldEditor
                  key={childField.id}
                  field={childField}
                  onFieldChange={onFieldChange}
                  onAddField={onAddField}
                  onRemoveField={onRemoveField}
                  level={level + 1}
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
                  level > 0 && borderColors[level % borderColors.length], // Match border color for nested levels
                  "text-foreground hover:bg-accent hover:text-accent-foreground" // General styling for button
                )}
              >
                <PlusCircle className="h-4 w-4 mr-2" /> Add Property to {field.name || "Unnamed Object"}
              </Button>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default FieldEditor;