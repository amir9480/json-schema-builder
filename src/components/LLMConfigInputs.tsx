import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LLMProvider = "openai" | "gemini" | "mistral" | "openrouter";

interface LLMConfigInputsProps {
  selectedProvider: LLMProvider;
  setSelectedProvider: (provider: LLMProvider) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
}

const LOCAL_STORAGE_SELECTED_PROVIDER_KEY = "llmBuilderSelectedProvider";
const LOCAL_STORAGE_API_KEY = "llmBuilderApiKey";

const LLMConfigInputs: React.FC<LLMConfigInputsProps> = ({
  selectedProvider,
  setSelectedProvider,
  apiKey,
  setApiKey,
}) => {
  // Load from local storage on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedProvider = localStorage.getItem(LOCAL_STORAGE_SELECTED_PROVIDER_KEY);
      if (savedProvider) {
        setSelectedProvider(savedProvider as LLMProvider);
      }
      const savedApiKey = localStorage.getItem(LOCAL_STORAGE_API_KEY);
      if (savedApiKey) {
        setApiKey(savedApiKey);
      }
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Persist to local storage when state changes
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

  return (
    <>
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
    </>
  );
};

export default LLMConfigInputs;