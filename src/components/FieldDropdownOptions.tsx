import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CustomCollapsibleContent } from "@/components/CustomCollapsibleContent";
import { PlusCircle, Trash2, ChevronDown, ChevronUp, ListPlus } from "lucide-react";
import { SchemaField } from "./FieldEditor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showSuccess } from "@/utils/toast";
import { COUNTRIES_EN, PRIORITY_OPTIONS } from "@/utils/predefinedOptions"; // Import predefined options
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea

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

  const handlePopulateOptions = (options: string[], collectionName: string) => {
    onFieldChange({ ...field, options: options });
    showSuccess(`Dropdown options populated with ${collectionName}!`);
  };

  return (
    <Collapsible
      open={isDropdownOptionsOpen}
      onOpenChange={setIsDropdownOptionsOpen}
      className="flex flex-col gap-4 mt-4 border-t pt-4"
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-start px-6 -mt-4">
          {isDropdownOptionsOpen ? (
            <ChevronUp className="h-4 w-4 mr-2" />
          ) : (
            <ChevronDown className="h-4 w-4 mr-2" />
          )}
          <h3 className="text-md font-semibold">Options for {field.name || "Unnamed Dropdown"}:</h3>
        </Button>
      </CollapsibleTrigger>
      <CustomCollapsibleContent className="space-y-4">
        <div className="grid gap-2 col-span-full px-6">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Populate options from collection">
                  <ListPlus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => handlePopulateOptions(COUNTRIES_EN, "Countries")}>
                  Populate with Countries
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handlePopulateOptions(PRIORITY_OPTIONS, "Priority Levels")}>
                  Populate with Priority Levels
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {field.options && field.options.length > 0 ? (
            <ScrollArea className="h-48 rounded-md border p-2 mt-2"> {/* Added ScrollArea */}
              <div className="space-y-2">
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
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground italic">No options added yet.</p>
          )}
        </div>
      </CustomCollapsibleContent>
    </Collapsible>
  );
};

export default FieldDropdownOptions;