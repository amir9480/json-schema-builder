import { v4 as uuidv4 } from "uuid";
import { SchemaField, SchemaFieldType } from "@/components/FieldEditor";

/**
 * Maps a JSON Schema type and format to a SchemaFieldType.
 * Handles basic types and specific formats for date/datetime.
 */
const mapJsonSchemaTypeToSchemaFieldType = (jsonType: string, format?: string): SchemaFieldType => {
  switch (jsonType) {
    case "string":
      if (format === "date") return "date";
      if (format === "date-time") return "datetime";
      return "string";
    case "number":
      // JSON schema doesn't distinguish int/float directly, default to int.
      // User can manually change to float/currency if needed.
      return "int";
    default:
      console.warn(`Unsupported JSON Schema type or format: ${jsonType} (format: ${format || 'none'}). Defaulting to 'string'.`);
      return "string";
  }
};

/**
 * Recursively converts a JSON Schema object into an array of SchemaField objects.
 * @param jsonSchema The JSON Schema object or a part of it (e.g., properties of an object).
 * @returns An array of SchemaField objects.
 */
export const jsonSchemaToSchemaFields = (jsonSchema: any): SchemaField[] => {
  if (!jsonSchema || typeof jsonSchema !== 'object' || !jsonSchema.properties) {
    // If it's not an object with properties, it's not a valid schema for direct conversion
    // or it's a nested type that should be handled by its parent.
    return [];
  }

  const fields: SchemaField[] = [];
  const requiredFields = new Set(jsonSchema.required || []);

  for (const key in jsonSchema.properties) {
    const prop = jsonSchema.properties[key];
    let fieldType: SchemaFieldType = "string"; // Default type
    let isMultiple = false;
    let children: SchemaField[] | undefined = undefined;

    if (prop.type === "array") {
      isMultiple = true;
      const itemSchema = prop.items;
      if (itemSchema) {
        if (itemSchema.type === "object") {
          fieldType = "object";
          children = jsonSchemaToSchemaFields(itemSchema);
        } else {
          fieldType = mapJsonSchemaTypeToSchemaFieldType(itemSchema.type, itemSchema.format);
        }
      } else {
        // If array items type is not specified, default to string array
        fieldType = "string";
      }
    } else if (prop.type === "object") {
      fieldType = "object";
      children = jsonSchemaToSchemaFields(prop);
    } else {
      fieldType = mapJsonSchemaTypeToSchemaFieldType(prop.type, prop.format);
    }

    fields.push({
      id: uuidv4(),
      name: key,
      type: fieldType,
      isMultiple: isMultiple,
      // A field is required if its name is in the parent's 'required' array
      isRequired: requiredFields.has(key),
      title: prop.title,
      description: prop.description,
      example: prop.example !== undefined ? String(prop.example) : undefined, // Convert example to string
      children: children,
    });
  }
  return fields;
};