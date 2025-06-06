import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, Play } from "lucide-react";
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
import ApiResponseDisplay from "./ApiResponseDisplay"; // Import the new component
import LoadingSpinner from "./LoadingSpinner"; // Import LoadingSpinner

interface CurlCommandGeneratorProps {
  jsonSchema: any;
}

type LLMProvider = "openai" | "gemini" | "mistral" | "openrouter";

const LOCAL_STORAGE_SELECTED_PROVIDER_KEY = "llmBuilderSelectedProvider";
const LOCAL_STORAGE_API_KEY = "llmBuilderApiKey";
const LOCAL_STORAGE_SHARED_USER_PROMPT_KEY = "llmBuilderSharedUserPrompt"; // New shared key for user prompt

const CurlCommandGenerator: React.FC<CurlCommandGeneratorProps> = ({ jsonSchema }) => {
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
      return localStorage.getItem(LOCAL_STORAGE_SHARED_USER_PROMPT_KEY) || "Generate a JSON object based on the schema.";
    }
    return "Generate a JSON object based on the schema.";
  });

  const [responseJson, setResponseJson] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = React.useState(false); // State to control modal

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

  const jsonString = JSON.stringify(jsonSchema, null, 2);

  // Refactored to return request details as an object
  const getRequestDetails = (provider: LLMProvider, currentApiKey: string, prompt: string) => {
    let requestBody: any = {};
    let endpoint = "";
    let headers: { [key: string]: string } = { "Content-Type": "application/json" };

    const messages = [
      { role: "system", content: "You are a helpful assistant designed to output JSON data strictly according to the provided JSON schema." },
      { role: "user", content: prompt },
    ];

    switch (provider) {
      case "openai":
        endpoint = "https://api.openai.com/v1/chat/completions";
        headers["Authorization"] = `Bearer ${currentApiKey || "YOUR_OPENAI_API_KEY"}`;
        requestBody = {
          model: "gpt-4o",
          messages: messages,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "generated_schema", // A default name for the schema
              strict: true,
              schema: jsonSchema, // The actual JSON schema
            },
          },
        };
        break;
      case "gemini":
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${currentApiKey || "YOUR_GEMINI_API_KEY"}`;
        requestBody = {
          contents: [
            { role: "user", parts: [{ text: `${prompt}\n\nHere is the schema:\n\n${jsonString}` }] },
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
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "generated_schema",
              strict: true,
              schema: jsonSchema,
            },
          },
        };
        break;
      case "openrouter":
        endpoint = "https://openrouter.ai/api/v1/chat/completions";
        headers["Authorization"] = `Bearer ${currentApiKey || "YOUR_OPENROUTER_API_KEY"}`;
        headers["HTTP-Referer"] = "YOUR_APP_URL";
        requestBody = {
          model: "openai/o4-mini", // Updated model here
          messages: messages,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "generated_schema",
              strict: true,
              schema: jsonSchema,
            },
          },
        };
        break;
      default:
        return { endpoint: "", headers: {}, requestBody: {}, curlCommand: "Select an LLM provider to generate the cURL command." };
    }

    const bodyString = JSON.stringify(requestBody, null, 2);
    
    const commandParts: string[] = [];
    commandParts.push(`curl -X POST ${endpoint}`);

    Object.entries(headers).forEach(([key, value]) => {
      commandParts.push(`-H "${key}: ${value}"`);
    });

    commandParts.push(`-d '${bodyString}'`);

    return {
      endpoint,
      headers,
      requestBody,
      curlCommand: commandParts.join(" \\\n  ")
    };
  };

  const { endpoint, headers, requestBody, curlCommand } = getRequestDetails(selectedProvider, apiKey, userPrompt);

  const handleCopy = () => {
    navigator.clipboard.writeText(curlCommand)
      .then(() => {
        showSuccess("cURL command copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy cURL command: ", err);
        showError("Failed to copy cURL command.");
      });
  };

  const handleTryIt = async () => {
    if (!apiKey) {
      showError("Please enter your API Key before trying the request.");
      return;
    }
    if (!endpoint) {
      showError("Please select an LLM provider.");
      return;
    }

    setIsLoading(true);
    setResponseJson("Loading...");
    setIsResponseModalOpen(true); // Open the modal when starting the request

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
        setResponseJson(JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          error: data
        }, null, 2));
        showError(`API Error: ${response.status} ${response.statusText}`);
      } else {
        // Extract the actual generated content for LLM responses
        let generatedContent = data;
        if (selectedProvider === "openai" || selectedProvider === "mistral" || selectedProvider === "openrouter") {
          generatedContent = data?.choices?.[0]?.message?.content || data;
        } else if (selectedProvider === "gemini") {
          generatedContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || data;
        }
        
        try {
          // Attempt to parse the content if it's a string that looks like JSON
          const parsedContent = JSON.parse(generatedContent);
          setResponseJson(JSON.stringify(parsedContent, null, 2));
        } catch (parseError) {
          // If it's not valid JSON, just display it as is
          setResponseJson(typeof generatedContent === 'string' ? generatedContent : JSON.stringify(generatedContent, null, 2));
        }
        showSuccess("Request successful!");
      }
    } catch (error) {
      console.error("Network or Fetch Error:", error);
      setResponseJson(JSON.stringify({
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
        <Label htmlFor="user-prompt-input">User Prompt</Label>
        <Textarea
          id="user-prompt-input"
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="e.g., Extract the product details from the following text."
          rows={4}
        />
        <p className="text-sm text-muted-foreground">
          This prompt will be sent to the LLM along with your schema.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="curl-command-output">Generated cURL Command</Label>
        <Textarea
          id="curl-command-output"
          value={curlCommand}
          readOnly
          rows={15}
          className="font-mono bg-gray-800 text-white"
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleCopy} className="flex-1">
          <Copy className="h-4 w-4 mr-2" /> Copy cURL Command
        </Button>
        <Button onClick={handleTryIt} disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <LoadingSpinner className="mr-2" /> Sending Request...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" /> Try it
            </>
          )}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Remember to replace `YOUR_APP_URL` if you are using OpenRouter.
      </p>

      {responseJson && (
        <ApiResponseDisplay
          isOpen={isResponseModalOpen}
          onOpenChange={setIsResponseModalOpen}
          title="API Response"
          description="The response from the LLM API call."
          jsonContent={responseJson}
        />
      )}
    </div>
  );
};

export default CurlCommandGenerator;