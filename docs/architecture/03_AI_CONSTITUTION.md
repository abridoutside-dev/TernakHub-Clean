# AI Constitution

Status: **Ratified** — this document is the implementation standard for every AI Insight feature across TernakHub. It documents the architecture already agreed and in use; it does not introduce new architecture. It applies to:

- AI Catat Bobot
- AI Kesehatan Hewan
- AI Pemberian Pakan
- AI Reproduksi
- AI Stock Pakan
- AI Stock Obat
- Future AI modules

This document sits under the [Project Constitution](00_PROJECT_CONSTITUTION.md) and inherits all of its rules.

---

# AI Principles

AI is decision support. AI never replaces veterinarians or users.

---

# Read Only

AI **only**:

- Reads data
- Analyzes
- Compares
- Predicts
- Summarizes
- Recommends
- Warns

AI **never**:

- Inserts data
- Updates data
- Deletes data
- Creates transactions
- Reduces stock
- Increases stock
- Executes workflow

---

# AI Data Source

AI must only read existing data. It never creates its own source of truth.

---

# AI Priority

Every AI output carries one of three priority levels:

- Info
- Warning
- Critical

---

# Output

AI may generate:

- Summary
- Recommendation
- Warning
- Prediction
- Trend
- Insight

---

# Implementation

All current analysis is deterministic and rule-based. TernakHub does not
connect to an external model, provider, or AI service. Analysis may only use
the live data sources declared by its module and must remain explainable and
read-only.

---

# Timestamp

Every AI analysis must include:

- Analysis Time
- Data Source
- Version

---

# Replit Agent Rules

- Reuse existing AI components.
- Reuse existing cards.
- Reuse existing layouts.
- Do not duplicate AI implementation.
