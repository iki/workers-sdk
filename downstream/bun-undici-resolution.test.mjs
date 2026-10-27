import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { test } from "node:test";

test("installed Undici supplies the missing Pool request lifecycle without replacing fetch", async () => {
  assert.equal(process.versions.bun, "1.4.2");
  const require = createRequire(resolve("package.json"));
  const nativeFetch = globalThis.fetch;
  assert.equal(typeof require("undici").Pool.prototype.dispatch, "undefined");
  const { undici } = await import("./bun-undici-resolution.mjs");
  assert.equal(globalThis.fetch, nativeFetch);
  const server = createServer((_request, response) => response.end("pool-ok"));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const pool = new undici.Pool(`http://127.0.0.1:${server.address().port}`);
  try {
    const response = await pool.request({ path: "/", method: "GET" });
    assert.equal(response.statusCode, 200);
    assert.equal(await response.body.text(), "pool-ok");
    assert.equal(require("undici").Pool, undici.Pool);
  } finally {
    await pool.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
