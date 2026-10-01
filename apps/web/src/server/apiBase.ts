// Server-side only: base URL for the LOGOS API.
// Used inside Route Handlers (app/api/*) and Server Components — never shipped to the browser.
export function apiBase(): string {
  return process.env.LOGOS_API_URL ?? "http://localhost:3001";
}
