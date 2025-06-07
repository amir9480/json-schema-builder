import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy, Play } from "lucide-react";
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
import { buildSingleFieldJsonSchema } from "@/utils/jsonSchemaBuilder";
import { convertSingleJsonSchemaToSchemaField } from "@/utils/schemaConverter";
import LoadingSpinner from "./LoadingSpinner"; // Import LoadingSpinner
import LLMConfigInputs from "./LLMConfigInputs"; // Import the new component

interface FieldRefineDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fieldToRefine: SchemaField | null;
  reusableTypes: SchemaField[];
  onFieldRefined: (refinedField: SchemaField) => void;
}

type LLMProvider = "openai" | "gemini" | "mistral" | "openrouter";

const LOCAL_STORAGE_FIELD_PROMPT_KEY = "llmFieldRefinePrompt"; // Specific prompt key for field refinement

// Define available models for field refinement
const FIELD_REFINE_MODELS = new Map<LLMProvider, string[]>([
  ["openai", ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"]],
  ["gemini", ["gemini-pro"]],
  ["mistral", ["mistral-small-latest", "mistral-large-latest", "mixtral-8x7b-instruct-v0.1"]],
  ["openrouter", ["openai/gpt-4o-mini", "openai/gpt-4o", "mistralai/mistral-small-latest"]],
]);

// Define default models for each provider for field refinement
const FIELD_REFINE_DEFAULT_MODELS = new Map<LLMProvider, string>([
  ["openai", "gpt-4o-mini"],
  ["gemini", "gemini-pro"],
  ["mistral", "mistral-small-latest"],
  ["openrouter", "openai/gpt-4o-mini"],
]);

const FieldRefineDialog: React.FC<FieldRefineDialogProps> = ({
  isOpen,
  onOpenChange,
  fieldToRefine,
  reusableTypes,
  onFieldRefined,
}) => {
  const [selectedProvider, setSelectedProvider] = React.useState<LLMProvider>("openai");
  const [apiKey, setApiKey] = React.useState<string>("");
  const [selectedModel, setSelectedModel] = React.useState<string>(FIELD_REFINE_DEFAULT_MODELS.get("openai") || "");

  const [userPrompt, setUserPrompt] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(LOCAL_STORAGE_FIELD_PROMPT_KEY) || "Refine this field. Make it a string with a maximum length of 50 characters.";
    }
    return "Refine this field. Make it a string with a maximum length of 50 characters.";
  });

  const [isLoading, setIsLoading] = React.useState(false);

  // Persist userPrompt to localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_FIELD_PROMPT_KEY, userPrompt);
    }
  }, [userPrompt]);

  const getRequestDetails = (provider: LLMProvider, currentApiKey: string, model: string, prompt: string, currentFieldSchema: any) => {
    let requestBody: any = {};
    let endpoint = "";
    let headers: { [key: string]: string } = { "Content-Type": "application/json" };

    // Updated system message to explicitly preserve properties for object types
    const systemMessage = `You are a helpful assistant designed to output JSON Schema data strictly according to the user's request. The user will provide an existing JSON Schema for a single field, and a prompt for how to refine it. Your output MUST be a valid JSON Schema object for that single field, reflecting the refinements. When refining an object type, ensure all existing properties are preserved unless explicitly instructed to remove them. Do not include any additional text or markdown outside the JSON object.`;
    const messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: `Here is the current JSON Schema for the field:\n\n${JSON.stringify(currentFieldSchema, null, 2)}\n\nRefine this field based on the following instructions: ${prompt}` },
    ];

    switch (provider) {
      case "openai":
        endpoint = "https://api.openai.com/v1/chat/completions";
        headers["Authorization"] = `Bearer ${currentApiKey || "YOUR_OPENAI_API_KEY"}`;
        requestBody = {
          model: model, // Using the selected model
          messages: messages,
          response_format: { type: "json_object" },
        };
        break;
      case "gemini":
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentApiKey || "YOUR_GEMINI_API_KEY"}`;
        requestBody = {
          contents: [
            { role: "user", parts: [{ text: `${systemMessage}\n\n${messages[1].content}` }] },
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
          model: model, // Using the selected model
          messages: messages,
          response_format: { type: "json_object" },
        };
        break;
      case "openrouter":
        endpoint = "https://openrouter.ai/api/v1/chat/completions";
        headers["Authorization"] = `Bearer ${currentApiKey || "YOUR_OPENROUTER_API_KEY"}`;
        headers["HTTP-Referer"] = "YOUR_APP_URL"; // Replace with your app's URL if deployed
        requestBody = {
          model: model, // Using the selected model
          messages: messages,
          response_format: { type: "json_object" },
        };
        break;
      default:
        return { endpoint: "", headers: {}, requestBody: {} };
    }
    return { endpoint, headers, requestBody };
  };

  const handleRefineField = async () => {
    if (!apiKey) {
      showError("Please enter your API Key before refining.");
      return;
    }
    if (!userPrompt.trim()) {
      showError("Please enter a prompt for field refinement.");
      return;
    }
    if (!fieldToRefine) {
      showError("No field selected for refinement.");
      return;
    }

    setIsLoading(true);

    const currentFieldSchema = buildSingleFieldJsonSchema(fieldToRefine, reusableTypes);
    console.log("JSON Schema sent to LLM for refinement:", JSON.stringify(currentFieldSchema, null, 2)); // Debug log
    
    const { endpoint, headers, requestBody } = getRequestDetails(selectedProvider, apiKey, selectedModel, userPrompt, currentFieldSchema);

    if (!endpoint) {
      showError("Please select a valid LLM provider.");
      setIsLoading(false);
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
          console.log("Parsed JSON Schema received from LLM:", JSON.stringify(parsedSchema, null, 2)); // Debug log
          
          // Convert the refined JSON schema back to a SchemaField
          const refinedField = convertSingleJsonSchemaToSchemaField(parsedSchema, reusableTypes);
          console.log("Converted SchemaField after refinement:", refinedField); // Debug log
          
          // Preserve the original ID and name of the field being refined
          const finalRefinedField = {
            ...refinedField,
            id: fieldToRefine.id,
            name: fieldToRefine.name,
            parentId: fieldToRefine.parentId,
          };

          onFieldRefined(finalRefinedField);
          showSuccess("Field refined successfully!");
          onOpenChange(false); // Close the dialog
        } catch (parseError) {
          console.error("Failed to parse generated content as JSON:", parseError);
          showError("Generated content is not a valid JSON Schema for a field. Please refine your prompt.");
        }
      }
    } catch (error) {
      console.error("Network or Fetch Error:", error);
      showError("Failed to send request. Check your API key, network connection, or browser's CORS policy. For production, consider using a backend proxy.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Refine Field with AI: {fieldToRefine?.name || "Unnamed Field"}</DialogTitle>
          <DialogDescription>
            Provide instructions to refine the selected field's schema using AI.
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
            availableModels={FIELD_REFINE_MODELS}
            defaultModelForProvider={FIELD_REFINE_DEFAULT_MODELS}
          />

          <div className="grid gap-2">
            <Label htmlFor="user-prompt-input">Refinement Instructions</Label>
            <Textarea
              id="user-prompt-input"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="e.g., Make this field an integer between 1 and 100. Add a description: 'Quantity of items'."
              rows={6}
            />
            <p className="text-sm text-muted-foreground">
              Describe how you want to modify the selected field's schema.
            </p>
          </div>

          <Button onClick={handleRefineField} disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner className="mr-2" /> Refining...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" /> Refine Field
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FieldRefineDialog;