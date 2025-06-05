import React from "react";
import { SchemaField, SchemaFieldType } from "./FieldEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  const required: string[] = []; // For simplicity, all fields are required for now

  fields.forEach((field) => {
    const baseType = mapTypeToJsonSchemaType(field.type);
    const format = mapTypeToJsonSchemaFormat(field.type);

    let fieldSchema: any = { type: baseType };

    if (format) {
      fieldSchema.format = format;
    }

    if (field.type === "object" && field.children) {
      fieldSchema.properties = buildJsonSchema(field.children).properties;
      fieldSchema.required = buildJsonSchema(field.children).required;
    }

    if (field.isMultiple) {
      properties[field.name] = {
        type: "array",
        items: fieldSchema,
      };
    } else {
      properties[field.name] = fieldSchema;
    }

    if (field.name) { // Only add to required if name is not empty
      required.push(field.name);
    }
  });

  return {
    type: "object",
    properties,
    required,
  };
};

const SchemaDisplay: React.FC<SchemaDisplayProps> = ({ schemaFields }) => {
  const jsonSchema = buildJsonSchema(schemaFields);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Generated JSON Schema</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="bg-gray-800 text-white p-4 rounded-md overflow-auto text-left text-sm">
          <code>{JSON.stringify(jsonSchema, null, 2)}</code>
        </pre>
      </CardContent>
    </Card>
  );
};

export default SchemaDisplay;