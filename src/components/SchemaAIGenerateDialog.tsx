import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, Play, Sparkles } from "lucide-react";
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
import { convertFullJsonSchemaToSchemaFieldsAndReusableTypes } from "@/utils/schemaConverter";
import ApiResponseDisplay from "./ApiResponseDisplay"; // Re-using the API response display
import LoadingSpinner from "./LoadingSpinner"; // Import LoadingSpinner

interface SchemaAIGenerateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSchemaGenerated: (mainFields: SchemaField[], reusableTypes: SchemaField[]) => void;
}

type LLMProvider = "openai" | "gemini" | "mistral" | "openrouter";

// Updated to use the same keys as CurlCommandGenerator
const LOCAL_STORAGE_SELECTED_PROVIDER_KEY = "llmBuilderSelectedProvider";
const LOCAL_STORAGE_API_KEY = "llmBuilderApiKey";
const LOCAL_STORAGE_USER_PROMPT_KEY = "llmSchemaBuilderUserPrompt"; // This prompt is specific to schema generation

const SchemaAIGenerateDialog: React.FC<SchemaAIGenerateDialogProps> = ({
  isOpen,
  onOpenChange,
  onSchemaGenerated,
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
      return localStorage.getItem(LOCAL_STORAGE_USER_PROMPT_KEY) || "Generate a JSON schema for a 'Product' object with fields like name (string), price (float), description (string, optional), and categories (array of strings).";
    }
    return "Generate a JSON schema for a 'Product' object with fields like name (string), price (float), description (string, optional), and categories (array of strings).";
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
      localStorage.setItem(LOCAL_STORAGE_USER_PROMPT_KEY, userPrompt);
    }
  }, [userPrompt]);

  const getRequestDetails = (provider: LLMProvider, currentApiKey: string, prompt: string) => {
    let requestBody: any = {};
    let endpoint = "";
    let headers: { [key: string]: string } = { "Content-Type": "application/json" };

    const systemMessage = "You are a helpful assistant designed to output JSON Schema data strictly according to the user's request. Ensure the output is a valid JSON Schema object, including $schema, type: 'object', properties, and required fields. Do not include any additional text or markdown outside the JSON object.";
    const messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt },
    ];

    switch (provider) {
      case "openai":
        endpoint = "https://api.openai.com/v1/chat/completions";
        headers["Authorization"] = `Bearer ${currentApiKey || "YOUR_OPENAI_API_KEY"}`;
        requestBody = {
          model: "gpt-4o",
          messages: messages,
          response_format: { type: "json_object" }, // Request JSON object, not schema-specific format
        };
        break;
      case "gemini":
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${currentApiKey || "YOUR_GEMINI_API_KEY"}`;
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
          model: "mistral-large-latest",
          messages: messages,
          response_format: { type: "json_object" },
        };
        break;
      case "openrouter":
        endpoint = "https://openrouter.ai/api/v1/chat/completions";
        headers["Authorization"] = `Bearer ${currentApiKey || "YOUR_OPENROUTER_API_KEY"}`;
        headers["HTTP-Referer"] = "YOUR_APP_URL"; // Replace with your app's URL if deployed
        requestBody = {
          model: "openai/gpt-4o-mini", // Using a smaller model for faster responses
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

    setIsLoading(true);
    setGeneratedJson("Generating schema...");
    setIsResponseModalOpen(true); // Open the modal to show loading state

    const { endpoint, headers, requestBody } = getRequestDetails(selectedProvider, apiKey, userPrompt);

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
          // Attempt to parse the content if it's a string that looks like JSON
          parsedSchema = typeof generatedContent === 'string' ? JSON.parse(generatedContent) : generatedContent;
          setGeneratedJson(JSON.stringify(parsedSchema, null, 2)); // Display formatted JSON
          
          // Convert and pass to parent
          const { mainFields, reusableTypes } = convertFullJsonSchemaToSchemaFieldsAndReusableTypes(parsedSchema);
          onSchemaGenerated(mainFields, reusableTypes);
          showSuccess("Schema generated successfully!");
          onOpenChange(false); // Close the generation dialog
        } catch (parseError) {
          console.error("Failed to parse generated content as JSON:", parseError);
          setGeneratedJson(typeof generatedContent === 'string' ? generatedContent : JSON.stringify(generatedContent, null, 2));
          showError("Generated content is not a valid JSON Schema. Please refine your prompt.");
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
          <DialogTitle>Generate Schema with AI</DialogTitle>
          <DialogDescription>
            Provide a prompt and select an LLM provider to generate a JSON Schema.
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
            <Label htmlFor="user-prompt-input">Prompt for Schema Generation</Label>
            <Textarea
              id="user-prompt-input"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="e.g., Generate a JSON schema for a 'User' object with fields like name, email, age, and an array of addresses."
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

        {/* Display API response in a modal, similar to CurlCommandGenerator */}
        <ApiResponseDisplay
          isOpen={isResponseModalOpen}
          onOpenChange={setIsResponseModalOpen}
          title="AI Generation Response"
          description="The raw response from the LLM API call. If successful, the schema will be imported."
          jsonContent={generatedJson}
        />
      </DialogContent>
    </Dialog>
  );
};

export default SchemaAIGenerateDialog;