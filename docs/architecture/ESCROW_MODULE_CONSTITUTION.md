# ESCROW MODULE CONSTITUTION
**TernakHub Platform — Authoritative Specification**
**Version 1.0 — Effective: 15 Juli 2026**
**Status: ACTIVE**

---

## 1. AUTHORITY

This document is the authoritative specification for all Escrow-related implementation in TernakHub.

All Escrow features MUST comply with this Constitution.
This Constitution MUST NOT be modified during implementation.

---

## 2. WHAT ESCROW IS

Escrow is an **optional Participant** in the Transaction Conversation system.

When a transaction uses Escrow settlement:

- Escrow **holds** the buyer's payment.
- Escrow **manages** Evidence relevant to the transaction.
- Escrow **manages** Audit Trail for all escrow actions.
- Escrow **performs Manual Transfer** to release funds.

---

## 3. WHAT ESCROW IS NOT

```
❌ Escrow is NOT a judge.
❌ Escrow is NOT an arbitrator.
❌ Escrow is NOT a law enforcement agency.
❌ Escrow does NOT determine who is right or wrong.
❌ Escrow does NOT perform automatic transfers.
❌ Escrow does NOT integrate with bank APIs or payment gateways.
❌ Escrow does NOT confirm that the receiver has received the funds.
```

---

## 4. SETTLEMENT METHOD

All transactions have a `settlementMethod` field.

| Method  | Description                          | Default |
|---------|--------------------------------------|---------|
| `P2P`   | Buyer pays Seller directly           | ✅ Yes  |
| `Escrow`| Funds held by Escrow until confirmed | No      |

**P2P remains the default.** Escrow is opt-in.

---

## 5. ESCROW STATUS

```
Waiting Payment
     ↓
Holding Fund
     ↓
Delivery
     ↓
Waiting Confirmation
     ↓
Waiting Transfer ← (also reachable from Dispute resolution)
     ↓
Transfer Processing
     ↓
Waiting Receiver Confirmation
     ↓
Completed
```

Dispute can be opened from: **Delivery**, **Waiting Confirmation**.
Dispute resolves to: **Waiting Transfer** (to Seller or back to Buyer).
Cancellation can happen from: **Waiting Payment**, **Holding Fund**.

| Status                       | Description                                              |
|------------------------------|----------------------------------------------------------|
| `Waiting Payment`            | Awaiting buyer payment to escrow account                 |
| `Holding Fund`               | Payment confirmed by Escrow officer; fund held           |
| `Delivery`                   | Seller has dispatched; Escrow monitors                   |
| `Waiting Confirmation`       | Awaiting buyer confirmation of arrival                   |
| `Dispute`                    | Dispute opened; Escrow waits for parties to agree        |
| `Waiting Transfer`           | Both parties agreed; Escrow prepares to transfer         |
| `Transfer Processing`        | Escrow officer is performing the bank transfer           |
| `Waiting Receiver Confirmation`| Escrow uploaded proof; awaiting receiver confirmation  |
| `Completed`                  | Receiver confirmed receipt; escrow closed                |
| `Cancelled`                  | Transaction cancelled; refund process initiated if needed|

---

## 6. PRICING POLICY

The pricing structure MUST support:

| Field         | Type                               |
|---------------|------------------------------------|
| `type`        | `'Percentage'` \| `'Fixed'`        |
| `percentage`  | `number` (e.g. `0.02` = 2%)       |
| `fixedAmount` | `number` (if type is Fixed)        |
| `minimumFee`  | `number \| null`                   |
| `maximumFee`  | `number \| null`                   |
| `feePayer`    | `'Buyer'` \| `'Seller'` \| `'Shared'` |

**No default values are set in this Constitution.** Platform policy determines the values.

---

## 7. TRANSACTION COST vs ESCROW FEE

These two MUST be separated:

| Field             | Description                                              |
|-------------------|----------------------------------------------------------|
| `escrowFee`       | Revenue of the Escrow service for holding/managing funds |
| `transactionCost` | Cost paid to third parties (bank fees, transfer fees)    |

**Transaction Cost is NOT Escrow revenue.**

---

## 8. MANUAL TRANSFER

Escrow performs fund transfers using an official bank application.
The system **only records** the transfer — it does NOT perform it.

Required fields for every Manual Transfer record:

