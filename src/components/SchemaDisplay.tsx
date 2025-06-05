import React from "react";
import { SchemaField, SchemaFieldType } from "./FieldEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { toTitleCase } from "@/lib/utils";

interface SchemaDisplayProps {
  schemaFields: SchemaField[];
  reusableTypes: SchemaField[]; // New prop for reusable types
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

const mapTypeToJsonSchemaType = (type: SchemaFieldType): string => {
  switch (type) {
    case "int":
    case "float":
      return "number";
    case "date":
    case "datetime":
    case "currency":
    case "dropdown": // Dropdown is a string type with enum
      return "string";
    default:
      return type;
  }
};

const mapTypeToJsonSchemaFormat = (type: SchemaFieldType): string | undefined => {
  switch (type) {
    case "date":
      return "date";
    case "datetime":
      return "date-time";
    default:
      return undefined;
  }
};

/**
 * Recursively builds the properties and required array for a given set of SchemaFields.
 * This function is designed to be called for the root schema, nested objects, and reusable type definitions.
 * It takes the full list of reusableTypes and the already built definitions to resolve references.
 */
const buildPropertiesAndRequired = (
  fields: SchemaField[],
  reusableTypes: SchemaField[],
  definitions: { [key: string]: any }
): { properties: any; required: string[] } => {
  const properties: { [key: string]: any } = {};
  const required: string[] = [];

  fields.forEach((field) => {
    if (field.name === "") {
      // Skip fields with empty names, they are incomplete
      return;
    }

    let fieldSchema: any = {};

    if (field.type === "ref") {
      const referencedType = reusableTypes.find(rt => rt.id === field.refId);
      if (referencedType && referencedType.name && definitions[referencedType.name]) {
        // Reference to an already built definition
        fieldSchema = { "$ref": `#/definitions/${referencedType.name}` };
      } else {
        // Fallback if reference is invalid or not found in definitions
        fieldSchema = { type: "object", description: "Invalid or undefined reference" };
      }
    } else {
      const baseType = mapTypeToJsonSchemaType(field.type);
      const format = mapTypeToJsonSchemaFormat(field.type);

      fieldSchema.type = baseType;

      if (format) {
        fieldSchema.format = format;
      }
      // Use field.title if available, otherwise generate from field.name
      fieldSchema.title = field.title || toTitleCase(field.name);
      
      if (field.description) {
        fieldSchema.description = field.description;
      }
      if (field.example !== undefined) {
        // Attempt to parse example based on type for better JSON representation
        try {
          if (field.type === "int" || field.type === "float") {
            fieldSchema.example = parseFloat(field.example);
            if (isNaN(fieldSchema.example)) delete fieldSchema.example; // Remove if not a valid number
          } else if (field.type === "currency") { // Keep currency example as string
            fieldSchema.example = field.example;
          } else {
            fieldSchema.example = field.example;
          }
        } catch (e) {
          fieldSchema.example = field.example; // Fallback to string if parsing fails
        }
      }

      // Add pattern for date and datetime types
      if (field.type === "date") {
        fieldSchema.pattern = "^\\d{4}-\\d{2}-\\d{2}$"; // YYYY-MM-DD
      } else if (field.type === "datetime") {
        fieldSchema.pattern = "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})?$"; // ISO 8601
      } else if (field.type === "currency" && field.currency) {
        const symbol = getCurrencySymbol(field.currency);
        // Regex: ^[Symbol]\s?\d+(\.\d{1,2})?$
        // Matches: $100, $100.50, €5, €5.99, etc.
        // \s? allows optional space between symbol and number
        // \d+ matches one or more digits
        // (?:\.\d{1,2})? matches an optional decimal point followed by 1 or 2 digits
        fieldSchema.pattern = `^${symbol.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s?\\d+(?:\\.\\d{1,2})?$`;
      } else if (field.type === "dropdown" && field.options && field.options.length > 0) {
        fieldSchema.enum = field.options;
      }

      // Add min/max values for number types (int and float only)
      if (field.type === "int" || field.type === "float") {
        if (field.minValue !== undefined) {
          fieldSchema.minimum = field.minValue;
        }
        if (field.maxValue !== undefined) {
          fieldSchema.maximum = field.maxValue;
        }
      }

      if (field.type === "object" && field.children) {
        // Recursive call for nested objects, passing definitions for nested refs
        const nestedSchema = buildPropertiesAndRequired(field.children, reusableTypes, definitions);
        fieldSchema.properties = nestedSchema.properties;
        if (nestedSchema.required.length > 0) {
          fieldSchema.required = nestedSchema.required;
        }
        fieldSchema.additionalProperties = false; // Add additionalProperties: false for nested objects
      }

      // Handle isRequired logic: if not required, allow null type
      if (!field.isRequired) {
        fieldSchema.type = Array.isArray(fieldSchema.type)
          ? [...fieldSchema.type, "null"]
          : [fieldSchema.type, "null"];
      }
    }

    if (field.isMultiple) {
      const arraySchema: any = {
        type: "array",
        items: fieldSchema, // The item schema is the fieldSchema itself
      };
      if (field.minItems !== undefined) {
        arraySchema.minItems = field.minItems;
      }
      if (field.maxItems !== undefined) {
        arraySchema.maxItems = field.maxItems;
      }
      properties[field.name] = arraySchema;
    } else {
      properties[field.name] = fieldSchema;
    }

    // Add to required if the field is explicitly marked as required
    if (field.isRequired) {
      required.push(field.name);
    }
  });

  return { properties, required };
};

/**
 * Builds the complete JSON Schema, including definitions for reusable types.
 * Handles potential circular references among reusable types.
 */
const buildFullJsonSchema = (schemaFields: SchemaField[], reusableTypes: SchemaField[]): any => {
  const definitions: { [key: string]: any } = {};
  const buildingDefinitions = new Set<string>(); // To detect circular references during definition building

  // First pass: Build all reusable type definitions
  reusableTypes.forEach(rt => {
    if (rt.name) {
      // Prevent infinite recursion for circular definitions
      if (buildingDefinitions.has(rt.id)) {
        // If we're already building this definition, skip to prevent stack overflow.
        // A more advanced solution might involve a "$recursiveRef" or similar.
        return;
      }
      buildingDefinitions.add(rt.id); // Mark as currently building

      // Recursively build properties for the reusable type's children
      const nestedSchema = buildPropertiesAndRequired(rt.children || [], reusableTypes, definitions);
      definitions[rt.name] = {
        type: "object",
        properties: nestedSchema.properties,
        required: nestedSchema.required,
        additionalProperties: false,
      };
      buildingDefinitions.delete(rt.id); // Unmark after building
    }
  });

  // Second pass: Build the main schema properties using the now-complete definitions
  const mainSchemaContent = buildPropertiesAndRequired(schemaFields, reusableTypes, definitions);

  const rootSchema: any = {
    type: "object",
    properties: mainSchemaContent.properties,
    required: mainSchemaContent.required,
    additionalProperties: false, // Add additionalProperties: false for the root object
  };

  if (Object.keys(definitions).length > 0) {
    rootSchema.definitions = definitions; // Using 'definitions' for compatibility
  }

  return rootSchema;
};

const SchemaDisplay: React.FC<SchemaDisplayProps> = ({ schemaFields, reusableTypes }) => {
  const jsonSchema = buildFullJsonSchema(schemaFields, reusableTypes);
  const jsonString = JSON.stringify(jsonSchema, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString)
      .then(() => {
        showSuccess("JSON schema copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy JSON: ", err);
        showError("Failed to copy JSON schema.");
      });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-semibold">Generated JSON Schema</CardTitle>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2" /> Copy JSON
        </Button>
      </CardHeader>
      <CardContent>
        <pre className="bg-gray-800 text-white p-4 rounded-md overflow-auto text-left text-sm">
          <code>{jsonString}</code>
        </pre>
      </CardContent>
    </Card>
  );
};

export default SchemaDisplay;