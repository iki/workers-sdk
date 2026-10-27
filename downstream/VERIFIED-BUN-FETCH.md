# Local Wrangler with an independently verified Bun fetch

This downstream-only patch permits local Worker requests when a preload registers
the exact dispatcher-aware fetch it verified. It does not change runtime identity,
enable remote bindings, or claim official Bun support. Node's behavior is unchanged.
Registration is a trusted local configuration contract, not a security boundary.
Do not register native Bun fetch manually to bypass the check.

Tested versions: Bun 1.4.2, Undici 8.12.3, Wrangler 4.153.0 and Miniflare
5.20261023.0-beta on Windows x64. The source change is based on upstream commit
`ec6edddadd8395b4991b23c5300ea68b701ce720`. The published-package diff targets 4.153.0.

Install the exact package pins in the consuming project, apply the included
`wrangler-4.153.0.patch` through your package manager, and run from that project:

```sh
bun --preload /path/to/workers-sdk/downstream/verified-bun-fetch.mjs node_modules/wrangler/wrangler-dist/cli.js dev
```

Use the package's in-process `wrangler-dist/cli.js` entry if your launcher would
otherwise respawn another runtime. Keep all three sibling preload files together.
The first two are separately removable adapters on preceding atomic branches.

The registration preload runs a network-disabled MockAgent test before opting in.
Missing registration or a different current fetch preserves the startup 503 and
harness UserError. Changing fetch in a running tooling process is unsupported;
the existing proxy binding is not a live monitor of later global changes.
The standalone `wrangler-local.test.mjs` runs real local HTTP and test-harness
requests, checks native-fetch replacement and an unregistered wrapper, and closes
every harness. Run it from a project containing the patched package and Undici:

```sh
bun test --timeout 120000 /path/to/workers-sdk/downstream/wrangler-local.test.mjs
node --test downstream/verified-bun-fetch.test.mjs
```

The first regression rejected the original 4.153.0 guard with `503 !== 200`, then
passed after this patch and verified preload. The full Workers SDK build/test suite
has not been run; this is a tested published-package workaround, not an upstream
release or full validation of the source checkout.

Upstream context: https://github.com/cloudflare/workers-sdk/pull/15846,
https://github.com/cloudflare/workers-sdk/issues/15717 and
https://github.com/oven-sh/bun/issues/39247. We will offer an atomic PR if maintainers
express interest; their current policy leaves Bun compatibility to Bun.
