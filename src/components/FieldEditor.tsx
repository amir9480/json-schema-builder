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
import { PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type SchemaFieldType =
  | "string"
  | "int"
  | "date"
  | "datetime"
  | "float"
  | "currency"
  | "object";

export interface SchemaField {
  id: string;
  name: string;
  type: SchemaFieldType;
  isMultiple: boolean;
  isRequired: boolean;
  title?: string; // Added title property
  description?: string; // Added description property
  children?: SchemaField[]; // For 'object' types
}

interface FieldEditorProps {
  field: SchemaField;
  onFieldChange: (field: SchemaField) => void;
  onAddField?: (parentId: string) => void;
  onRemoveField?: (fieldId: string) => void;
  isRoot?: boolean;
  level?: number;
}

const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  onFieldChange,
  onAddField,
  onRemoveField,
  isRoot = false,
  level = 0,
}) => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFieldChange({ ...field, name: e.target.value });
  };

  const handleTypeChange = (value: SchemaFieldType) => {
    onFieldChange({
      ...field,
      type: value,
      children: value === "object" ? field.children || [] : undefined,
    });
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

  const paddingLeft = level * 20; // Adjust indentation based on level

  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-4 border rounded-md",
        level > 0 && "bg-muted/50",
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
            </SelectContent>
          </Select>
        </div>

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
          <Button
            variant="destructive"
            size="icon"
            onClick={() => onRemoveField(field.id)}
            className="mt-auto"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

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
      </div>

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
              className="w-full"
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Add Property
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default FieldEditor;