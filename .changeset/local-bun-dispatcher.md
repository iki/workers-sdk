---
"wrangler": patch
---

Permit an explicitly verified dispatcher fetch in local Bun tooling

Downstream-only opt-in: accept the exact fetch function registered by a trusted
preload after its dispatcher probe. Retain the existing local rejection when no
matching registration exists, and leave remote bindings unsupported. This does
not make native Bun fetch compatible or claim official Bun support.
