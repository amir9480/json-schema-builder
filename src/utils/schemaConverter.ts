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
      // JSON schema doesn't distinguish int/float directly, default to float.
      // User can manually change to int/currency if needed.
      return "float";
    case "integer": // Explicit integer type
      return "int";
    case "boolean":
      return "boolean";
    default:
      console.warn(`Unsupported JSON Schema type or format: ${jsonType} (format: ${format || 'none'}). Defaulting to 'string'.`);
      return "string";
  }
};

/**
 * Recursively converts JSON Schema properties into an array of SchemaField objects.
 * This helper function is used for both main schema properties and nested object properties.
 * It resolves $ref against the provided definitionsMap.
 */
const convertPropertiesToSchemaFields = (
  properties: any,
  requiredFields: Set<string>,
  definitionsMap: Map<string, SchemaField>, // Map of definition names to SchemaField objects
  parentId?: string,
): SchemaField[] => {
  const fields: SchemaField[] = [];
  if (!properties || typeof properties !== 'object') return fields;

  for (const key in properties) {
    const prop = properties[key];
    let fieldType: SchemaFieldType = "string";
    let isMultiple = false;
    let children: SchemaField[] | undefined = undefined;
    let refId: string | undefined = undefined;
    let options: string[] | undefined = undefined;
    let isRequired = requiredFields.has(key);
    let currency: string | undefined = undefined;

    // Handle $ref first
    if (prop.$ref) {
      const refName = prop.$ref.split('/').pop();
      const referencedField = definitionsMap.get(refName);
      if (referencedField) {
        fieldType = "ref";
        refId = referencedField.id;
      } else {
        console.warn(`Reference ${prop.$ref} not found in definitions. Falling back to string.`);
        fieldType = "string"; // Fallback if reference is not found
      }
    } else if (prop.type === "array") {
      isMultiple = true;
      const itemSchema = prop.items;
      if (itemSchema) {
        if (itemSchema.$ref) {
          const refName = itemSchema.$ref.split('/').pop();
          const referencedField = definitionsMap.get(refName);
          if (referencedField) {
            fieldType = "ref"; // Array of references
            refId = referencedField.id;
          } else {
            console.warn(`Reference ${itemSchema.$ref} not found for array items. Falling back to string.`);
            fieldType = "string"; // Fallback
          }
        } else if (itemSchema.type === "object") {
          fieldType = "object";
          children = convertPropertiesToSchemaFields(itemSchema.properties, new Set(itemSchema.required || []), definitionsMap, uuidv4());
        } else {
          // Handle primitive array items
          const actualType = Array.isArray(itemSchema.type) ? itemSchema.type.find((t: string) => t !== "null") : itemSchema.type;
          fieldType = mapJsonSchemaTypeToSchemaFieldType(actualType || "string", itemSchema.format);
          if (itemSchema.enum) {
            fieldType = "dropdown";
            options = itemSchema.enum;
          }
          // Check for custom 'currency' property on array items if applicable
          if (itemSchema.currency) {
            fieldType = "currency";
            currency = itemSchema.currency;
          }
        }
      } else {
        fieldType = "string"; // Default for untyped array items
      }
    } else if (prop.type === "object") {
      fieldType = "object";
      children = convertPropertiesToSchemaFields(prop.properties, new Set(prop.required || []), definitionsMap, uuidv4());
    } else {
      // Handle single primitive types
      const actualType = Array.isArray(prop.type) ? prop.type.find((t: string) => t !== "null") : prop.type;
      if (Array.isArray(prop.type) && prop.type.includes("null")) {
        isRequired = false; // If null is allowed, it's not strictly required
      }
      
      fieldType = mapJsonSchemaTypeToSchemaFieldType(actualType || "string", prop.format);
      
      if (prop.enum) {
        fieldType = "dropdown";
        options = prop.enum;
      }
      // Check for custom 'currency' property
      if (prop.currency) {
        fieldType = "currency";
        currency = prop.currency;
      }
    }

    const field: SchemaField = {
      id: uuidv4(),
      name: key,
      type: fieldType,
      isMultiple: isMultiple,
      isRequired: isRequired,
      title: prop.title,
      description: prop.description,
      example: prop.example !== undefined ? String(prop.example) : undefined,
      children: children,
      refId: refId,
      minValue: prop.minimum,
      maxValue: prop.maximum,
      minItems: prop.minItems,
      maxItems: prop.maxItems,
      currency: currency, // Assign the detected currency
      options: options,
      parentId: parentId,
      isValidName: true, // Assume valid name from imported schema
    };
    fields.push(field);
  }
  return fields;
};

/**
 * Converts a full JSON Schema object (including definitions) into an array of SchemaField objects
 * for the main schema and an array for reusable types.
 * @param jsonSchema The full JSON Schema object.
 * @returns An object containing `mainFields` and `reusableTypes`.
 */
