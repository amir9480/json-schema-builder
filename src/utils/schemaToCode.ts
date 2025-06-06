// Helper to convert string to PascalCase for class/variable names
function toPascalCase(str: string): string {
  if (!str) return "";
  return str
    .replace(/([_.-])(\w)/g, (_, __, c) => c.toUpperCase())
    .replace(/(\w)(\w*)/g, (_, c1, c2) => c1.toUpperCase() + c2.toLowerCase());
}

// Helper to convert string to camelCase for variable names in JS
function toCamelCase(str: string): string {
  if (!str) return "";
  return str.replace(/([_.-])(\w)/g, (_, __, c) => c.toUpperCase()).replace(/^./, (str) => str.toLowerCase());
}

// Helper to convert string to snake_case for Python
function toSnakeCase(str: string): string {
  if (!str) return "";
  return str
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^-/, "");
}

// --- Python (Pydantic) Code Generation ---

function generatePydanticModel(
  schemaName: string,
  schema: any,
  definitions: { [key: string]: any },
  indent: string = "    ",
): string {
  const properties = schema.properties || {};
  const required = new Set(schema.required || []);
  let modelCode = `class ${toPascalCase(schemaName)}(BaseModel):\n`;

  if (schema.description) {
    modelCode += `${indent}"""\n${indent}${schema.description}\n${indent}"""\n`;
  }

  if (Object.keys(properties).length === 0) {
    modelCode += `${indent}pass\n`; // Empty model
  } else {
    for (const propName in properties) {
      const prop = properties[propName];
      const isRequired = required.has(propName);
      let pydanticType = "Any"; // Default to Any if type is unknown
      let defaultValue = "";
      let comment = "";

      if (prop.description) {
        comment += `  # ${prop.description}`;
      }
      if (prop.example !== undefined) {
        comment += `${comment ? ", " : "  # "}Example: ${JSON.stringify(prop.example)}`;
      }

      if (prop.$ref) {
        const refName = prop.$ref.split("/").pop();
        pydanticType = toPascalCase(refName);
      } else if (prop.type === "array") {
        const items = prop.items;
        let itemType = "Any";
        if (items) {
          if (items.$ref) {
            const refName = items.$ref.split("/").pop();
            itemType = toPascalCase(refName);
          } else if (items.type === "object") {
            // Inline object in array, generate a nested anonymous model or handle as dict
            // For simplicity, we'll treat it as Dict[str, Any] or generate a nested model if complex
            // For now, let's assume it's a simple type or a defined ref
            itemType = mapJsonSchemaTypeToPydanticType(items.type, items.format, items.enum);
          } else {
            itemType = mapJsonSchemaTypeToPydanticType(items.type, items.format, items.enum);
          }
        }
        pydanticType = `list[${itemType}]`;
        if (prop.minItems !== undefined) comment += `${comment ? ", " : "  # "}Min items: ${prop.minItems}`;
        if (prop.maxItems !== undefined) comment += `${comment ? ", " : "  # "}Max items: ${prop.maxItems}`;
      } else if (prop.type === "object") {
        // Inline object, treat as Dict[str, Any] or generate nested model
        // For now, we'll generate a nested model if it has properties
        if (Object.keys(prop.properties || {}).length > 0) {
          const nestedModelName = toPascalCase(propName);
          // This requires a separate definition for the nested model
          // For simplicity in this generator, we'll assume all objects are either top-level or referenced.
          // If inline objects are needed, this function would need to recursively call itself and manage unique names.
          // For now, we'll treat inline objects as Dict[str, Any] or generate a placeholder.
          pydanticType = `Dict[str, Any]`; // Fallback for inline objects
          comment += `${comment ? ", " : "  # "}Nested object properties: ${Object.keys(prop.properties).join(", ")}`;
        } else {
          pydanticType = `Dict[str, Any]`;
        }
      } else {
        pydanticType = mapJsonSchemaTypeToPydanticType(prop.type, prop.format, prop.enum);
        if (prop.minimum !== undefined) comment += `${comment ? ", " : "  # "}Min value: ${prop.minimum}`;
        if (prop.maximum !== undefined) comment += `${comment ? ", " : "  # "}Max value: ${prop.maximum}`;
        if (prop.pattern) comment += `${comment ? ", " : "  # "}Pattern: ${prop.pattern}`;
      }

      const fieldName = toSnakeCase(propName);

      if (!isRequired) {
        pydanticType = `Optional[${pydanticType}]`;
        defaultValue = " = None";
      }

      modelCode += `${indent}${fieldName}: ${pydanticType}${defaultValue}${comment}\n`;
    }
  }
  return modelCode;
}

