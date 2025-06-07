import React from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GitHubStarButtonProps {
  repoUrl: string;
}

const GitHubStarButton: React.FC<GitHubStarButtonProps> = ({ repoUrl }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a href={repoUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="icon" aria-label="Star on GitHub">
            <Star className="h-[1.2rem] w-[1.2rem] fill-current text-yellow-500" />
          </Button>
        </a>
      </TooltipTrigger>
      <TooltipContent>
        <p>Star on GitHub</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default GitHubStarButton;