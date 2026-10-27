/**
 * Returns whether Wrangler is running in the Bun runtime.
 *
 * @returns Whether Wrangler is running in the Bun runtime.
 */
export function isBun(): boolean {
	return !!process.versions.bun;
}

/**
 * Why requests can't reach the Worker under Bun: Bun's `fetch()` ignores the
 * undici `dispatcher` that Miniflare routes requests and control messages through.
 */
export const BUN_UNSUPPORTED_MESSAGE =
	"Wrangler can't forward requests to your Worker under Bun, because Bun's `fetch()` ignores the undici `dispatcher` that Miniflare routes them through (https://github.com/oven-sh/bun/issues/39247). Run this using Node.js.";

/** Local-only opt-in for an independently verified dispatcher-aware fetch. */
export function isUnsupportedBunFetch(): boolean {
	return (
		isBun() &&
		Reflect.get(globalThis, Symbol.for("wrangler.dispatcherFetch")) !== globalThis.fetch
	);
}
