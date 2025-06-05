import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import FieldEditor, { SchemaField, SchemaFieldType } from "./FieldEditor";
import SchemaDisplay from "./SchemaDisplay";
import { v4 as uuidv4 } from "uuid";

interface SchemaBuilderProps {}

const SchemaBuilder: React.FC<SchemaBuilderProps> = () => {
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]);

  const addField = (parentId?: string) => {
    const newField: SchemaField = {
      id: uuidv4(),
      name: "",
      type: "string",
      isMultiple: false,
      isRequired: true, // Default to required
    };

    if (parentId) {
      setSchemaFields((prevFields) =>
        prevFields.map((field) =>
          field.id === parentId
            ? {
                ...field,
                children: field.children ? [...field.children, newField] : [newField],
              }
            : field.type === "object" && field.children
            ? { ...field, children: updateNestedFields(field.children, parentId, newField) }
            : field,
        ),
      );
    } else {
      setSchemaFields((prevFields) => [...prevFields, newField]);
    }
  };

  const updateNestedFields = (
    fields: SchemaField[],
    parentId: string,
    newField: SchemaField,
  ): SchemaField[] => {
    return fields.map((field) => {
      if (field.id === parentId) {
        return {
          ...field,
          children: field.children ? [...field.children, newField] : [newField],
        };
      } else if (field.type === "object" && field.children) {
        return {
          ...field,
          children: updateNestedFields(field.children, parentId, newField),
        };
      }
      return field;
    });
  };

  const handleFieldChange = (updatedField: SchemaField) => {
    const updateFields = (fields: SchemaField[]): SchemaField[] => {
      return fields.map((field) => {
        if (field.id === updatedField.id) {
          return updatedField;
        } else if (field.type === "object" && field.children) {
          return {
            ...field,
            children: updateFields(field.children),
          };
        }
        return field;
      });
    };
    setSchemaFields(updateFields(schemaFields));
  };

  const removeField = (fieldId: string) => {
    const filterFields = (fields: SchemaField[]): SchemaField[] => {
      return fields.filter((field) => {
        if (field.id === fieldId) {
          return false;
        }
        if (field.type === "object" && field.children) {
          field.children = filterFields(field.children);
        }
        return true;
      });
    };
    setSchemaFields(filterFields(schemaFields));
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        JSON Schema Builder
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Define Your Schema Fields</h2>
          {schemaFields.length === 0 ? (
            <p className="text-muted-foreground">
              Start by adding your first field.
            </p>
          ) : (
            <div className="space-y-4">
              {schemaFields.map((field) => (
                <FieldEditor
                  key={field.id}
                  field={field}
                  onFieldChange={handleFieldChange}
                  onAddField={addField}
                  onRemoveField={removeField}
                />
              ))}
            </div>
          )}
          <Button onClick={() => addField()} className="w-full">
            <PlusCircle className="h-4 w-4 mr-2" /> Add New Field
          </Button>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Schema Output</h2>
          <SchemaDisplay schemaFields={schemaFields} />
        </div>
      </div>
    </div>
  );
};

export default SchemaBuilder;