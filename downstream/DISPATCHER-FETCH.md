# Dispatcher-aware global fetch under Bun

This atomic adapter depends on the preceding installed-Undici resolution branch.
It installs Undici 8.12.3's actual fetch in the isolated tooling process under
Bun 1.4.2. It changes global fetch; do not load it into your application process.

```sh
bun --preload /path/to/workers-sdk/downstream/bun-dispatcher-fetch.mjs your-tool.mjs
bun test /path/to/workers-sdk/downstream/bun-dispatcher-fetch.test.mjs
```

The consuming project must install Undici 8.12.3. A local loopback test with
MockAgent shows native Bun fetch reaching the real listener instead of the mock,
while the installed Undici fetch consumes the mock interception. Miniflare D1
checks pass with these two adapters. Neither result establishes that Bun itself
is fixed. Wrangler 4.153.0 also needs the separate verified-fetch guard patch.

Related: https://github.com/oven-sh/bun/issues/39247,
https://github.com/oven-sh/bun/pull/39250 and
https://github.com/oven-sh/bun/pull/38855. Test native global fetch, Worker startup,
HTTP dispatch, reconfiguration and disposal without this adapter before removal.
