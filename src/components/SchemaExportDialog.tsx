import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import SchemaDisplay from "./SchemaDisplay";
import { SchemaField } from "./FieldEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CurlCommandGenerator from "./CurlCommandGenerator";
import { buildFullJsonSchema } from "@/utils/jsonSchemaBuilder";
import SchemaFormPreview from "./SchemaFormPreview";
import PythonCodeGenerator from "./PythonCodeGenerator";
import JavaScriptCodeGenerator from "./JavaScriptCodeGenerator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, Play } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import LoadingSpinner from "./LoadingSpinner";
import ApiResponseDisplay from "./ApiResponseDisplay";

interface SchemaExportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  schemaFields: SchemaField[];
  reusableTypes: SchemaField[];
  initialTab?: string;
}

type LLMProvider = "openai" | "gemini" | "mistral" | "openrouter";

const LOCAL_STORAGE_SELECTED_EXPORT_TAB_KEY = "jsonSchemaBuilderSelectedExportTab";
const LOCAL_STORAGE_SELECTED_DEV_EXPORT_TYPE_KEY = "jsonSchemaBuilderSelectedDevExportType";
const LOCAL_STORAGE_SELECTED_PROVIDER_KEY = "llmBuilderSelectedProvider";
const LOCAL_STORAGE_API_KEY = "llmBuilderApiKey";
const LOCAL_STORAGE_SHARED_USER_PROMPT_KEY = "llmBuilderSharedUserPrompt";

const SchemaExportDialog: React.FC<SchemaExportDialogProps> = ({
  isOpen,
  onOpenChange,
  schemaFields,
  reusableTypes,
  initialTab = "json-schema",
}) => {
  const [selectedTab, setSelectedTab] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      // Prioritize initialTab prop if provided and is not the default "json-schema",
      // which indicates an action (e.g., after data generation) is trying to force the tab.
      // Otherwise, use the saved tab from localStorage, or default to "json-schema".
      if (initialTab && initialTab !== "json-schema") {
        return initialTab;
      }
      // Ensure "generate-data" is not a default option anymore
      const savedTab = localStorage.getItem(LOCAL_STORAGE_SELECTED_EXPORT_TAB_KEY);
      return (savedTab === "generate-data" ? "form-preview" : savedTab) || "json-schema";
    }
    return initialTab || "json-schema";
  });
  const [selectedDevExportType, setSelectedDevExportType] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(LOCAL_STORAGE_SELECTED_DEV_EXPORT_TYPE_KEY) || "curl-command";
    }
    return "curl-command";
  });
  const [generatedJsonSchema, setGeneratedJsonSchema] = React.useState<any>(null);
  const [generatedFormData, setGeneratedFormData] = React.useState<Record<string, any> | undefined>(undefined);

  // LLM configuration states, moved here from SchemaDataGenerator
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
  const [isResponseModalOpen, setIsResponseModalOpen] = React.useState(false);
  const [responseJson, setResponseJson] = React.useState<string>("");

  // Persist LLM config states
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

  React.useEffect(() => {
    if (isOpen) {
      setGeneratedJsonSchema(buildFullJsonSchema(schemaFields, reusableTypes));
    }
  }, [isOpen, schemaFields, reusableTypes]);

  React.useEffect(() => {
    // Persist selectedTab to localStorage whenever it changes
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_SELECTED_EXPORT_TAB_KEY, selectedTab);
    }
  }, [selectedTab]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_SELECTED_DEV_EXPORT_TYPE_KEY, selectedDevExportType);
    }
  }, [selectedDevExportType]);

  // LLM request details function, moved here from SchemaDataGenerator
  const getRequestDetails = (provider: LLMProvider, currentApiKey: string, prompt: string, schema: any) => {
    let requestBody: any = {};
    let endpoint = "";
    let headers: { [key: string]: string } = { "Content-Type": "application/json" };

    const systemMessage = "You are a helpful assistant designed to output JSON data strictly according to the provided JSON schema. Do not include any additional text or markdown outside the JSON object.";
    const messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt },
    ];

    switch (provider) {
      case "openai":
        endpoint = "https://api.openai.com/v1/chat/completions";
        headers["Authorization"] = `Bearer ${currentApiKey || "YOUR_OPENAI_API_KEY"}`;
        requestBody = {
          model: "gpt-4o-mini", // Using a smaller model for faster responses
          messages: messages,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "generated_schema",
              strict: true,
              schema: schema,
            },
          },
        };
        break;
      case "gemini":
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${currentApiKey || "YOUR_GEMINI_API_KEY"}`;
        requestBody = {
          contents: [
            { role: "user", parts: [{ text: `${systemMessage}\n\n${prompt}\n\nHere is the JSON Schema:\n\n${JSON.stringify(schema, null, 2)}` }] },
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
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "generated_schema",
              strict: true,
              schema: schema,
            },
          },
        };
        break;
      case "openrouter":
        endpoint = "https://openrouter.ai/api/v1/chat/completions";
        headers["Authorization"] = `Bearer ${currentApiKey || "YOUR_OPENROUTER_API_KEY"}`;
        headers["HTTP-Referer"] = "YOUR_APP_URL"; // Replace with your app's URL if deployed
        requestBody = {
          model: "openai/gpt-4o-mini",
          messages: messages,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "generated_schema",
              strict: true,
              schema: schema,
            },
          },
        };
        break;
      default:
        return { endpoint: "", headers: {}, requestBody: {} };
    }
    return { endpoint, headers, requestBody };
  };

  // Handle "Generate Data" button click, moved here from SchemaDataGenerator
  const handleGenerateData = async () => {
    if (!apiKey) {
      showError("Please enter your API Key before generating data.");
      return;
    }
    if (!userPrompt.trim()) {
      showError("Please enter a prompt for data generation.");
      return;
    }
    if (!generatedJsonSchema || Object.keys(generatedJsonSchema).length === 0) {
      showError("No schema defined to generate data from.");
      return;
    }

    setIsLoading(true);

    const { endpoint, headers, requestBody } = getRequestDetails(selectedProvider, apiKey, userPrompt, generatedJsonSchema);

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
          setGeneratedFormData(parsedData); // Update generated form data
          showSuccess("Data generated successfully!");
        } catch (parseError) {
          console.error("Failed to parse generated content as JSON:", parseError);
          showError("Generated content is not valid JSON. Please refine your prompt.");
        }
      }
    } catch (error) {
      console.error("Network or Fetch Error:", error);
      showError("Failed to send request. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Schema Tools</DialogTitle>
          <DialogDescription>
            Export your schema, preview it as a form, or generate sample data.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 flex-1 flex flex-col overflow-y-auto">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3"> {/* Changed to 3 columns */}
              <TabsTrigger value="json-schema">JSON Schema</TabsTrigger>
              <TabsTrigger value="form-preview">Form Preview & Data</TabsTrigger> {/* Updated tab name */}
              <TabsTrigger value="for-developers">For Developers</TabsTrigger>
            </TabsList>
            <TabsContent value="json-schema" className="mt-4 flex-1">
              {generatedJsonSchema ? (
                <SchemaDisplay jsonSchema={generatedJsonSchema} />
              ) : (
                <p className="text-muted-foreground text-center">Generating schema...</p>
              )}
            </TabsContent>
            <TabsContent value="form-preview" className="mt-4 flex-1 flex flex-col">
              {/* AI Data Generation Section */}
              <div className="space-y-4 mb-6 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                <h3 className="text-lg font-semibold">Generate Sample Data with AI</h3>
                <p className="text-sm text-muted-foreground">
                  Use AI to generate realistic data based on your current schema.
                </p>
                <div className="grid gap-2">
                  <Label htmlFor="llm-provider-select-data">Select LLM Provider</Label>
                  <Select value={selectedProvider} onValueChange={(value) => setSelectedProvider(value as LLMProvider)}>
                    <SelectTrigger id="llm-provider-select-data">
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
                  <Label htmlFor="api-key-input-data">API Key</Label>
                  <Input
                    id="api-key-input-data"
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
                  <Label htmlFor="user-prompt-input-data">Prompt for Data Generation</Label>
                  <Textarea
                    id="user-prompt-input-data"
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="e.g., Generate a JSON object for a product with a name 'Laptop Pro', price 1200.50, and categories ['Electronics', 'Computers']."
                    rows={4}
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
              </div>

              {/* Form Preview Section */}
              <h3 className="text-lg font-semibold mb-4">Form Preview</h3>
              {schemaFields.length > 0 ? (
                <SchemaFormPreview fields={schemaFields} reusableTypes={reusableTypes} formData={generatedFormData} />
              ) : (
                <p className="text-muted-foreground text-center">
                  Add some fields to see a preview.
                </p>
              )}
            </TabsContent>
            <TabsContent value="for-developers" className="mt-4 flex-1 flex flex-col">
              <div className="grid gap-4 mb-4">
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
                    placeholder="e.g., Generate a JSON object based on the schema."
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground">
                    This prompt will be sent to the LLM along with your schema.
                  </p>
                </div>

                <div className="flex gap-2">
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
              </div>

              <div className="grid gap-2 mb-4">
                <Label htmlFor="dev-export-type-select">Select Code Type</Label>
                <Select value={selectedDevExportType} onValueChange={setSelectedDevExportType}>
                  <SelectTrigger id="dev-export-type-select">
                    <SelectValue placeholder="Select a code type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="curl-command">cURL Command</SelectItem>
                    <SelectItem value="python-code">Python Code</SelectItem>
                    <SelectItem value="javascript-code">JavaScript Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {generatedJsonSchema ? (
                <>
                  {selectedDevExportType === "curl-command" && (
                    <CurlCommandGenerator jsonSchema={generatedJsonSchema} selectedProvider={selectedProvider} apiKey={apiKey} userPrompt={userPrompt} />
                  )}
                  {selectedDevExportType === "python-code" && (
                    <PythonCodeGenerator jsonSchema={generatedJsonSchema} selectedProvider={selectedProvider} apiKey={apiKey} />
                  )}
                  {selectedDevExportType === "javascript-code" && (
                    <JavaScriptCodeGenerator jsonSchema={generatedJsonSchema} selectedProvider={selectedProvider} apiKey={apiKey} />
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-center">
                  Build your schema first to generate code.
                </p>
              )}
              
              <ApiResponseDisplay
                isOpen={isResponseModalOpen}
                onOpenChange={setIsResponseModalOpen}
                title="API Response"
                description="The response from the LLM API call."
                jsonContent={responseJson}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SchemaExportDialog;