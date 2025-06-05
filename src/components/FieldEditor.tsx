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

export type SchemaFieldType =
  | "string"
  | "int"
  | "date"
  | "datetime"
  | "float"
  | "currency"
  | "object"
  | "ref";

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
}

interface FieldEditorProps {
  field: SchemaField;
  onFieldChange: (field: SchemaField) => void;
  onAddField?: (parentId: string) => void;
  onRemoveField?: (fieldId: string) => void;
  isRoot?: boolean;
  level?: number;
  reusableTypes?: SchemaField[];
  hideRefTypeOption?: boolean;
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
  isRoot = false,
  level = 0,
  reusableTypes = [],
  hideRefTypeOption = false,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);
  const [isObjectPropertiesOpen, setIsObjectPropertiesOpen] = React.useState(true);

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

  const paddingLeft = level * 20;

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
                  reusableTypes={reusableTypes}
                  hideRefTypeOption={hideRefTypeOption}
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