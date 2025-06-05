import React from "react";
import { SchemaField, SchemaFieldType } from "./FieldEditor";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SchemaFormPreviewProps {
  fields: SchemaField[];
  level?: number;
  reusableTypes: SchemaField[]; // New prop to resolve references
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
    case "ref": // Should not be called directly for ref, but as a fallback
      return "Referenced Value";
    default:
      return "N/A";
  }
};

const SchemaFormPreview: React.FC<SchemaFormPreviewProps> = ({ fields, level = 0, reusableTypes }) => {
  const paddingLeft = level * 20;

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        let displayField = field;
        let isReference = false;

        if (field.type === "ref" && field.refId) {
          const referencedType = reusableTypes.find(rt => rt.id === field.refId);
          if (referencedType) {
            displayField = { ...field, type: referencedType.type, children: referencedType.children };
            isReference = true;
          } else {
            // Handle invalid reference
            return (
              <div
                key={field.id}
                className={cn(
                  "flex flex-col gap-2 p-3 rounded-md bg-red-50/30 border border-dashed border-red-400",
                  level > 0 ? "bg-muted/30 border border-dashed" : "bg-background",
                )}
                style={{ paddingLeft: `${paddingLeft + 12}px` }}
              >
                <Label className="text-sm font-medium text-red-600">
                  {field.title || field.name} <span className="text-xs italic">(Invalid Reference)</span>
                </Label>
                <Input
                  type="text"
                  value="Error: Referenced type not found"
                  readOnly
                  className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700"
                />
              </div>
            );
          }
        }

        return (
          <div
            key={field.id}
            className={cn(
              "flex flex-col gap-2 p-3 rounded-md",
              level > 0 ? "bg-muted/30 border border-dashed" : "bg-background",
              isReference && "border-blue-300 bg-blue-50/20" // Highlight references
            )}
            style={{ paddingLeft: `${paddingLeft + 12}px` }}
          >
            <Label className="text-sm font-medium">
              {field.title || field.name} {/* Use field.title, fallback to field.name */}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              {field.isMultiple && <span className="text-muted-foreground ml-1">(Multiple)</span>}
              {isReference && <span className="text-blue-600 ml-1">(Ref: {reusableTypes.find(rt => rt.id === field.refId)?.name || 'Unknown'})</span>}
            </Label>
            {displayField.type === "object" ? (
              <div className="ml-4 mt-2 space-y-2">
                <p className="text-sm text-muted-foreground">Object Properties:</p>
                {displayField.children && displayField.children.length > 0 ? (
                  <SchemaFormPreview fields={displayField.children} level={level + 1} reusableTypes={reusableTypes} />
                ) : (
                  <p className="text-xs text-muted-foreground italic">No properties defined.</p>
                )}
              </div>
            ) : (
              <Input
                type="text" // Using text for simplicity in preview
                value={field.example || getPlaceholderValue(displayField.type)}
                readOnly
                className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SchemaFormPreview;