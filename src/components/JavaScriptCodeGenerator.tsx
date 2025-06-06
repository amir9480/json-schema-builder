import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { Textarea } from "@/components/ui/textarea";
import { generateJavaScriptCode } from "@/utils/schemaToCode";

interface JavaScriptCodeGeneratorProps {
  jsonSchema: any;
}

const JavaScriptCodeGenerator: React.FC<JavaScriptCodeGeneratorProps> = ({ jsonSchema }) => {
  const generatedCode = React.useMemo(() => {
    if (!jsonSchema) return "";
    try {
      return generateJavaScriptCode(jsonSchema);
    } catch (error) {
      console.error("Error generating JavaScript code:", error);
      return `Error generating JavaScript code: ${(error as Error).message}`;
    }
  }, [jsonSchema]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode)
      .then(() => {
        showSuccess("JavaScript code copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy JavaScript code: ", err);
        showError("Failed to copy JavaScript code.");
      });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-semibold">JavaScript Code (Zod)</CardTitle>
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
          This code uses Zod for schema definition and the official OpenAI JavaScript client for parsing.
        </p>
      </CardContent>
    </Card>
  );
};

export default JavaScriptCodeGenerator;