import React from "react";
import { SchemaField, SchemaFieldType } from "./FieldEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

interface SchemaDisplayProps {
  schemaFields: SchemaField[];
  reusableTypes: SchemaField[]; // New prop for reusable types
}

const mapTypeToJsonSchemaType = (type: SchemaFieldType): string => {
  switch (type) {
    case "int":
    case "float":
    case "currency":
      return "number";
    case "date":
    case "datetime":
      return "string"; // Dates/datetimes are typically strings in JSON schema with format
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

const buildJsonSchema = (fields: SchemaField[], reusableTypes: SchemaField[]): any => {
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
      if (referencedType && referencedType.name) {
        fieldSchema = { "$ref": `#/definitions/${referencedType.name}` };
      } else {
        // Fallback if reference is invalid or not found
        fieldSchema = { type: "object", description: "Invalid or undefined reference" };
      }
    } else {
      const baseType = mapTypeToJsonSchemaType(field.type);
      const format = mapTypeToJsonSchemaFormat(field.type);

      fieldSchema.type = baseType;

      if (format) {
        fieldSchema.format = format;
      }
      if (field.title) {
        fieldSchema.title = field.title;
      }
      if (field.description) {
        fieldSchema.description = field.description;
      }
      if (field.example !== undefined) {
        // Attempt to parse example based on type for better JSON representation
        try {
          if (field.type === "int" || field.type === "float" || field.type === "currency") {
            fieldSchema.example = parseFloat(field.example);
            if (isNaN(fieldSchema.example)) delete fieldSchema.example; // Remove if not a valid number
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
      }

      if (field.type === "object" && field.children) {
        const nestedSchema = buildJsonSchema(field.children, reusableTypes); // Pass reusableTypes recursively
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
      properties[field.name] = {
        type: "array",
        items: fieldSchema,
      };
    } else {
      properties[field.name] = fieldSchema;
    }

    // Add to required if the field is explicitly marked as required
    if (field.isRequired) {
      required.push(field.name);
    }
  });

  const definitions: { [key: string]: any } = {};
  reusableTypes.forEach(rt => {
    if (rt.name) {
      definitions[rt.name] = {
        type: "object",
        properties: buildJsonSchema(rt.children || [], reusableTypes).properties,
        required: buildJsonSchema(rt.children || [], reusableTypes).required,
        additionalProperties: false,
      };
    }
  });

  const rootSchema: any = {
    type: "object",
    properties,
    required,
    additionalProperties: false, // Add additionalProperties: false for the root object
  };

  if (Object.keys(definitions).length > 0) {
    rootSchema.definitions = definitions; // Use 'definitions' for older JSON Schema drafts, or '$defs' for draft 2019-09 and later
  }

  return rootSchema;
};

const SchemaDisplay: React.FC<SchemaDisplayProps> = ({ schemaFields, reusableTypes }) => {
  const jsonSchema = buildJsonSchema(schemaFields, reusableTypes);
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