import assert from "node:assert/strict";
import { test } from "node:test";
import { isBun, isUnsupportedBunFetch } from "../packages/wrangler/src/utils/is-bun.ts";

test("local fetch exception preserves Node, native Bun and stale-registration boundaries", () => {
  const bun = process.versions.bun;
  const fetch = globalThis.fetch;
  const key = Symbol.for("wrangler.dispatcherFetch");
  assert.equal(Reflect.has(globalThis, key), false);
  try {
    process.versions.bun = undefined;
    assert.equal(isBun(), false);
    assert.equal(isUnsupportedBunFetch(), false);
    process.versions.bun = "1.4.2";
    assert.equal(isBun(), true);
    assert.equal(isUnsupportedBunFetch(), true);
    Object.defineProperty(globalThis, key, { value: fetch, configurable: true });
    assert.equal(isUnsupportedBunFetch(), false);
    globalThis.fetch = (...args) => fetch(...args);
    assert.equal(isUnsupportedBunFetch(), true);
  } finally {
    process.versions.bun = bun;
    globalThis.fetch = fetch;
    Reflect.deleteProperty(globalThis, key);
  }
});
