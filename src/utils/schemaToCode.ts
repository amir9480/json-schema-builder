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

// This map will collect all Pydantic models to be generated, keyed by their PascalCase name.
// It will store the JSON Schema definition for each model.
const collectedPydanticModels: Map<string, any> = new Map();

function mapJsonSchemaTypeToPydanticType(jsonType: string | string[], format?: string, enumValues?: string[]): string {
  const actualType = Array.isArray(jsonType) ? jsonType.find((t) => t !== "null") : jsonType;

  if (enumValues && enumValues.length > 0) {
    return `Literal[${enumValues.map((v) => JSON.stringify(v)).join(", ")}]`;
  }

  switch (actualType) {
    case "string":
      if (format === "date") return "date";
      if (format === "date-time") return "datetime";
      if (format === "time") return "time"; // Added time
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

// Recursive helper to build Pydantic model content and collect nested models
function _buildPydanticModelContent(
  currentSchema: any,
  parentName: string, // Used for generating unique names for inline nested objects
  indent: string = "    ",
): string {
  const properties = currentSchema.properties || {};
  const required = new Set(currentSchema.required || []);
  let modelContent = "";

  for (const propName in properties) {
    const prop = properties[propName];
    const isRequired = required.has(propName);
    let pydanticType = "Any";
    let defaultValue = "";
    let comment = "";
    let fieldDefinition = "";

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
          // Inline object within an array: generate a new nested model
          const nestedModelName = toPascalCase(`${parentName}${toPascalCase(propName)}Item`);
          // Add this new model to the collection if not already present
          if (!collectedPydanticModels.has(nestedModelName)) {
            collectedPydanticModels.set(nestedModelName, items);
          }
          itemType = nestedModelName;
        } else {
          itemType = mapJsonSchemaTypeToPydanticType(items.type, items.format, items.enum);
        }
      }
      pydanticType = `list[${itemType}]`;
      if (prop.minItems !== undefined) comment += `${comment ? ", " : "  # "}Min items: ${prop.minItems}`;
      if (prop.maxItems !== undefined) comment += `${comment ? ", " : "  # "}Max items: ${prop.maxItems}`;
    } else if (prop.type === "object") {
      // Inline object: generate a new nested model
      const nestedModelName = toPascalCase(`${parentName}${toPascalCase(propName)}`);
      // Add this new model to the collection if not already present
      if (!collectedPydanticModels.has(nestedModelName)) {
        collectedPydanticModels.set(nestedModelName, prop);
      }
      pydanticType = nestedModelName;
    } else {
      pydanticType = mapJsonSchemaTypeToPydanticType(prop.type, prop.format, prop.enum);
      let fieldArgs: string[] = [];
      if (prop.minimum !== undefined) fieldArgs.push(`ge=${prop.minimum}`);
      if (prop.maximum !== undefined) fieldArgs.push(`le=${prop.maximum}`);
      if (prop.pattern) fieldArgs.push(`pattern=r"${prop.pattern.replace(/\\/g, "\\\\")}"`);
      if (prop.minLength !== undefined) fieldArgs.push(`min_length=${prop.minLength}`); // New: min_length
      if (prop.maxLength !== undefined) fieldArgs.push(`max_length=${prop.maxLength}`); // New: max_length

      if (fieldArgs.length > 0) {
        fieldDefinition = `, Field(${fieldArgs.join(", ")})`;
      }
    }

    const fieldName = toSnakeCase(propName);

    if (!isRequired) {
      pydanticType = `Optional[${pydanticType}]`;
      defaultValue = " = None";
    }

    modelContent += `${indent}${fieldName}: ${pydanticType}${defaultValue}${fieldDefinition}${comment}\n`;
  }
  return modelContent;
}

