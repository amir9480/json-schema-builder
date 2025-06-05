import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts camelCase, snake_case, kebab-case strings to Title Case.
 * @param str The input string.
 * @returns The string in Title Case.
 */
export const toTitleCase = (str: string): string => {
  if (!str) return "";
  return str
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/[-_]/g, " ") // Replace hyphens and underscores with spaces
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
    .join(" ")
    .trim();
};