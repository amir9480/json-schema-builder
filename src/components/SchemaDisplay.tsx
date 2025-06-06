import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import ReactJson from 'react-json-view';
import { useTheme } from "next-themes";

interface SchemaDisplayProps {
  jsonSchema: any; // Now directly receives the full JSON schema
}

const SchemaDisplay: React.FC<SchemaDisplayProps> = ({ jsonSchema }) => {
  const jsonString = JSON.stringify(jsonSchema, null, 2);
  const { resolvedTheme } = useTheme();

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
        <div className="p-4 rounded-md overflow-auto text-left text-sm">
          <ReactJson
            src={jsonSchema}
            theme={resolvedTheme === 'dark' ? 'codeschool' : 'rjv-default'}
            name={false}
            collapsed={false}
            enableClipboard={false}
            displayObjectSize={false}
            displayDataTypes={false}
            indentWidth={2}
            style={{ backgroundColor: 'transparent' }} // Ensure background is handled by parent div
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SchemaDisplay;