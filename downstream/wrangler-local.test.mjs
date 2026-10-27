import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const exec = promisify(execFile);

await test("Wrangler permits only the verified Bun fetch and keeps its rejection after replacement", async () => {
  const parent = resolve(".cache/wrangler-bun-tests");
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(join(parent, "local-"));
  const fixture = join(root, "probe.mjs");
  const worker = join(root, "worker.mjs");
  await writeFile(worker, 'export default { fetch() { return new Response("worker-ok"); } };\n');
  await writeFile(
    fixture,
    `import assert from "node:assert/strict";
const nativeFetch = globalThis.fetch;
await import(${JSON.stringify(new URL("./verified-bun-fetch.mjs", import.meta.url).href)});
const mode = process.argv[2];
if (mode === "replaced") globalThis.fetch = nativeFetch;
if (mode === "unregistered") {
  const verified = globalThis.fetch;
  globalThis.fetch = (...args) => verified(...args);
}
const { createTestHarness } = await import(${JSON.stringify(pathToFileURL(createRequire(resolve("package.json")).resolve("wrangler")).href)});
const server = createTestHarness({ workers: [{ config: {
  name: "dispatcher-probe", main: ${JSON.stringify(worker)},
  compatibility_date: "2026-10-01", dev: { ip: "127.0.0.1", port: 0 }
} }] });
try {
  const { url } = await server.listen();
  const response = await nativeFetch(url, { signal: AbortSignal.timeout(10000) });
  assert.equal(response.status, mode === "verified" ? 200 : 503);
  if (mode === "verified") {
    assert.equal(await response.text(), "worker-ok");
    assert.equal(await (await server.fetch("/test")).text(), "worker-ok");
    assert.equal(await (await server.getWorker().fetch("http://worker.invalid/test")).text(), "worker-ok");
    const verified = globalThis.fetch;
    globalThis.fetch = nativeFetch;
    try {
      await assert.rejects(() => server.fetch("/test"), /Bun.*dispatcher/);
    } finally {
      globalThis.fetch = verified;
    }
  } else {
    assert.match(await response.text(), /Bun.*dispatcher/);
    await assert.rejects(() => server.fetch("/test"), /Bun.*dispatcher/);
    await assert.rejects(() => server.getWorker().fetch("http://worker.invalid/test"), /Bun.*dispatcher/);
  }
} finally {
  await server.close();
}
console.log(mode + ": passed");
`,
  );
  try {
    for (const mode of ["verified", "replaced", "unregistered"]) {
      const result = await exec(process.execPath, [fixture, mode], {
        cwd: root,
        windowsHide: true,
        timeout: 35000,
        maxBuffer: 2 * 1024 ** 2,
        env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
      });
      assert.match(result.stdout, new RegExp(`${mode}: passed`));
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
