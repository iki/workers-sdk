# Local Wrangler requests with a verified Bun fetch

This downstream patch targets the published Wrangler 4.169.0 package and its
source tag at commit `370ea36c3b25414b7ee521238db8cbd54e19e522`. It changes
the local HTTP proxy and test-harness dispatch checks. The preload exercises a
network-disabled Undici MockAgent before registering the exact fetch function
that handled the request. Replacing that function invalidates the registration.
The HTTP proxy records its bindings when the harness starts. Direct dispatch
checks the current fetch on each request.

## Reproduce the package check

Use a project containing Bun 1.4.5, Wrangler 4.169.0, Miniflare
5.20261127.0-beta and Undici 8.14.0. Select
`downstream/wrangler-4.169.0.patch` for exactly `wrangler@4.169.0` with
the project's package manager. Generate its lock, then perform a frozen install
with dependency lifecycle scripts disabled. The patch SHA-256 is
`43b60f0373204af06655431874acf9e2932c30f29545e428f53da3baee661877`.

The registration preload imports two independent prerequisites as siblings.
From a checkout of this fork branch, materialize their original files from
the immutable published commits. Run the following commands in a fresh checkout to stage those two dependencies.

```sh
git fetch --depth=1 --no-tags https://github.com/iki/workers-sdk.git f2160e3f8dd97b388d98b247445f3951f7a91ab1
git restore --source=f2160e3f8dd97b388d98b247445f3951f7a91ab1 --worktree -- downstream/bun-undici-resolution.mjs
git fetch --depth=1 --no-tags https://github.com/iki/workers-sdk.git 943d97d3b5d148d2ab9f88a2cc3f0bea21df18a4
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

## Verification on November 28, 2026

On Windows x64 with Bun 1.4.5, separate pristine and patched frozen Aube
installations selected Wrangler 4.169.0, Miniflare 5.20261127.0-beta and
Undici 8.14.0. The Web tooling profile explicitly selected Undici 8.14.0 for
the preload. The published Wrangler manifest declares Undici 7.30.2.

With both prerequisite adapters active, the pristine package returned HTTP
503 where the Worker harness expected 200. The versioned patch returned 200,
and both direct dispatch routes returned the worker body. Replacing the
registered fetch caused direct dispatch to reject. A harness started with a
replaced or unregistered fetch returned 503 and rejected both direct routes.
The harnesses closed, and the installed Pool and dispatcher controls passed.
The package diff reversed to the exact original CLI bytes. The independent
source predicate test passed under Node 24.22.3.

Upstream's full build and test suites and a consuming application's D1
lifecycle remain unverified.

Upstream tracks the Bun runtime behavior in
[Workers SDK #16644](https://github.com/cloudflare/workers-sdk/issues/16644)
and [Bun #39247](https://github.com/oven-sh/bun/issues/39247).
The [maintainer review](https://github.com/cloudflare/workers-sdk/pull/15846#pullrequestreview-5573853511)
documents the upstream support policy. Native Bun and real Worker/D1 startup,
request, reconfiguration, and disposal still require independent acceptance
before the two prerequisite adapters can be retired.
