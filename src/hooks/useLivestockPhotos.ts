// ─── useLivestockPhotos — DB-001E-1 ──────────────────────────────────────────
//
// Async hook: loads livestock photo metadata from Supabase `livestock_photos`.
// Supabase is the authoritative source for all photo metadata.
//
// Photo categorisation (driven by DB-001A schema):
//   is_cover = true                → Foto Identitas (primary / cover)
//   is_cover = false, taken_at ≠ null → Foto Prestasi (achievement)
//   is_cover = false, taken_at = null → Foto Terbaru  (general gallery)
//
// Auth/RLS errors are suppressed silently in dev/demo mode so the app
// degrades gracefully when no Supabase session is present.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import {
  repoGetLivestockPhotosByLivestockId,
  type LivestockPhotoRepoRecord,
} from '../repositories/mediaRepository';

// ─── Derived typed views ──────────────────────────────────────────────────────
// These views keep the existing UI contract while adapting repository rows.

export interface LivestockIdentitasPhoto {
  id: string;            // photo_uuid
  original_url: string;  // storage_url
  thumbnail_url: string | null;
  uploadedAt: string;    // created_at ISO
  reason: string | null; // caption (repurposed as reason/note)
}

export interface LivestockPrestasiPhoto {
  id: string;
  original_url: string;
  thumbnail_url: string | null;
  achievementDate: string;   // taken_at (or created_at date part as fallback)
  description: string | null; // caption
  uploadedAt: string;
}

export interface LivestockTerbaruPhoto {
  id: string;
  original_url: string;
  thumbnail_url: string | null;
  uploadedAt: string;
}

// ─── Hook return ──────────────────────────────────────────────────────────────

export interface LivestockPhotosState {
  /** Primary / cover photo row; null until first upload. */
  identitas: LivestockIdentitasPhoto | null;
  /** Achievement photos (taken_at ≠ null), newest first. */
  prestasiList: LivestockPrestasiPhoto[];
  /** General gallery photos (taken_at = null, not cover), newest first. */
  terbaruList: LivestockTerbaruPhoto[];
  /** Effective cover URL — identitas thumbnail_url → storage_url → null. */
  coverPhotoUrl: string | null;
  /** photo_uuid of the identitas (cover) photo, or null. */
  coverPhotoId: string | null;
  /** Raw repo records — needed for cover / delete mutations. */
  rawPhotos: LivestockPhotoRepoRecord[];
  isLoading: boolean;
  error: string | null;
  /** Call after any mutation to reload from Supabase. */
  refetch: () => void;
}

// ─── Row adapters ─────────────────────────────────────────────────────────────

function toIdentitas(p: LivestockPhotoRepoRecord): LivestockIdentitasPhoto {
  return {
    id:            p.photo_uuid,
    original_url:  p.storage_url,
    thumbnail_url: p.thumbnail_url,
    uploadedAt:    p.created_at,
    reason:        p.caption,
  };
}

function toPrestasi(p: LivestockPhotoRepoRecord): LivestockPrestasiPhoto {
  return {
    id:              p.photo_uuid,
    original_url:    p.storage_url,
    thumbnail_url:   p.thumbnail_url,
    achievementDate: p.taken_at ?? p.created_at.slice(0, 10),
    description:     p.caption,
    uploadedAt:      p.created_at,
  };
}

function toTerbaru(p: LivestockPhotoRepoRecord): LivestockTerbaruPhoto {
  return {
    id:            p.photo_uuid,
    original_url:  p.storage_url,
    thumbnail_url: p.thumbnail_url,
    uploadedAt:    p.created_at,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLivestockPhotos(livestockId: string): LivestockPhotosState {
  const [rawPhotos, setRawPhotos] = useState<LivestockPhotoRepoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [fetchSeq, setFetchSeq]   = useState(0);

  const refetch = useCallback(() => setFetchSeq((n) => n + 1), []);

  useEffect(() => {
    if (!livestockId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    repoGetLivestockPhotosByLivestockId(livestockId)
      .then((photos) => {
        if (!cancelled) setRawPhotos(photos);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          // Suppress auth / RLS errors gracefully in dev / demo mode
          const isAuthError =
            msg.includes('permission denied') ||
            msg.includes('JWT') ||
            msg.includes('PGRST') ||
            msg.includes('401');
          if (!isAuthError) setError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [livestockId, fetchSeq]);

  // Derive typed views
  const identitasRaw = rawPhotos.find((p) => p.is_cover) ?? null;

  const prestasiRaw = rawPhotos
    .filter((p) => !p.is_cover && p.taken_at != null)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  const terbaruRaw = rawPhotos
    .filter((p) => !p.is_cover && p.taken_at == null)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  const identitas    = identitasRaw ? toIdentitas(identitasRaw) : null;
  const prestasiList = prestasiRaw.map(toPrestasi);
  const terbaruList  = terbaruRaw.map(toTerbaru);

  const coverPhotoUrl = identitas
    ? (identitas.thumbnail_url ?? identitas.original_url)
    : null;

  return {
    identitas,
    prestasiList,
    terbaruList,
    coverPhotoUrl,
    coverPhotoId: identitas?.id ?? null,
    rawPhotos,
    isLoading,
    error,
    refetch,
  };
}
