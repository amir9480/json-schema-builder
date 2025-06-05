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
import { PlusCircle, Trash2, ChevronDown, ChevronUp, Settings, Link, List } from "lucide-react";
import { cn, toTitleCase } from "@/lib/utils";
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
} from "@/components/ui/dropdown-menu";
import FieldTypeIcon from "./FieldTypeIcon";
import SortableFieldEditor from "./SortableFieldEditor"; // Import SortableFieldEditor for nested fields
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Import Tooltip components

export type SchemaFieldType =
  | "string"
  | "int"
  | "date"
  | "datetime"
  | "float"
  | "currency"
  | "object"
  | "ref"
  | "dropdown"; // Added new type

export interface SchemaField {
  id: string;
  name: string;
  type: SchemaFieldType;
  isMultiple: boolean;
  isRequired: boolean;
  title?: string;
  description?: string;
  example?: string;
  children?: SchemaField[];
  refId?: string;
  minValue?: number; // Minimum value for number types
  maxValue?: number; // Maximum value for number types
  minItems?: number; // Minimum items for array types
  maxItems?: number; // Maximum items for array types
  currency?: string; // Currency code for 'currency' type
  options?: string[]; // New: Options for 'dropdown' type
  parentId?: string; // New: Parent ID for nested fields
}

interface FieldEditorProps {
  field: SchemaField;
  onFieldChange: (field: SchemaField) => void;
  onAddField?: (parentId: string) => void;
  onRemoveField?: (fieldId: string) => void;
  onMoveField?: (fieldId: string, direction: "up" | "down", parentId?: string) => void; // New prop
  isRoot?: boolean;
  level?: number;
  reusableTypes?: SchemaField[];
  hideRefTypeOption?: boolean;
  isDraggable?: boolean; // Prop to control drag handle visibility
  onManageReusableTypes?: () => void; // New prop
  onConvertToReusableType?: (fieldId: string) => void; // New prop
}

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD - United States Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "CHF", label: "CHF - Swiss Franc" },
  { value: "CNY", label: "CNY - Chinese Yuan" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "BRL", label: "BRL - Brazilian Real" },
];

