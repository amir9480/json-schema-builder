import React from "react";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // Import Input
import { showSuccess, showError } from "@/utils/toast";

interface CurlCommandGeneratorProps {
  jsonSchema: any;
}

type LLMProvider = "openai" | "gemini" | "mistral" | "openrouter";

const LOCAL_STORAGE_SELECTED_PROVIDER_KEY = "llmBuilderSelectedProvider";
const LOCAL_STORAGE_API_KEY = "llmBuilderApiKey";

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

  // Persist selectedProvider and apiKey to localStorage
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

  const jsonString = JSON.stringify(jsonSchema, null, 2);

  const generateCurlCommand = (provider: LLMProvider, currentApiKey: string): string => {
    let requestBody: any = {};
    let endpoint = "";
    let headers: { [key: string]: string } = { "Content-Type": "application/json" };

    // Common messages for all providers
    const messages = [
      { role: "system", content: "You are a helpful assistant designed to output JSON data strictly according to the provided JSON schema." },
      { role: "user", content: "Generate a JSON object based on the schema." },
    ];

    switch (provider) {
      case "openai":
        endpoint = "https://api.openai.com/v1/chat/completions";
        headers["Authorization"] = `Bearer ${currentApiKey || "YOUR_OPENAI_API_KEY"}`;
        requestBody = {
          model: "gpt-4o", // gpt-4o and newer models support json_schema
          messages: messages,
          response_format: { type: "json_schema", json_schema: jsonSchema },
        };
        break;
      case "gemini":
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${currentApiKey || "YOUR_GEMINI_API_KEY"}`;
        // Gemini typically uses responseMimeType and relies on prompt engineering for schema adherence
        requestBody = {
          contents: [
            { role: "user", parts: [{ text: `Generate a JSON object based on the following schema:\n\n${jsonString}` }] },
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
          model: "mistral-large-latest", // Check Mistral's documentation for models supporting json_schema
          messages: messages,
          response_format: { type: "json_schema", json_schema: jsonSchema },
        };
        break;
      case "openrouter":
        endpoint = "https://openrouter.ai/api/v1/chat/completions";
        headers["Authorization"] = `Bearer ${currentApiKey || "YOUR_OPENROUTER_API_KEY"}`;
        headers["HTTP-Referer"] = "YOUR_APP_URL"; // Optional, but good practice
        requestBody = {
          model: "mistralai/mistral-7b-instruct", // Example model, choose one from OpenRouter's list that supports json_schema
          messages: messages,
          response_format: { type: "json_schema", json_schema: jsonSchema },
        };
        break;
      default:
        return "Select an LLM provider to generate the cURL command.";
    }

    const bodyString = JSON.stringify(requestBody, null, 2);
    
    const commandParts: string[] = [];
    commandParts.push(`curl -X POST ${endpoint}`);

    Object.entries(headers).forEach(([key, value]) => {
      commandParts.push(`-H "${key}: ${value}"`);
    });

    commandParts.push(`-d '${bodyString}'`);

    // Join all parts with ' \\\n  ' except the last one
    return commandParts.join(" \\\n  ");
  };

  const currentCurlCommand = generateCurlCommand(selectedProvider, apiKey);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCurlCommand)
      .then(() => {
        showSuccess("cURL command copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy cURL command: ", err);
        showError("Failed to copy cURL command.");
      });
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
          type="password" // Use type="password" for sensitive input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={`Enter your ${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} API Key`}
        />
        <p className="text-sm text-muted-foreground">
          Your API key is stored locally in your browser for convenience and is not sent to any server.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="curl-command-output">Generated cURL Command</Label>
        <Textarea
          id="curl-command-output"
          value={currentCurlCommand}
          readOnly
          rows={15}
          className="font-mono bg-gray-800 text-white"
        />
      </div>
      <Button onClick={handleCopy} className="w-full">
        <Copy className="h-4 w-4 mr-2" /> Copy cURL Command
      </Button>
      <p className="text-sm text-muted-foreground">
        Remember to replace `YOUR_APP_URL` if you are using OpenRouter.
      </p>
    </div>
  );
};

export default CurlCommandGenerator;