import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function daysUntil(dateString: string) {
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const parts = String(dateString).split("-").map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    const targetUtc = Date.UTC(parts[0], parts[1] - 1, parts[2]);
    return Math.round((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));
  }
  const d = new Date(dateString);
  return Math.ceil((d.getTime() - todayUtc) / (1000 * 60 * 60 * 24));
}