export function generatePythonCode(jsonSchema: any, selectedProvider: string, apiKey: string): string {
  // Clear collected models for each new generation
  collectedPydanticModels.clear();

  const definitions = jsonSchema.definitions || {};
  const rootSchemaName = jsonSchema.title ? toPascalCase(jsonSchema.title) : "MainSchema";
  let code = `from pydantic import BaseModel, Field # Import Field for validation\n`;
  code += `from typing import Optional, Literal, Union, Any, Dict # Import Any and Dict for generic objects\n`;
  code += `from datetime import date, datetime, time # For date, datetime, and time formats\n`; // Added time
  code += `from openai import OpenAI\n\n`;

  let clientConfig = "";
  const apiKeyPlaceholder = apiKey || `"<YOUR_${selectedProvider.toUpperCase()}_API_KEY>"`;

  switch (selectedProvider) {
    case "openai":
      clientConfig = `client = OpenAI(api_key=${apiKeyPlaceholder})\n`;
      break;
    case "gemini":
      clientConfig = `client = OpenAI(
    base_url="https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
    api_key=${apiKeyPlaceholder},
)\n`;
      break;
    case "mistral":
      clientConfig = `client = OpenAI(
    base_url="https://api.mistral.ai/v1",
    api_key=${apiKeyPlaceholder},
)\n`;
      break;
    case "openrouter":
      clientConfig = `client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=${apiKeyPlaceholder},
)\n`;
      break;
    default:
      clientConfig = `client = OpenAI(api_key=${apiKeyPlaceholder})\n`; // Default to OpenAI config
  }

  code += clientConfig;
  code += "\n";

  // First, add all explicit definitions (reusable types) to the collection
  for (const defName in definitions) {
    collectedPydanticModels.set(toPascalCase(defName), definitions[defName]);
  }

  // Then, process the root schema. This will recursively add any inline nested objects to the collection.
  collectedPydanticModels.set(rootSchemaName, jsonSchema);

  // Generate code for all collected models (definitions + root + inline nested)
  // Iterate over a copy of keys to allow map modification during iteration
  const modelNamesToProcess = Array.from(collectedPydanticModels.keys());
  for (const modelName of modelNamesToProcess) {
    const modelSchema = collectedPydanticModels.get(modelName);
    if (!modelSchema) continue; // Should not happen

    let modelCode = `class ${modelName}(BaseModel):\n`;
    if (modelSchema.description) {
      modelCode += `    """\n    ${modelSchema.description}\n    """\n`;
    }

    const content = _buildPydanticModelContent(modelSchema, modelName); // Pass modelName as parentName
    if (content.trim() === "") {
      modelCode += `    pass\n`;
    } else {
      modelCode += content;
    }
    code += modelCode + "\n";
  }

  // Add example usage (this part remains the same)
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
      if (prop.pattern) zodType += `.regex(/${prop.pattern.replace(/\\/g, "\\\\")}/)`;
      if (prop.minLength !== undefined) zodType += `.min(${prop.minLength})`; // New: minLength
      if (prop.maxLength !== undefined) zodType += `.max(${prop.maxLength})`; // New: maxLength
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
      if (format === "time") return "z.string().regex(/^([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)$/)"; // HH:MM:SS regex
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

export function generateJavaScriptCode(jsonSchema: any, selectedProvider: string, apiKey: string): string {
  const definitions = jsonSchema.definitions || {};
  const rootSchemaName = jsonSchema.title ? toPascalCase(jsonSchema.title) : "MainSchema";
  let code = `import OpenAI from "openai";\n`;
  code += `import { zodResponseFormat } from "openai/helpers/zod";\n`;
  code += `import { z } from "zod";\n\n`;

  let openaiConfig = "";
  const apiKeyPlaceholder = apiKey || `'<YOUR_${selectedProvider.toUpperCase()}_API_KEY>'`;

  switch (selectedProvider) {
    case "openai":
      openaiConfig = `const openai = new OpenAI({ apiKey: ${apiKeyPlaceholder} });\n`;
      break;
    case "gemini":
      openaiConfig = `const openai = new OpenAI({
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  apiKey: ${apiKeyPlaceholder},
});\n`;
      break;
    case "mistral":
      openaiConfig = `const openai = new OpenAI({
  baseURL: 'https://api.mistral.ai/v1',
  apiKey: ${apiKeyPlaceholder},
});\n`;
      break;
    case "openrouter":
      openaiConfig = `const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: ${apiKeyPlaceholder},
  defaultHeaders: {
    'HTTP-Referer': '<YOUR_APP_URL>', // Optional. Site URL for rankings on openrouter.ai.
    'X-Title': 'JSON Schema Builder & Generator', // Optional. Site title for rankings on openrouter.ai.
  },
});\n`;
      break;
    default:
      openaiConfig = `const openai = new OpenAI({ apiKey: ${apiKeyPlaceholder} });\n`; // Default to OpenAI config
  }

  code += openaiConfig;
  code += "\n";

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