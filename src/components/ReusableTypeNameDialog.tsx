import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface ReusableTypeNameDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  onConfirm: (name: string) => void;
}

const ReusableTypeNameDialog: React.FC<ReusableTypeNameDialogProps> = ({
  isOpen,
  onOpenChange,
  initialName,
  onConfirm,
}) => {
  const [typeName, setTypeName] = React.useState(initialName);

  React.useEffect(() => {
    if (isOpen) {
      setTypeName(initialName);
    }
  }, [isOpen, initialName]);

  const handleConfirm = () => {
    if (typeName.trim()) {
      onConfirm(typeName.trim());
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Name Reusable Type</DialogTitle>
          <DialogDescription>
            Enter a unique name for your new reusable type.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Label htmlFor="reusable-type-name">Reusable Type Name</Label>
          <Input
            id="reusable-type-name"
            value={typeName}
            onChange={(e) => setTypeName(e.target.value)}
            placeholder="e.g., AddressObject"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleConfirm();
              }
            }}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!typeName.trim()}>
            Create Type
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReusableTypeNameDialog;