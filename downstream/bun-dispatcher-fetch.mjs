import { undici } from "./bun-undici-resolution.mjs";

// Isolate this replacement to the tooling process that needs Miniflare dispatchers.
Object.defineProperty(globalThis, "fetch", {
  value: undici.fetch,
  writable: true,
  configurable: true,
});
