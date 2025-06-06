import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy, Play } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import ApiResponseDisplay from "./ApiResponseDisplay";

interface FieldRefineDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fieldToRefine: SchemaField | null;
  reusableTypes: SchemaField[];
  onFieldRefined: (refinedField: SchemaField) => void;
}

type LLMProvider = "openai" | "gemini" | "mistral" | "openrouter";

const LOCAL_STORAGE_SELECTED_PROVIDER_KEY = "llmBuilderSelectedProvider";
const LOCAL_STORAGE_API_KEY = "llmBuilderApiKey";
const LOCAL_STORAGE_FIELD_PROMPT_KEY = "llmFieldRefinePrompt"; // Specific prompt key for field refinement

const FieldRefineDialog: React.FC<FieldRefineDialogProps> = ({
  isOpen,
  onOpenChange,
  fieldToRefine,
  reusableTypes,
  onFieldRefined,
}) => {
  const [selectedProvider, setSelectedProvider] = React.useState<LLMProvider>(() => {
    if (typeof window !== "undefined") {
      const savedProvider = localStorage.getItem(LOCAL_STORAGE_SELECTED_PROVIDER_KEY);
      return (savedProvider as LLMProvider) || "openai";
    }
    return "openai";
  });

  const [apiKey, setApiKey] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(LOCAL_STORAGE_API_KEY) || "";
    }
    return "";
  });

  const [userPrompt, setUserPrompt] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(LOCAL_STORAGE_FIELD_PROMPT_KEY) || "Refine this field. Make it a string with a maximum length of 50 characters.";
    }
    return "Refine this field. Make it a string with a maximum length of 50 characters.";
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [generatedJson, setGeneratedJson] = React.useState<string>("");
  const [isResponseModalOpen, setIsResponseModalOpen] = React.useState(false);

  // Persist selectedProvider, apiKey, and userPrompt to localStorage
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
      localStorage.setItem(LOCAL_STORAGE_FIELD_PROMPT_KEY, userPrompt);
    }
  }, [userPrompt]);

  const getRequestDetails = (provider: LLMProvider, currentApiKey: string, prompt: string, currentFieldSchema: any) => {
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
          model: "gpt-4o-mini", // Using a smaller model for faster responses
          messages: messages,
          response_format: { type: "json_object" },
        };
        break;
      case "gemini":
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${currentApiKey || "YOUR_GEMINI_API_KEY"}`;
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
          model: "mistral-small-latest", // Using a smaller model for faster responses
          messages: messages,
          response_format: { type: "json_object" },
        };
        break;
      case "openrouter":
        endpoint = "https://openrouter.ai/api/v1/chat/completions";
        headers["Authorization"] = `Bearer ${currentApiKey || "YOUR_OPENROUTER_API_KEY"}`;
        headers["HTTP-Referer"] = "YOUR_APP_URL"; // Replace with your app's URL if deployed
        requestBody = {
          model: "openai/gpt-4o-mini",
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
    setGeneratedJson("Refining field...");
    setIsResponseModalOpen(true);

    const currentFieldSchema = buildSingleFieldJsonSchema(fieldToRefine, reusableTypes);
    console.log("JSON Schema sent to LLM for refinement:", JSON.stringify(currentFieldSchema, null, 2)); // Debug log
    
    const { endpoint, headers, requestBody } = getRequestDetails(selectedProvider, apiKey, userPrompt, currentFieldSchema);

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
        setGeneratedJson(JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          error: data
        }, null, 2));
        showError(`API Error: ${response.status} ${response.statusText}`);
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
          setGeneratedJson(JSON.stringify(parsedSchema, null, 2)); // Display formatted JSON
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
          setGeneratedJson(typeof generatedContent === 'string' ? generatedContent : JSON.stringify(generatedContent, null, 2));
          showError("Generated content is not a valid JSON Schema for a field. Please refine your prompt.");
        }
      }
    } catch (error) {
      console.error("Network or Fetch Error:", error);
      setGeneratedJson(JSON.stringify({
        error: "Network or Fetch Error",
        message: (error as Error).message,
        details: "Check your API key, network connection, or browser's CORS policy. For production, consider using a backend proxy."
      }, null, 2));
      showError("Failed to send request. Check console for details.");
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
          <div className="grid gap-2">
            <Label htmlFor="llm-provider-select">Select LLM Provider</Label>
            <Select value={selectedProvider} onValueChange={(value) => setSelectedProvider(value as LLMProvider)}>
              <SelectTrigger id="llm-provider-select">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
                <SelectItem value="gemini">Google (Gemini)</SelectItem>
                <SelectItem value="mistral">Mistral AI</SelectItem>
                <SelectItem value="openrouter">OpenRouter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="api-key-input">API Key</Label>
            <Input
              id="api-key-input"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter your ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API Key`}
            />
            <p className="text-sm text-muted-foreground">
              Your API key is stored locally in your browser for convenience and is not sent to any server.
            </p>
          </div>

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
            {isLoading ? "Refining..." : <><Sparkles className="h-4 w-4 mr-2" /> Refine Field</>}
          </Button>
        </div>

        <ApiResponseDisplay
          isOpen={isResponseModalOpen}
          onOpenChange={setIsResponseModalOpen}
          title="AI Refinement Response"
          description="The raw response from the LLM API call. If successful, the field will be updated."
          jsonContent={generatedJson}
        />
      </DialogContent>
    </Dialog>
  );
};

export default FieldRefineDialog;