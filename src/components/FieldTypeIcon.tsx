import React from "react";
import {
  Type,
  Hash,
  Calendar,
  Clock,
  DollarSign,
  Box,
  Link,
  HelpCircle,
  LucideIcon,
  List, // Import List icon for dropdown
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SchemaFieldType } from "./FieldEditor";
import { cn } from "@/lib/utils";

interface FieldTypeIconProps {
  type: SchemaFieldType;
  className?: string;
}

const typeIconMap: Record<
  SchemaFieldType,
  { icon: LucideIcon; name: string }
> = {
  string: { icon: Type, name: "String" },
  int: { icon: Hash, name: "Integer" },
  float: { icon: Hash, name: "Float" }, // Using Hash for both int and float
  currency: { icon: DollarSign, name: "Currency" },
  date: { icon: Calendar, name: "Date" },
  datetime: { icon: Clock, name: "DateTime" },
  object: { icon: Box, name: "Object" },
  ref: { icon: Link, name: "Reference" },
  dropdown: { icon: List, name: "Dropdown" }, // Added icon for dropdown
};

const FieldTypeIcon: React.FC<FieldTypeIconProps> = ({ type, className }) => {
  const { icon: Icon, name: typeName } =
    typeIconMap[type] || { icon: HelpCircle, name: "Unknown Type" }; // Fallback for unknown types

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-md border bg-muted text-muted-foreground",
            className
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{typeName}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default FieldTypeIcon;