| Field        | Type     | Description                      |
|--------------|----------|----------------------------------|
| `nominal`    | `number` | Amount transferred               |
| `bankTujuan` | `string` | Destination bank name            |
| `noRekening` | `string` | Destination account number       |
| `namaPenerima`| `string`| Receiver name                    |
| `tanggal`    | `string` | Transfer date (YYYY-MM-DD)       |
| `jam`        | `string` | Transfer time (HH:MM)            |
| `fileName`   | `string` | Screenshot / photo of proof      |
| `catatan`    | `string \| null` | Notes from Escrow officer |

After recording a transfer, status moves to `Waiting Receiver Confirmation`.

---

## 9. PAYMENT PROOF

**Screenshot ≠ Confirmation of received funds.**

A screenshot of a payment transfer is:
- A candidate evidence item.
- Subject to OCR Warning checks.
- NOT sufficient proof on its own.

**Only an Escrow Officer** can confirm fund receipt by manually verifying the bank account.

---

## 10. TRANSFER RELEASE (Fund Release)

When releasing funds, Escrow uploads:
- Bukti Transfer (screenshot/photo)
- Nominal
- Catatan (optional notes)

After upload, status moves to `Waiting Receiver Confirmation`.

**Escrow MUST NOT confirm receipt themselves.**

---

## 11. FINAL CONFIRMATION

**Escrow is PROHIBITED from confirming that funds have been received.**

Final confirmation is performed by the fund receiver:

| Scenario                  | Who Confirms  |
|---------------------------|---------------|
| Funds released to Seller  | Seller        |
| Funds returned to Buyer   | Buyer         |

After confirmation, status moves to `Completed`.

---

## 12. DISPUTE

| Rule                     | Value          |
|--------------------------|----------------|
| Normal duration          | 7 days         |
| Maximum duration         | 30 days        |
| Resolution authority     | Parties only   |
| Escrow role in dispute   | Hold & wait    |

**Escrow MUST NOT determine the outcome of any dispute.**
Escrow only waits for the parties to reach an agreement, then executes the agreed transfer.

---

## 13. OCR WARNING STRUCTURE

The system supports OCR Warning metadata to flag inconsistencies in uploaded proofs.

| Warning Type       | Description                              |
|--------------------|------------------------------------------|
| `Nominal Berbeda`  | Detected amount differs from expected    |
| `Tanggal Berbeda`  | Detected date differs from expected      |
| `Bank Berbeda`     | Detected bank differs from expected      |
| `Rekening Berbeda` | Detected account number differs          |
| `Other`            | Any other detected inconsistency         |

**Warnings may be ignored by the Escrow Officer** with a documented reason.
**No AI/OCR is implemented** in the Foundation phase.

---

## 14. PARTICIPANT INTEGRATION

Escrow is a `ConversationParticipant` with role `'Escrow'`.

- Escrow joins via `addParticipant(conversationId, 'Escrow', workspaceId)`.
- Escrow can send messages in the Conversation.
- Escrow's actions are automatically logged to Audit Trail via `addAuditEvent()`.

---

## 15. PROHIBITED ACTIONS

```
❌ Do NOT implement payment gateway integration.
❌ Do NOT implement automatic bank transfers.
❌ Do NOT implement bank API connections.
❌ Do NOT allow Escrow to confirm final receipt.
❌ Do NOT allow Escrow to judge disputes.
❌ Do NOT modify this Constitution or any other existing Constitution.
```

---

## 16. DATA ARCHITECTURE

```
EscrowRecord
  ├── id                    UUID v4
  ├── transaksiId           Foreign key → TransaksiItem
  ├── status                EscrowStatus
  ├── statusHistory[]       EscrowStatusEntry
  ├── pricing               EscrowPricingPolicy
  ├── nominalTransaksi      number
  ├── escrowFee             number | null
  ├── transactionCost       number | null  ← NOT Escrow revenue
  ├── transfers[]           EscrowTransferRecord
  ├── dispute               EscrowDisputeRecord | null
  ├── workspaceIdBuyer      string
  ├── workspaceIdSeller     string
  ├── createdAt             ISO datetime
  └── updatedAt             ISO datetime
```

---

## 17. RETENTION

Escrow records follow the same retention policy as Audit Trail: **Permanent**.
Escrow records MUST NOT be deleted after the transaction is closed.

---

*End of Escrow Module Constitution v1.0*
*TernakHub Platform — 15 Juli 2026*
