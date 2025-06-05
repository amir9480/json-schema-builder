import { MadeWithDyad } from "@/components/made-with-dyad";
import SchemaBuilder from "@/components/SchemaBuilder"; // Import the new component
import { ThemeToggle } from "@/components/ThemeToggle"; // Import ThemeToggle

const Index = () => {
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