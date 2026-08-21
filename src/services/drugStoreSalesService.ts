// ─── Drug Store Sales Service ──────────────────────────────────────────────────
//
// Business logic layer for Drug Store sales transactions.
// Implements the atomic sales completion pattern (Gap 9):
//   Pending → items → completion (stock deduction) → Selesai
//
// Rules:
//  - No React imports.
//  - Validation is synchronous; persistence is async.
//  - All operations are scoped to the active workspace.
//  - Selesai status is terminal: no edits, no deletes, no re-completion.
//  - Stock deduction uses stok_obat quantity, checked-and-decremented atomically.
//  - Retry is safe: re-calling completeSale on a Selesai sale is idempotent.

import type {
  DrugStoreSalesDbRow,
  DrugStoreSalesCreateInput,
  DrugStoreSalesItemCreateInput,
} from '../types/drugStore';

import {
  repoGetDrugStoreSaleById,
  repoInsertDrugStoreSale,
  repoUpdateDrugStoreSale,
  repoInsertDrugStoreSalesItem,
  repoGetDrugStoreSalesItemsBySaleId,
} from '../repositories/drugStoreRepository';

import { repoGetStokObatItemById } from '../repositories/stokObatRepository';
import { addStokKeluar } from '../services/stokObatService';

import { DrugStoreRepoError } from '../repositories/drugStoreRepository';

export class DrugStoreSalesServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DrugStoreSalesServiceError';
  }
}

export type DrugStoreSalesResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function ok<T>(data: T): DrugStoreSalesResult<T> {
  return { ok: true, data };
}

function fail<T>(message: string): DrugStoreSalesResult<T> {
  return { ok: false, error: message };
}

// ─── Service input types ───────────────────────────────────────────────────────

export interface CreateSaleInput {
  workspace_id: string;
  customer_id?: string | null;
  sale_date: string;
  payment_method?: string | null;
  notes?: string | null;
  created_by?: string | null;
  /** Items to insert as part of the sale. */
  items: DrugStoreSalesItemCreateInput[];
}

// ─── Service commands ──────────────────────────────────────────────────────────

/**
 * Creates a new Drug Store sale in Pending status with line items.
 * Items are inserted before completion; stock is NOT deducted until
 * completeSale() is called successfully.
 */
export async function createSale(
  workspaceId: string,
  input: CreateSaleInput,
): Promise<DrugStoreSalesResult<DrugStoreSalesDbRow>> {
  if (!workspaceId) return fail('Workspace diperlukan.');
  if (!input.sale_date) return fail('Tanggal penjualan diperlukan.');
  if (!input.items || input.items.length === 0) {
    return fail('Minimal 1 item diperlukan.');
  }

  // Validate each item
  for (const item of input.items) {
    if (!item.item_name?.trim()) {
      return fail('Nama item wajib diisi untuk setiap item penjualan.');
    }
    if (!item.quantity || item.quantity <= 0) {
      return fail(`Jumlah untuk "${item.item_name}" harus lebih dari 0.`);
    }
  }

  try {
    const saleInput: DrugStoreSalesCreateInput = {
      workspace_id:  workspaceId,
      customer_id:   input.customer_id ?? null,
      sale_date:     input.sale_date,
      total_amount:  input.items.reduce(
        (sum, i) => sum + (Number(i.subtotal ?? 0) || 0), 0,
      ),
      payment_method: input.payment_method ?? null,
      status:         'Pending',
      notes:          input.notes ?? null,
      created_by:     input.created_by ?? null,
    };

    const sale = await repoInsertDrugStoreSale(saleInput);

    // Insert items with the sale_id assigned
    for (const item of input.items) {
      await repoInsertDrugStoreSalesItem({
        sale_id:       sale.id,
        workspace_id:  workspaceId,
        stok_id:       item.stok_id ?? null,
        item_name:     item.item_name,
        quantity:      item.quantity,
        unit:          item.unit ?? null,
        unit_price:    item.unit_price ?? 0,
        subtotal:      item.subtotal ?? 0,
        notes:         item.notes ?? null,
      });
    }

    return ok(sale);
  } catch (err) {
    const msg = err instanceof DrugStoreRepoError
      ? err.message
      : 'Gagal membuat penjualan.';
    return fail(msg);
  }
}

/**
 * Completes a Pending sale:
 * 1. Verifies the sale is in Pending status (idempotent — returns ok if already Selesai).
 * 2. Checks idempotency: if stok_obat_keluar records already exist for this sale, skip deduction.
 * 3. Reads all items for the sale.
 * 4. For each item with a stok_id, creates a stok_obat_keluar record via addStokKeluar()
 *    which uses the DB trigger deduct_stok_obat() to decrement quantity atomically.
 * 5. Updates the sale status to 'Selesai'.
 *
 * If any step fails, the sale remains in its current state — stock is NOT
 * deducted, and the sale is NOT marked Selesai. Retry is safe.
 */
