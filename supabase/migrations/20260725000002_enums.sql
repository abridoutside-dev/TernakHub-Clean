-- DB-001A / 002 — All PostgreSQL enum types.

CREATE TYPE workspace_type AS ENUM (
  'Farm', 'FeedStore', 'VeterinaryClinic', 'VeterinaryDoctor', 'Transport', 'Marketplace'
);
CREATE TYPE workspace_status AS ENUM ('Aktif', 'Nonaktif', 'Diarsipkan', 'Pending');
-- This enum is shared by workspace and verification records. The audit defines
-- two value sets under the same type name, so the production type is their
-- backwards-compatible superset.
CREATE TYPE verification_status_enum AS ENUM (
  'Unverified', 'Pending', 'Verified', 'Rejected', 'Suspended',
  'Draft', 'Submitted', 'UnderReview', 'Approved', 'Expired'
);
CREATE TYPE verification_type_enum AS ENUM (
  'KTP', 'NPWP', 'SIUP', 'Sertifikat', 'LokasiUsaha', 'Rekening', 'Lainnya'
);
CREATE TYPE member_role AS ENUM ('Owner', 'Admin', 'Staff', 'Viewer', 'Guest');
CREATE TYPE member_status AS ENUM ('Aktif', 'Nonaktif', 'Diundang', 'Ditangguhkan');
CREATE TYPE relationship_type AS ENUM (
  'Supplier', 'Buyer', 'Partner', 'Afiliasi', 'Kompetitor', 'Mitra', 'Lainnya'
);
CREATE TYPE relationship_status AS ENUM ('Aktif', 'Nonaktif', 'Pending', 'Ditolak', 'Diputus');
CREATE TYPE ownership_transfer_status AS ENUM (
  'Draft', 'Requested', 'PendingVerification', 'Approved', 'Rejected',
  'Completed', 'Cancelled', 'Failed'
);
CREATE TYPE subscription_status AS ENUM ('Aktif', 'Trial', 'Kadaluarsa', 'Dibatalkan', 'Ditangguhkan');
CREATE TYPE sex_enum AS ENUM ('Jantan', 'Betina');
CREATE TYPE health_status_enum AS ENUM ('Sehat', 'Sakit', 'Pemantauan');
CREATE TYPE location_status_enum AS ENUM ('Di Kandang', 'Luar Kandang', 'Arsip');
CREATE TYPE archive_reason_enum AS ENUM ('Mati', 'Terjual', 'Hibah');
CREATE TYPE pedigree_role_enum AS ENUM ('Induk', 'Pejantan', 'Anak', 'Kakek', 'Nenek', 'Buyut');
CREATE TYPE ownership_method_enum AS ENUM (
  'Lahir', 'Pembelian', 'Penjualan', 'Hibah', 'Beli Kembali',
  'Transfer', 'Registrasi Manual', 'Impor', 'Transfer Masuk', 'Lainnya'
);
CREATE TYPE batch_status_enum AS ENUM ('Aktif', 'Selesai', 'Diarsipkan');
CREATE TYPE transfer_type_enum AS ENUM ('Keluar Sementara', 'Masuk Kembali', 'Keluar Permanen');
CREATE TYPE mutation_status_enum AS ENUM (
  'Draft', 'Pending', 'Approved', 'Completed', 'Rejected', 'Cancelled'
);
CREATE TYPE treatment_type_enum AS ENUM (
  'Pengobatan', 'Vaksinasi', 'Deworming', 'Vitamin', 'Operasi', 'Infus', 'Lainnya'
);
CREATE TYPE stok_status_enum AS ENUM ('Aktif', 'Habis', 'Kadaluarsa', 'Diarsipkan');
CREATE TYPE program_status_enum AS ENUM ('Aktif', 'Selesai', 'Dihentikan', 'Draft');
CREATE TYPE pregnancy_status_enum AS ENUM ('Aktif', 'Selesai', 'Gugur', 'Dibatalkan');
CREATE TYPE formula_status_enum AS ENUM ('Aktif', 'Draft', 'Arsip');
CREATE TYPE listing_status_enum AS ENUM (
  'Draft', 'Aktif', 'Terjual', 'Ditarik', 'Moderasi', 'Kedaluwarsa', 'Diarsipkan'
);
CREATE TYPE negotiation_status_enum AS ENUM (
  'Pending', 'Countered', 'Accepted', 'Rejected', 'Expired', 'Cancelled'
);
CREATE TYPE marketplace_transaction_status_enum AS ENUM (
  'Baru', 'Dikonfirmasi', 'Proses', 'Dikirim', 'Diterima', 'Selesai',
  'Dibatalkan', 'Sengketa'
);
CREATE TYPE moderation_status_enum AS ENUM ('Pending', 'UnderReview', 'Resolved', 'Ditolak');
CREATE TYPE room_status_enum AS ENUM (
  'Open', 'EscrowRequested', 'EscrowActive', 'TransportArranged', 'InTransit',
  'DeliveryConfirmed', 'ReceiverConfirmed', 'Completed', 'Disputed',
  'Cancelled', 'Refunded', 'Closed'
);
CREATE TYPE participant_role_enum AS ENUM (
  'Buyer', 'Seller', 'Transport', 'Escrow', 'Judge', 'Observer'
);
CREATE TYPE escrow_status_enum AS ENUM (
  'Pending', 'Funded', 'Held', 'Released', 'Refunded', 'Disputed', 'Cancelled'
);
CREATE TYPE transport_status_enum AS ENUM (
  'Pending', 'Confirmed', 'InTransit', 'Delivered', 'Cancelled'
);
CREATE TYPE layanan_status_enum AS ENUM ('Aktif', 'Nonaktif', 'Diarsipkan');
CREATE TYPE quotation_status_enum AS ENUM ('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired');
CREATE TYPE content_type_enum AS ENUM (
  'Berita', 'Artikel', 'Event', 'Pengumuman', 'Tips', 'Regulasi'
);
CREATE TYPE publication_status_enum AS ENUM (
  'Draft', 'PendingReview', 'Published', 'Rejected', 'Archived'
);
CREATE TYPE rss_queue_status_enum AS ENUM (
  'Pending', 'Processing', 'Approved', 'Rejected', 'Duplicate'
);
CREATE TYPE notification_type_enum AS ENUM (
  'Info', 'Peringatan', 'Kritis', 'Transaksi', 'Sistem', 'Promosi'
);
CREATE TYPE media_type_enum AS ENUM (
  'image', 'document', 'attachment', 'avatar', 'cover',
  'gallery', 'audio', 'video', 'pdf', 'spreadsheet'
);
CREATE TYPE media_category_enum AS ENUM (
  'livestock', 'marketplace', 'health', 'feed', 'transaction',
  'profile', 'workspace', 'trust', 'news', 'admin', 'system'
);
CREATE TYPE insight_priority_enum AS ENUM ('critical', 'high', 'medium', 'low', 'info');