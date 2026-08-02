# TRANSPORT MODULE CONSTITUTION
**TernakHub Platform — Authoritative Specification**
**Version 1.0 — Effective: 15 Juli 2026**
**Status: ACTIVE**

---

## 1. AUTHORITY

This document is the authoritative specification for all Transport-related implementation in TernakHub.

All Transport features MUST comply with this Constitution.
This Constitution MUST NOT be modified during implementation.

---

## 2. WHAT TRANSPORT IS

Transport is an **optional Participant** in the Transaction Conversation system.

Transport is a **logistics service provider** that:

- Transports goods and/or livestock.
- Documents the delivery process.
- Uploads Evidence (photos, videos, time, location).

Transport can join a Transaction Conversation when a logistics service is activated for that transaction.

Transport can **auto-exit** the Conversation after Delivery Completed.

---

## 3. WHAT TRANSPORT IS NOT

```
❌ Transport is NOT Escrow.
❌ Transport is NOT a judge.
❌ Transport is NOT an arbitrator.
❌ Transport does NOT assess livestock condition (healthy / sick / good / damaged).
❌ Transport does NOT perform automatic payments.
❌ Transport does NOT implement real-time GPS tracking.
❌ Transport does NOT determine who is right or wrong in a dispute.
❌ Transport does NOT confirm that livestock is in good or bad condition.
```

---

## 4. TRANSPORT ROLE IN TRANSACTION CONVERSATION

Transport is an **optional Participant** alongside:

| Participant     | Status    |
|-----------------|-----------|
| Buyer           | Required  |
| Seller          | Required  |
| Transport       | Optional  |
| Escrow          | Optional  |
| Veterinarian    | Optional  |

Transport joins via `addTransportParticipant()`.
Transport can auto-exit after `Delivery Completed` status.

Transport can:
- Send messages in the Conversation.
- Upload Evidence (photos, videos, location, notes).
- Use Quick Templates for its role.
- Log actions to Audit Trail via `addAuditEvent()`.

Transport CANNOT:
- Access Escrow fund data.
- Approve or reject a transaction.
- Declare livestock condition (healthy / damaged).

---

## 5. TRANSPORT STATUS

```
Waiting Assignment
      ↓
   Accepted
      ↓
 Pickup Ready
      ↓
   Loading
      ↓
 On Delivery
      ↓
   Arrived
      ↓
  Unloading
      ↓
Delivery Completed
```

Cancellation can happen from: **Waiting Assignment**, **Accepted**, **Pickup Ready**.

| Status               | Description                                                |
|----------------------|------------------------------------------------------------|
| `Waiting Assignment` | Transport order created; awaiting Transport acceptance     |
| `Accepted`           | Transport has accepted the delivery assignment             |
| `Pickup Ready`       | Transport is ready at origin; awaiting loading             |
| `Loading`            | Goods/livestock are being loaded onto the vehicle          |
| `On Delivery`        | Vehicle is en route to destination                         |
| `Arrived`            | Vehicle has arrived at destination                         |
| `Unloading`          | Goods/livestock are being unloaded                         |
| `Delivery Completed` | Delivery finished; Transport role ends                     |
| `Cancelled`          | Delivery cancelled before departure                        |

---

## 6. TRANSPORT EVIDENCE

Transport ONLY uploads:
- **Photo**
- **Video**
- **Time** (timestamp — automatic)
- **Location** (optional — text description, NOT real-time GPS)

Transport DOES NOT assess or declare the condition of goods or livestock.

### Evidence by Phase

**Before Loading**

| Evidence               | Required |
|------------------------|----------|
| Foto Kendaraan         | ✅ Yes   |
| Plat Nomor             | ✅ Yes   |
| Foto Barang/Hewan      | ✅ Yes   |
| Video Barang/Hewan     | ✅ Yes   |

**Saat Perjalanan (During Transit)**

| Evidence  | Required |
|-----------|----------|
| Lokasi    | Optional |
| Catatan   | Optional |

**Saat Tiba (On Arrival)**

| Evidence                  | Required |
|---------------------------|----------|
| Foto Unloading            | ✅ Yes   |
| Video Unloading           | ✅ Yes   |
| Foto Kondisi Barang/Hewan | ✅ Yes   |

> Note: "Foto Kondisi Barang/Hewan" documents the visual state at arrival.
> Transport does NOT interpret or declare whether condition is good or bad.

---

## 7. QUICK TEMPLATE — TRANSPORT

Minimum Quick Templates for Transport role:

| Template                | Phase              |
|-------------------------|--------------------|
| Foto Loading            | Before Loading     |
| Video Loading           | Before Loading     |
| Lokasi Berangkat        | Departure          |
| Lokasi Tiba             | Arrival            |
| Foto Unloading          | On Arrival         |
| Video Unloading         | On Arrival         |
| Konfirmasi Pengiriman   | Delivery Completed |

