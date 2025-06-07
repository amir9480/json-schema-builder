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
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  availableModels: Map<LLMProvider, string[]>;
  defaultModelForProvider: Map<LLMProvider, string>;
}

const LOCAL_STORAGE_SELECTED_PROVIDER_KEY = "llmBuilderSelectedProvider";
const LOCAL_STORAGE_API_KEY = "llmBuilderApiKey";
const LOCAL_STORAGE_SELECTED_MODEL_KEY = "llmBuilderSelectedModel";

const LLMConfigInputs: React.FC<LLMConfigInputsProps> = ({
  selectedProvider,
  setSelectedProvider,
  apiKey,
  setApiKey,
  selectedModel,
  setSelectedModel,
  availableModels,
  defaultModelForProvider,
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
      const savedModel = localStorage.getItem(LOCAL_STORAGE_SELECTED_MODEL_KEY);
      if (savedModel) {
        setSelectedModel(savedModel);
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

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_SELECTED_MODEL_KEY, selectedModel);
    }
  }, [selectedModel]);

  // Update selected model when provider changes, defaulting to the provider's default model
  React.useEffect(() => {
    const defaultModel = defaultModelForProvider.get(selectedProvider);
    if (defaultModel && selectedModel !== defaultModel) {
      setSelectedModel(defaultModel);
    }
  }, [selectedProvider, defaultModelForProvider, selectedModel, setSelectedModel]);

  const currentModels = availableModels.get(selectedProvider) || [];

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
        <Label htmlFor="llm-model-select">Select Model</Label>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger id="llm-model-select">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {currentModels.length > 0 ? (
              currentModels.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-models" disabled>
                No models available for this provider
              </SelectItem>
            )}
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