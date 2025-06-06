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
import { showSuccess, showError } from "@/utils/toast";

interface CurlCommandGeneratorProps {
  jsonSchema: any;
}

type LLMProvider = "openai" | "gemini" | "mistral" | "openrouter";

const CurlCommandGenerator: React.FC<CurlCommandGeneratorProps> = ({ jsonSchema }) => {
  const [selectedProvider, setSelectedProvider] = React.useState<LLMProvider>("openai");
  const jsonString = JSON.stringify(jsonSchema, null, 2);

  const generateCurlCommand = (provider: LLMProvider): string => {
    const promptContent = `Generate data based on the following JSON schema:\n\n${jsonString}`;
    let curlCommand = "";
    let requestBody: any = {};
    let endpoint = "";
    let headers: { [key: string]: string } = { "Content-Type": "application/json" };

    switch (provider) {
      case "openai":
        endpoint = "https://api.openai.com/v1/chat/completions";
        headers["Authorization"] = "Bearer YOUR_OPENAI_API_KEY";
        requestBody = {
          model: "gpt-4o", // Or another suitable model like gpt-3.5-turbo
          messages: [
            { role: "system", content: "You are a helpful assistant designed to output JSON." },
            { role: "user", content: promptContent },
          ],
          response_format: { type: "json_object" },
        };
        break;
      case "gemini":
        endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_GEMINI_API_KEY";
        requestBody = {
          contents: [
            { role: "user", parts: [{ text: promptContent }] },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        };
        break;
      case "mistral":
        endpoint = "https://api.mistral.ai/v1/chat/completions";
        headers["Authorization"] = "Bearer YOUR_MISTRAL_API_KEY";
        requestBody = {
          model: "mistral-large-latest", // Or another suitable model
          messages: [
            { role: "system", content: "You are a helpful assistant designed to output JSON." },
            { role: "user", content: promptContent },
          ],
          response_format: { type: "json_object" },
        };
        break;
      case "openrouter":
        endpoint = "https://openrouter.ai/api/v1/chat/completions";
        headers["Authorization"] = "Bearer YOUR_OPENROUTER_API_KEY";
        headers["HTTP-Referer"] = "YOUR_APP_URL"; // Optional, but good practice
        requestBody = {
          model: "mistralai/mistral-7b-instruct", // Example model, choose one from OpenRouter's list
          messages: [
            { role: "system", content: "You are a helpful assistant designed to output JSON." },
            { role: "user", content: promptContent },
          ],
          response_format: { type: "json_object" },
        };
        break;
      default:
        return "Select an LLM provider to generate the cURL command.";
    }

    const bodyString = JSON.stringify(requestBody, null, 2);
    const headerString = Object.entries(headers)
      .map(([key, value]) => `-H "${key}: ${value}"`)
      .join(" \\\n  ");

    curlCommand = `curl -X POST ${endpoint} \\\n  ${headerString} \\\n  -d '${bodyString}'`;

    return curlCommand;
  };

  const currentCurlCommand = generateCurlCommand(selectedProvider);

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
        Remember to replace placeholder API keys (e.g., `YOUR_OPENAI_API_KEY`) and `YOUR_APP_URL` with your actual values.
      </p>
    </div>
  );
};

export default CurlCommandGenerator;