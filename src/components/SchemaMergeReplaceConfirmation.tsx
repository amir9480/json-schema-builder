import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface SchemaMergeReplaceConfirmationProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onReplace: () => void;
  onMerge: () => void;
}

const SchemaMergeReplaceConfirmation: React.FC<SchemaMergeReplaceConfirmationProps> = ({
  isOpen,
  onOpenChange,
  onReplace,
  onMerge,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Schema Already Exists</AlertDialogTitle>
          <AlertDialogDescription>
            You currently have fields defined in your schema. How would you like to handle the newly generated/imported schema?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="outline" onClick={onMerge}>
            Merge (Append)
          </Button>
          <AlertDialogAction onClick={onReplace} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            Replace All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SchemaMergeReplaceConfirmation;