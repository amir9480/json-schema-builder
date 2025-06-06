import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";
import { generatePythonCode } from "@/utils/schemaToCode";

interface PythonCodeGeneratorProps {
  jsonSchema: any;
  selectedProvider: string; // Added prop
  apiKey: string; // Added prop
}

const PythonCodeGenerator: React.FC<PythonCodeGeneratorProps> = ({ jsonSchema, selectedProvider, apiKey }) => {
  const generatedCode = React.useMemo(() => {
    if (!jsonSchema) return "";
    try {
      return generatePythonCode(jsonSchema, selectedProvider, apiKey);
    } catch (error) {
      console.error("Error generating Python code:", error);
      return `Error generating Python code: ${(error as Error).message}`;
    }
  }, [jsonSchema, selectedProvider, apiKey]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode)
      .then(() => {
        showSuccess("Python code copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy Python code: ", err);
        showError("Failed to copy Python code.");
      });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-semibold">Python Code (Pydantic)</CardTitle>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2" /> Copy Code
        </Button>
      </CardHeader>
      <CardContent>
        <Textarea
          value={generatedCode}
          readOnly
          rows={20}
          className="font-mono bg-gray-800 text-white text-sm"
          style={{ minHeight: '400px' }}
        />
        <p className="text-sm text-muted-foreground mt-2">
          This code uses Pydantic for schema definition and the official OpenAI Python client for parsing.
        </p>
      </CardContent>
    </Card>
  );
};

export default PythonCodeGenerator;