import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toTitleCase } from "@/lib/utils";
import { SchemaField, SchemaFieldType } from "./FieldEditor"; // Import SchemaField and SchemaFieldType

interface FieldAdvancedOptionsProps {
  field: SchemaField;
  onFieldChange: (field: SchemaField) => void;
}

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD - United States Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "CHF", label: "CHF - Swiss Franc" },
  { value: "CNY", label: "CNY - Chinese Yuan" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "BRL", label: "BRL - Brazilian Real" },
];

const FieldAdvancedOptions: React.FC<FieldAdvancedOptionsProps> = ({
  field,
  onFieldChange,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFieldChange({ ...field, title: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFieldChange({ ...field, description: e.target.value });
  };

  const handleExampleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFieldChange({ ...field, example: e.target.value });
  };

  const handleMinValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
    onFieldChange({ ...field, minValue: value });
  };

  const handleMaxValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
    onFieldChange({ ...field, maxValue: value });
  };

  const handleMinItemsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
    onFieldChange({ ...field, minItems: value });
  };

  const handleMaxItemsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
    onFieldChange({ ...field, maxItems: value });
  };

  const handleCurrencyChange = (value: string) => {
    onFieldChange({ ...field, currency: value });
  };

  const isNumberLikeType = field.type === "int" || field.type === "float" || field.type === "currency";

  return (
    <Collapsible
      open={isAdvancedOpen}
      onOpenChange={setIsAdvancedOpen}
      className="w-full space-y-2 px-6"
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-start px-0">
          {isAdvancedOpen ? (
            <ChevronUp className="h-4 w-4 mr-2" />
          ) : (
            <ChevronDown className="h-4 w-4 mr-2" />
          )}
          Advanced options
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`field-title-${field.id}`}>Title (Optional)</Label>
            <Input
              id={`field-title-${field.id}`}
              value={field.title || ""}
              onChange={handleTitleChange}
              placeholder={field.name ? toTitleCase(field.name) : "e.g., Product Name"}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`field-description-${field.id}`}>Description (Optional)</Label>
            <Input
              id={`field-description-${field.id}`}
              value={field.description || ""}
              onChange={handleDescriptionChange}
              placeholder="e.g., Name of the product"
            />
          </div>
          <div className="grid gap-2 col-span-full">
            <Label htmlFor={`field-example-${field.id}`}>Example Value (Optional)</Label>
            <Input
              id={`field-example-${field.id}`}
              value={field.example || ""}
              onChange={handleExampleChange}
              placeholder="e.g., 'Laptop', 123, '2023-10-26'"
            />
          </div>

          {isNumberLikeType && (
            <>
              <div className="grid gap-2">
                <Label htmlFor={`field-min-value-${field.id}`}>Min Value (Optional)</Label>
                <Input
                  id={`field-min-value-${field.id}`}
                  type="number"
                  value={field.minValue === undefined ? "" : field.minValue}
                  onChange={handleMinValueChange}
                  placeholder="e.g., 0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`field-max-value-${field.id}`}>Max Value (Optional)</Label>
                <Input
                  id={`field-max-value-${field.id}`}
                  type="number"
                  value={field.maxValue === undefined ? "" : field.maxValue}
                  onChange={handleMaxValueChange}
                  placeholder="e.g., 100"
                />
              </div>
            </>
          )}

          {field.isMultiple && (
            <>
              <div className="grid gap-2">
                <Label htmlFor={`field-min-items-${field.id}`}>Min Items (Optional)</Label>
                <Input
                  id={`field-min-items-${field.id}`}
                  type="number"
                  value={field.minItems === undefined ? "" : field.minItems}
                  onChange={handleMinItemsChange}
                  placeholder="e.g., 1"
                  min="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`field-max-items-${field.id}`}>Max Items (Optional)</Label>
                <Input
                  id={`field-max-items-${field.id}`}
                  type="number"
                  value={field.maxItems === undefined ? "" : field.maxItems}
                  onChange={handleMaxItemsChange}
                  placeholder="e.g., 10"
                  min="0"
                />
              </div>
            </>
          )}

          {field.type === "currency" && (
            <div className="grid gap-2 col-span-full">
              <Label htmlFor={`field-currency-${field.id}`}>Currency (Optional)</Label>
              <Select
                value={field.currency || ""}
                onValueChange={handleCurrencyChange}
              >
                <SelectTrigger id={`field-currency-${field.id}`}>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default FieldAdvancedOptions;