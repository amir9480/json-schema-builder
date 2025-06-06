import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Play } from "lucide-react";
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
import ApiResponseDisplay from "./ApiResponseDisplay";
import LoadingSpinner from "./LoadingSpinner"; // Import LoadingSpinner

interface SchemaDataGeneratorProps {
  jsonSchema: any;
  onDataGenerated: (data: Record<string, any>) => void;
}

type LLMProvider = "openai" | "gemini" | "mistral" | "openrouter";

const LOCAL_STORAGE_SELECTED_PROVIDER_KEY = "llmBuilderSelectedProvider";
const LOCAL_STORAGE_API_KEY = "llmBuilderApiKey";
const LOCAL_STORAGE_SHARED_USER_PROMPT_KEY = "llmBuilderSharedUserPrompt"; // Using the shared key

const SchemaDataGenerator: React.FC<SchemaDataGeneratorProps> = ({
  jsonSchema,
  onDataGenerated,
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
      return localStorage.getItem(LOCAL_STORAGE_SHARED_USER_PROMPT_KEY) || "Generate a realistic JSON object based on the provided schema.";
    }
    return "Generate a realistic JSON object based on the provided schema.";
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
      localStorage.setItem(LOCAL_STORAGE_SHARED_USER_PROMPT_KEY, userPrompt);
    }
  }, [userPrompt]);

  const getRequestDetails = (provider: LLMProvider, currentApiKey: string, prompt: string, schema: any) => {
    let requestBody: any = {};
    let endpoint = "";
    let headers: { [key: string]: string } = { "Content-Type": "application/json" };

    const systemMessage = "You are a helpful assistant designed to output JSON data strictly according to the provided JSON schema. Do not include any additional text or markdown outside the JSON object.";
    const messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: `${prompt}\n\nHere is the JSON Schema:\n\n${JSON.stringify(schema, null, 2)}` },
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

  const handleGenerateData = async () => {
    if (!apiKey) {
      showError("Please enter your API Key before generating data.");
      return;
    }
    if (!userPrompt.trim()) {
      showError("Please enter a prompt for data generation.");
      return;
    }
    if (!jsonSchema || Object.keys(jsonSchema).length === 0) {
      showError("No schema defined to generate data from.");
      return;
    }

    setIsLoading(true);
    setGeneratedJson("Generating data...");
    setIsResponseModalOpen(true);

    const { endpoint, headers, requestBody } = getRequestDetails(selectedProvider, apiKey, userPrompt, jsonSchema);

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

        let parsedData: any;
        try {
          parsedData = typeof generatedContent === 'string' ? JSON.parse(generatedContent) : generatedContent;
          setGeneratedJson(JSON.stringify(parsedData, null, 2)); // Display formatted JSON
          onDataGenerated(parsedData); // Pass generated data to parent
          showSuccess("Data generated successfully!");
        } catch (parseError) {
          console.error("Failed to parse generated content as JSON:", parseError);
          setGeneratedJson(typeof generatedContent === 'string' ? generatedContent : JSON.stringify(generatedContent, null, 2));
          showError("Generated content is not valid JSON. Please refine your prompt.");
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
    <div className="space-y-4">
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
        <Label htmlFor="user-prompt-input">Prompt for Data Generation</Label>
        <Textarea
          id="user-prompt-input"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="e.g., Generate a JSON object for a product with a name 'Laptop Pro', price 1200.50, and categories ['Electronics', 'Computers']."
          rows={6}
        />
        <p className="text-sm text-muted-foreground">
          Describe the data you want to generate based on your schema.
        </p>
      </div>

      <Button onClick={handleGenerateData} disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <LoadingSpinner className="mr-2" /> Generating Data...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" /> Generate Data
          </>
        )}
      </Button>

      <ApiResponseDisplay
        isOpen={isResponseModalOpen}
        onOpenChange={setIsResponseModalOpen}
        title="AI Data Generation Response"
        description="The raw response from the LLM API call. If successful, the form preview will be updated."
        jsonContent={generatedJson}
      />
    </div>
  );
};

export default SchemaDataGenerator;