import React from "react";
import { SchemaField, SchemaFieldType } from "./FieldEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

interface SchemaDisplayProps {
  schemaFields: SchemaField[];
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

const buildJsonSchema = (fields: SchemaField[]): any => {
  const properties: { [key: string]: any } = {};
  const required: string[] = [];

  fields.forEach((field) => {
    const baseType = mapTypeToJsonSchemaType(field.type);
    const format = mapTypeToJsonSchemaFormat(field.type);

    let fieldSchema: any = { type: baseType };

    if (format) {
      fieldSchema.format = format;
    }
    if (field.title) {
      fieldSchema.title = field.title;
    }
    if (field.description) {
      fieldSchema.description = field.description;
    }

    // Add pattern for date and datetime types
    if (field.type === "date") {
      fieldSchema.pattern = "^\\d{4}-\\d{2}-\\d{2}$"; // YYYY-MM-DD
    } else if (field.type === "datetime") {
      fieldSchema.pattern = "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})?$"; // ISO 8601
    }

    if (field.type === "object" && field.children) {
      const nestedSchema = buildJsonSchema(field.children);
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

    if (field.isMultiple) {
      properties[field.name] = {
        type: "array",
        items: fieldSchema,
      };
    } else {
      properties[field.name] = fieldSchema;
    }

    // Always add to required if name is not empty, regardless of isRequired flag
    if (field.name) {
      required.push(field.name);
    }
  });

  return {
    type: "object",
    properties,
    required,
    additionalProperties: false, // Add additionalProperties: false for the root object
  };
};

const SchemaDisplay: React.FC<SchemaDisplayProps> = ({ schemaFields }) => {
  const jsonSchema = buildJsonSchema(schemaFields);
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