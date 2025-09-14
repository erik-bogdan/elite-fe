import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toBackendUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (pathOrUrl.startsWith('/uploads')) {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    return `${base}${pathOrUrl}`;
  }
  return pathOrUrl;
}
