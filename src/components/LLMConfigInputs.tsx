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
import LoadingSpinner from "./LoadingSpinner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

type LLMProvider = "openai" | "gemini" | "mistral" | "openrouter";

interface LLMConfigInputsProps {
  selectedProvider: LLMProvider;
  setSelectedProvider: (provider: LLMProvider) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

const LOCAL_STORAGE_SELECTED_PROVIDER_KEY = "llmBuilderSelectedProvider";
const LOCAL_STORAGE_API_KEY = "llmBuilderApiKey";
const LOCAL_STORAGE_SELECTED_MODEL_KEY = "llmBuilderSelectedModel";

// Default models for initial selection if API fetching fails or is slow
const DEFAULT_MODELS_FALLBACK = new Map<LLMProvider, string[]>([
  ["openai", ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"]],
  ["gemini", ["gemini-pro"]], // Gemini doesn't have a public /models endpoint like others
  ["mistral", ["mistral-small-latest", "mistral-large-latest", "mixtral-8x7b-instruct-v0.1"]],
  ["openrouter", ["openai/gpt-4o-mini", "openai/gpt-4o", "mistralai/mistral-small-latest"]],
]);

const LLMConfigInputs: React.FC<LLMConfigInputsProps> = ({
  selectedProvider,
  setSelectedProvider,
  apiKey,
  setApiKey,
  selectedModel,
  setSelectedModel,
}) => {
  const [availableModels, setAvailableModels] = React.useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = React.useState(false);
  const [isModelSelectOpen, setIsModelSelectOpen] = React.useState(false); // State for Popover

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
  }, []);

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

  // Function to fetch models
  const fetchModels = React.useCallback(async () => {
    if (!apiKey && selectedProvider !== "gemini") { // API key not strictly needed for Gemini's single model
      setAvailableModels(DEFAULT_MODELS_FALLBACK.get(selectedProvider) || []);
      setSelectedModel(DEFAULT_MODELS_FALLBACK.get(selectedProvider)?.[0] || "");
      return;
    }

    setIsFetchingModels(true);
    let endpoint = "";
    let headers: { [key: string]: string } = {};
    let models: string[] = [];

    try {
      switch (selectedProvider) {
        case "openai":
          endpoint = "https://api.openai.com/v1/models";
          headers["Authorization"] = `Bearer ${apiKey}`;
          const openaiResponse = await fetch(endpoint, { headers });
          const openaiData = await openaiResponse.json();
          if (openaiResponse.ok) {
            models = openaiData.data
              .filter((m: any) => m.id.startsWith("gpt-") || m.id.startsWith("ft:gpt-")) // Filter for chat models
              .map((m: any) => m.id)
              .sort();
          } else {
            console.error("Failed to fetch OpenAI models:", openaiData);
            models = DEFAULT_MODELS_FALLBACK.get("openai") || [];
          }
          break;
        case "gemini":
          // Gemini doesn't have a public /models endpoint for listing.
          // We'll hardcode the common model for now.
          models = ["gemini-pro"];
          break;
        case "mistral":
          endpoint = "https://api.mistral.ai/v1/models";
          headers["Authorization"] = `Bearer ${apiKey}`;
          const mistralResponse = await fetch(endpoint, { headers });
          const mistralData = await mistralResponse.json();
          if (mistralResponse.ok) {
            models = mistralData.data
              .map((m: any) => m.id)
              .sort();
          } else {
            console.error("Failed to fetch Mistral models:", mistralData);
            models = DEFAULT_MODELS_FALLBACK.get("mistral") || [];
          }
          break;
        case "openrouter":
          endpoint = "https://openrouter.ai/api/v1/models";
          headers["Authorization"] = `Bearer ${apiKey}`;
          const openrouterResponse = await fetch(endpoint, { headers });
          const openrouterData = await openrouterResponse.json();
          if (openrouterResponse.ok) {
            models = openrouterData.data
              .map((m: any) => m.id)
              .sort();
          } else {
            console.error("Failed to fetch OpenRouter models:", openrouterData);
            models = DEFAULT_MODELS_FALLBACK.get("openrouter") || [];
          }
          break;
        default:
          models = [];
      }
    } catch (error) {
      console.error(`Error fetching models for ${selectedProvider}:`, error);
      models = DEFAULT_MODELS_FALLBACK.get(selectedProvider) || [];
    } finally {
      setAvailableModels(models);
      // If the currently selected model is not in the new list, or if no model is selected,
      // default to the first available model.
      if (!models.includes(selectedModel) && models.length > 0) {
        setSelectedModel(models[0]);
      } else if (models.length === 0) {
        setSelectedModel(""); // Clear selection if no models are available
      }
      setIsFetchingModels(false);
    }
  }, [selectedProvider, apiKey, selectedModel, setSelectedModel]);

  // Fetch models whenever provider or API key changes
  React.useEffect(() => {
    fetchModels();
  }, [fetchModels]);

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
        <Popover open={isModelSelectOpen} onOpenChange={setIsModelSelectOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isModelSelectOpen}
              className="w-full justify-between"
              disabled={isFetchingModels || availableModels.length === 0}
            >
              {isFetchingModels ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size={16} /> Loading models...
                </div>
              ) : (
                selectedModel
                  ? availableModels.find((model) => model === selectedModel)
                  : "Select a model..."
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Search model..." />
              <CommandEmpty>No model found.</CommandEmpty>
              <CommandGroup className="max-h-60 overflow-y-auto">
                {availableModels.map((model) => (
                  <CommandItem
                    key={model}
                    value={model}
                    onSelect={(currentValue) => {
                      setSelectedModel(currentValue === selectedModel ? "" : currentValue);
                      setIsModelSelectOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedModel === model ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {model}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
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