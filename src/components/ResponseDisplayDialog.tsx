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
import { ScrollArea } from "@/components/ui/scroll-area";

interface ResponseDisplayDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  jsonContent: string;
}

const ResponseDisplayDialog: React.FC<ResponseDisplayDialogProps> = ({
  isOpen,
  onOpenChange,
  title,
  description,
  jsonContent,
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
          <ScrollArea className="h-full rounded-md border bg-gray-800 text-white">
            <pre className="p-4 text-left text-sm">
              <code>{jsonContent}</code>
            </pre>
          </ScrollArea>
        </div>
        <div className="flex justify-end gap-2 mt-auto">
          <Button onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" /> Copy Response
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResponseDisplayDialog;