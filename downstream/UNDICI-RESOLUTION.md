# Installed Undici under Bun

This downstream tooling adapter makes Bun's bare `undici` module expose the installed
package. It is independent of the global-fetch adapter and Wrangler runtime guard.
It is not a Bun runtime fix or an upstream-supported configuration.

Tested dependency: Undici 8.12.3; runtime: Bun 1.4.2 on Windows x64.
Install that exact dependency in your consuming project, then run from its root:

```sh
bun --preload /path/to/workers-sdk/downstream/bun-undici-resolution.mjs your-tool.mjs
bun test /path/to/workers-sdk/downstream/bun-undici-resolution.test.mjs
```

The adapter resolves the installed package relative to that project, not this fork.
Use a separate tooling process; it deliberately mutates Bun's module shim there.
With no adapter, `require("undici").Pool.prototype.dispatch` is absent on the tested
runtime. With it, the method is callable. Worker HTTP dispatch also needs the
separate dispatcher-aware global fetch adapter.

Related: https://github.com/oven-sh/bun/pull/36102 and
https://github.com/oven-sh/bun/issues/36098. Retire only when the pinned Bun resolves
the installed implementation and Worker lifecycle checks pass without this adapter.
