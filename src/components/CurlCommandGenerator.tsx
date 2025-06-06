import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";

interface CurlCommandGeneratorProps {
  jsonSchema: any;
  selectedProvider: "openai" | "gemini" | "mistral" | "openrouter";
  apiKey: string;
  userPrompt: string;
}

const CurlCommandGenerator: React.FC<CurlCommandGeneratorProps> = ({ jsonSchema, selectedProvider, apiKey, userPrompt }) => {
  const jsonString = JSON.stringify(jsonSchema, null, 2);

  // Refactored to return request details as an object
  const getRequestDetails = (provider: "openai" | "gemini" | "mistral" | "openrouter", currentApiKey: string, prompt: string) => {
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
              name: "generated_schema",
              strict: true,
              schema: jsonSchema,
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
          model: "openai/o4-mini",
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

  const { curlCommand } = React.useMemo(() => getRequestDetails(selectedProvider, apiKey, userPrompt), [selectedProvider, apiKey, userPrompt, jsonSchema]);

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

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-semibold">Generated cURL Command</CardTitle>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2" /> Copy Command
        </Button>
      </CardHeader>
      <CardContent>
        <Textarea
          value={curlCommand}
          readOnly
          rows={15}
          className="font-mono bg-gray-800 text-white"
        />
      </CardContent>
    </Card>
  );
};

export default CurlCommandGenerator;