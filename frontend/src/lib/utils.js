import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge Tailwind classes cleanly, handling conditional logic
 * and resolving conflicts (e.g., 'p-4 p-2' -> 'p-2').
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
