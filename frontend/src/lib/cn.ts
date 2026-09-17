import { clsx, type ClassValue } from 'clsx';

/** Tiny wrapper so call sites read `cn(...)` and conditional classes stay tidy. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
