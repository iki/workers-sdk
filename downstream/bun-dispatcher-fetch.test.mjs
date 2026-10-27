import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { undici } from "./bun-undici-resolution.mjs";

test("global fetch consumes the dispatcher instead of sending the request to its origin", async () => {
  assert.equal(process.versions.bun, "1.4.2");
  const server = createServer((_request, response) => response.end("native"));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const dispatcher = new undici.MockAgent();
  dispatcher.disableNetConnect();
  dispatcher.get(url).intercept({ path: "/", method: "GET" }).reply(200, "dispatched");
  try {
    assert.equal(await (await fetch(url, { dispatcher })).text(), "native");
    await import("./bun-dispatcher-fetch.mjs");
    assert.equal(await (await fetch(url, { dispatcher })).text(), "dispatched");
    dispatcher.assertNoPendingInterceptors();
  } finally {
    await dispatcher.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
