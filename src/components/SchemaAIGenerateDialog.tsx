import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import {
  Select, // Keep Select for case type
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // Keep Input for user prompt
import { showSuccess, showError } from "@/utils/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SchemaField } from "./FieldEditor";
import { convertFullJsonSchemaToSchemaFieldsAndReusableTypes } from "@/utils/schemaConverter";
import LoadingSpinner from "./LoadingSpinner";
import LLMConfigInputs from "./LLMConfigInputs"; // Import the new component

interface SchemaAIGenerateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSchemaGenerated: (mainFields: SchemaField[], reusableTypes: SchemaField[]) => void;
}

type LLMProvider = "openai" | "gemini" | "mistral" | "openrouter";
type CaseType = "snake_case" | "camelCase" | "PascalCase" | "CONSTANT_CASE" | "kebab-case";

const LOCAL_STORAGE_USER_PROMPT_KEY = "llmSchemaBuilderUserPrompt";
const LOCAL_STORAGE_CASE_TYPE_KEY = "llmSchemaBuilderCaseType";
const LOCAL_STORAGE_SELECTED_PROVIDER_KEY = "llmBuilderSelectedProvider"; // Moved from LLMConfigInputs
const LOCAL_STORAGE_API_KEY = "llmBuilderApiKey"; // Moved from LLMConfigInputs
const LOCAL_STORAGE_SELECTED_MODEL_KEY = "llmBuilderSelectedModel"; // Moved from LLMConfigInputs

const caseTypeOptions: { value: CaseType; label: string }[] = [
  { value: "snake_case", label: "snake_case (e.g., product_name)" },
  { value: "camelCase", label: "camelCase (e.g., productName)" },
  { value: "PascalCase", label: "PascalCase (e.g., ProductName)" },
  { value: "CONSTANT_CASE", label: "CONSTANT_CASE (e.g., PRODUCT_NAME)" },
  { value: "kebab-case", label: "kebab-case (e.g., product-name)" },
];

