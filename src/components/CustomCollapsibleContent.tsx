import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { cn } from "@/lib/utils";

const CustomCollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.Content
    ref={ref}
    className={cn(
      "overflow-hidden text-sm transition-all duration-300 ease-in-out",
      "data-[state=closed]:max-h-0 data-[state=open]:max-h-[1000px]", // Use a large max-height for open state
      className
    )}
    {...props}
  >
    {children}
  </CollapsiblePrimitive.Content>
));
CustomCollapsibleContent.displayName = "CustomCollapsibleContent";

export { CustomCollapsibleContent };