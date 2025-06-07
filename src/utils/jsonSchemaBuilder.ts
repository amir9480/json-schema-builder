import { SchemaField, SchemaFieldType } from "@/components/FieldEditor";
import { toTitleCase } from "@/lib/utils";

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
    case "boolean": // Add boolean type mapping
      return "boolean";
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
          } else if (field.type === "boolean") {
            fieldSchema.example = field.example.toLowerCase() === 'true';
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
        // For currency, we just add a custom 'currency' property and the symbol for context,
        // but don't enforce a pattern as it's not a standard JSON Schema feature.
        fieldSchema.currency = field.currency;
        fieldSchema.description = field.description ? `${field.description} (Currency: ${getCurrencySymbol(field.currency)})` : `Currency field (e.g., ${getCurrencySymbol(field.currency)}123.45)`;
      } else if (field.type === "dropdown" && field.options && field.options.length > 0) {
        fieldSchema.enum = field.options;
      } else if (field.type === "string" && field.pattern) { // Add pattern for generic string type
        fieldSchema.pattern = field.pattern;
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
        // For nested objects, only include truly required fields in their 'required' array
        if (nestedSchema.required.length > 0) {
          fieldSchema.required = nestedSchema.required;
        }
        fieldSchema.additionalProperties = false; // Add additionalProperties: false for nested objects
      }

      // Handle isRequired logic: if not required, allow null type
      // This should NOT apply to 'ref' types, as 'ref' is a schema keyword, not a data type.
      // The nullability of a referenced object should be defined within the referenced schema itself.
      if (!field.isRequired && field.type !== "ref") {
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
        arraySchema.maxItems = field.maxItems; // Changed to maximum for array length
      }
      properties[field.name] = arraySchema;
    } else {
      properties[field.name] = fieldSchema;
    }

    // IMPORTANT: For LLM compatibility, add ALL properties to the 'required' array at the current level.
    // The 'isRequired' flag now primarily controls whether 'null' is allowed as a type.
    required.push(field.name);
  });

  return { properties, required };
};

/**
 * Builds the complete JSON Schema, including definitions for reusable types.
 * Handles potential circular references among reusable types.
 */
export const buildFullJsonSchema = (schemaFields: SchemaField[], reusableTypes: SchemaField[]): any => {
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

      if (rt.type === "object") {
        // Recursively build properties for the reusable type's children
        const nestedSchema = buildPropertiesAndRequired(rt.children || [], reusableTypes, definitions);
        definitions[rt.name] = {
          type: "object",
          properties: nestedSchema.properties,
          required: nestedSchema.required,
          additionalProperties: false,
        };
      } else {
        // For non-object reusable types, build their schema directly
        const singleFieldSchema = buildSingleFieldJsonSchema(rt, reusableTypes);
        // Remove $schema, title, description from the definition itself, as they are for the root schema
        const { $schema, title, description, ...restOfSchema } = singleFieldSchema;
        definitions[rt.name] = restOfSchema;
      }
      buildingDefinitions.delete(rt.id); // Unmark after building
    }
  });

  // Second pass: Build the main schema properties using the now-complete definitions
  const mainSchemaContent = buildPropertiesAndRequired(schemaFields, reusableTypes, definitions);

  const rootSchema: any = {
    $schema: "http://json-schema.org/draft-07/schema#", // Specify draft version
    title: "Generated Schema", // Add a default title
    // description: "Schema generated by Dyad's JSON Schema Builder", // Removed this line
    type: "object",
    properties: mainSchemaContent.properties,
    required: mainSchemaContent.required, // This now includes all properties for LLM compatibility
    additionalProperties: false, // Add additionalProperties: false for the root object
  };

  if (Object.keys(definitions).length > 0) {
    rootSchema.definitions = definitions; // Using 'definitions' for compatibility
  }

  return rootSchema;
};

/**
 * Builds the JSON Schema for a single SchemaField.
 * This is used when sending a specific field's schema to an LLM for refinement.
 * It will include relevant definitions if the field or its children reference reusable types.
 */
