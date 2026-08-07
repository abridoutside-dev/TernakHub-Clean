import type {
  RelationshipStatus,
  RelationshipType,
} from '../types/workspaceRelationship';

export const RELATIONSHIP_TYPE_CONFIG: Record<RelationshipType, {
  label: string;
  color: string;
  bg: string;
  icon: string;
}> = {
  Supplier: { label: 'Pemasok', color: '#b45309', bg: '#fffbeb', icon: '📦' },
  Buyer: { label: 'Pembeli', color: '#15803d', bg: '#f0fdf4', icon: '🛒' },
  Partner: { label: 'Partner', color: '#0369a1', bg: '#f0f9ff', icon: '🤝' },
  Afiliasi: { label: 'Afiliasi', color: '#7c3aed', bg: '#f5f3ff', icon: '🔗' },
  Kompetitor: { label: 'Kompetitor', color: '#b91c1c', bg: '#fef2f2', icon: '⚔️' },
  Mitra: { label: 'Mitra', color: '#0891b2', bg: '#ecfeff', icon: '🫱' },
  Lainnya: { label: 'Lainnya', color: '#64748b', bg: '#f8fafc', icon: '🏷️' },
};

export const RELATIONSHIP_STATUS_CONFIG: Record<RelationshipStatus, {
  label: string;
  color: string;
  bg: string;
  dot: string;
}> = {
  Active: { label: 'Aktif', color: '#15803d', bg: '#f0fdf4', dot: '#22c55e' },
  Pending: { label: 'Menunggu', color: '#b45309', bg: '#fffbeb', dot: '#f59e0b' },
  Suspended: { label: 'Ditangguhkan', color: '#b91c1c', bg: '#fef2f2', dot: '#f87171' },
  Rejected: { label: 'Ditolak', color: '#9f1239', bg: '#fff1f2', dot: '#fb7185' },
  Archived: { label: 'Diputus', color: '#64748b', bg: '#f8fafc', dot: '#94a3b8' },
};

export const WORKSPACE_TYPE_CONFIG: Record<string, {
  icon: string;
  label: string;
  color: string;
  bg: string;
}> = {
  Farm: { icon: '🐄', label: 'Peternakan', color: '#15803d', bg: '#f0fdf4' },
  FeedStore: { icon: '🌾', label: 'Toko Pakan', color: '#b45309', bg: '#fffbeb' },
  VeterinaryClinic: { icon: '🩺', label: 'Klinik Hewan', color: '#7c3aed', bg: '#f5f3ff' },
  VeterinaryDoctor: { icon: '🩺', label: 'Dokter Hewan', color: '#7c3aed', bg: '#f5f3ff' },
  Veterinary: { icon: '🩺', label: 'Veteriner', color: '#7c3aed', bg: '#f5f3ff' },
  Transport: { icon: '🚚', label: 'Transportasi', color: '#0369a1', bg: '#f0f9ff' },
  Marketplace: { icon: '🛒', label: 'Marketplace', color: '#0891b2', bg: '#ecfeff' },
};