const SchemaAIGenerateDialog: React.FC<SchemaAIGenerateDialogProps> = ({
  isOpen,
  onOpenChange,
  onSchemaGenerated,
}) => {
  const [selectedProvider, setSelectedProvider] = React.useState<LLMProvider>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(LOCAL_STORAGE_SELECTED_PROVIDER_KEY) as LLMProvider) || "openai";
    }
    return "openai";
  });
  const [apiKey, setApiKey] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(LOCAL_STORAGE_API_KEY) || "";
    }
    return "";
  });
  const [selectedModel, setSelectedModel] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(LOCAL_STORAGE_SELECTED_MODEL_KEY) || "";
    }
    return "";
  });

  const [userPrompt, setUserPrompt] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(LOCAL_STORAGE_USER_PROMPT_KEY) || "Generate a JSON schema for a 'Product' object with fields like name (string), price (float), description (string, optional), and categories (array of strings).";
    }
    return "Generate a JSON schema for a 'Product' object with fields like name (string), price (float), description (string, optional), and categories (array of strings).";
  });

  const [selectedCaseType, setSelectedCaseType] = React.useState<CaseType>(() => {
    if (typeof window !== "undefined") {
      const savedCaseType = localStorage.getItem(LOCAL_STORAGE_CASE_TYPE_KEY);
      return (savedCaseType as CaseType) || "snake_case";
    }
    return "snake_case";
  });

  const [isLoading, setIsLoading] = React.useState(false);

  // Persist userPrompt and selectedCaseType to localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_USER_PROMPT_KEY, userPrompt);
    }
  }, [userPrompt]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_CASE_TYPE_KEY, selectedCaseType);
    }
  }, [selectedCaseType]);

  // Persist LLM config to localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_SELECTED_PROVIDER_KEY, selectedProvider);
    }
  }, [selectedProvider]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_API_KEY, apiKey);
    }
  }, [apiKey]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_SELECTED_MODEL_KEY, selectedModel);
    }
  }, [selectedModel]);

  const getRequestDetails = (provider: LLMProvider, currentApiKey: string, model: string, prompt: string, caseType: CaseType) => {
    let requestBody: any = {};
    let endpoint = "";
    let headers: { [key: string]: string } = { "Content-Type": "application/json" };

    const systemMessage = `You are a helpful assistant designed to output JSON Schema data strictly according to the user's request. Ensure the output is a valid JSON Schema object, including $schema, type: 'object', properties, and required fields. All property names in the generated schema MUST use ${caseType} format. Do not include any additional text or markdown outside the JSON object.`;
    const messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt },
    ];

    switch (provider) {
      case "openai":
        endpoint = "https://api.openai.com/v1/chat/completions";
        headers["Authorization"] = `Bearer ${currentApiKey || "YOUR_OPENAI_API_KEY"}`;
        requestBody = {
          model: model,
          messages: messages,
          response_format: { type: "json_object" },
        };
        break;
      case "gemini":
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentApiKey || "YOUR_GEMINI_API_KEY"}`;
        requestBody = {
          contents: [
            { role: "user", parts: [{ text: `${systemMessage}\n\n${prompt}` }] },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        };
        break;
      case "mistral":
        endpoint = "https://api.mistral.ai/v1/chat/completions";
        headers["Authorization"] = `Bearer ${currentApiKey || "YOUR_MISTRAL_API_KEY"}`;
        requestBody = {
          model: model,
          messages: messages,
          response_format: { type: "json_object" },
        };
        break;
      case "openrouter":
        endpoint = "https://openrouter.ai/api/v1/chat/completions";
        headers["Authorization"] = `Bearer ${currentApiKey || "YOUR_OPENROUTER_API_KEY"}`;
        headers["HTTP-Referer"] = "YOUR_APP_URL";
        requestBody = {
          model: model,
          messages: messages,
          response_format: { type: "json_object" },
        };
        break;
      default:
        return { endpoint: "", headers: {}, requestBody: {} };
    }
    return { endpoint, headers, requestBody };
  };

  const handleGenerateSchema = async () => {
    if (!apiKey) {
      showError("Please enter your API Key before generating.");
      return;
    }
    if (!userPrompt.trim()) {
      showError("Please enter a prompt for schema generation.");
      return;
    }
    if (!selectedModel) {
      showError("Please select an LLM model.");
      return;
    }

    setIsLoading(true);

    const { endpoint, headers, requestBody } = getRequestDetails(selectedProvider, apiKey, selectedModel, userPrompt, selectedCaseType);

    if (!endpoint) {
      showError("Please select a valid LLM provider.");
      setIsLoading(false);
      onOpenChange(false);
      return;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      let data;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        console.error("API Error:", data);
        showError(`API Error: ${response.status} ${response.statusText}. Check console for details.`);
      } else {
        let generatedContent: string | object = data;
        if (selectedProvider === "openai" || selectedProvider === "mistral" || selectedProvider === "openrouter") {
          generatedContent = data?.choices?.[0]?.message?.content || data;
        } else if (selectedProvider === "gemini") {
          generatedContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || data;
        }

        let parsedSchema: any;
        try {
          parsedSchema = typeof generatedContent === 'string' ? JSON.parse(generatedContent) : generatedContent;
          
          const { mainFields, reusableTypes } = convertFullJsonSchemaToSchemaFieldsAndReusableTypes(parsedSchema);
          onSchemaGenerated(mainFields, reusableTypes);
          showSuccess("Schema generated successfully!");
        } catch (parseError) {
          console.error("Failed to parse generated content as JSON:", parseError);
          showError("Generated content is not a valid JSON Schema. Please refine your prompt.");
        }
      }
    } catch (error) {
      console.error("Network or Fetch Error:", error);
      showError("Failed to send request. Check your API key, network connection, or browser's CORS policy.");
    } finally {
      setIsLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Schema with AI</DialogTitle>
          <DialogDescription>
            Provide a prompt and select an LLM provider to generate a JSON Schema.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <LLMConfigInputs
            selectedProvider={selectedProvider}
            setSelectedProvider={setSelectedProvider}
            apiKey={apiKey}
            setApiKey={setApiKey}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />

          <div className="grid gap-2">
            <Label htmlFor="case-type-select">Field Name Case Type</Label>
            <Select value={selectedCaseType} onValueChange={(value) => setSelectedCaseType(value as CaseType)}>
              <SelectTrigger id="case-type-select">
                <SelectValue placeholder="Select case type" />
              </SelectTrigger>
              <SelectContent>
                {caseTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              This will instruct the AI to format all generated field names (property keys) in the chosen case.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="user-prompt-input">Prompt for Schema Generation</Label>
            <Textarea
              id="user-prompt-input"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="e.g., Generate a JSON schema for a 'Product' object with fields like name (string), price (float), description (string, optional), and categories (array of strings)."
              rows={6}
            />
            <p className="text-sm text-muted-foreground">
              Describe the JSON schema you want to generate. Be specific about field names, types, and relationships.
            </p>
          </div>

          <Button onClick={handleGenerateSchema} disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner className="mr-2" /> Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" /> Generate Schema
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SchemaAIGenerateDialog;