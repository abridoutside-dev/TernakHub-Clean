// Shared media vocabulary used by the Supabase/R2 media boundary.

export type MediaType =
  | 'image'
  | 'document'
  | 'attachment'
  | 'avatar'
  | 'cover'
  | 'gallery'
  | 'audio'
  | 'video'
  | 'pdf'
  | 'spreadsheet';

export type MediaCategory =
  | 'livestock'
  | 'marketplace'
  | 'master_pakan'
  | 'produk_komersial'
  | 'workspace'
  | 'profile'
  | 'kesehatan'
  | 'penyakit'
  | 'reproduksi'
  | 'batch'
  | 'news_event'
  | 'dokumen'
  | 'system';

export type MediaStatus = 'active' | 'pending' | 'deleted';