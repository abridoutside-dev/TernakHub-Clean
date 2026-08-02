# Roadmap Prompt Template

Status: **Ratified** — this is the standard prompt format for every future roadmap implementation. Future roadmap prompts should reuse this template instead of rewriting instructions.

This template assumes the reader has access to the [Architecture Index](../architecture/README.md).

---

## Template

```markdown
# TASK

Roadmap ID
Roadmap Name

==================================================

# CONTEXT

Read:

docs/architecture/README.md

Follow only the Constitution documents relevant to this roadmap.

==================================================

# SCOPE

Implement ONLY this roadmap.

Do not implement future roadmap.

Do not modify unrelated modules.

==================================================

# REUSE

Reuse existing:

- Components
- Services
- Hooks
- Validators
- Models
- Utilities
- Existing UI patterns
- Existing workflow

==================================================

# DO NOT

- Redesign architecture
- Duplicate implementation
- Scan the whole project repeatedly
- Create unnecessary folders
- Modify unrelated modules

==================================================

# IMPLEMENTATION

Implement only the requested roadmap.

==================================================

# VALIDATION

Verify:

- Build success
- TypeScript compile
- Existing functionality not broken
- UUID integrity
- No orphan reference
- No runtime error

==================================================

# OUTPUT

Report:

- Files Created
- Files Modified
- Components Reused
- Services Reused
- Validation Result

==================================================

# ACCEPTANCE CRITERIA

Roadmap-specific Acceptance Criteria only.
```
