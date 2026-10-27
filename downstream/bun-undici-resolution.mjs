import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

// Resolve from the consuming project, even if this adapter lives in another checkout.
const require = createRequire(resolve("package.json"));
export const undici = require(join(dirname(require.resolve("undici/package.json")), "index.js"));
const shim = require("undici");
if (typeof shim !== "object" || shim === null) throw new Error("Unexpected Bun Undici shim");
Object.assign(shim, undici);