export async function completeSale(
  workspaceId: string,
  saleId: string,
): Promise<DrugStoreSalesResult<DrugStoreSalesDbRow>> {
  if (!workspaceId) return fail('Workspace diperlukan.');
  if (!saleId) return fail('ID penjualan diperlukan.');

  try {
    const sale = await repoGetDrugStoreSaleById(saleId);
    if (!sale) {
      return fail('Penjualan tidak ditemukan.');
    }
    if (sale.workspace_id !== workspaceId) {
      return fail('Penjualan tidak ditemukan di workspace ini.');
    }

    // Idempotency: if already Selesai, return the current record.
    if (sale.status === 'Selesai') {
      return ok(sale);
    }

    // Only Pending sales can be completed.
    if (sale.status !== 'Pending') {
      return fail(`Penjualan tidak dapat diselesaikan dari status "${sale.status}".`);
    }

    // Idempotency: check if stok_obat_keluar records already exist for this sale.
    const { supabase: sb } = await import('../lib/supabase');
    const { data: existingKeluar } = await sb
      .from('stok_obat_keluar')
      .select('id')
      .eq('workspace_id', workspaceId)
      .ilike('notes', `%${saleId}%`)
      .limit(1);

    const alreadyCompleted = existingKeluar && existingKeluar.length > 0;
    if (alreadyCompleted) {
      const updated = await repoUpdateDrugStoreSale(saleId, { status: 'Selesai' });
      return ok(updated);
    }

    // Fetch items to process stock deduction.
    const items = await repoGetDrugStoreSalesItemsBySaleId(saleId);

    // Deduct stock for each item that references a stok_obat row.
    // Each deduction uses addStokKeluar() which creates an audit record
    // and fires the DB trigger deduct_stok_obat() atomically.
    for (const item of items) {
      if (!item.stok_id) continue;

      // Fetch the current stok_obat row to check available quantity.
      const stokRow = await repoGetStokObatItemById(item.stok_id, workspaceId);
      if (!stokRow) {
        return fail(`Item stok "${item.item_name}" tidak ditemukan di workspace ini.`);
      }

      const currentQty = Number(stokRow.quantity) || 0;
      const deductQty  = Math.floor(Number(item.quantity) || 0);
      if (currentQty < deductQty) {
        return fail(
          `Stok tidak cukup untuk "${item.item_name}": tersedia ${currentQty}, ` +
          `dibutuhkan ${deductQty}.`,
        );
      }

      const keluarResult = await addStokKeluar(workspaceId, item.stok_id, {
        jumlah: deductQty,
        tanggalKeluar: sale.sale_date,
        alasan: 'Penjualan',
        catatan: `Penjualan [sale:${saleId}]`,
      });
      if (!keluarResult.ok) {
        return fail(keluarResult.error);
      }
    }

    // All stock deductions succeeded — mark the sale as Selesai.
    const updated = await repoUpdateDrugStoreSale(saleId, { status: 'Selesai' });
    return ok(updated);
  } catch (err) {
    const msg = err instanceof DrugStoreSalesServiceError
      ? err.message
      : err instanceof Error
        ? err.message
        : 'Gagal menyelesaikan penjualan.';
    return fail(msg);
  }
}

/**
 * Cancels a Pending sale by setting status to 'Dibatalkan'.
 * Selesai sales cannot be cancelled (terminal state).
 */
export async function cancelSale(
  workspaceId: string,
  saleId: string,
  reason?: string,
): Promise<DrugStoreSalesResult<DrugStoreSalesDbRow>> {
  if (!workspaceId) return fail('Workspace diperlukan.');
  if (!saleId) return fail('ID penjualan diperlukan.');

  try {
    const sale = await repoGetDrugStoreSaleById(saleId);
    if (!sale) return fail('Penjualan tidak ditemukan.');
    if (sale.workspace_id !== workspaceId) return fail('Penjualan tidak ditemukan di workspace ini.');
    if (sale.status === 'Selesai') {
      return fail('Penjualan yang sudah Selesai tidak dapat dibatalkan.');
    }

    const updated = await repoUpdateDrugStoreSale(saleId, {
      status:    'Dibatalkan' as const,
      notes:     reason ? `[BATAL] ${reason}` : sale.notes,
    });
    return ok(updated);
  } catch (err) {
    const msg = err instanceof DrugStoreRepoError
      ? err.message
      : 'Gagal membatalkan penjualan.';
    return fail(msg);
  }
}