export const buildSingleFieldJsonSchema = (field: SchemaField, reusableTypes: SchemaField[]): any => {
  const definitions: { [key: string]: any } = {};
  const buildingDefinitions = new Set<string>();

  // Helper to recursively collect all referenced reusable types
  const collectReferencedTypes = (fields: SchemaField[]) => {
    fields.forEach(f => {
      if (f.type === "ref" && f.refId) {
        const referencedType = reusableTypes.find(rt => rt.id === f.refId);
        if (referencedType && referencedType.name && !definitions[referencedType.name] && !buildingDefinitions.has(referencedType.id)) {
          buildingDefinitions.add(referencedType.id);
          if (referencedType.type === "object") {
            const nestedSchema = buildPropertiesAndRequired(referencedType.children || [], reusableTypes, definitions);
            definitions[referencedType.name] = {
              type: "object",
              properties: nestedSchema.properties,
              required: nestedSchema.required,
              additionalProperties: false,
            };
          } else {
            // For non-object reusable types, build their schema directly
            const singleFieldSchema = buildSingleFieldJsonSchema(referencedType, reusableTypes);
            const { $schema, title, description, ...restOfSchema } = singleFieldSchema; // Remove root-level schema properties
            definitions[referencedType.name] = restOfSchema;
          }
          buildingDefinitions.delete(referencedType.id);
          // Also collect types referenced by this reusable type's children (if it's an object)
          if (referencedType.type === "object") {
            collectReferencedTypes(referencedType.children || []);
          }
        }
      } else if (f.type === "object" && f.children) {
        collectReferencedTypes(f.children);
      } else if (f.isMultiple && f.type === "ref" && f.refId) { // Handle arrays of refs
        const referencedType = reusableTypes.find(rt => rt.id === f.refId);
        if (referencedType && referencedType.name && !definitions[referencedType.name] && !buildingDefinitions.has(referencedType.id)) {
          buildingDefinitions.add(referencedType.id);
          if (referencedType.type === "object") {
            const nestedSchema = buildPropertiesAndRequired(referencedType.children || [], reusableTypes, definitions);
            definitions[referencedType.name] = {
              type: "object",
              properties: nestedSchema.properties,
              required: nestedSchema.required,
              additionalProperties: false,
            };
          } else {
            const singleFieldSchema = buildSingleFieldJsonSchema(referencedType, reusableTypes);
            const { $schema, title, description, ...restOfSchema } = singleFieldSchema;
            definitions[referencedType.name] = restOfSchema;
          }
          buildingDefinitions.delete(referencedType.id);
          if (referencedType.type === "object") {
            collectReferencedTypes(referencedType.children || []);
          }
        }
      }
    });
  };

  // Collect definitions for the field itself and any nested/referenced types
  collectReferencedTypes([field]);

  // Build the schema for the single field
  let fieldSchema: any = {};

  if (field.type === "ref") {
    const referencedType = reusableTypes.find(rt => rt.id === field.refId);
    if (referencedType && referencedType.name && definitions[referencedType.name]) {
      fieldSchema = { "$ref": `#/definitions/${referencedType.name}` };
    } else {
      fieldSchema = { type: "object", description: "Invalid or undefined reference" };
    }
  } else {
    const baseType = mapTypeToJsonSchemaType(field.type);
    const format = mapTypeToJsonSchemaFormat(field.type);

    fieldSchema.type = baseType;
    if (format) {
      fieldSchema.format = format;
    }
    fieldSchema.title = field.title || toTitleCase(field.name);
    if (field.description) {
      fieldSchema.description = field.description;
    }
    if (field.example !== undefined) {
      try {
        if (field.type === "int" || field.type === "float") {
          fieldSchema.example = parseFloat(field.example);
          if (isNaN(fieldSchema.example)) delete fieldSchema.example;
        } else if (field.type === "boolean") {
          fieldSchema.example = field.example.toLowerCase() === 'true';
        } else {
          fieldSchema.example = field.example;
        }
      } catch (e) {
        fieldSchema.example = field.example;
      }
    }

    if (field.type === "date") {
      fieldSchema.pattern = "^\\d{4}-\\d{2}-\\d{2}$";
    } else if (field.type === "datetime") {
      fieldSchema.pattern = "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})?$";
    } else if (field.type === "currency" && field.currency) {
      fieldSchema.currency = field.currency;
      fieldSchema.description = field.description ? `${field.description} (Currency: ${getCurrencySymbol(field.currency)})` : `Currency field (e.g., ${getCurrencySymbol(field.currency)}123.45)`;
    } else if (field.type === "dropdown" && field.options && field.options.length > 0) {
      fieldSchema.enum = field.options;
    } else if (field.type === "string" && field.pattern) { // Add pattern for generic string type
      fieldSchema.pattern = field.pattern;
    }

    if (field.type === "int" || field.type === "float") {
      if (field.minValue !== undefined) {
        fieldSchema.minimum = field.minValue;
      }
      if (field.maxValue !== undefined) {
        fieldSchema.maximum = field.maxValue;
      }
    }

    if (field.type === "object" && field.children) {
      const nestedSchema = buildPropertiesAndRequired(field.children, reusableTypes, definitions);
      fieldSchema.properties = nestedSchema.properties;
      if (nestedSchema.required.length > 0) {
        fieldSchema.required = nestedSchema.required;
      }
      fieldSchema.additionalProperties = false;
    }

    if (!field.isRequired && field.type !== "ref") {
      fieldSchema.type = Array.isArray(fieldSchema.type)
        ? [...fieldSchema.type, "null"]
        : [fieldSchema.type, "null"];
    }
  }

  if (field.isMultiple) {
    const arraySchema: any = {
      type: "array",
      items: fieldSchema,
    };
    if (field.minItems !== undefined) {
      arraySchema.minItems = field.minItems;
    }
    if (field.maxItems !== undefined) {
      arraySchema.maxItems = field.maxItems;
    }
    fieldSchema = arraySchema;
  }

  const finalSchema: any = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: field.title || toTitleCase(field.name),
    description: field.description || `Schema for field: ${field.name}`,
    ...fieldSchema, // Spread the generated field schema directly
  };

  if (Object.keys(definitions).length > 0) {
    finalSchema.definitions = definitions;
  }

  return finalSchema;
};