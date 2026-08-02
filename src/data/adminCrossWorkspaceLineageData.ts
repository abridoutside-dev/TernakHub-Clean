// ─── Admin Cross-Workspace Lineage Data — CWL-001 ────────────────────────────
// Foundation architecture for cross-workspace livestock lineage.
// Read-only dummy data only. No breeding logic. No ownership transfer.

// ─── Types ────────────────────────────────────────────────────────────────────

export type CWLVerificationStatus =
  | 'Terverifikasi'
  | 'Menunggu Verifikasi'
  | 'Belum Diverifikasi'
  | 'Ditolak';

export type CWLSpecies = 'Sapi' | 'Kambing' | 'Domba' | 'Kerbau' | 'Babi' | 'Ayam';

export type CWLRelationshipType =
  | 'Ayah'
  | 'Ibu'
  | 'Keturunan'
  | 'Saudara Kandung'
  | 'Saudara Tiri'
  | 'Orang Tua Tidak Diketahui';

export type CWLWorkspaceType =
  | 'Peternakan'
  | 'Klinik Hewan'
  | 'Dokter Hewan'
  | 'Transportasi';

// ─── Workspace Reference ──────────────────────────────────────────────────────
// Read-only cross-workspace pointer. Never mutates source workspace data.

export interface CWLWorkspaceRef {
  workspaceId: string;
  workspaceName: string;
  workspaceType: CWLWorkspaceType;
  ownerName: string;
  verified: boolean;
}

// ─── Parent Reference ─────────────────────────────────────────────────────────
// Can reference an animal in the same workspace or a different workspace.
// isExternal = true means it belongs to another workspace and is read-only here.

export interface CWLParentRef {
  livestockId: string | null;
  livestockName: string | null;
  species: CWLSpecies;
  breed: string;
  icon: string;
  typeBg: string;
  workspaceId: string;
  workspaceName: string;
  isExternal: boolean;
  verificationStatus: CWLVerificationStatus;
  isUnknown?: boolean;
}

// ─── Offspring Reference ──────────────────────────────────────────────────────

export interface CWLOffspringRef {
  livestockId: string;
  livestockName: string;
  species: CWLSpecies;
  icon: string;
  typeBg: string;
  workspaceId: string;
  workspaceName: string;
  isExternal: boolean;
  birthDate: string;
  verificationStatus: CWLVerificationStatus;
}

// ─── Sibling Reference ────────────────────────────────────────────────────────

export interface CWLSiblingRef {
  livestockId: string;
  livestockName: string;
  species: CWLSpecies;
  icon: string;
  typeBg: string;
  workspaceId: string;
  workspaceName: string;
  isExternal: boolean;
  siblingType: 'Saudara Kandung' | 'Saudara Tiri';
  sharedParent: 'Ayah' | 'Ibu' | 'Keduanya';
}

// ─── Cross-Workspace Reference ────────────────────────────────────────────────
// Tracks every cross-workspace lineage reference attached to this record.

export interface CWLCrossRef {
  refId: string;
  sourceWorkspaceId: string;
  sourceWorkspaceName: string;
  targetWorkspaceId: string;
  targetWorkspaceName: string;
  relationshipType: CWLRelationshipType;
  livestockId: string;
  livestockName: string;
  linkedDate: string;
  verificationStatus: CWLVerificationStatus;
  notes: string;
}

// ─── Timeline Event ───────────────────────────────────────────────────────────

export interface CWLTimelineEvent {
  id: string;
  date: string;
  event: string;
  actor: string;
  workspaceName: string;
  icon: string;
  color: string;
}

// ─── Main Lineage Record ──────────────────────────────────────────────────────

export interface CWLLineageRecord {
  /** Permanent UUID — never changes, even across workspace transfers. */
  livestockId: string;
  livestockName: string;
  species: CWLSpecies;
  breed: string;
  kelamin: 'Jantan' | 'Betina';
  icon: string;
  typeBg: string;
  typeColor: string;
  birthDate: string;
  birthDateEstimated: boolean;
  birthWeight: string;
  birthLocation: string;

  /** The workspace currently responsible for this animal. */
  currentWorkspaceId: string;
  currentWorkspaceName: string;
  currentWorkspaceType: CWLWorkspaceType;
  currentOwner: string;

  /** Lineage — both can be null/unknown. */
  father: CWLParentRef | null;
  mother: CWLParentRef | null;

  offspring: CWLOffspringRef[];
  siblings: CWLSiblingRef[];

  /** All cross-workspace lineage links involving this animal. */
  crossWorkspaceRefs: CWLCrossRef[];

  verificationStatus: CWLVerificationStatus;
  verificationDate: string | null;
  verifiedBy: string | null;

  timeline: CWLTimelineEvent[];

  registeredDate: string;
  notes: string;
}

// ─── Platform Summary Stats ───────────────────────────────────────────────────

export interface CWLPlatformStats {
  totalAnimals: number;
  totalLineages: number;
  crossWorkspaceRecords: number;
  verifiedLineages: number;
  pendingVerification: number;
  rejectedLineages: number;
  workspacesInvolved: number;
  speciesBreakdown: Record<CWLSpecies, number>;
}

// ─── Config Maps ──────────────────────────────────────────────────────────────

export const CWL_VERIFICATION_CONFIG: Record<
  CWLVerificationStatus,
  { label: string; bg: string; color: string; dot: string }
