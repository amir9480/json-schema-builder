import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface GenerateSchemaPromptCardProps {
  onAIGenerateSchemaTrigger: () => void;
}

const GenerateSchemaPromptCard: React.FC<GenerateSchemaPromptCardProps> = ({
  onAIGenerateSchemaTrigger,
}) => {
  return (
    <Card className="w-full max-w-2xl mx-auto text-center py-12 px-6">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">Generate Your First Schema</CardTitle>
        <CardDescription className="text-lg text-muted-foreground mt-2">
          Start building your JSON schema by generating it with AI or adding fields manually.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <Button
          onClick={onAIGenerateSchemaTrigger}
          className="px-8 py-4 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Sparkles className="h-6 w-6 mr-3" /> Generate Schema with AI
        </Button>
        <p className="text-sm text-muted-foreground">
          Or, use the "Add New Field" button below to start from scratch.
        </p>
      </CardContent>
    </Card>
  );
};

export default GenerateSchemaPromptCard;