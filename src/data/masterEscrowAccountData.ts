// ─── Master Escrow Account — FARM-FIX-005.5 ──────────────────────────────────
// Official escrow bank accounts used to receive Buyer payment.
// Escrow officer selects ONE active account when creating a payment instruction.
// Buyer NEVER enters destination account manually — the system displays it.
//
// SSOT for official accounts.  No write mutations from UI (admin-only seeding).

export interface EscrowOfficialAccount {
  /** UUID v4 — primary key */
  id: string;
  /** Bank name displayed to Buyer and Escrow */
  bankName: string;
  /** Full account number */
  accountNumber: string;
  /** Account holder name exactly as registered with the bank */
  accountHolder: string;
  /** Whether this account is available for new instructions */
  isActive: boolean;
  /** Bank logo / icon */
  bankIcon: string;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

export const MASTER_ESCROW_ACCOUNTS: EscrowOfficialAccount[] = [
  {
    id:             'esc-acc-0001-bca',
    bankName:       'BCA',
    accountNumber:  '1234567890',
    accountHolder:  'TernakHub Rekening Bersama',
    isActive:       true,
    bankIcon:       '🏦',
  },
  {
    id:             'esc-acc-0002-bri',
    bankName:       'BRI',
    accountNumber:  '0987654321',
    accountHolder:  'TernakHub Rekening Bersama',
    isActive:       true,
    bankIcon:       '🏛️',
  },
  {
    id:             'esc-acc-0003-mandiri',
    bankName:       'Mandiri',
    accountNumber:  '1122334455',
    accountHolder:  'TernakHub Rekening Bersama',
    isActive:       true,
    bankIcon:       '🏢',
  },
  {
    id:             'esc-acc-0004-bni',
    bankName:       'BNI',
    accountNumber:  '6677889900',
    accountHolder:  'TernakHub Rekening Bersama',
    isActive:       false, // inactive — not selectable for new instructions
    bankIcon:       '🏣',
  },
];

// ─── Getters ──────────────────────────────────────────────────────────────────

/** All active official escrow accounts — for Escrow officer selection */
export function getActiveEscrowAccounts(): EscrowOfficialAccount[] {
  return MASTER_ESCROW_ACCOUNTS.filter(a => a.isActive);
}

/** Single account by ID */
export function getEscrowAccountById(id: string): EscrowOfficialAccount | undefined {
  return MASTER_ESCROW_ACCOUNTS.find(a => a.id === id);
}

/** Buyer bank options (banks the buyer can select to transfer FROM) */
export const BUYER_BANK_OPTIONS = [
  'BCA', 'BRI', 'Mandiri', 'BNI', 'BSI',
  'CIMB Niaga', 'Danamon', 'Permata', 'BTN', 'Lainnya',
];
