# Replit Agent Working Rules

Status: **Ratified** — this document defines how Replit Agent works inside the TernakHub repository when executing roadmap implementations.

This document sits under the [Architecture Index](README.md) and inherits all Constitution rules.

---

# Purpose

This document defines how Replit Agent should execute future roadmap implementations efficiently and consistently.

---

# Workflow

Before implementing any roadmap item:

1. Read `docs/architecture/README.md`.
2. Read only the Constitution documents relevant to the requested roadmap.
3. Reuse existing implementation.
4. Implement only the requested roadmap.
5. Run validation.
6. Report completion.

---

# Do

Always:

- Reuse existing components.
- Reuse existing services.
- Reuse existing hooks.
- Reuse existing validators.
- Reuse existing models.
- Reuse existing utilities.
- Extend existing implementation.

---

# Do Not

Do **not**:

- Scan the entire repository repeatedly.
- Redesign existing architecture.
- Duplicate components.
- Duplicate services.
- Duplicate models.
- Modify unrelated modules.
- Implement future roadmap items.

---

# When a File Already Exists

If an existing implementation satisfies the roadmap:

- Reuse it.
- Extend it only when necessary.
- Do not replace it.

---

# When Reporting

At the end of each roadmap report, include only:

- Files created
- Files modified
- Reused components
- Reused services
- Validation status
- Remaining roadmap

Do not include unrelated information.
