import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import LoadingSpinner from "./LoadingSpinner";
import ReactJson from 'react-json-view';
import { useTheme } from "next-themes";

interface ApiResponseDisplayProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  jsonContent: string;
  isLoading?: boolean;
}

const ApiResponseDisplay: React.FC<ApiResponseDisplayProps> = ({
  isOpen,
  onOpenChange,
  title,
  description,
  jsonContent,
  isLoading = false,
}) => {
  const { resolvedTheme } = useTheme();
  const [parsedJson, setParsedJson] = React.useState<any>(null);
  const [isJsonValid, setIsJsonValid] = React.useState(true);

  React.useEffect(() => {
    if (jsonContent) {
      try {
        setParsedJson(JSON.parse(jsonContent));
        setIsJsonValid(true);
      } catch (e) {
        setParsedJson(null);
        setIsJsonValid(false);
      }
    } else {
      setParsedJson(null);
      setIsJsonValid(true); // Treat empty as valid for initial state
    }
  }, [jsonContent]);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonContent)
      .then(() => {
        showSuccess("Response copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy response: ", err);
        showError("Failed to copy response.");
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-4"> {/* Applied overflow-y-auto here */}
          <div className="h-full rounded-md border text-white"> {/* Removed max-h-[calc...] and flex */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center w-full h-full text-white py-8">
                <LoadingSpinner size={48} className="text-blue-400" />
                <p className="text-lg mt-4">Loading response...</p>
              </div>
            ) : isJsonValid && parsedJson !== null ? (
              <div className="p-4 text-left text-sm block w-full whitespace-pre">
                <ReactJson
                  src={parsedJson}
                  theme={resolvedTheme === 'dark' ? 'codeschool' : 'rjv-default'}
                  name={false}
                  collapsed={false}
                  enableClipboard={false}
                  displayObjectSize={false}
                  displayDataTypes={false}
                  indentWidth={2}
                  style={{ backgroundColor: 'transparent' }}
                />
              </div>
            ) : (
              <pre className="p-4 text-left text-sm block w-full whitespace-pre">
                <code>{jsonContent || "No content to display or invalid JSON."}</code>
              </pre>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-auto">
          <Button onClick={handleCopy} disabled={isLoading}>
            <Copy className="h-4 w-4 mr-2" /> Copy Response
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiResponseDisplay;