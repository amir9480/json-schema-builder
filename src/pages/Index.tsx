import { useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import SchemaBuilder from "@/components/SchemaBuilder";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner"; // Import toast from sonner

const LOCAL_STORAGE_VISITED_KEY = "dyadSchemaBuilderVisited";

const Index = () => {
  useEffect(() => {
    // Check if the user has visited before
    const hasVisited = localStorage.getItem(LOCAL_STORAGE_VISITED_KEY);

    if (!hasVisited) {
      // If not, show the toast and set the flag
      toast.info("We use Clarity analytics to improve user experience.", {
        description: "This helps us understand how the app is used and make it better for you.",
        action: {
          label: "Dismiss",
          onClick: () => {
            localStorage.setItem(LOCAL_STORAGE_VISITED_KEY, "true");
            toast.dismiss(); // Dismiss all toasts, or you can pass a specific toast ID if you store it
          },
        },
        // Do not set a duration, so it stays until dismissed by action
      });
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="flex justify-end p-4">
        <ThemeToggle />
      </header>
      <main className="flex-1">
        <SchemaBuilder />
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Index;