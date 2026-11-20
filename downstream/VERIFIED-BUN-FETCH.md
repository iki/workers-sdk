# Local Wrangler requests with a verified Bun fetch

This downstream patch targets the published Wrangler 4.165.0 package and its
source tag at commit `5b44e5e2f9df23b38b17903d6f4194919042828e`. It changes
the local HTTP proxy and test-harness dispatch checks. The preload exercises a
network-disabled Undici MockAgent before registering the exact fetch function
that handled the request. Replacing that function invalidates the registration.
The HTTP proxy records its bindings when the harness starts. Direct dispatch
checks the current fetch on each request.

## Reproduce the package check

Use a project containing Bun 1.4.2, Wrangler 4.165.0, Miniflare
5.20261118.0-beta and Undici 8.13.0. Select
`downstream/wrangler-4.165.0.patch` for exactly `wrangler@4.165.0` with
the project's package manager. Generate its lock, then perform a frozen install
with dependency lifecycle scripts disabled. The patch SHA-256 is
`d044b7020ffc42153fe9e1e8371d3321575d1dcc4a217ff00bf7252c912e15b7`.

The registration preload imports two independent prerequisites as siblings.
From a checkout of this fork branch, materialize their original files from
the immutable published commits. The following commands fetch only the
requested objects and write only the two prerequisite files in the checkout.

```sh
git fetch --no-tags https://github.com/iki/workers-sdk.git f2160e3f8dd97b388d98b247445f3951f7a91ab1
git restore --source=f2160e3f8dd97b388d98b247445f3951f7a91ab1 --worktree -- downstream/bun-undici-resolution.mjs
git fetch --no-tags https://github.com/iki/workers-sdk.git 943d97d3b5d148d2ab9f88a2cc3f0bea21df18a4
git restore --source=943d97d3b5d148d2ab9f88a2cc3f0bea21df18a4 --worktree -- downstream/bun-dispatcher-fetch.mjs
```

Run the published-package fixture from the installed project's root. It tests a
real local Worker over HTTP and direct dispatch, rejects a replaced fetch and an
unregistered wrapper, and closes each harness. Run the independent source
predicate test in the fork checkout with Node 24.

```sh
bun test --timeout 120000 /path/to/workers-sdk/downstream/wrangler-local.test.mjs
node --test downstream/verified-bun-fetch.test.mjs
```

For local development, run the package entry under Bun in the same project.
Keep the preload scoped to that tooling process.

```sh
bun --preload /path/to/workers-sdk/downstream/verified-bun-fetch.mjs node_modules/wrangler/wrangler-dist/cli.js dev
```

## Verification on November 20, 2026

On Windows x64, separate frozen Aube 2.5.1 installations used Bun 1.4.2
(`744846f84`) and the exact package versions above. With both prerequisite
adapters active, the pristine Wrangler package returned HTTP 503 where the
local harness expected 200. With the versioned package patch, HTTP returned
200, both direct dispatch routes returned the worker body, and replacing fetch
in the running process caused direct dispatch to reject. Starting with a replaced
or unregistered fetch retained HTTP 503 and rejected both direct routes. Each
harness closed. Separate checks exercised the installed Undici Pool and the
dispatcher-aware global fetch in both installations.

The source predicate test passed with Node 24.22.3. Upstream's full build and
test suites and a consuming application's D1 lifecycle remain unverified.

Upstream tracks the Bun runtime behavior in
[Workers SDK #16644](https://github.com/cloudflare/workers-sdk/issues/16644)
and [Bun #39247](https://github.com/oven-sh/bun/issues/39247).
The [maintainer review](https://github.com/cloudflare/workers-sdk/pull/15846#pullrequestreview-5573853511)
documents the upstream support policy. Native Bun and real Worker/D1 startup,
request, reconfiguration, and disposal still require independent acceptance
before the two prerequisite adapters can be retired.
