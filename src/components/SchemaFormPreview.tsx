import React from "react";
import { SchemaField, SchemaFieldType } from "./FieldEditor";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SchemaFormPreviewProps {
  fields: SchemaField[];
  level?: number;
}

const getPlaceholderValue = (type: SchemaFieldType): string => {
  switch (type) {
    case "string":
      return "Lorem ipsum string";
    case "int":
      return "123";
    case "float":
      return "123.45";
    case "currency":
      return "123.45 USD";
    case "date":
      return "2023-01-01";
    case "datetime":
      return "2023-01-01T12:00:00Z";
    case "object":
      return ""; // Objects will render their children
    default:
      return "N/A";
  }
};

const SchemaFormPreview: React.FC<SchemaFormPreviewProps> = ({ fields, level = 0 }) => {
  const paddingLeft = level * 20;

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div
          key={field.id}
          className={cn(
            "flex flex-col gap-2 p-3 rounded-md",
            level > 0 ? "bg-muted/30 border border-dashed" : "bg-background",
          )}
          style={{ paddingLeft: `${paddingLeft + 12}px` }}
        >
          <Label className="text-sm font-medium">
            {field.name}
            {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            {field.isMultiple && <span className="text-muted-foreground ml-1">(Multiple)</span>}
          </Label>
          {field.type === "object" ? (
            <div className="ml-4 mt-2 space-y-2">
              <p className="text-sm text-muted-foreground">Object Properties:</p>
              {field.children && field.children.length > 0 ? (
                <SchemaFormPreview fields={field.children} level={level + 1} />
              ) : (
                <p className="text-xs text-muted-foreground italic">No properties defined.</p>
              )}
            </div>
          ) : (
            <Input
              type="text" // Using text for simplicity in preview
              value={field.example || getPlaceholderValue(field.type)}
              readOnly
              className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default SchemaFormPreview;