const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  onFieldChange,
  onAddField,
  onRemoveField,
  onMoveField, // Destructure new prop
  isRoot = false,
  level = 0,
  reusableTypes = [],
  hideRefTypeOption = false,
  isDraggable = true,
  onManageReusableTypes, // Destructure new prop
  onConvertToReusableType, // Destructure new prop
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);
  const [isObjectPropertiesOpen, setIsObjectPropertiesOpen] = React.useState(true);
  const [isDropdownOptionsOpen, setIsDropdownOptionsOpen] = React.useState(true); // New state for dropdown options
  const [newOption, setNewOption] = React.useState(""); // State for new dropdown option

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

  const getBackgroundClasses = (currentLevel: number) => {
    if (currentLevel === 0) {
      return "bg-background";
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
      refId: value === "ref" ? field.refId : undefined,
      // Clear number specific properties if type changes and is no longer a number-like type
      minValue: (value === "int" || value === "float" || value === "currency") ? field.minValue : undefined,
      maxValue: (value === "int" || value === "float" || value === "currency") ? field.maxValue : undefined,
      currency: value === "currency" ? field.currency : undefined, // Keep currency for 'currency' type
      options: value === "dropdown" ? field.options || [] : undefined, // Initialize options for dropdown
    });
  };

  const handleRefChange = (refId: string) => {
    onFieldChange({ ...field, refId: refId });
  };

  const handleMultipleChange = (checked: boolean) => {
    onFieldChange({
      ...field,
      isMultiple: checked,
      // Clear min/max items if not multiple
      minItems: checked ? field.minItems : undefined,
      maxItems: checked ? field.maxItems : undefined,
    });
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

  const handleMinValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
    onFieldChange({ ...field, minValue: value });
  };

  const handleMaxValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
    onFieldChange({ ...field, maxValue: value });
  };

  const handleMinItemsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
    onFieldChange({ ...field, minItems: value });
  };

  const handleMaxItemsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
    onFieldChange({ ...field, maxItems: value });
  };

  const handleCurrencyChange = (value: string) => {
    onFieldChange({ ...field, currency: value });
  };

  const handleAddOption = () => {
    if (newOption.trim() !== "") {
      const updatedOptions = [...(field.options || []), newOption.trim()];
      onFieldChange({ ...field, options: updatedOptions });
      setNewOption("");
    }
  };

  const handleRemoveOption = (optionToRemove: string) => {
    const updatedOptions = (field.options || []).filter(
      (option) => option !== optionToRemove
    );
    onFieldChange({ ...field, options: updatedOptions });
  };

  const handleEditOption = (oldOption: string, newText: string) => {
    const updatedOptions = (field.options || []).map((option) =>
      option === oldOption ? newText.trim() : option
    );
    onFieldChange({ ...field, options: updatedOptions });
  };

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

  const paddingLeft = level * 20;

  const typeOptions: { value: SchemaFieldType; label: string }[] = [
    { value: "string", label: "String" },
    { value: "int", label: "Integer" },
    { value: "float", label: "Float" },
    { value: "currency", label: "Currency" },
    { value: "date", label: "Date" },
    { value: "datetime", label: "DateTime" },
    { value: "object", label: "Object" },
    { value: "dropdown", label: "Dropdown" }, // Added new type
    { value: "ref", label: "Reference ($ref)" },
  ];

  // Number-like types that can have min/max values
  const isNumberLikeType = field.type === "int" || field.type === "float" || field.type === "currency";

  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-4 border rounded-md",
        getBackgroundClasses(level),
        level > 0 && currentBorderColor
      )}
      style={{ paddingLeft: `${paddingLeft + 16}px` }}
    >
      <div className="flex items-center gap-4">
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
          <div className="flex items-center gap-2"> {/* Container for Label and Convert button */}
            <Label htmlFor={`field-name-${field.id}`}>Field Name</Label>
            {onConvertToReusableType && field.type !== "ref" && !isRoot && !hideRefTypeOption && (
              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-blue-600" aria-label="Convert to reusable type">
                        <Link className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Convert to Reusable Type</p>
                  </TooltipContent>
                </Tooltip>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Convert to Reusable Type?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will convert "{field.name || "Unnamed Field"}" into a new reusable type. The original field will become a reference to this new type. Are you sure you want to proceed?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onConvertToReusableType(field.id)}>
                      Convert
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <Input
            id={`field-name-${field.id}`}
            value={field.name}
            onChange={handleNameChange}
            placeholder="e.g., productName"
            className="flex-1"
          />
        </div>

        {field.type === "ref" && (
          <div className="flex-1 grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`field-ref-${field.id}`}>Select Reference</Label>
              {onManageReusableTypes && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onManageReusableTypes}
                  className="h-auto px-2 py-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Settings className="h-3 w-3 mr-1" /> Manage Types
                </Button>
              )}
            </div>
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

      {/* Advanced Options Collapsible */}
      {field.type !== "ref" && (
        <Collapsible
          open={isAdvancedOpen}
          onOpenChange={setIsAdvancedOpen}
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
                  placeholder={field.name ? toTitleCase(field.name) : "e.g., Product Name"}
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

              {isNumberLikeType && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor={`field-min-value-${field.id}`}>Min Value (Optional)</Label>
                    <Input
                      id={`field-min-value-${field.id}`}
                      type="number"
                      value={field.minValue === undefined ? "" : field.minValue}
                      onChange={handleMinValueChange}
                      placeholder="e.g., 0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`field-max-value-${field.id}`}>Max Value (Optional)</Label>
                    <Input
                      id={`field-max-value-${field.id}`}
                      type="number"
                      value={field.maxValue === undefined ? "" : field.maxValue}
                      onChange={handleMaxValueChange}
                      placeholder="e.g., 100"
                    />
                  </div>
                </>
              )}

              {field.isMultiple && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor={`field-min-items-${field.id}`}>Min Items (Optional)</Label>
                    <Input
                      id={`field-min-items-${field.id}`}
                      type="number"
                      value={field.minItems === undefined ? "" : field.minItems}
                      onChange={handleMinItemsChange}
                      placeholder="e.g., 1"
                      min="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`field-max-items-${field.id}`}>Max Items (Optional)</Label>
                    <Input
                      id={`field-max-items-${field.id}`}
                      type="number"
                      value={field.maxItems === undefined ? "" : field.maxItems}
                      onChange={handleMaxItemsChange}
                      placeholder="e.g., 10"
                      min="0"
                    />
                  </div>
                </>
              )}

              {field.type === "currency" && (
                <div className="grid gap-2 col-span-full">
                  <Label htmlFor={`field-currency-${field.id}`}>Currency (Optional)</Label>
                  <Select
                    value={field.currency || ""}
                    onValueChange={handleCurrencyChange}
                  >
                    <SelectTrigger id={`field-currency-${field.id}`}>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Dropdown Options Collapsible */}
      {field.type === "dropdown" && (
        <Collapsible
          open={isDropdownOptionsOpen}
          onOpenChange={setIsDropdownOptionsOpen}
          className="flex flex-col gap-4 mt-4 border-t pt-4"
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start px-0 -mt-4">
              {isDropdownOptionsOpen ? (
                <ChevronUp className="h-4 w-4 mr-2" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-2" />
              )}
              <h3 className="text-md font-semibold">Options for {field.name || "Unnamed Dropdown"}:</h3>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <div className="grid gap-2 col-span-full">
              <Label htmlFor={`field-options-${field.id}`}>Dropdown Options</Label>
              <div className="flex gap-2">
                <Input
                  id={`field-options-${field.id}`}
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Add new option"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                />
                <Button onClick={handleAddOption} variant="outline" size="icon">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
              {field.options && field.options.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {field.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => handleEditOption(option, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveOption(option)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No options added yet.</p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Object Properties Collapsible */}
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
                        onMoveField={onMoveField} // Pass down for nested sorting
                        level={level + 1}
                        reusableTypes={reusableTypes}
                        hideRefTypeOption={hideRefTypeOption}
                        isDraggable={isDraggable}
                        isFirst={index === 0}
                        isLast={index === (field.children?.length || 0) - 1}
                        onManageReusableTypes={onManageReusableTypes} // Pass the function here
                        onConvertToReusableType={onConvertToReusableType} // Pass the function here
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
                  level > 0 && borderColors[level % borderColors.length],
                  "text-foreground hover:bg-accent hover:text-accent-foreground"
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