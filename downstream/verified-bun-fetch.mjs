import { undici } from "./bun-undici-resolution.mjs";
import "./bun-dispatcher-fetch.mjs";

const probe = new undici.MockAgent();
probe.disableNetConnect();
probe.get("http://127.0.0.1:0").intercept({ path: "/dispatcher-probe", method: "GET" }).reply(204);
try {
  const response = await undici.fetch("http://127.0.0.1:0/dispatcher-probe", {
    dispatcher: probe,
    signal: AbortSignal.timeout(1000),
  });
  if (response.status !== 204) throw new Error("Wrangler fetch dispatcher probe failed");
  probe.assertNoPendingInterceptors();
} finally {
  await probe.close();
}
// Downstream patch contract. Replacing global fetch invalidates the registration.
Object.defineProperty(globalThis, Symbol.for("wrangler.dispatcherFetch"), { value: undici.fetch });
