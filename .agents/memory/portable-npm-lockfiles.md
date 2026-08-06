---
name: Portable npm lockfiles
description: Registry URL requirement for npm installs outside the Replit environment.
---

Committed npm lockfiles must resolve packages through a publicly reachable registry, not a workspace-local package proxy.

**Why:** Replit can install from its injected package-firewall host, but external builders such as Cloudflare Pages cannot resolve that private hostname; the resulting install failure can surface later as missing build binaries like `tsc`.

**How to apply:** Before external deployment, inspect every `resolved` URL in `package-lock.json`. Keep package versions, integrity hashes, and dependency graph unchanged while replacing only non-portable registry hosts with the intended public registry.