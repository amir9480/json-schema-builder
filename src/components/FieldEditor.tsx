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
import { PlusCircle, Trash2, ChevronDown, ChevronUp, Settings, Link, List, GripVertical, Sparkles } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import new sub-components
import FieldAdvancedOptions from "./FieldAdvancedOptions";
import FieldDropdownOptions from "./FieldDropdownOptions";
import FieldObjectProperties from "./FieldObjectProperties";

export type SchemaFieldType =
  | "string"
  | "int"
  | "date"
  | "datetime"
  | "time" // Added new 'time' type
  | "float"
  | "currency"
  | "object"
  | "ref"
  | "dropdown"
  | "boolean";

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
  minValue?: number;
  maxValue?: number;
  minItems?: number;
  maxItems?: number;
  currency?: string;
  options?: string[];
  parentId?: string;
  isValidName?: boolean;
  pattern?: string;
  minLength?: number; // New: Minimum length for string
  maxLength?: number; // New: Maximum length for string
}

interface FieldEditorProps {
  field: SchemaField;
  onFieldChange: (field: SchemaField) => void;
  onAddField?: (parentId: string) => void;
  onRemoveField?: (fieldId: string) => void;
  onMoveField?: (fieldId: string, direction: "up" | "down", parentId?: string) => void;
  isRoot?: boolean;
  level?: number;
  reusableTypes?: SchemaField[];
  hideRefTypeOption?: boolean;
  dragHandleAttributes?: React.HTMLAttributes<HTMLButtonElement>;
  dragHandleListeners?: React.HTMLAttributes<HTMLButtonElement>;
  isFirstItem?: boolean;
  isLastItem?: boolean;
  onManageReusableTypes?: () => void;
  onConvertToReusableType?: (fieldId: string) => void;
  onRefineFieldWithAI?: (field: SchemaField) => void;
}

