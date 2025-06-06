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
import LoadingSpinner from "./LoadingSpinner"; // Import LoadingSpinner

interface ApiResponseDisplayProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  jsonContent: string;
  isLoading?: boolean; // New prop for loading state
}

const ApiResponseDisplay: React.FC<ApiResponseDisplayProps> = ({
  isOpen,
  onOpenChange,
  title,
  description,
  jsonContent,
  isLoading = false, // Default to false
}) => {
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
        <div className="flex-1 overflow-hidden py-4">
          <div className="h-full max-h-[calc(90vh-200px)] rounded-md border bg-gray-800 text-white overflow-auto flex"> {/* Removed items-center and justify-center */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center w-full h-full text-white"> {/* Centering for spinner */}
                <LoadingSpinner size={48} className="text-blue-400" />
                <p className="text-lg">Loading response...</p>
              </div>
            ) : (
              <pre className="p-4 text-left text-sm block w-full whitespace-pre"> {/* Added w-full */}
                <code>{jsonContent}</code>
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