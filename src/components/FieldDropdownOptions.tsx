import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PlusCircle, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { SchemaField } from "./FieldEditor"; // Import SchemaField

interface FieldDropdownOptionsProps {
  field: SchemaField;
  onFieldChange: (field: SchemaField) => void;
}

const FieldDropdownOptions: React.FC<FieldDropdownOptionsProps> = ({
  field,
  onFieldChange,
}) => {
  const [isDropdownOptionsOpen, setIsDropdownOptionsOpen] = React.useState(true);
  const [newOption, setNewOption] = React.useState("");

  const handleAddOption = () => {
    if (newOption.trim() !== "") {
      const updatedOptions = [...(field.options || []), newOption.trim()];
      onFieldChange({ ...field, options: updatedOptions });
      setNewOption("");
    }
  };

  const handleRemoveOption = (optionToRemove: string) => {
    const updatedOptions = (field.options || []).filter(
      (option) => option !== optionToRemove
    );
    onFieldChange({ ...field, options: updatedOptions });
  };

  const handleEditOption = (oldOption: string, newText: string) => {
    const updatedOptions = (field.options || []).map((option) =>
      option === oldOption ? newText.trim() : option
    );
    onFieldChange({ ...field, options: updatedOptions });
  };

  return (
    <Collapsible
      open={isDropdownOptionsOpen}
      onOpenChange={setIsDropdownOptionsOpen}
      className="flex flex-col gap-4 mt-4 border-t pt-4 px-6"
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-start px-0 -mt-4">
          {isDropdownOptionsOpen ? (
            <ChevronUp className="h-4 w-4 mr-2" />
          ) : (
            <ChevronDown className="h-4 w-4 mr-2" />
          )}
          <h3 className="text-md font-semibold">Options for {field.name || "Unnamed Dropdown"}:</h3>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="grid gap-2 col-span-full">
          <Label htmlFor={`field-options-${field.id}`}>Dropdown Options</Label>
          <div className="flex gap-2">
            <Input
              id={`field-options-${field.id}`}
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="Add new option"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddOption();
                }
              }}
            />
            <Button onClick={handleAddOption} variant="outline" size="icon">
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
          {field.options && field.options.length > 0 ? (
            <div className="space-y-2 mt-2">
              {field.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => handleEditOption(option, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveOption(option)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No options added yet.</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default FieldDropdownOptions;