---

## 8. TRANSPORT PAYMENT

Transport Fee is **strictly separated** from:

- Harga Barang (goods price)
- Escrow Fee

Transport Fee MUST be displayed separately in all transaction summaries.

### Fee Payer

| Option     | Description                        |
|------------|------------------------------------|
| `Buyer`    | Buyer pays Transport Fee           |
| `Seller`   | Seller pays Transport Fee          |
| `Shared`   | Both parties split Transport Fee   |

### Payment Method

Transport Fee can be settled:

1. **Directly (P2P)** — Buyer or Seller pays Transport directly.
2. **Via Escrow** — Transport Fee routed through Escrow if all parties agree.

No automatic payment. No bank API integration.

### Pricing Structure

| Field             | Type                                        |
|-------------------|---------------------------------------------|
| `type`            | `'Percentage'` \| `'Fixed'`                 |
| `percentage`      | `number \| null` (e.g. `0.05` = 5%)        |
| `fixedAmount`     | `number \| null`                            |
| `minimumFee`      | `number \| null`                            |
| `maximumFee`      | `number \| null`                            |
| `feePayer`        | `'Buyer'` \| `'Seller'` \| `'Shared'`       |
| `viaEscrow`       | `boolean` (default: false)                  |

---

## 9. DELIVERY PRINCIPLE

Transport documents the process — it does NOT judge the outcome.

```
✅ Transport uploads: Foto, Video, Waktu, Lokasi
❌ Transport does NOT state: Barang Baik / Barang Rusak / Hewan Sehat / Hewan Sakit
```

Condition assessment is the responsibility of the **Receiver (Buyer)** and optionally the **Veterinarian**.

---

## 10. AUDIT TRAIL

All Transport actions MUST be logged via `addAuditEvent()`.

| Action               | AuditEvent              |
|----------------------|-------------------------|
| Assignment accepted  | `Transport Assigned`    |
| Pickup ready         | `Transport Pickup`      |
| Loading started      | `Transport Loading`     |
| Departure            | `Transport Departure`   |
| Arrival              | `Transport Arrived`     |
| Unloading started    | `Transport Unloading`   |
| Delivery completed   | `Transport Completed`   |

---

## 11. RESPONSIVE

All Transport UI MUST support:

- Android (mobile-first)
- Tablet
- Desktop

---

## 12. PROHIBITED ACTIONS

```
❌ Do NOT implement real-time GPS tracking.
❌ Do NOT implement automatic payment or bank API.
❌ Do NOT allow Transport to assess livestock condition.
❌ Do NOT allow Transport to judge disputes.
❌ Do NOT modify this Constitution or any other existing Constitution.
❌ Do NOT duplicate Transport data into Marketplace or other modules.
```

---

## 13. DATA ARCHITECTURE

```
TransportRecord
  ├── id                    UUID v4
  ├── transaksiId           Foreign key → TransaksiItem
  ├── layananTransportUuid  Reference UUID → LayananTransportRecord
  ├── workspaceIdTransport  string (Workspace Transporter)
  ├── workspaceNamaTransport string
  ├── status                TransportStatus
  ├── statusHistory[]       TransportStatusEntry
  ├── pricing               TransportPricingPolicy
  ├── transportFee          number | null
  ├── evidence[]            TransportEvidenceRecord
  ├── createdAt             ISO datetime
  └── updatedAt             ISO datetime

TransportStatusEntry
  ├── status                TransportStatus
  ├── timestamp             ISO datetime
  ├── actor                 string (workspaceId)
  ├── actorNama             string
  └── catatan               string | null

TransportPricingPolicy
  ├── type                  'Percentage' | 'Fixed'
  ├── percentage            number | null
  ├── fixedAmount           number | null
  ├── minimumFee            number | null
  ├── maximumFee            number | null
  ├── feePayer              'Buyer' | 'Seller' | 'Shared'
  └── viaEscrow             boolean

TransportEvidenceRecord
  ├── id                    UUID v4
  ├── transportId           Foreign key → TransportRecord
  ├── phase                 'Before Loading' | 'In Transit' | 'On Arrival'
  ├── tipe                  'Foto' | 'Video' | 'Lokasi' | 'Catatan'
  ├── fileName              string | null
  ├── caption               string
  ├── timestamp             ISO datetime
  └── uploadedBy            string (workspaceId)
```

---

## 14. RETENTION

Transport records follow the same retention policy as Audit Trail: **Permanent**.
Transport Evidence MUST NOT be deleted after delivery is completed.

---

## 15. MODULE REGISTRATION

```
PROFILE-008 — Transport Constitution & Foundation (dokumen ini)
PROFILE-009 dan seterusnya mengacu pada Constitution ini.
```

---

*End of Transport Module Constitution v1.0*
*TernakHub Platform — 15 Juli 2026*