> = {
  Terverifikasi:        { label: 'Terverifikasi',        bg: '#d1fae5', color: '#065f46', dot: '#059669' },
  'Menunggu Verifikasi':{ label: 'Menunggu Verifikasi',  bg: '#fef3c7', color: '#92400e', dot: '#d97706' },
  'Belum Diverifikasi': { label: 'Belum Diverifikasi',   bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
  Ditolak:              { label: 'Ditolak',               bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
};

export const CWL_SPECIES_CONFIG: Record<
  CWLSpecies,
  { icon: string; bg: string; color: string }
> = {
  Sapi:   { icon: '🐄', bg: '#fef3c7', color: '#b45309' },
  Kambing:{ icon: '🐐', bg: '#d1fae5', color: '#065f46' },
  Domba:  { icon: '🐑', bg: '#ede9fe', color: '#5b21b6' },
  Kerbau: { icon: '🦬', bg: '#fee2e2', color: '#991b1b' },
  Babi:   { icon: '🐖', bg: '#fce7f3', color: '#9d174d' },
  Ayam:   { icon: '🐓', bg: '#ecfdf5', color: '#047857' },
};

export const CWL_WORKSPACE_TYPE_CONFIG: Record<
  CWLWorkspaceType,
  { icon: string; bg: string; color: string }
> = {
  Peternakan:    { icon: '🐄', bg: '#fef3c7', color: '#b45309' },
  'Klinik Hewan':{ icon: '🏥', bg: '#dbeafe', color: '#1d4ed8' },
  'Dokter Hewan':{ icon: '👨‍⚕️', bg: '#d1fae5', color: '#065f46' },
  Transportasi:  { icon: '🚛', bg: '#e0e7ff', color: '#3730a3' },
};

// ─── Workspace Registry (dummy) ───────────────────────────────────────────────

export const CWL_WORKSPACE_REGISTRY: CWLWorkspaceRef[] = [
  {
    workspaceId:   'WS-CWL-01',
    workspaceName: 'Peternakan Maju Jaya',
    workspaceType: 'Peternakan',
    ownerName:     'Budi Santoso',
    verified:      true,
  },
  {
    workspaceId:   'WS-CWL-02',
    workspaceName: 'Farm Berkah Mandiri',
    workspaceType: 'Peternakan',
    ownerName:     'Siti Rahayu',
    verified:      true,
  },
  {
    workspaceId:   'WS-CWL-03',
    workspaceName: 'Ternak Unggul Nusantara',
    workspaceType: 'Peternakan',
    ownerName:     'Ahmad Fauzi',
    verified:      false,
  },
  {
    workspaceId:   'WS-CWL-04',
    workspaceName: 'Klinik Hewan Sehat Sentosa',
    workspaceType: 'Klinik Hewan',
    ownerName:     'Dr. Maya Dewi',
    verified:      true,
  },
  {
    workspaceId:   'WS-CWL-05',
    workspaceName: 'CV Berkah Ternak Makmur',
    workspaceType: 'Peternakan',
    ownerName:     'Eko Prasetyo',
    verified:      false,
  },
];

// ─── Dummy Lineage Records ────────────────────────────────────────────────────

export const CWL_LINEAGE_LIST: CWLLineageRecord[] = [
  // ── Record 1: Rajawali (Sapi, WS-01, cross-ws mother from WS-02) ──────────
  {
    livestockId:       'LS-CWL-001',
    livestockName:     'Rajawali',
    species:           'Sapi',
    breed:             'Limosin × Simmental',
    kelamin:           'Jantan',
    icon:              '🐄',
    typeBg:            '#fef3c7',
    typeColor:         '#b45309',
    birthDate:         '2022-03-15',
    birthDateEstimated: false,
    birthWeight:       '38 kg',
    birthLocation:     'Kandang A, Peternakan Maju Jaya',
    currentWorkspaceId:   'WS-CWL-01',
    currentWorkspaceName: 'Peternakan Maju Jaya',
    currentWorkspaceType: 'Peternakan',
    currentOwner:         'Budi Santoso',
    father: {
      livestockId:        'LS-CWL-P01',
      livestockName:      'Garuda',
      species:            'Sapi',
      breed:              'Limousin',
      icon:               '🐄',
      typeBg:             '#fef3c7',
      workspaceId:        'WS-CWL-01',
      workspaceName:      'Peternakan Maju Jaya',
      isExternal:         false,
      verificationStatus: 'Terverifikasi',
    },
    mother: {
      livestockId:        'LS-CWL-P02',
      livestockName:      'Melati',
      species:            'Sapi',
      breed:              'Simmental',
      icon:               '🐄',
      typeBg:             '#fef3c7',
      workspaceId:        'WS-CWL-02',
      workspaceName:      'Farm Berkah Mandiri',
      isExternal:         true,
      verificationStatus: 'Terverifikasi',
    },
    offspring: [
      {
        livestockId:        'LS-CWL-007',
        livestockName:      'Agung',
        species:            'Sapi',
        icon:               '🐄',
        typeBg:             '#fef3c7',
        workspaceId:        'WS-CWL-04',
        workspaceName:      'Klinik Hewan Sehat Sentosa',
        isExternal:         true,
        birthDate:          '2024-09-10',
        verificationStatus: 'Terverifikasi',
      },
      {
        livestockId:        'LS-CWL-008',
        livestockName:      'Sinar',
        species:            'Sapi',
        icon:               '🐄',
        typeBg:             '#fef3c7',
        workspaceId:        'WS-CWL-01',
        workspaceName:      'Peternakan Maju Jaya',
        isExternal:         false,
        birthDate:          '2025-01-22',
        verificationStatus: 'Belum Diverifikasi',
      },
    ],
    siblings: [
      {
        livestockId:   'LS-CWL-002',
        livestockName: 'Cempaka',
        species:       'Sapi',
        icon:          '🐄',
        typeBg:        '#fef3c7',
        workspaceId:   'WS-CWL-02',
        workspaceName: 'Farm Berkah Mandiri',
        isExternal:    true,
        siblingType:   'Saudara Kandung',
        sharedParent:  'Keduanya',
      },
      {
        livestockId:   'LS-CWL-005',
        livestockName: 'Perkasa',
        species:       'Sapi',
        icon:          '🐄',
        typeBg:        '#fef3c7',
        workspaceId:   'WS-CWL-02',
        workspaceName: 'Farm Berkah Mandiri',
        isExternal:    true,
        siblingType:   'Saudara Tiri',
        sharedParent:  'Ayah',
      },
    ],
    crossWorkspaceRefs: [
      {
        refId:               'XREF-001-A',
        sourceWorkspaceId:   'WS-CWL-01',
        sourceWorkspaceName: 'Peternakan Maju Jaya',
        targetWorkspaceId:   'WS-CWL-02',
        targetWorkspaceName: 'Farm Berkah Mandiri',
        relationshipType:    'Ibu',
        livestockId:         'LS-CWL-P02',
        livestockName:       'Melati',
        linkedDate:          '2022-03-15',
        verificationStatus:  'Terverifikasi',
        notes:               'Ibu Rajawali tercatat di Farm Berkah Mandiri. Diverifikasi oleh kedua workspace.',
      },
      {
        refId:               'XREF-001-B',
        sourceWorkspaceId:   'WS-CWL-01',
        sourceWorkspaceName: 'Peternakan Maju Jaya',
        targetWorkspaceId:   'WS-CWL-04',
        targetWorkspaceName: 'Klinik Hewan Sehat Sentosa',
        relationshipType:    'Keturunan',
        livestockId:         'LS-CWL-007',
        livestockName:       'Agung',
        linkedDate:          '2024-09-12',
        verificationStatus:  'Terverifikasi',
        notes:               'Anak Rajawali (Agung) kini berada di bawah pengawasan klinik hewan.',
      },
    ],
    verificationStatus: 'Terverifikasi',
    verificationDate:   '2022-04-01',
    verifiedBy:         'Platform Admin — TernakHub',
    timeline: [
      { id: 't1-1', date: '2022-03-15', event: 'Kelahiran tercatat',              actor: 'Budi Santoso',        workspaceName: 'Peternakan Maju Jaya',       icon: '🐄', color: '#10b981' },
      { id: 't1-2', date: '2022-03-15', event: 'Silsilah Ayah ditautkan',         actor: 'Budi Santoso',        workspaceName: 'Peternakan Maju Jaya',       icon: '🔗', color: '#3b82f6' },
      { id: 't1-3', date: '2022-03-16', event: 'Referensi lintas-WS dibuat (Ibu)',actor: 'Siti Rahayu',         workspaceName: 'Farm Berkah Mandiri',         icon: '🌐', color: '#8b5cf6' },
      { id: 't1-4', date: '2022-04-01', event: 'Silsilah diverifikasi',           actor: 'Platform Admin',      workspaceName: 'TernakHub Platform',         icon: '✅', color: '#059669' },
      { id: 't1-5', date: '2024-09-12', event: 'Keturunan (Agung) terdaftar',     actor: 'Dr. Maya Dewi',       workspaceName: 'Klinik Hewan Sehat Sentosa', icon: '🐣', color: '#f59e0b' },
      { id: 't1-6', date: '2025-01-22', event: 'Keturunan (Sinar) terdaftar',     actor: 'Budi Santoso',        workspaceName: 'Peternakan Maju Jaya',       icon: '🐣', color: '#f59e0b' },
    ],
    registeredDate: '2022-03-15',
    notes: 'Pejantan unggul — digunakan dalam program persilangan lintas-workspace.',
  },

  // ── Record 2: Cempaka (Sapi, WS-02, saudara kandung Rajawali) ────────────
  {
    livestockId:       'LS-CWL-002',
    livestockName:     'Cempaka',
    species:           'Sapi',
    breed:             'Limosin × Simmental',
    kelamin:           'Betina',
    icon:              '🐄',
    typeBg:            '#fef3c7',
    typeColor:         '#b45309',
    birthDate:         '2022-07-28',
    birthDateEstimated: false,
    birthWeight:       '35 kg',
    birthLocation:     'Kandang B, Farm Berkah Mandiri',
    currentWorkspaceId:   'WS-CWL-02',
    currentWorkspaceName: 'Farm Berkah Mandiri',
    currentWorkspaceType: 'Peternakan',
    currentOwner:         'Siti Rahayu',
    father: {
      livestockId:        'LS-CWL-P01',
      livestockName:      'Garuda',
      species:            'Sapi',
      breed:              'Limousin',
      icon:               '🐄',
      typeBg:             '#fef3c7',
      workspaceId:        'WS-CWL-01',
      workspaceName:      'Peternakan Maju Jaya',
      isExternal:         true,
      verificationStatus: 'Terverifikasi',
    },
    mother: {
      livestockId:        'LS-CWL-P02',
      livestockName:      'Melati',
      species:            'Sapi',
      breed:              'Simmental',
      icon:               '🐄',
      typeBg:             '#fef3c7',
      workspaceId:        'WS-CWL-02',
      workspaceName:      'Farm Berkah Mandiri',
      isExternal:         false,
      verificationStatus: 'Terverifikasi',
    },
    offspring: [],
    siblings: [
      {
        livestockId:   'LS-CWL-001',
        livestockName: 'Rajawali',
        species:       'Sapi',
        icon:          '🐄',
        typeBg:        '#fef3c7',
        workspaceId:   'WS-CWL-01',
        workspaceName: 'Peternakan Maju Jaya',
        isExternal:    true,
        siblingType:   'Saudara Kandung',
        sharedParent:  'Keduanya',
      },
    ],
    crossWorkspaceRefs: [
      {
        refId:               'XREF-002-A',
        sourceWorkspaceId:   'WS-CWL-02',
        sourceWorkspaceName: 'Farm Berkah Mandiri',
        targetWorkspaceId:   'WS-CWL-01',
        targetWorkspaceName: 'Peternakan Maju Jaya',
        relationshipType:    'Ayah',
        livestockId:         'LS-CWL-P01',
        livestockName:       'Garuda',
        linkedDate:          '2022-07-28',
        verificationStatus:  'Terverifikasi',
        notes:               'Ayah Cempaka (Garuda) terdaftar di Peternakan Maju Jaya.',
      },
    ],
    verificationStatus: 'Terverifikasi',
    verificationDate:   '2022-08-10',
    verifiedBy:         'Platform Admin — TernakHub',
    timeline: [
      { id: 't2-1', date: '2022-07-28', event: 'Kelahiran tercatat',              actor: 'Siti Rahayu',    workspaceName: 'Farm Berkah Mandiri',  icon: '🐄', color: '#10b981' },
      { id: 't2-2', date: '2022-07-28', event: 'Referensi lintas-WS dibuat (Ayah)', actor: 'Budi Santoso', workspaceName: 'Peternakan Maju Jaya', icon: '🌐', color: '#8b5cf6' },
      { id: 't2-3', date: '2022-08-10', event: 'Silsilah diverifikasi',           actor: 'Platform Admin', workspaceName: 'TernakHub Platform',  icon: '✅', color: '#059669' },
    ],
    registeredDate: '2022-07-28',
    notes: 'Saudara kandung Rajawali — direncanakan untuk program pembibitan.',
  },

  // ── Record 3: Macan (Sapi Simmental, WS-03, menunggu verifikasi) ──────────
  {
    livestockId:       'LS-CWL-003',
    livestockName:     'Macan',
    species:           'Sapi',
    breed:             'Simmental',
    kelamin:           'Jantan',
    icon:              '🐄',
    typeBg:            '#fef3c7',
    typeColor:         '#b45309',
    birthDate:         '2023-05-02',
    birthDateEstimated: false,
    birthWeight:       '40 kg',
    birthLocation:     'Kandang Utama, Ternak Unggul Nusantara',
    currentWorkspaceId:   'WS-CWL-03',
    currentWorkspaceName: 'Ternak Unggul Nusantara',
    currentWorkspaceType: 'Peternakan',
    currentOwner:         'Ahmad Fauzi',
    father: {
      livestockId:        'LS-CWL-P03',
      livestockName:      'Harimau',
      species:            'Sapi',
      breed:              'Simmental',
      icon:               '🐄',
      typeBg:             '#fef3c7',
      workspaceId:        'WS-CWL-02',
      workspaceName:      'Farm Berkah Mandiri',
      isExternal:         true,
      verificationStatus: 'Menunggu Verifikasi',
    },
    mother: {
      livestockId:        'LS-CWL-P04',
      livestockName:      'Bunga',
      species:            'Sapi',
      breed:              'Simmental',
      icon:               '🐄',
      typeBg:             '#fef3c7',
      workspaceId:        'WS-CWL-03',
      workspaceName:      'Ternak Unggul Nusantara',
      isExternal:         false,
      verificationStatus: 'Belum Diverifikasi',
    },
    offspring: [],
    siblings: [],
    crossWorkspaceRefs: [
      {
        refId:               'XREF-003-A',
        sourceWorkspaceId:   'WS-CWL-03',
        sourceWorkspaceName: 'Ternak Unggul Nusantara',
        targetWorkspaceId:   'WS-CWL-02',
        targetWorkspaceName: 'Farm Berkah Mandiri',
        relationshipType:    'Ayah',
        livestockId:         'LS-CWL-P03',
        livestockName:       'Harimau',
        linkedDate:          '2023-05-03',
        verificationStatus:  'Menunggu Verifikasi',
        notes:               'Verifikasi tertunda — menunggu konfirmasi dari Farm Berkah Mandiri.',
      },
    ],
    verificationStatus: 'Menunggu Verifikasi',
    verificationDate:   null,
    verifiedBy:         null,
    timeline: [
      { id: 't3-1', date: '2023-05-02', event: 'Kelahiran tercatat',                actor: 'Ahmad Fauzi',  workspaceName: 'Ternak Unggul Nusantara', icon: '🐄', color: '#10b981' },
      { id: 't3-2', date: '2023-05-03', event: 'Permintaan verifikasi dikirim',     actor: 'Ahmad Fauzi',  workspaceName: 'Ternak Unggul Nusantara', icon: '📨', color: '#3b82f6' },
      { id: 't3-3', date: '2023-05-10', event: 'Menunggu konfirmasi WS-02',         actor: 'Sistem',       workspaceName: 'TernakHub Platform',      icon: '⏳', color: '#f59e0b' },
    ],
    registeredDate: '2023-05-02',
    notes: 'Verifikasi lintas-workspace sedang dalam proses.',
  },

  // ── Record 4: Kenanga (Kambing PE, WS-01, ayah tidak diketahui) ──────────
  {
    livestockId:       'LS-CWL-004',
    livestockName:     'Kenanga',
    species:           'Kambing',
    breed:             'Peranakan Ettawa (PE)',
    kelamin:           'Betina',
    icon:              '🐐',
    typeBg:            '#d1fae5',
    typeColor:         '#065f46',
    birthDate:         '2023-08-14',
    birthDateEstimated: true,
    birthWeight:       '3.2 kg',
    birthLocation:     'Kandang C, Peternakan Maju Jaya',
    currentWorkspaceId:   'WS-CWL-01',
    currentWorkspaceName: 'Peternakan Maju Jaya',
    currentWorkspaceType: 'Peternakan',
    currentOwner:         'Budi Santoso',
    father: {
      livestockId:        null,
      livestockName:      null,
      species:            'Kambing',
      breed:              'Tidak Diketahui',
      icon:               '❓',
      typeBg:             '#f1f5f9',
      workspaceId:        '',
      workspaceName:      '',
      isExternal:         false,
      verificationStatus: 'Belum Diverifikasi',
      isUnknown:          true,
    },
    mother: {
      livestockId:        'LS-CWL-P05',
      livestockName:      'Anggrek',
      species:            'Kambing',
      breed:              'Peranakan Ettawa (PE)',
      icon:               '🐐',
      typeBg:             '#d1fae5',
      workspaceId:        'WS-CWL-01',
      workspaceName:      'Peternakan Maju Jaya',
      isExternal:         false,
      verificationStatus: 'Belum Diverifikasi',
    },
    offspring: [],
    siblings: [],
    crossWorkspaceRefs: [],
    verificationStatus: 'Belum Diverifikasi',
    verificationDate:   null,
    verifiedBy:         null,
    timeline: [
      { id: 't4-1', date: '2023-08-14', event: 'Kelahiran tercatat (estimasi)',  actor: 'Budi Santoso', workspaceName: 'Peternakan Maju Jaya', icon: '🐐', color: '#10b981' },
      { id: 't4-2', date: '2023-08-14', event: 'Silsilah Ibu ditautkan',        actor: 'Budi Santoso', workspaceName: 'Peternakan Maju Jaya', icon: '🔗', color: '#3b82f6' },
      { id: 't4-3', date: '2023-08-20', event: 'Ayah tidak dapat diidentifikasi', actor: 'Budi Santoso', workspaceName: 'Peternakan Maju Jaya', icon: '❓', color: '#94a3b8' },
    ],
    registeredDate: '2023-08-14',
    notes: 'Silsilah ayah tidak diketahui — kemungkinan perkawinan liar.',
  },

  // ── Record 5: Perkasa (Sapi, WS-02, saudara tiri Rajawali) ───────────────
  {
    livestockId:       'LS-CWL-005',
    livestockName:     'Perkasa',
    species:           'Sapi',
    breed:             'Limousin',
    kelamin:           'Jantan',
    icon:              '🐄',
    typeBg:            '#fef3c7',
    typeColor:         '#b45309',
    birthDate:         '2023-02-11',
    birthDateEstimated: false,
    birthWeight:       '42 kg',
    birthLocation:     'Kandang Utama, Farm Berkah Mandiri',
    currentWorkspaceId:   'WS-CWL-02',
    currentWorkspaceName: 'Farm Berkah Mandiri',
    currentWorkspaceType: 'Peternakan',
    currentOwner:         'Siti Rahayu',
    father: {
      livestockId:        'LS-CWL-P01',
      livestockName:      'Garuda',
      species:            'Sapi',
      breed:              'Limousin',
      icon:               '🐄',
      typeBg:             '#fef3c7',
      workspaceId:        'WS-CWL-01',
      workspaceName:      'Peternakan Maju Jaya',
      isExternal:         true,
      verificationStatus: 'Terverifikasi',
    },
    mother: {
      livestockId:        'LS-CWL-P06',
      livestockName:      'Seruni',
      species:            'Sapi',
      breed:              'Brahman',
      icon:               '🐄',
      typeBg:             '#fef3c7',
      workspaceId:        'WS-CWL-02',
      workspaceName:      'Farm Berkah Mandiri',
      isExternal:         false,
      verificationStatus: 'Terverifikasi',
    },
    offspring: [],
    siblings: [
      {
        livestockId:   'LS-CWL-001',
        livestockName: 'Rajawali',
        species:       'Sapi',
        icon:          '🐄',
        typeBg:        '#fef3c7',
        workspaceId:   'WS-CWL-01',
        workspaceName: 'Peternakan Maju Jaya',
        isExternal:    true,
        siblingType:   'Saudara Tiri',
        sharedParent:  'Ayah',
      },
      {
        livestockId:   'LS-CWL-002',
        livestockName: 'Cempaka',
        species:       'Sapi',
        icon:          '🐄',
        typeBg:        '#fef3c7',
        workspaceId:   'WS-CWL-02',
        workspaceName: 'Farm Berkah Mandiri',
        isExternal:    false,
        siblingType:   'Saudara Tiri',
        sharedParent:  'Ayah',
      },
    ],
    crossWorkspaceRefs: [
      {
        refId:               'XREF-005-A',
        sourceWorkspaceId:   'WS-CWL-02',
        sourceWorkspaceName: 'Farm Berkah Mandiri',
        targetWorkspaceId:   'WS-CWL-01',
        targetWorkspaceName: 'Peternakan Maju Jaya',
        relationshipType:    'Ayah',
        livestockId:         'LS-CWL-P01',
        livestockName:       'Garuda',
        linkedDate:          '2023-02-11',
        verificationStatus:  'Terverifikasi',
        notes:               'Ayah Perkasa (Garuda) dikonfirmasi dari Peternakan Maju Jaya.',
      },
    ],
    verificationStatus: 'Terverifikasi',
    verificationDate:   '2023-02-20',
    verifiedBy:         'Platform Admin — TernakHub',
    timeline: [
      { id: 't5-1', date: '2023-02-11', event: 'Kelahiran tercatat',            actor: 'Siti Rahayu',    workspaceName: 'Farm Berkah Mandiri',  icon: '🐄', color: '#10b981' },
      { id: 't5-2', date: '2023-02-11', event: 'Referensi lintas-WS dibuat (Ayah)', actor: 'Budi Santoso', workspaceName: 'Peternakan Maju Jaya', icon: '🌐', color: '#8b5cf6' },
      { id: 't5-3', date: '2023-02-20', event: 'Silsilah diverifikasi',         actor: 'Platform Admin', workspaceName: 'TernakHub Platform',  icon: '✅', color: '#059669' },
    ],
    registeredDate: '2023-02-11',
    notes: 'Saudara tiri Rajawali — ayah yang sama, ibu berbeda.',
  },

  // ── Record 6: Melodi (Domba Merino, WS-03, menunggu) ─────────────────────
  {
    livestockId:       'LS-CWL-006',
    livestockName:     'Melodi',
    species:           'Domba',
    breed:             'Merino',
    kelamin:           'Betina',
    icon:              '🐑',
    typeBg:            '#ede9fe',
    typeColor:         '#5b21b6',
    birthDate:         '2023-11-05',
    birthDateEstimated: false,
    birthWeight:       '4.8 kg',
    birthLocation:     'Kandang B, Ternak Unggul Nusantara',
    currentWorkspaceId:   'WS-CWL-03',
    currentWorkspaceName: 'Ternak Unggul Nusantara',
    currentWorkspaceType: 'Peternakan',
    currentOwner:         'Ahmad Fauzi',
    father: {
      livestockId:        'LS-CWL-P07',
      livestockName:      'Sultan',
      species:            'Domba',
      breed:              'Merino',
      icon:               '🐑',
      typeBg:             '#ede9fe',
      workspaceId:        'WS-CWL-05',
      workspaceName:      'CV Berkah Ternak Makmur',
      isExternal:         true,
      verificationStatus: 'Menunggu Verifikasi',
    },
    mother: {
      livestockId:        null,
      livestockName:      null,
      species:            'Domba',
      breed:              'Tidak Diketahui',
      icon:               '❓',
      typeBg:             '#f1f5f9',
      workspaceId:        '',
      workspaceName:      '',
      isExternal:         false,
      verificationStatus: 'Belum Diverifikasi',
      isUnknown:          true,
    },
    offspring: [],
    siblings: [],
    crossWorkspaceRefs: [
      {
        refId:               'XREF-006-A',
        sourceWorkspaceId:   'WS-CWL-03',
        sourceWorkspaceName: 'Ternak Unggul Nusantara',
        targetWorkspaceId:   'WS-CWL-05',
        targetWorkspaceName: 'CV Berkah Ternak Makmur',
        relationshipType:    'Ayah',
        livestockId:         'LS-CWL-P07',
        livestockName:       'Sultan',
        linkedDate:          '2023-11-06',
        verificationStatus:  'Menunggu Verifikasi',
        notes:               'Verifikasi dari CV Berkah Ternak Makmur belum diterima.',
      },
    ],
    verificationStatus: 'Menunggu Verifikasi',
    verificationDate:   null,
    verifiedBy:         null,
    timeline: [
      { id: 't6-1', date: '2023-11-05', event: 'Kelahiran tercatat',              actor: 'Ahmad Fauzi', workspaceName: 'Ternak Unggul Nusantara', icon: '🐑', color: '#10b981' },
      { id: 't6-2', date: '2023-11-06', event: 'Permintaan verifikasi dikirim',   actor: 'Ahmad Fauzi', workspaceName: 'Ternak Unggul Nusantara', icon: '📨', color: '#3b82f6' },
      { id: 't6-3', date: '2023-11-15', event: 'Ibu tidak dapat diidentifikasi',  actor: 'Ahmad Fauzi', workspaceName: 'Ternak Unggul Nusantara', icon: '❓', color: '#94a3b8' },
    ],
    registeredDate: '2023-11-05',
    notes: 'Silsilah ibu tidak diketahui. Verifikasi ayah dalam proses.',
  },

  // ── Record 7: Agung (Sapi, WS-04 klinik, keturunan Rajawali) ────────────
  {
    livestockId:       'LS-CWL-007',
    livestockName:     'Agung',
    species:           'Sapi',
    breed:             'Limosin × Simmental',
    kelamin:           'Jantan',
    icon:              '🐄',
    typeBg:            '#fef3c7',
    typeColor:         '#b45309',
    birthDate:         '2024-09-10',
    birthDateEstimated: false,
    birthWeight:       '37 kg',
    birthLocation:     'Klinik Hewan Sehat Sentosa',
    currentWorkspaceId:   'WS-CWL-04',
    currentWorkspaceName: 'Klinik Hewan Sehat Sentosa',
    currentWorkspaceType: 'Klinik Hewan',
    currentOwner:         'Dr. Maya Dewi',
    father: {
      livestockId:        'LS-CWL-001',
      livestockName:      'Rajawali',
      species:            'Sapi',
      breed:              'Limosin × Simmental',
      icon:               '🐄',
      typeBg:             '#fef3c7',
      workspaceId:        'WS-CWL-01',
      workspaceName:      'Peternakan Maju Jaya',
      isExternal:         true,
      verificationStatus: 'Terverifikasi',
    },
    mother: {
      livestockId:        'LS-CWL-P08',
      livestockName:      'Dahlia',
      species:            'Sapi',
      breed:              'Angus',
      icon:               '🐄',
      typeBg:             '#fef3c7',
      workspaceId:        'WS-CWL-04',
      workspaceName:      'Klinik Hewan Sehat Sentosa',
      isExternal:         false,
      verificationStatus: 'Terverifikasi',
    },
    offspring: [],
    siblings: [],
    crossWorkspaceRefs: [
      {
        refId:               'XREF-007-A',
        sourceWorkspaceId:   'WS-CWL-04',
        sourceWorkspaceName: 'Klinik Hewan Sehat Sentosa',
        targetWorkspaceId:   'WS-CWL-01',
        targetWorkspaceName: 'Peternakan Maju Jaya',
        relationshipType:    'Ayah',
        livestockId:         'LS-CWL-001',
        livestockName:       'Rajawali',
        linkedDate:          '2024-09-12',
        verificationStatus:  'Terverifikasi',
        notes:               'Ayah Agung (Rajawali) dikonfirmasi dari Peternakan Maju Jaya.',
      },
    ],
    verificationStatus: 'Terverifikasi',
    verificationDate:   '2024-09-15',
    verifiedBy:         'Platform Admin — TernakHub',
    timeline: [
      { id: 't7-1', date: '2024-09-10', event: 'Kelahiran tercatat di klinik',    actor: 'Dr. Maya Dewi',  workspaceName: 'Klinik Hewan Sehat Sentosa', icon: '🐄', color: '#10b981' },
      { id: 't7-2', date: '2024-09-12', event: 'Referensi lintas-WS dibuat (Ayah)', actor: 'Budi Santoso', workspaceName: 'Peternakan Maju Jaya',       icon: '🌐', color: '#8b5cf6' },
      { id: 't7-3', date: '2024-09-15', event: 'Silsilah diverifikasi',           actor: 'Platform Admin', workspaceName: 'TernakHub Platform',         icon: '✅', color: '#059669' },
    ],
    registeredDate: '2024-09-10',
    notes: 'Lahir dan dirawat di klinik hewan. Catatan klinik tersinkronisasi.',
  },

  // ── Record 8: Sinar (Sapi, WS-01, keturunan Rajawali, belum verifikasi) ──
  {
    livestockId:       'LS-CWL-008',
    livestockName:     'Sinar',
    species:           'Sapi',
    breed:             'Limosin × Simmental',
    kelamin:           'Betina',
    icon:              '🐄',
    typeBg:            '#fef3c7',
    typeColor:         '#b45309',
    birthDate:         '2025-01-22',
    birthDateEstimated: false,
    birthWeight:       '34 kg',
    birthLocation:     'Kandang A, Peternakan Maju Jaya',
    currentWorkspaceId:   'WS-CWL-01',
    currentWorkspaceName: 'Peternakan Maju Jaya',
    currentWorkspaceType: 'Peternakan',
    currentOwner:         'Budi Santoso',
    father: {
      livestockId:        'LS-CWL-001',
      livestockName:      'Rajawali',
      species:            'Sapi',
      breed:              'Limosin × Simmental',
      icon:               '🐄',
      typeBg:             '#fef3c7',
      workspaceId:        'WS-CWL-01',
      workspaceName:      'Peternakan Maju Jaya',
      isExternal:         false,
      verificationStatus: 'Belum Diverifikasi',
    },
    mother: {
      livestockId:        'LS-CWL-P09',
      livestockName:      'Lestari',
      species:            'Sapi',
      breed:              'Simmental',
      icon:               '🐄',
      typeBg:             '#fef3c7',
      workspaceId:        'WS-CWL-01',
      workspaceName:      'Peternakan Maju Jaya',
      isExternal:         false,
      verificationStatus: 'Belum Diverifikasi',
    },
    offspring: [],
    siblings: [],
    crossWorkspaceRefs: [],
    verificationStatus: 'Belum Diverifikasi',
    verificationDate:   null,
    verifiedBy:         null,
    timeline: [
      { id: 't8-1', date: '2025-01-22', event: 'Kelahiran tercatat',     actor: 'Budi Santoso', workspaceName: 'Peternakan Maju Jaya', icon: '🐄', color: '#10b981' },
      { id: 't8-2', date: '2025-01-22', event: 'Silsilah Ayah ditautkan', actor: 'Budi Santoso', workspaceName: 'Peternakan Maju Jaya', icon: '🔗', color: '#3b82f6' },
    ],
    registeredDate: '2025-01-22',
    notes: 'Terdaftar baru — silsilah belum diverifikasi.',
  },

  // ── Record 9: Cemara (Kambing Kacang, WS-05, ditolak) ────────────────────
  {
    livestockId:       'LS-CWL-009',
    livestockName:     'Cemara',
    species:           'Kambing',
    breed:             'Kacang',
    kelamin:           'Betina',
    icon:              '🐐',
    typeBg:            '#d1fae5',
    typeColor:         '#065f46',
    birthDate:         '2023-06-30',
    birthDateEstimated: true,
    birthWeight:       '2.9 kg',
    birthLocation:     'Kandang Utama, CV Berkah Ternak Makmur',
    currentWorkspaceId:   'WS-CWL-05',
    currentWorkspaceName: 'CV Berkah Ternak Makmur',
    currentWorkspaceType: 'Peternakan',
    currentOwner:         'Eko Prasetyo',
    father: {
      livestockId:        'LS-CWL-P10',
      livestockName:      'Bajra',
      species:            'Kambing',
      breed:              'Kacang',
      icon:               '🐐',
      typeBg:             '#d1fae5',
      workspaceId:        'WS-CWL-03',
      workspaceName:      'Ternak Unggul Nusantara',
      isExternal:         true,
      verificationStatus: 'Ditolak',
    },
    mother: {
      livestockId:        'LS-CWL-P11',
      livestockName:      'Mawar',
      species:            'Kambing',
      breed:              'Kacang',
      icon:               '🐐',
      typeBg:             '#d1fae5',
      workspaceId:        'WS-CWL-05',
      workspaceName:      'CV Berkah Ternak Makmur',
      isExternal:         false,
      verificationStatus: 'Belum Diverifikasi',
    },
    offspring: [],
    siblings: [],
    crossWorkspaceRefs: [
      {
        refId:               'XREF-009-A',
        sourceWorkspaceId:   'WS-CWL-05',
        sourceWorkspaceName: 'CV Berkah Ternak Makmur',
        targetWorkspaceId:   'WS-CWL-03',
        targetWorkspaceName: 'Ternak Unggul Nusantara',
        relationshipType:    'Ayah',
        livestockId:         'LS-CWL-P10',
        livestockName:       'Bajra',
        linkedDate:          '2023-07-01',
        verificationStatus:  'Ditolak',
        notes:               'Ditolak — ID ternak tidak ditemukan di registri Ternak Unggul Nusantara.',
      },
    ],
    verificationStatus: 'Ditolak',
    verificationDate:   '2023-07-20',
    verifiedBy:         'Platform Admin — TernakHub',
    timeline: [
      { id: 't9-1', date: '2023-06-30', event: 'Kelahiran tercatat (estimasi)',  actor: 'Eko Prasetyo',   workspaceName: 'CV Berkah Ternak Makmur',  icon: '🐐', color: '#10b981' },
      { id: 't9-2', date: '2023-07-01', event: 'Permintaan verifikasi dikirim',  actor: 'Eko Prasetyo',   workspaceName: 'CV Berkah Ternak Makmur',  icon: '📨', color: '#3b82f6' },
      { id: 't9-3', date: '2023-07-20', event: 'Verifikasi DITOLAK',             actor: 'Platform Admin', workspaceName: 'TernakHub Platform',       icon: '❌', color: '#ef4444' },
    ],
    registeredDate: '2023-06-30',
    notes: 'ID ayah tidak valid — tidak ditemukan di workspace asal.',
  },

  // ── Record 10: Bintang (Sapi Simmental, WS-03) ────────────────────────────
  {
    livestockId:       'LS-CWL-010',
    livestockName:     'Bintang',
    species:           'Sapi',
    breed:             'Simmental',
    kelamin:           'Jantan',
    icon:              '🐄',
    typeBg:            '#fef3c7',
    typeColor:         '#b45309',
    birthDate:         '2024-04-18',
    birthDateEstimated: false,
    birthWeight:       '39 kg',
    birthLocation:     'Kandang A, Ternak Unggul Nusantara',
    currentWorkspaceId:   'WS-CWL-03',
    currentWorkspaceName: 'Ternak Unggul Nusantara',
    currentWorkspaceType: 'Peternakan',
    currentOwner:         'Ahmad Fauzi',
    father: {
      livestockId:        null,
      livestockName:      null,
      species:            'Sapi',
      breed:              'Tidak Diketahui',
      icon:               '❓',
      typeBg:             '#f1f5f9',
      workspaceId:        '',
      workspaceName:      '',
      isExternal:         false,
      verificationStatus: 'Belum Diverifikasi',
      isUnknown:          true,
    },
    mother: {
      livestockId:        'LS-CWL-P12',
      livestockName:      'Rossa',
      species:            'Sapi',
      breed:              'Simmental',
      icon:               '🐄',
      typeBg:             '#fef3c7',
      workspaceId:        'WS-CWL-02',
      workspaceName:      'Farm Berkah Mandiri',
      isExternal:         true,
      verificationStatus: 'Belum Diverifikasi',
    },
    offspring: [],
    siblings: [],
    crossWorkspaceRefs: [
      {
        refId:               'XREF-010-A',
        sourceWorkspaceId:   'WS-CWL-03',
        sourceWorkspaceName: 'Ternak Unggul Nusantara',
        targetWorkspaceId:   'WS-CWL-02',
        targetWorkspaceName: 'Farm Berkah Mandiri',
        relationshipType:    'Ibu',
        livestockId:         'LS-CWL-P12',
        livestockName:       'Rossa',
        linkedDate:          '2024-04-19',
        verificationStatus:  'Belum Diverifikasi',
        notes:               'Verifikasi dari Farm Berkah Mandiri belum dimulai.',
      },
    ],
    verificationStatus: 'Belum Diverifikasi',
    verificationDate:   null,
    verifiedBy:         null,
    timeline: [
      { id: 't10-1', date: '2024-04-18', event: 'Kelahiran tercatat',              actor: 'Ahmad Fauzi', workspaceName: 'Ternak Unggul Nusantara', icon: '🐄', color: '#10b981' },
      { id: 't10-2', date: '2024-04-19', event: 'Referensi lintas-WS dibuat (Ibu)',actor: 'Ahmad Fauzi', workspaceName: 'Ternak Unggul Nusantara', icon: '🌐', color: '#8b5cf6' },
    ],
    registeredDate: '2024-04-18',
    notes: 'Silsilah ayah tidak diketahui. Referensi ibu lintas-workspace belum dikonfirmasi.',
  },
];

// ─── Platform Stats ───────────────────────────────────────────────────────────

export const CWL_PLATFORM_STATS: CWLPlatformStats = {
  totalAnimals:         10,
  totalLineages:        10,
  crossWorkspaceRecords: 7,
  verifiedLineages:     3,
  pendingVerification:  2,
  rejectedLineages:     1,
  workspacesInvolved:   5,
  speciesBreakdown: {
    Sapi:    7,
    Kambing: 2,
    Domba:   1,
    Kerbau:  0,
    Babi:    0,
    Ayam:    0,
  },
};

// ─── Filter Function ──────────────────────────────────────────────────────────

export interface CWLFilterParams {
  livestockId?: string;
  livestockName?: string;
  workspace?: string;
  owner?: string;
  species?: CWLSpecies | 'All';
  breed?: string;
  verificationStatus?: CWLVerificationStatus | 'All';
  workspaceFilter?: string;
}

export function filterCWLLineage(
  records: CWLLineageRecord[],
  params: CWLFilterParams,
): CWLLineageRecord[] {
  return records.filter((r) => {
    if (params.livestockId && !r.livestockId.toLowerCase().includes(params.livestockId.toLowerCase())) return false;
    if (params.livestockName && !r.livestockName.toLowerCase().includes(params.livestockName.toLowerCase())) return false;
    if (params.workspace && !r.currentWorkspaceName.toLowerCase().includes(params.workspace.toLowerCase())) return false;
    if (params.owner && !r.currentOwner.toLowerCase().includes(params.owner.toLowerCase())) return false;
    if (params.species && params.species !== 'All' && r.species !== params.species) return false;
    if (params.breed && !r.breed.toLowerCase().includes(params.breed.toLowerCase())) return false;
    if (params.verificationStatus && params.verificationStatus !== 'All' && r.verificationStatus !== params.verificationStatus) return false;
    if (params.workspaceFilter && params.workspaceFilter !== 'All' && r.currentWorkspaceId !== params.workspaceFilter) return false;
    return true;
  });
}