export const convertFullJsonSchemaToSchemaFieldsAndReusableTypes = (jsonSchema: any): { mainFields: SchemaField[]; reusableTypes: SchemaField[] } => {
  const definitionsMap = new Map<string, SchemaField>();
  const reusableTypes: SchemaField[] = [];

  // First pass: Identify and create placeholder SchemaField objects for all definitions.
  // This ensures all reusable types have an ID and are in the map before we try to resolve them.
  const defs = jsonSchema.definitions || jsonSchema.$defs;
  if (defs && typeof defs === 'object') {
    for (const defName in defs) {
      const def = defs[defName];
      if (def.type === "object" && def.properties) {
        const newReusableType: SchemaField = {
          id: uuidv4(),
          name: defName,
          type: "object",
          isMultiple: false,
          isRequired: false, // Reusable types themselves are not 'required'
          title: def.title || defName,
          description: def.description,
          children: [], // Will be populated in second pass
          isValidName: true,
        };
        definitionsMap.set(defName, newReusableType);
        reusableTypes.push(newReusableType);
      } else {
        console.warn(`Definition '${defName}' is not a valid object schema and will be skipped.`);
      }
    }
  }

  // Second pass: Populate children for reusable types and main fields, resolving references.
  reusableTypes.forEach(rt => {
    const originalDef = (jsonSchema.definitions || jsonSchema.$defs)?.[rt.name];
    if (originalDef && originalDef.properties) {
      rt.children = convertPropertiesToSchemaFields(originalDef.properties, new Set(originalDef.required || []), definitionsMap, rt.id);
    }
  });

  const mainFields = convertPropertiesToSchemaFields(
    jsonSchema.properties,
    new Set(jsonSchema.required || []),
    definitionsMap,
  );

  return { mainFields, reusableTypes };
};

/**
 * Converts a single JSON Schema object (e.g., from an AI response for a field)
 * into a single SchemaField object.
 * This function assumes the input JSON schema represents a single field's definition,
 * not a full root schema with properties.
 * @param jsonSchema The JSON Schema object representing a single field.
 * @param reusableTypes Existing reusable types to resolve references against.
 * @returns A single SchemaField object.
 */
export const convertSingleJsonSchemaToSchemaField = (jsonSchema: any, reusableTypes: SchemaField[]): SchemaField => {
  const definitionsMap = new Map<string, SchemaField>();
  // Populate definitionsMap with existing reusable types for reference resolution
  reusableTypes.forEach(rt => definitionsMap.set(rt.name, rt));

  let fieldType: SchemaFieldType = "string";
  let isMultiple = false;
  let children: SchemaField[] | undefined = undefined;
  let refId: string | undefined = undefined;
  let options: string[] | undefined = undefined;
  let isRequired = true; // Default to required for a single field, adjust if 'null' type is present
  let currency: string | undefined = undefined;

  // Check for 'null' type to determine if it's required
  if (Array.isArray(jsonSchema.type) && jsonSchema.type.includes("null")) {
    isRequired = false;
  }

  // Handle array type
  if (jsonSchema.type === "array") {
    isMultiple = true;
    const itemSchema = jsonSchema.items;
    if (itemSchema) {
      if (itemSchema.$ref) {
        const refName = itemSchema.$ref.split('/').pop();
        const referencedField = reusableTypes.find(rt => rt.name === refName); // Find by name for existing types
        if (referencedField) {
          fieldType = "ref";
          refId = referencedField.id;
        } else {
          console.warn(`Reference ${itemSchema.$ref} not found for array items during single field conversion. Falling back to string.`);
          fieldType = "string";
        }
      } else if (itemSchema.type === "object") {
        fieldType = "object";
        // Recursively convert properties of the nested object
        children = convertPropertiesToSchemaFields(itemSchema.properties, new Set(itemSchema.required || []), definitionsMap);
      } else {
        const actualType = Array.isArray(itemSchema.type) ? itemSchema.type.find((t: string) => t !== "null") : itemSchema.type;
        fieldType = mapJsonSchemaTypeToSchemaFieldType(actualType || "string", itemSchema.format);
        if (itemSchema.enum) {
          fieldType = "dropdown";
          options = itemSchema.enum;
        }
        if (itemSchema.currency) {
          fieldType = "currency";
          currency = itemSchema.currency;
        }
      }
    } else {
      fieldType = "string"; // Default for untyped array items
    }
  } else if (jsonSchema.$ref) {
    const refName = jsonSchema.$ref.split('/').pop();
    const referencedField = reusableTypes.find(rt => rt.name === refName);
    if (referencedField) {
      fieldType = "ref";
      refId = referencedField.id;
    } else {
      console.warn(`Reference ${jsonSchema.$ref} not found during single field conversion. Falling back to string.`);
      fieldType = "string";
    }
  } else if (jsonSchema.type === "object") {
    fieldType = "object";
    children = convertPropertiesToSchemaFields(jsonSchema.properties, new Set(jsonSchema.required || []), definitionsMap);
  } else {
    const actualType = Array.isArray(jsonSchema.type) ? jsonSchema.type.find((t: string) => t !== "null") : jsonSchema.type;
    fieldType = mapJsonSchemaTypeToSchemaFieldType(actualType || "string", jsonSchema.format);
    if (jsonSchema.enum) {
      fieldType = "dropdown";
      options = jsonSchema.enum;
    }
    if (jsonSchema.currency) {
      fieldType = "currency";
      currency = jsonSchema.currency;
    }
  }

  const convertedField: SchemaField = {
    id: uuidv4(), // Generate a new ID for the converted field
    name: jsonSchema.title || "refinedField", // Use title as name, or a default
    type: fieldType,
    isMultiple: isMultiple,
    isRequired: isRequired,
    title: jsonSchema.title,
    description: jsonSchema.description,
    example: jsonSchema.example !== undefined ? String(json.example) : undefined,
    children: children,
    refId: refId,
    minValue: jsonSchema.minimum,
    maxValue: jsonSchema.maximum,
    minItems: jsonSchema.minItems,
    maxItems: jsonSchema.maxItems,
    currency: currency, // Assign the detected currency
    options: options,
    isValidName: true, // Assume valid name from AI
  };

  return convertedField;
};