function mapJsonSchemaTypeToPydanticType(jsonType: string | string[], format?: string, enumValues?: string[]): string {
  const actualType = Array.isArray(jsonType) ? jsonType.find((t) => t !== "null") : jsonType;

  if (enumValues && enumValues.length > 0) {
    return `Literal[${enumValues.map((v) => JSON.stringify(v)).join(", ")}]`;
  }

  switch (actualType) {
    case "string":
      if (format === "date") return "date";
      if (format === "date-time") return "datetime";
      return "str";
    case "number":
      return "float"; // Pydantic numbers are floats by default, can be int if no decimal
    case "integer":
      return "int";
    case "boolean":
      return "bool";
    default:
      return "Any";
  }
}

export function generatePythonCode(jsonSchema: any): string {
  const definitions = jsonSchema.definitions || {};
  const rootSchemaName = jsonSchema.title ? toPascalCase(jsonSchema.title) : "MainSchema";
  let code = `from pydantic import BaseModel\n`;
  code += `from typing import Optional, Literal, Union, Any, Dict # Import Any and Dict for generic objects\n`;
  code += `from datetime import date, datetime # For date and datetime formats\n`;
  code += `from openai import OpenAI\n\n`;

  code += `client = OpenAI()\n\n`;

  // Generate reusable type models first
  for (const defName in definitions) {
    code += generatePydanticModel(defName, definitions[defName], definitions);
    code += "\n";
  }

  // Generate the main schema model
  code += generatePydanticModel(rootSchemaName, jsonSchema, definitions);
  code += "\n";

  // Add example usage
  code += `# Example usage:\n`;
  code += `system_message = "Extract the event information."\n`;
  code += `user_content = "Alice and Bob are going to a science fair on Friday."\n\n`;
  code += `completion = client.beta.chat.completions.parse(\n`;
  code += `    model="gpt-4o-2024-08-06", # Or your preferred model\n`;
  code += `    messages=[\n`;
  code += `        {"role": "system", "content": system_message},\n`;
  code += `        {"role": "user", "content": user_content},\n`;
  code += `    ],\n`;
  code += `    response_format=${rootSchemaName},\n`;
  code += `)\n\n`;
  code += `parsed_data = completion.choices[0].message.parsed\n`;
  code += `print(parsed_data)\n`;

  return code;
}

// --- JavaScript (Zod) Code Generation ---