const FieldEditor: React.FC<FieldEditorProps> = React.memo(({
  field,
  onFieldChange,
  onAddField,
  onRemoveField,
  onMoveField,
  isRoot = false,
  level = 0,
  reusableTypes = [],
  hideRefTypeOption = false,
  dragHandleAttributes,
  dragHandleListeners,
  isFirstItem = false,
  isLastItem = false,
  onManageReusableTypes,
  onConvertToReusableType,
  onRefineFieldWithAI,
}) => {
  const [nameError, setNameError] = React.useState<string | null>(null);

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

  const validateName = (name: string): boolean => {
    // Allow alphanumeric, underscore, and hyphen. Must not be empty.
    const isValid = /^[a-zA-Z0-9_-]*$/.test(name) && name.trim() !== "";
    if (!isValid) {
      setNameError("Name must be alphanumeric, hyphens, or underscores (no spaces).");
    } else {
      setNameError(null);
    }
    return isValid;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    const isValid = validateName(newName);
    onFieldChange({ ...field, name: newName, isValidName: isValid });
  };

  // Validate initial name on mount
  React.useEffect(() => {
    validateName(field.name);
  }, [field.name]);


  const handleTypeChange = (value: SchemaFieldType) => {
    onFieldChange({
      ...field,
      type: value,
      children: value === "object" ? field.children || [] : undefined,
      refId: value === "ref" ? field.refId : undefined,
      minValue: (value === "int" || value === "float" || value === "currency") ? field.minValue : undefined,
      maxValue: (value === "int" || value === "float" || value === "currency") ? field.maxValue : undefined,
      currency: value === "currency" ? field.currency : undefined,
      options: value === "dropdown" ? field.options || [] : undefined,
      pattern: (value === "string" || value === "date" || value === "datetime" || value === "time") ? field.pattern : undefined, // Keep pattern for string, date, datetime, time
      minLength: value === "string" ? field.minLength : undefined, // Preserve minLength for string, clear for others
      maxLength: value === "string" ? field.maxLength : undefined, // Preserve maxLength for string, clear for others
    });
  };

  const handleRefChange = (refId: string) => {
    onFieldChange({ ...field, refId: refId });
  };

  const handleMultipleChange = (checked: boolean) => {
    onFieldChange({
      ...field,
      isMultiple: checked,
      minItems: checked ? field.minItems : undefined,
      maxItems: checked ? field.maxItems : undefined,
    });
  };

  const handleRequiredChange = (checked: boolean) => {
    onFieldChange({ ...field, isRequired: checked });
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

  const typeOptions: { value: SchemaFieldType; label: string }[] = [
    { value: "string", label: "String" },
    { value: "int", label: "Integer" },
    { value: "float", label: "Float" },
    { value: "currency", label: "Currency" },
    { value: "date", label: "Date" },
    { value: "datetime", label: "DateTime" },
    { value: "time", label: "Time" }, // Added new 'time' option
    { value: "object", label: "Object" },
    { value: "dropdown", label: "Dropdown" },
    { value: "boolean", label: "Boolean" },
    { value: "ref", label: "Reference ($ref)" },
  ];

  return (
    <div
      className={cn(
        "flex flex-col gap-4 py-4 border rounded-md px-6",
        getBackgroundClasses(level),
        level > 0 && currentBorderColor
      )}
    >
      <div className="flex flex-wrap items-center gap-4">
        {/* Drag and Move Buttons */}
        {!isRoot && (
          <div className="flex flex-col items-center justify-center h-full py-4 -my-4 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={handleMoveUp}
              disabled={isFirstItem}
              aria-label="Move field up"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-grab"
              {...dragHandleListeners}
              {...dragHandleAttributes}
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={handleMoveDown}
              disabled={isLastItem}
              aria-label="Move field down"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}

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

        <div className="flex-1 flex flex-col gap-2 min-w-[150px]">
          <div className="grid gap-2 flex-1">
            <Input
              id={`field-name-${field.id}`}
              value={field.name}
              onChange={handleNameChange}
              placeholder="e.g., productName"
              className={cn(nameError && "border-red-500 focus-visible:ring-red-500")}
            />
          </div>
          {nameError && (
            <p className="text-red-500 text-xs mt-1">{nameError}</p>
          )}
        </div>

        {onConvertToReusableType && !isRoot && !hideRefTypeOption && field.type !== "ref" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600 shrink-0" aria-label="Convert to reusable type" onClick={() => onConvertToReusableType(field.id)}>
                <Link className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Convert to Reusable Type</p>
            </TooltipContent>
          </Tooltip>
        )}

        <div className="flex items-center space-x-2 min-w-[100px]">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-2 cursor-pointer">
                <Switch
                  id={`multiple-switch-${field.id}`}
                  checked={field.isMultiple}
                  onCheckedChange={handleMultipleChange}
                />
                <Label htmlFor={`multiple-switch-${field.id}`}>Multiple</Label>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>If enabled, this field will be an array (list) of values.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {!isRoot && (
          <div className="flex items-center space-x-2 min-w-[100px]">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2 cursor-pointer">
                  <Switch
                    id={`required-switch-${field.id}`}
                    checked={field.isRequired}
                    onCheckedChange={handleRequiredChange}
                  />
                  <Label htmlFor={`required-switch-${field.id}`}>Required</Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>If enabled, this field must be present in the data.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {onRefineFieldWithAI && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="icon"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
                onClick={() => onRefineFieldWithAI(field)}
                aria-label="Refine field with AI"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refine field with AI</p>
            </TooltipContent>
          </Tooltip>
        )}

        {!isRoot && onRemoveField && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
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

      {field.type === "ref" && (
        <div className="grid gap-2 mt-2">
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

      {field.type !== "ref" && (
        <FieldAdvancedOptions field={field} onFieldChange={onFieldChange} />
      )}

      {field.type === "dropdown" && (
        <FieldDropdownOptions field={field} onFieldChange={onFieldChange} />
      )}

      {field.type === "object" && (
        <FieldObjectProperties
          field={field}
          onFieldChange={onFieldChange}
          onAddField={onAddField}
          onRemoveField={onRemoveField}
          onMoveField={onMoveField}
          level={level}
          reusableTypes={reusableTypes}
          hideRefTypeOption={hideRefTypeOption}
          onManageReusableTypes={onManageReusableTypes}
          onConvertToReusableType={onConvertToReusableType}
          onRefineFieldWithAI={onRefineFieldWithAI}
        />
      )}
    </div>
  );
});

FieldEditor.displayName = "FieldEditor";

export default FieldEditor;