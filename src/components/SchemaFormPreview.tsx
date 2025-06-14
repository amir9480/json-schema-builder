import React from "react";
import { SchemaField, SchemaFieldType } from "./FieldEditor";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"; // Import Switch for boolean type
import { cn, toTitleCase } from "@/lib/utils";

interface SchemaFormPreviewProps {
  fields: SchemaField[];
  level?: number;
  reusableTypes: SchemaField[];
  formData?: Record<string, any>; // New prop for AI-generated form data
}

const currencySymbolMap: Record<string, string> = {
  "USD": "$",
  "EUR": "€",
  "GBP": "£",
  "JPY": "¥",
  "CAD": "C$",
  "AUD": "A$",
  "CHF": "CHF", // Often used as code
  "CNY": "¥",
  "INR": "₹",
  "BRL": "R$",
};

const getCurrencySymbol = (code: string | undefined): string => {
  if (!code) return "";
  return currencySymbolMap[code] || code; // Fallback to code if symbol not found
};

const getPlaceholderValue = (type: SchemaFieldType, currencyCode?: string, options?: string[]): string => {
  switch (type) {
    case "string":
      return "Lorem ipsum string";
    case "int":
      return "123";
    case "float":
      return "123.45";
    case "currency":
      return `${getCurrencySymbol(currencyCode || 'USD')} 123.45`; // Placeholder for currency value
    case "date":
      return "2023-01-01";
    case "datetime":
      return "2023-01-01T12:00:00Z";
    case "object":
      return "";
    case "ref":
      return "Referenced Value";
    case "dropdown":
      return options && options.length > 0 ? options[0] : "Select an option";
    case "boolean":
      return "true/false"; // Placeholder for boolean
    default:
      return "N/A";
  }
};

const SchemaFormPreview: React.FC<SchemaFormPreviewProps> = ({ fields, level = 0, reusableTypes, formData }) => {
  const paddingLeft = level * 20;

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        let displayField = field;
        let isReference = false;
        const fieldValue = formData ? formData[field.name] : undefined;

        if (field.type === "ref" && field.refId) {
          const referencedType = reusableTypes.find(rt => rt.id === field.refId);
          if (referencedType) {
            displayField = { ...field, type: referencedType.type, children: referencedType.children, options: referencedType.options };
            isReference = true;
          } else {
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
                  {field.title || toTitleCase(field.name)} <span className="text-xs italic">(Invalid Reference)</span>
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

        const isNumberType = displayField.type === "int" || displayField.type === "float" || displayField.type === "currency";

        return (
          <div
            key={field.id}
            className={cn(
              "flex flex-col gap-2 p-3 rounded-md",
              level > 0 ? "bg-muted/30 border border-dashed" : "bg-background",
              isReference && "border-blue-300 bg-blue-50/20"
            )}
            style={{ paddingLeft: `${paddingLeft + 12}px` }}
          >
            <Label className="text-sm font-medium">
              {field.title || toTitleCase(field.name)}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              {field.isMultiple && <span className="text-muted-foreground ml-1">(Multiple)</span>}
              {isReference && <span className="text-blue-600 ml-1">(Ref: {reusableTypes.find(rt => rt.id === field.refId)?.name || 'Unknown'})</span>}
            </Label>
            {displayField.isMultiple ? (
              Array.isArray(fieldValue) && fieldValue.length > 0 ? (
                <div className="space-y-4 mt-2">
                  {fieldValue.map((item, idx) => (
                    <div key={idx} className="border border-dashed p-3 rounded-md bg-gray-50 dark:bg-gray-800">
                      <p className="text-sm font-semibold mb-2 text-muted-foreground">Item {idx + 1}</p>
                      {displayField.type === "object" ? ( // Check if the resolved item type is an object
                        <SchemaFormPreview
                          fields={displayField.children || []} // Use children of the resolved object type
                          level={level + 1}
                          reusableTypes={reusableTypes}
                          formData={item} // Pass the individual object data
                        />
                      ) : (
                        // If it's an array of primitives (string, int, float, etc.)
                        <Input
                          type="text"
                          value={String(item)}
                          readOnly
                          className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Input
                  type="text"
                  value="No items generated"
                  readOnly
                  className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                />
              )
            ) : (
              displayField.type === "object" ? (
                <div className="ml-4 mt-2 space-y-2">
                  <p className="text-sm text-muted-foreground">Object Properties:</p>
                  {displayField.children && displayField.children.length > 0 ? (
                    <SchemaFormPreview fields={displayField.children} level={level + 1} reusableTypes={reusableTypes} formData={fieldValue} />
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No properties defined.</p>
                  )}
                </div>
              ) : displayField.type === "dropdown" ? (
                <Select value={fieldValue !== undefined ? String(fieldValue) : (displayField.example || (displayField.options && displayField.options.length > 0 ? displayField.options[0] : ""))}>
                  <SelectTrigger className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">
                    <SelectValue placeholder={getPlaceholderValue(displayField.type, undefined, displayField.options)} />
                  </SelectTrigger>
                  <SelectContent>
                    {displayField.options && displayField.options.length > 0 ? (
                      displayField.options.map((option, idx) => (
                        <SelectItem key={idx} value={option}>
                          {option}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-options" disabled>No options defined</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              ) : displayField.type === "boolean" ? (
                <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-700">
                  <Switch
                    checked={fieldValue !== undefined ? Boolean(fieldValue) : (displayField.example === 'true')}
                    disabled // Preview only, not interactive
                  />
                  <Label>{fieldValue !== undefined ? String(fieldValue) : (displayField.example === 'true' ? 'True' : 'False')}</Label>
                </div>
              ) : (
                <Input
                  type="text"
                  value={fieldValue !== undefined ? String(fieldValue) : (field.example || getPlaceholderValue(displayField.type, field.currency))}
                  readOnly
                  className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                />
              )
            )}
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
              {isNumberType && (
                <>
                  {field.minValue !== undefined && <span>Min: {field.minValue}</span>}
                  {field.maxValue !== undefined && <span>Max: {field.maxValue}</span>}
                </>
              )}
              {field.isMultiple && (
                <>
                  {field.minItems !== undefined && <span>Min Items: {field.minItems}</span>}
                  {field.maxItems !== undefined && <span>Max Items: {field.maxItems}</span>}
                </>
              )}
              {displayField.type === "currency" && displayField.currency && (
                <span>Currency: {displayField.currency}</span>
              )}
              {displayField.type === "string" && displayField.pattern && (
                <span>Pattern: <code>{displayField.pattern}</code></span>
              )}
              {displayField.type === "string" && displayField.minLength !== undefined && (
                <span>Min Length: {displayField.minLength}</span>
              )}
              {displayField.type === "string" && displayField.maxLength !== undefined && (
                <span>Max Length: {displayField.maxLength}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SchemaFormPreview;