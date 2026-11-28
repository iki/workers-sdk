---
"wrangler": patch
---

Allow local Bun requests through a verified dispatcher-aware fetch

This downstream opt-in accepts the exact function registered by a trusted local
preload after its dispatcher probe. A missing or replaced registration keeps
the existing runtime rejection for local HTTP and test-harness requests.
