import React from "react";
import { SchemaField } from "./FieldEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { buildFullJsonSchema } from "@/utils/jsonSchemaBuilder"; // Import from new utility

interface SchemaDisplayProps {
  schemaFields: SchemaField[];
  reusableTypes: SchemaField[]; // New prop for reusable types
}

const SchemaDisplay: React.FC<SchemaDisplayProps> = ({ schemaFields, reusableTypes }) => {
  const jsonSchema = buildFullJsonSchema(schemaFields, reusableTypes);
  const jsonString = JSON.stringify(jsonSchema, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString)
      .then(() => {
        showSuccess("JSON schema copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy JSON: ", err);
        showError("Failed to copy JSON schema.");
      });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-semibold">Generated JSON Schema</CardTitle>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2" /> Copy JSON
        </Button>
      </CardHeader>
      <CardContent>
        <pre className="bg-gray-800 text-white p-4 rounded-md overflow-auto text-left text-sm">
          <code>{jsonString}</code>
        </pre>
      </CardContent>
    </Card>
  );
};

export default SchemaDisplay;