function generateZodSchema(
  schemaName: string,
  schema: any,
  definitions: { [key: string]: any },
  isRoot: boolean = false,
): string {
  const properties = schema.properties || {};
  const required = new Set(schema.required || []);
  let zodProps: string[] = [];

  for (const propName in properties) {
    const prop = properties[propName];
    const isRequired = required.has(propName);
    let zodType = "z.any()"; // Default to z.any() if type is unknown
    let comment = "";

    if (prop.description) {
      comment += `  // ${prop.description}`;
    }
    if (prop.example !== undefined) {
      comment += `${comment ? ", " : "  // "}Example: ${JSON.stringify(prop.example)}`;
    }

    if (prop.$ref) {
      const refName = prop.$ref.split("/").pop();
      // Use z.lazy for forward references
      zodType = `z.lazy(() => ${toPascalCase(refName)})`;
    } else if (prop.type === "array") {
      const items = prop.items;
      let itemZodType = "z.any()";
      if (items) {
        if (items.$ref) {
          const refName = items.$ref.split("/").pop();
          itemZodType = `z.lazy(() => ${toPascalCase(refName)})`;
        } else if (items.type === "object") {
          // Inline object in array, recursively generate Zod object
          const nestedZod = generateZodSchema(propName, items, definitions);
          itemZodType = `z.object({\n${nestedZod}\n    })`;
        } else {
          itemZodType = mapJsonSchemaTypeToZodType(items.type, items.format, items.enum);
        }
      }
      zodType = `z.array(${itemZodType})`;
      if (prop.minItems !== undefined) zodType += `.min(${prop.minItems})`;
      if (prop.maxItems !== undefined) zodType += `.max(${prop.maxItems})`;
    } else if (prop.type === "object") {
      // Inline object, recursively generate Zod object
      const nestedZod = generateZodSchema(propName, prop, definitions);
      zodType = `z.object({\n${nestedZod}\n    })`;
    } else {
      zodType = mapJsonSchemaTypeToZodType(prop.type, prop.format, prop.enum);
      if (prop.minimum !== undefined) zodType += `.min(${prop.minimum})`;
      if (prop.maximum !== undefined) zodType += `.max(${prop.maximum})`;
      if (prop.pattern) zodType += `.regex(/${prop.pattern.replace(/\\/g, "\\\\")}/)`; // Escape backslashes for JS regex
    }

    if (!isRequired) {
      zodType += ".optional()";
    }

    zodProps.push(`  ${toCamelCase(propName)}: ${zodType},${comment}`);
  }

  return zodProps.join("\n");
}

function mapJsonSchemaTypeToZodType(jsonType: string | string[], format?: string, enumValues?: string[]): string {
  const actualType = Array.isArray(jsonType) ? jsonType.find((t) => t !== "null") : jsonType;

  if (enumValues && enumValues.length > 0) {
    return `z.enum([${enumValues.map((v) => JSON.stringify(v)).join(", ")}])`;
  }

  switch (actualType) {
    case "string":
      if (format === "date") return "z.string().datetime().date()"; // Zod's date validation
      if (format === "date-time") return "z.string().datetime()";
      return "z.string()";
    case "number":
      return "z.number()";
    case "integer":
      return "z.number().int()";
    case "boolean":
      return "z.boolean()";
    default:
      return "z.any()";
  }
}

export function generateJavaScriptCode(jsonSchema: any): string {
  const definitions = jsonSchema.definitions || {};
  const rootSchemaName = jsonSchema.title ? toPascalCase(jsonSchema.title) : "MainSchema";
  let code = `import OpenAI from "openai";\n`;
  code += `import { zodResponseFormat } from "openai/helpers/zod";\n`;
  code += `import { z } from "zod";\n\n`;

  code += `const openai = new OpenAI();\n\n`;

  // Generate reusable type Zod schemas first
  for (const defName in definitions) {
    const pascalDefName = toPascalCase(defName);
    const zodContent = generateZodSchema(defName, definitions[defName], definitions);
    code += `const ${pascalDefName} = z.object({\n${zodContent}\n});\n\n`;
  }

  // Generate the main schema Zod object
  const mainZodContent = generateZodSchema(rootSchemaName, jsonSchema, definitions, true);
  code += `const ${rootSchemaName} = z.object({\n${mainZodContent}\n});\n\n`;

  // Add example usage
  code += `// Example usage:\n`;
  code += `async function runCompletion() {\n`;
  code += `  const systemMessage = "Extract the event information.";\n`;
  code += `  const userContent = "Alice and Bob are going to a science fair on Friday.";\n\n`;
  code += `  const completion = await openai.beta.chat.completions.parse({\n`;
  code += `    model: "gpt-4o-2024-08-06", // Or your preferred model\n`;
  code += `    messages: [\n`;
  code += `      { role: "system", content: systemMessage },\n`;
  code += `      { role: "user", content: userContent },\n`;
  code += `    ],\n`;
  code += `    response_format: zodResponseFormat(${rootSchemaName}, "${toCamelCase(rootSchemaName)}"),\n`;
  code += `  });\n\n`;
  code += `  const parsedData = completion.choices[0].message.parsed;\n`;
  code += `  console.log(parsedData);\n`;
  code += `}\n\n`;
  code += `runCompletion();\n`;

  return code;
}