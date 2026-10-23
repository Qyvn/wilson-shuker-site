/// <reference types="vite/client" />
/** Prefix a public/ path with Vite's base URL so it works under a sub-path (e.g. GitHub Pages /repo/). */
export function asset(path: string): string {
  if (!path || /^(https?:|data:|blob:)/.test(path)) return path;
  const base = (import.meta.env?.BASE_URL as string | undefined) ?? '/';
  return base.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
}
