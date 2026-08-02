// ─── Detail Penyakit — Referensi Lengkap per Penyakit ────────────────────────
// SP-004: Detail Penyakit sebagai hub referensi penyakit lengkap.
// Setiap entri direlasikan ke PenyakitListItem (daftarPenyakitData.ts) via
// penyakitUuid. Field referensiObatId merujuk ke ObatItem.id di obatData.ts
// (Master Obat) — hanya relasi baca, TIDAK menduplikasi data obat.
//
// Catatan: tidak semua dari 84 penyakit di DAFTAR_PENYAKIT memiliki entri di
// sini. Halaman Detail Penyakit menampilkan status "Data Belum Tersedia" untuk
// penyakit tanpa entri, mengikuti pola dataLengkap yang sudah dipakai pada
// Master Obat/Master Pakan.

export interface PenyakitDetail {
  /** Relasi ke PenyakitListItem.uuid di daftarPenyakitData.ts */
  penyakitUuid: string;
  gejalaAwal: string[];
  gejalaLanjutan: string[];
  /** Komplikasi yang mungkin timbul jika tidak ditangani. Bisa kosong. */
  komplikasi: string[];
  penyebab: string;
  caraPenularan: string[];
  faktorRisiko: string[];
  /** Langkah-langkah penanganan, berurutan. */
  penanganan: string[];
  pencegahan: string[];
  /** Relasi ke ObatItem.id di obatData.ts (Master Obat). Bisa kosong bila tidak ada obat spesifik. */
  referensiObatId: string[];
  catatan?: string;
  /**
    * Relasi ke Supabase media via UUID.
   * Null = foto belum tersedia, tampilkan placeholder.
    * Tidak menyimpan URL gambar langsung — selalu baca via media repository.
   * Dirancang untuk ekspansi: Foto Utama → Galeri → Dokumen → PDF → Video.
   */
  media_uuid?: string | null;
}

const PENYAKIT_DETAIL_DB: PenyakitDetail[] = [

  // ══ PENYAKIT BAKTERI ══════════════════════════════════════════════════════
  {
    penyakitUuid: 'dp-bak-001', // Mastitis
    gejalaAwal: ['Ambing bengkak, panas, dan nyeri saat disentuh', 'Susu menggumpal atau berair encer'],
    gejalaLanjutan: ['Demam tinggi dan nafsu makan turun', 'Produksi susu menurun drastis', 'Ambing mengeras atau berwarna kebiruan (gangren)'],
    komplikasi: ['Mastitis gangrenosa', 'Sepsis', 'Kehilangan fungsi ambing permanen'],
    penyebab: 'Infeksi bakteri (Staphylococcus aureus, Streptococcus agalactiae, E. coli) yang masuk melalui saluran puting.',
    caraPenularan: ['Kontak alat pemerahan yang tidak steril', 'Luka atau lecet pada puting', 'Lingkungan kandang lembap dan kotor'],
    faktorRisiko: ['Higiene pemerahan buruk', 'Luka puting', 'Kondisi tubuh lemah pasca melahirkan'],
    penanganan: ['Isolasi hewan yang terinfeksi', 'Pemerahan manual rutin, buang susu yang terinfeksi', 'Terapi antibiotik intramammary/sistemik sesuai resep dokter hewan', 'Kompres hangat pada ambing', 'Pantau suhu tubuh secara berkala'],
    pencegahan: ['Sanitasi alat pemerahan sebelum dan sesudah digunakan', 'Dipping puting pasca pemerahan', 'Deteksi dini melalui uji California Mastitis Test (CMT)', 'Jaga kebersihan kandang dan alas tidur'],
    referensiObatId: ['cloxacillin', 'cefazolin', 'ampicillin'],
    media_uuid: 'gm-penyakit-mastitis-001',
  },
  {
    penyakitUuid: 'dp-bak-002', // Brucellosis
    gejalaAwal: ['Tidak ada gejala klinis yang jelas pada awal infeksi', 'Retensi plasenta ringan'],
    gejalaLanjutan: ['Aborsi pada trimester akhir kebuntingan', 'Orchitis dan epididimitis pada pejantan', 'Infertilitas'],
    komplikasi: ['Infertilitas permanen', 'Penularan zoonosis ke manusia (demam undulan)'],
    penyebab: 'Infeksi bakteri Brucella abortus.',
    caraPenularan: ['Kontak dengan sekresi reproduksi dan cairan aborsi', 'Konsumsi susu mentah terkontaminasi', 'Perkawinan alami dengan pejantan karier'],
    faktorRisiko: ['Kawanan tanpa program vaksinasi', 'Kontak dengan ternak baru tanpa karantina', 'Kepadatan kandang tinggi'],
    penanganan: ['Tidak ada pengobatan kuratif efektif — penyakit ini dilaporkan wajib (notifiable disease)', 'Isolasi dan uji serologi seluruh kawanan', 'Pemusnahan/pengeluaran hewan positif sesuai regulasi otoritas veteriner', 'Konsultasi dengan dinas peternakan/karantina setempat'],
    pencegahan: ['Vaksinasi rutin sesuai program pemerintah', 'Karantina ternak baru sebelum digabung ke kawanan', 'Uji serologi berkala', 'Penanganan APD saat menangani produk reproduksi/aborsi'],
    referensiObatId: ['vaksin-brucellosis', 'vaksin-brucellosis-s19'],
    catatan: 'Zoonosis — penanganan pada manusia yang terpapar harus melalui fasilitas kesehatan, bukan pengobatan mandiri pada ternak.',
  },
  {
    penyakitUuid: 'dp-bak-003', // Anthraks
    gejalaAwal: ['Demam tinggi mendadak', 'Gelisah dan sesak napas'],
    gejalaLanjutan: ['Kematian mendadak tanpa gejala klinis jelas', 'Keluarnya darah gelap tidak membeku dari lubang tubuh setelah kematian'],
    komplikasi: ['Kematian dalam hitungan jam', 'Penyebaran spora ke tanah yang bertahan puluhan tahun'],
    penyebab: 'Infeksi bakteri Bacillus anthracis yang membentuk spora tahan lama di tanah.',
    caraPenularan: ['Konsumsi/inhalasi spora dari tanah atau pakan terkontaminasi', 'Kontak dengan bangkai hewan terinfeksi'],
    faktorRisiko: ['Penggembalaan di area endemik/riwayat kasus lama', 'Kondisi tanah tergenang lalu kering setelah hujan'],
    penanganan: ['JANGAN membuka/membedah bangkai — segera laporkan ke dinas peternakan/karantina', 'Isolasi area dan larangan penggembalaan', 'Pemusnahan bangkai dengan pembakaran/penguburan dalam sesuai protokol resmi', 'Antibiotik hanya efektif jika diberikan pada fase sangat awal atas arahan dokter hewan'],
    pencegahan: ['Vaksinasi tahunan di area endemik', 'Hindari penggembalaan di lokasi dengan riwayat kasus', 'Laporkan segera kematian mendadak ke otoritas veteriner'],
    referensiObatId: ['vaksin-antraks'],
    catatan: 'Zoonosis berat dan penyakit wajib lapor — penanganan bangkai harus mengikuti protokol resmi, bukan dilakukan sendiri oleh peternak.',
  },
  {
    penyakitUuid: 'dp-bak-004', // Tuberkulosis
    gejalaAwal: ['Batuk kronis ringan', 'Penurunan berat badan bertahap'],
    gejalaLanjutan: ['Pembesaran kelenjar limfe', 'Sesak napas progresif', 'Kondisi tubuh sangat kurus (emasiasi)'],
    komplikasi: ['Penyebaran ke organ lain (TB milier)', 'Zoonosis pada manusia melalui susu/kontak dekat'],
    penyebab: 'Infeksi bakteri Mycobacterium bovis, bersifat kronis.',
    caraPenularan: ['Inhalasi droplet dari hewan terinfeksi', 'Konsumsi susu mentah terkontaminasi'],
    faktorRisiko: ['Kandang dengan ventilasi buruk dan kepadatan tinggi', 'Kontak dengan kawanan yang belum diuji TB'],
    penanganan: ['Tidak dianjurkan pengobatan — program pengendalian menggunakan uji tuberkulin (test-and-slaughter)', 'Isolasi hewan reaktor positif', 'Koordinasi dengan dinas peternakan untuk pemusnahan sesuai regulasi'],
    pencegahan: ['Uji tuberkulin rutin pada kawanan', 'Karantina dan uji ternak baru sebelum digabung', 'Ventilasi kandang yang baik'],
    referensiObatId: [],
    catatan: 'Zoonosis penting — pasteurisasi susu wajib di area dengan riwayat TB sapi.',
  },
  {
    penyakitUuid: 'dp-bak-005', // Salmonellosis
    gejalaAwal: ['Demam dan lemas', 'Nafsu makan turun'],
    gejalaLanjutan: ['Diare berdarah berbau busuk', 'Dehidrasi berat', 'Septicemia pada anak ternak'],
    komplikasi: ['Kematian pada anak ternak', 'Karier asimtomatik yang menyebarkan bakteri terus-menerus'],
    penyebab: 'Infeksi bakteri Salmonella spp.',
    caraPenularan: ['Konsumsi pakan/air terkontaminasi feses', 'Kontak langsung dengan hewan karier'],
    faktorRisiko: ['Sanitasi kandang buruk', 'Stres akibat transportasi/perubahan pakan mendadak', 'Anak ternak dengan imunitas rendah'],
    penanganan: ['Rehidrasi oral/intravena sesegera mungkin', 'Terapi antibiotik sesuai hasil uji sensitivitas', 'Isolasi hewan sakit dari kawanan', 'Disinfeksi kandang secara menyeluruh'],
    pencegahan: ['Sanitasi kandang dan sumber air rutin', 'Kolostrum cukup untuk anak ternak', 'Kontrol hama pembawa bakteri (tikus, burung)'],
    referensiObatId: ['trimethoprim-sulfa', 'enrofloxacin', 'elektrolit-oral-rehidrasi', 'ringer-laktat'],
  },
  {
    penyakitUuid: 'dp-bak-006', // Leptospirosis
    gejalaAwal: ['Demam dan lemas', 'Penurunan produksi susu mendadak'],
    gejalaLanjutan: ['Aborsi', 'Ikterus (kulit/selaput lendir menguning)', 'Hemoglobinuria (urin kemerahan) akibat anemia hemolitik'],
    komplikasi: ['Gagal ginjal', 'Kematian pada kasus berat'],
    penyebab: 'Infeksi bakteri Leptospira interrogans.',
    caraPenularan: ['Kontak dengan urin hewan terinfeksi', 'Air atau lingkungan tergenang yang terkontaminasi'],
    faktorRisiko: ['Kandang lembap/tergenang air', 'Keberadaan hewan pengerat pembawa bakteri'],
    penanganan: ['Terapi antibiotik golongan tetrasiklin/penisilin sesuai anjuran dokter hewan', 'Cairan infus untuk mendukung fungsi ginjal', 'Isolasi hewan sakit', 'Pantau fungsi ginjal dan hidrasi'],
    pencegahan: ['Kontrol populasi hewan pengerat', 'Perbaikan drainase kandang agar tidak tergenang', 'Vaksinasi pada area endemik'],
    referensiObatId: ['oxytetracycline', 'penicillin-g-procaine', 'ringer-laktat'],
    catatan: 'Zoonosis — gunakan sarung tangan saat kontak dengan urin/cairan tubuh hewan sakit.',
  },
  {
    penyakitUuid: 'dp-bak-007', // Listeriosis
    gejalaAwal: ['Demam ringan', 'Nafsu makan turun', 'Gerakan berputar (circling)'],
    gejalaLanjutan: ['Ensefalitis dengan kelumpuhan wajah sebelah', 'Aborsi', 'Septicemia pada anak ternak'],
    komplikasi: ['Kematian akibat gangguan saraf pusat berat'],
    penyebab: 'Infeksi bakteri Listeria monocytogenes.',
    caraPenularan: ['Konsumsi silase berkualitas buruk (pH tinggi)', 'Kontak dengan sekresi hewan terinfeksi'],
    faktorRisiko: ['Pemberian silase yang tidak difermentasi dengan baik', 'Cuaca dingin dan stres'],
    penanganan: ['Terapi antibiotik dosis tinggi sesegera mungkin (prognosis buruk jika terlambat)', 'Hentikan pemberian silase yang dicurigai', 'Perawatan suportif — cairan dan nutrisi', 'Isolasi hewan bergejala saraf'],
    pencegahan: ['Kontrol kualitas fermentasi silase (pH < 5)', 'Buang bagian silase yang berjamur/berbau busuk', 'Hindari kontaminasi tanah pada silase'],
    referensiObatId: ['penicillin-g-procaine', 'ampicillin'],
  },
  {
    penyakitUuid: 'dp-bak-008', // Pasteurellosis
    gejalaAwal: ['Demam tinggi mendadak', 'Depresi dan enggan bergerak'],
    gejalaLanjutan: ['Sesak napas berat', 'Bengkak pada leher dan dada (edema)', 'Kematian mendadak pada kasus akut'],
    komplikasi: ['Septicemia fatal dalam 24-48 jam', 'Kematian massal pada kawanan yang stres'],
    penyebab: 'Infeksi bakteri Pasteurella multocida, sering dipicu oleh stres.',
    caraPenularan: ['Droplet pernapasan antar hewan', 'Karier tanpa gejala yang aktif saat stres'],
    faktorRisiko: ['Transportasi jarak jauh', 'Perubahan cuaca ekstrem', 'Kepadatan kandang tinggi'],
    penanganan: ['Terapi antibiotik segera atas anjuran dokter hewan', 'Anti-inflamasi untuk meredakan demam dan nyeri', 'Kurangi stres — perbaiki ventilasi dan kepadatan kandang', 'Pantau hewan lain dalam kawanan untuk gejala serupa'],
    pencegahan: ['Vaksinasi sebelum musim stres tinggi (transportasi/pergantian cuaca)', 'Minimalkan stres saat penanganan dan transportasi'],
    referensiObatId: ['ceftiofur', 'oxytetracycline', 'flunixin-meglumine', 'vaksin-se'],
  },
  {
    penyakitUuid: 'dp-bak-009', // Kolibacillosis
    gejalaAwal: ['Diare cair kekuningan pada anak ternak baru lahir', 'Lemas dan enggan menyusu'],
    gejalaLanjutan: ['Dehidrasi berat', 'Septicemia', 'Kematian cepat jika tidak ditangani'],
    komplikasi: ['Kematian dalam 24-48 jam pada kasus berat', 'Gangguan pertumbuhan pada anak yang sembuh'],
    penyebab: 'Infeksi bakteri Escherichia coli enterotoksigenik.',
    caraPenularan: ['Kontak dengan feses terkontaminasi di lingkungan kandang beranak', 'Kolostrum tidak memadai'],
    faktorRisiko: ['Kolostrum tertunda/kurang', 'Sanitasi kandang beranak buruk', 'Cuaca dingin'],
    penanganan: ['Rehidrasi oral/intravena segera', 'Terapi antibiotik pada kasus septicemia sesuai anjuran dokter hewan', 'Jaga suhu tubuh anak ternak tetap hangat', 'Isolasi anak yang sakit dari kelompok'],
    pencegahan: ['Pastikan kolostrum diberikan dalam 6 jam pertama kelahiran', 'Sanitasi kandang beranak secara rutin', 'Vaksinasi induk pada kebuntingan akhir bila tersedia'],
    referensiObatId: ['gentamicin', 'neomycin', 'elektrolit-oral-rehidrasi', 'imunoglobulin-kolostrum'],
  },
  {
    penyakitUuid: 'dp-bak-010', // Clostridial Disease
    gejalaAwal: ['Depresi mendadak dan enggan bergerak', 'Pincang pada kasus blackleg (bengkak otot)'],
    gejalaLanjutan: ['Kematian mendadak tanpa gejala jelas', 'Bengkak berkrepitasi (berisi gas) pada otot'],
    komplikasi: ['Kematian dalam beberapa jam pada kebanyakan kasus'],
    penyebab: 'Infeksi berbagai spesies Clostridium (C. chauvoei, C. perfringens, C. tetani) yang menghasilkan toksin mematikan.',
    caraPenularan: ['Spora dari tanah masuk melalui luka atau saluran cerna', 'Tidak menular langsung antar hewan'],
    faktorRisiko: ['Luka terbuka tanpa perawatan', 'Padang rumput dengan riwayat kasus', 'Ternak tanpa vaksinasi clostridial'],
    penanganan: ['Sebagian besar kasus berakhir fatal sebelum sempat ditangani — fokus pada pencegahan', 'Bila terdeteksi dini, antibiotik dosis tinggi dan perawatan suportif atas anjuran dokter hewan', 'Laporkan kematian mendadak untuk konfirmasi diagnosis'],
    pencegahan: ['Vaksinasi clostridial (multivalen) rutin', 'Perawatan luka segera dan menyeluruh', 'Hindari penggembalaan di area berisiko tinggi'],
    referensiObatId: ['vaksin-tetanus-toksoid', 'vaksin-enterotoksemia', 'vaksin-blackleg', 'penicillin-g-procaine'],
  },
  {
    penyakitUuid: 'dp-bak-011', // Pneumonia Bakteri
    gejalaAwal: ['Batuk dan sekret hidung', 'Demam ringan hingga sedang'],
    gejalaLanjutan: ['Sesak napas berat dan napas cepat', 'Nafsu makan hilang', 'Suara paru abnormal (krepitasi)'],
    komplikasi: ['Pleuropneumonia', 'Abses paru kronis'],
    penyebab: 'Infeksi bakteri Mannheimia haemolytica, sering menyertai stres transportasi.',
    caraPenularan: ['Droplet pernapasan antar hewan', 'Bakteri komensal yang menjadi patogen saat imunitas turun'],
    faktorRisiko: ['Transportasi jarak jauh', 'Perubahan cuaca mendadak', 'Ventilasi kandang buruk'],
    penanganan: ['Terapi antibiotik sesuai anjuran dokter hewan', 'Anti-inflamasi/antipiretik untuk menurunkan demam', 'Perbaiki ventilasi dan kurangi kepadatan kandang', 'Istirahatkan hewan dari aktivitas berat'],
    pencegahan: ['Vaksinasi respirasi sebelum musim stres tinggi', 'Minimalkan stres transportasi', 'Ventilasi kandang yang baik'],
    referensiObatId: ['oxytetracycline', 'danofloxacin', 'flunixin-meglumine', 'bromhexine'],
  },
  {
    penyakitUuid: 'dp-bak-012', // Campilobakteriosis
    gejalaAwal: ['Tidak ada gejala klinis yang jelas pada infeksi awal'],
    gejalaLanjutan: ['Aborsi pada trimester pertengahan', 'Infertilitas dan kegagalan kebuntingan berulang'],
    komplikasi: ['Penurunan tingkat kebuntingan kawanan secara signifikan'],
    penyebab: 'Infeksi bakteri Campylobacter fetus.',
    caraPenularan: ['Perkawinan alami dengan pejantan karier', 'Inseminasi buatan dengan semen terkontaminasi'],
    faktorRisiko: ['Penggunaan pejantan tanpa uji kesehatan reproduksi', 'Kawanan tanpa program IB terkontrol'],
    penanganan: ['Terapi antibiotik pada pejantan karier atas anjuran dokter hewan', 'Istirahatkan pejantan dari perkawinan sampai dinyatakan bersih', 'Gunakan inseminasi buatan dengan semen bersertifikat'],
    pencegahan: ['Uji kesehatan reproduksi pejantan secara berkala', 'Utamakan inseminasi buatan dari sumber semen terverifikasi'],
    referensiObatId: ['streptomycin'],
  },

  // ══ PENYAKIT VIRUS ════════════════════════════════════════════════════════
  {
    penyakitUuid: 'dp-vir-001', // PMK
    gejalaAwal: ['Demam tinggi mendadak', 'Air liur berlebihan (hipersalivasi)'],
    gejalaLanjutan: ['Lepuhan/vesikel di mulut, lidah, dan sela kuku', 'Pincang berat', 'Produksi susu turun drastis'],
    komplikasi: ['Infeksi sekunder pada luka kuku', 'Kematian pada anak ternak akibat myocarditis'],
    penyebab: 'Infeksi virus Foot-and-Mouth Disease Virus (FMDV), sangat menular.',
    caraPenularan: ['Kontak langsung antar hewan', 'Melalui udara dalam jarak dekat', 'Alat, kendaraan, dan pakaian yang terkontaminasi'],
    faktorRisiko: ['Kawanan tanpa vaksinasi', 'Lalu lintas ternak antar daerah tanpa karantina'],
    penanganan: ['Isolasi ketat dan laporkan ke dinas peternakan (penyakit wajib lapor)', 'Perawatan suportif — cairan, pakan lunak, perawatan luka', 'Anti-inflamasi untuk meredakan demam dan nyeri', 'Disinfeksi kandang dan peralatan secara menyeluruh'],
    pencegahan: ['Vaksinasi PMK rutin sesuai program pemerintah', 'Karantina ternak baru', 'Biosekuriti ketat pada lalu lintas ternak dan kendaraan'],
    referensiObatId: ['vaksin-fmd', 'flunixin-meglumine', 'povidone-iodine'],
    catatan: 'Penyakit wajib lapor dengan dampak ekonomi dan perdagangan besar — koordinasi dengan otoritas veteriner adalah prioritas.',
  },
  {
    penyakitUuid: 'dp-vir-002', // Rabies
    gejalaAwal: ['Perubahan perilaku (gelisah/lesu tidak biasa)', 'Air liur berlebihan'],
    gejalaLanjutan: ['Agresivitas atau kelumpuhan progresif', 'Kesulitan menelan', 'Kematian dalam beberapa hari setelah gejala muncul'],
    komplikasi: ['Selalu fatal setelah gejala klinis muncul'],
    penyebab: 'Infeksi virus Rabies lyssavirus yang menyerang sistem saraf pusat.',
    caraPenularan: ['Gigitan hewan terinfeksi (anjing, kucing, hewan liar)', 'Kontak air liur dengan luka terbuka'],
    faktorRisiko: ['Area dengan riwayat rabies pada hewan liar/anjing', 'Ternak digembalakan bebas tanpa pengawasan'],
    penanganan: ['TIDAK ADA pengobatan setelah gejala muncul — eutanasia humanis diperlukan', 'Segera laporkan ke otoritas kesehatan hewan', 'Hewan/manusia yang tergigit harus mendapat penanganan medis segera'],
    pencegahan: ['Vaksinasi rabies pada hewan peliharaan di sekitar kandang', 'Hindari kontak dengan hewan liar', 'Laporkan gigitan hewan mencurigakan segera'],
    referensiObatId: [],
    catatan: 'Zoonosis fatal — segera cari pertolongan medis manusia jika tergigit hewan yang dicurigai rabies.',
  },
  {
    penyakitUuid: 'dp-vir-003', // IBR
    gejalaAwal: ['Demam dan sekret hidung', 'Batuk ringan'],
    gejalaLanjutan: ['Konjungtivitis', 'Aborsi', 'Lesi pustular pada saluran reproduksi (IPV)'],
    komplikasi: ['Infeksi laten yang aktif kembali saat stres', 'Infeksi sekunder bakteri pada paru'],
    penyebab: 'Infeksi Bovine Herpesvirus-1 (BHV-1).',
    caraPenularan: ['Droplet pernapasan', 'Kontak sekresi reproduksi saat perkawinan'],
    faktorRisiko: ['Stres akibat transportasi/penggabungan kawanan baru', 'Kepadatan kandang tinggi'],
    penanganan: ['Perawatan suportif — antipiretik dan cairan', 'Antibiotik untuk mencegah infeksi sekunder bakteri', 'Isolasi hewan bergejala dari kawanan'],
    pencegahan: ['Vaksinasi IBR rutin', 'Karantina ternak baru sebelum digabung', 'Minimalkan stres pada kawanan'],
    referensiObatId: ['vaksin-ibr', 'oxytetracycline'],
  },
  {
    penyakitUuid: 'dp-vir-004', // BVD
    gejalaAwal: ['Demam ringan dan diare', 'Sekret hidung dan mata'],
    gejalaLanjutan: ['Aborsi atau kelahiran anak dengan kelainan (PI carrier)', 'Imunosupresi yang memicu infeksi sekunder berat'],
    komplikasi: ['Mucosal Disease pada hewan PI (persistently infected) — hampir selalu fatal'],
    penyebab: 'Infeksi Bovine Viral Diarrhea Virus (BVDV), bersifat imunosupresif.',
    caraPenularan: ['Kontak langsung dengan hewan PI (sumber penyebar utama)', 'Cairan tubuh dan sekresi hewan terinfeksi'],
    faktorRisiko: ['Kawanan dengan hewan PI yang belum teridentifikasi', 'Tidak ada program uji BVD'],
    penanganan: ['Identifikasi dan keluarkan hewan PI dari kawanan (uji antigen/PCR)', 'Perawatan suportif untuk infeksi akut', 'Antibiotik untuk mencegah infeksi sekunder'],
    pencegahan: ['Vaksinasi BVD rutin', 'Uji dan eliminasi hewan PI dari kawanan', 'Karantina ternak baru sebelum digabung'],
    referensiObatId: ['vaksin-bvd'],
  },
  {
    penyakitUuid: 'dp-vir-005', // Jembrana Disease
    gejalaAwal: ['Demam tinggi mendadak (>40°C)', 'Pembesaran kelenjar limfe superfisial'],
    gejalaLanjutan: ['Pendarahan pada kulit dan mukosa', 'Diare berdarah', 'Kelemahan ekstrem'],
    komplikasi: ['Kematian hingga 17% pada kasus akut', 'Imunosupresi jangka panjang pada hewan yang sembuh'],
    penyebab: 'Infeksi Jembrana Disease Virus (Lentivirus), endemik pada sapi Bali.',
    caraPenularan: ['Vektor serangga penghisap darah', 'Kontak langsung dengan cairan tubuh hewan terinfeksi'],
    faktorRisiko: ['Populasi sapi Bali di area endemik Indonesia', 'Kepadatan kandang tinggi dan sanitasi buruk'],
    penanganan: ['Perawatan suportif — cairan, antipiretik, nutrisi tambahan', 'Antibiotik untuk mencegah infeksi sekunder', 'Isolasi hewan sakit dari kawanan'],
    pencegahan: ['Vaksinasi di area endemik sesuai program pemerintah', 'Kontrol vektor serangga', 'Karantina ternak yang berasal dari area endemik'],
    referensiObatId: ['flunixin-meglumine', 'oxytetracycline'],
  },
  {
    penyakitUuid: 'dp-vir-006', // LSD
    gejalaAwal: ['Demam tinggi', 'Nodul kulit multipel di seluruh tubuh'],
    gejalaLanjutan: ['Pembesaran kelenjar limfe', 'Edema kaki', 'Luka nodul yang pecah dan terinfeksi sekunder'],
    komplikasi: ['Kerusakan kulit permanen (jaringan parut)', 'Penurunan produksi susu jangka panjang'],
    penyebab: 'Infeksi Lumpy Skin Disease Virus (Capripoxvirus).',
    caraPenularan: ['Vektor serangga penghisap darah (lalat, nyamuk, caplak)', 'Kontak langsung dalam kasus tertentu'],
    faktorRisiko: ['Musim dengan populasi vektor tinggi', 'Kandang dekat area berair/lembap tempat vektor berkembang'],
    penanganan: ['Perawatan suportif dan antipiretik', 'Perawatan luka nodul yang pecah untuk mencegah infeksi sekunder', 'Antibiotik bila terjadi infeksi sekunder', 'Isolasi hewan bergejala'],
    pencegahan: ['Vaksinasi LSD sesuai anjuran otoritas veteriner', 'Kontrol vektor serangga di sekitar kandang', 'Karantina ternak baru'],
    referensiObatId: ['oxytetracycline', 'povidone-iodine'],
  },
  {
    penyakitUuid: 'dp-vir-007', // Bluetongue
    gejalaAwal: ['Demam dan lesu', 'Kemerahan pada mukosa mulut'],
    gejalaLanjutan: ['Lidah membiru (sianotik)', 'Luka pada mulut dan hidung', 'Pincang akibat laminitis'],
    komplikasi: ['Kematian pada domba yang rentan', 'Kelahiran anak dengan cacat saraf pada infeksi saat bunting'],
    penyebab: 'Infeksi Bluetongue Virus, ditularkan oleh serangga Culicoides (agas).',
    caraPenularan: ['Gigitan serangga Culicoides — tidak menular langsung antar hewan'],
    faktorRisiko: ['Musim dengan populasi Culicoides tinggi', 'Lahan basah/rawa di sekitar kandang'],
    penanganan: ['Perawatan suportif — cairan, antipiretik, pakan lunak', 'Anti-inflamasi untuk nyeri mulut dan kaki', 'Isolasi hewan bergejala dari area berisiko vektor'],
    pencegahan: ['Vaksinasi pada area endemik bila tersedia', 'Kontrol populasi Culicoides di sekitar kandang', 'Kandangkan ternak saat senja/malam (waktu aktif vektor)'],
    referensiObatId: ['flunixin-meglumine'],
  },
  {
    penyakitUuid: 'dp-vir-008', // PPR
    gejalaAwal: ['Demam tinggi mendadak', 'Sekret mata dan hidung'],
    gejalaLanjutan: ['Diare berdarah profus', 'Pneumonia', 'Luka mulut yang meluas'],
    komplikasi: ['Kematian 80-100% pada kawanan rentan tanpa vaksinasi'],
    penyebab: 'Infeksi Morbillivirus (PPR virus), sangat menular pada domba dan kambing.',
    caraPenularan: ['Kontak langsung dan droplet pernapasan', 'Sekresi hidung, mata, dan feses hewan terinfeksi'],
    faktorRisiko: ['Kawanan tanpa vaksinasi PPR', 'Pengumpulan ternak dari berbagai sumber (pasar hewan)'],
    penanganan: ['Isolasi ketat dan laporkan ke dinas peternakan', 'Perawatan suportif — cairan, antipiretik, nutrisi', 'Antibiotik untuk mencegah infeksi sekunder bakteri', 'Disinfeksi kandang menyeluruh'],
    pencegahan: ['Vaksinasi PPR sesuai program eradikasi nasional/global', 'Karantina ternak baru', 'Hindari pencampuran ternak dari sumber berbeda tanpa karantina'],
    referensiObatId: ['oxytetracycline', 'elektrolit-oral-rehidrasi'],
    catatan: 'Target program eradikasi global OIE/FAO — pelaporan wajib penting untuk pengendalian regional.',
  },
  {
    penyakitUuid: 'dp-vir-009', // ASF
    gejalaAwal: ['Demam sangat tinggi mendadak', 'Lesu ekstrem dan enggan bergerak'],
    gejalaLanjutan: ['Kulit kemerahan/kebiruan pada telinga, perut, dan kaki', 'Pendarahan internal', 'Kematian mendadak'],
    komplikasi: ['Angka kematian mendekati 100% tanpa vaksin/pengobatan'],
    penyebab: 'Infeksi Asfivirus (African Swine Fever Virus).',
    caraPenularan: ['Kontak langsung antar babi', 'Pakan sisa (swill feeding) yang terkontaminasi', 'Vektor caplak Ornithodoros pada beberapa wilayah'],
    faktorRisiko: ['Pemberian pakan sisa dapur/rumah makan tanpa pengolahan', 'Kandang tanpa biosekuriti ketat', 'Lalu lintas babi antar daerah tanpa karantina'],
    penanganan: ['TIDAK ADA vaksin atau pengobatan efektif — fokus pada pelaporan dan pemusnahan terkendali sesuai regulasi', 'Isolasi ketat kandang dan larangan lalu lintas babi', 'Koordinasi wajib dengan dinas peternakan/karantina'],
    pencegahan: ['Biosekuriti ketat — larangan pakan sisa mentah', 'Karantina babi baru', 'Disinfeksi kendaraan dan peralatan yang masuk-keluar kandang'],
    referensiObatId: [],
    catatan: 'Dampak ekonomi sangat besar pada industri babi — pelaporan dini adalah langkah paling penting.',
  },
  {
    penyakitUuid: 'dp-vir-010', // ND
    gejalaAwal: ['Gejala pernapasan dan saraf pada unggas — relevan bila ternak bersinggungan dengan kandang unggas'],
    gejalaLanjutan: ['Produksi telur turun drastis pada unggas', 'Gejala saraf (tortikolis) pada unggas'],
    komplikasi: ['Bukan penyakit utama pada ruminansia/ternak besar — relevansi terbatas pada sistem pertanian terpadu'],
    penyebab: 'Infeksi Avian Paramyxovirus-1, utamanya menyerang unggas.',
    caraPenularan: ['Kontak dengan unggas terinfeksi atau kotorannya'],
    faktorRisiko: ['Sistem pertanian terpadu ternak-unggas tanpa pemisahan kandang'],
    penanganan: ['Konsultasikan dengan dokter hewan unggas bila ditemukan gejala pada unggas di lingkungan peternakan', 'Pisahkan kandang ternak besar dari kandang unggas'],
    pencegahan: ['Pisahkan area kandang ternak besar dan unggas', 'Vaksinasi ND pada unggas sesuai program'],
    referensiObatId: ['vaksin-nd'],
    catatan: 'Dicatat sebagai referensi silang karena relevan pada sistem pertanian terpadu, bukan penyakit primer ternak besar.',
  },

  // ══ PENYAKIT PARASIT ══════════════════════════════════════════════════════
  {
    penyakitUuid: 'dp-par-001', // Fasciolosis
    gejalaAwal: ['Nafsu makan turun', 'Bulu kasar dan kusam'],
    gejalaLanjutan: ['Anemia dan edema submandibula (bottle jaw)', 'Penurunan berat badan progresif', 'Diare intermiten'],
    komplikasi: ['Kerusakan hati kronis (fibrosis)', 'Penurunan produktivitas jangka panjang'],
    penyebab: 'Infeksi cacing hati Fasciola hepatica/Fasciola gigantica.',
    caraPenularan: ['Konsumsi rumput/air yang mengandung larva metaserkaria', 'Siklus hidup melalui siput air sebagai inang antara'],
    faktorRisiko: ['Penggembalaan di lahan basah/rawa', 'Musim hujan dengan populasi siput tinggi'],
    penanganan: ['Pemberian obat cacing (flukisida) sesuai anjuran dokter hewan', 'Perbaikan nutrisi untuk mendukung pemulihan hati', 'Pantau kondisi tubuh dan anemia secara berkala'],
    pencegahan: ['Program pemberian obat cacing terjadwal (2-4 kali/tahun)', 'Hindari penggembalaan di lahan basah/berawa', 'Kontrol populasi siput sebagai inang antara'],
    referensiObatId: ['triclabendazole', 'albendazole', 'closantel'],
  },
  {
    penyakitUuid: 'dp-par-002', // Toxoplasmosis
    gejalaAwal: ['Umumnya tidak bergejala pada induk'],
    gejalaLanjutan: ['Aborsi pada trimester akhir kebuntingan', 'Kelahiran anak lemah atau mati'],
    komplikasi: ['Infertilitas berulang', 'Risiko zoonosis pada wanita hamil yang kontak dengan ternak'],
    penyebab: 'Infeksi protozoa Toxoplasma gondii.',
    caraPenularan: ['Konsumsi pakan/air terkontaminasi ookista dari feses kucing (inang definitif)'],
    faktorRisiko: ['Populasi kucing liar di sekitar gudang pakan', 'Pakan yang tidak tertutup rapat'],
    penanganan: ['Perawatan suportif pasca aborsi', 'Konsultasi dokter hewan untuk terapi pada kasus kebuntingan berikutnya', 'Isolasi dan pembuangan jaringan aborsi secara aman'],
    pencegahan: ['Cegah kucing mengakses gudang pakan dan area pakan ternak', 'Tutup rapat tempat penyimpanan pakan', 'Buang jaringan aborsi dengan aman, gunakan sarung tangan'],
    referensiObatId: [],
    catatan: 'Zoonosis penting — wanita hamil sebaiknya menghindari kontak langsung dengan jaringan aborsi/kotoran kucing.',
  },
  {
    penyakitUuid: 'dp-par-003', // Sarkoptik Mange
    gejalaAwal: ['Gatal hebat', 'Kerontokan bulu setempat'],
    gejalaLanjutan: ['Luka kulit menyebar dan menebal (hiperkeratosis)', 'Penurunan kondisi tubuh akibat gatal terus-menerus'],
    komplikasi: ['Infeksi bakteri sekunder pada kulit yang terluka'],
    penyebab: 'Infestasi tungau Sarcoptes scabiei.',
    caraPenularan: ['Kontak langsung antar ternak', 'Peralatan/alas kandang yang terkontaminasi tungau'],
    faktorRisiko: ['Kepadatan kandang tinggi', 'Kondisi tubuh lemah/imunitas rendah'],
    penanganan: ['Pemberian obat antiparasit topikal atau sistemik sesuai anjuran dokter hewan', 'Isolasi hewan terinfeksi dari kawanan', 'Disinfeksi kandang dan peralatan'],
    pencegahan: ['Karantina ternak baru sebelum digabung ke kawanan', 'Pemeriksaan kulit rutin', 'Sanitasi kandang dan alat perawatan'],
    referensiObatId: ['ivermectin', 'amitraz', 'doramectin'],
    catatan: 'Bersifat zoonosis ringan — gunakan sarung tangan saat menangani hewan terinfeksi.',
  },
  {
    penyakitUuid: 'dp-par-004', // Anaplasmosis
    gejalaAwal: ['Demam dan lesu', 'Nafsu makan menurun'],
    gejalaLanjutan: ['Anemia hemolitik berat', 'Ikterus (menguning)', 'Kelemahan ekstrem'],
    komplikasi: ['Kematian pada sapi dewasa tanpa proteksi imun'],
    penyebab: 'Infeksi Anaplasma marginale yang menyerang sel darah merah.',
    caraPenularan: ['Gigitan caplak', 'Transmisi mekanis melalui alat suntik/peralatan yang terkontaminasi darah'],
    faktorRisiko: ['Area dengan populasi caplak tinggi', 'Penggunaan alat suntik berulang tanpa sterilisasi'],
    penanganan: ['Terapi antibiotik golongan tetrasiklin sesuai anjuran dokter hewan', 'Transfusi darah pada kasus anemia berat', 'Kontrol caplak segera di sekitar kandang dan tubuh ternak'],
    pencegahan: ['Program kontrol caplak rutin (celup/semprot akarisida)', 'Sterilisasi alat suntik dan peralatan medis antar hewan', 'Vaksinasi pada area endemik bila tersedia'],
    referensiObatId: ['oxytetracycline', 'imidocarb'],
  },
  {
    penyakitUuid: 'dp-par-005', // Theileriosis
    gejalaAwal: ['Demam tinggi', 'Pembengkakan kelenjar limfe'],
    gejalaLanjutan: ['Anemia berat', 'Sesak napas', 'Diare'],
    komplikasi: ['Angka kematian sangat tinggi pada kawanan rentan tanpa proteksi'],
    penyebab: 'Infeksi protozoa Theileria parva/T. annulata.',
    caraPenularan: ['Gigitan caplak — tidak menular langsung antar hewan'],
    faktorRisiko: ['Area endemik dengan populasi caplak vektor tinggi', 'Ternak yang dipindahkan ke area endemik tanpa proteksi'],
    penanganan: ['Terapi antiprotozoa sesuai anjuran dokter hewan (dimulai secepat mungkin)', 'Perawatan suportif — transfusi/cairan pada anemia berat', 'Kontrol caplak intensif'],
    pencegahan: ['Program kontrol caplak berkelanjutan', 'Imunisasi infection-and-treatment pada area endemik bila tersedia', 'Karantina ternak yang dipindahkan dari/ke area endemik'],
    referensiObatId: ['diminazene', 'imidocarb'],
  },
  {
    penyakitUuid: 'dp-par-006', // Strongylosis
    gejalaAwal: ['Nafsu makan turun ringan', 'Bulu kusam'],
    gejalaLanjutan: ['Anemia dan edema submandibula (bottle jaw)', 'Diare dan penurunan berat badan drastis'],
    komplikasi: ['Kematian pada anak ternak akibat anemia berat'],
    penyebab: 'Infestasi cacing nematoda saluran cerna, terutama Haemonchus contortus.',
    caraPenularan: ['Konsumsi larva cacing pada rumput yang tercemar feses'],
    faktorRisiko: ['Penggembalaan padat tanpa rotasi lahan', 'Musim hujan dengan kelembapan tinggi'],
    penanganan: ['Pemberian obat cacing sesuai anjuran dokter hewan dan hasil uji resistensi', 'Perbaikan nutrisi untuk mendukung pemulihan', 'Pantau kadar hemoglobin/kondisi tubuh'],
    pencegahan: ['Rotasi lahan penggembalaan', 'Program deworming terjadwal berdasarkan pemantauan telur cacing (FEC)', 'Hindari penggembalaan berlebihan pada satu area'],
    referensiObatId: ['albendazole', 'levamisole', 'closantel', 'moxidectin'],
  },
  {
    penyakitUuid: 'dp-par-007', // Babesiosis
    gejalaAwal: ['Demam tinggi', 'Lesu dan nafsu makan turun'],
    gejalaLanjutan: ['Hemoglobinuria (urin kemerahan)', 'Anemia berat', 'Ikterus'],
    komplikasi: ['Kematian cepat bila tidak ditangani'],
    penyebab: 'Infeksi protozoa Babesia bovis/B. bigemina yang merusak sel darah merah.',
    caraPenularan: ['Gigitan caplak — tidak menular langsung antar hewan'],
    faktorRisiko: ['Area dengan populasi caplak tinggi', 'Ternak yang baru dipindahkan ke area endemik'],
    penanganan: ['Terapi antiprotozoa segera sesuai anjuran dokter hewan', 'Transfusi darah pada anemia sangat berat', 'Kontrol caplak intensif pada kandang dan tubuh ternak'],
    pencegahan: ['Program kontrol caplak rutin', 'Vaksinasi pada area endemik bila tersedia', 'Karantina ternak yang dipindahkan dari area bebas ke area endemik'],
    referensiObatId: ['diminazene', 'imidocarb'],
  },
  {
    penyakitUuid: 'dp-par-008', // Koksidiosis
    gejalaAwal: ['Diare ringan', 'Nafsu makan turun'],
    gejalaLanjutan: ['Diare berdarah', 'Dehidrasi', 'Penurunan berat badan drastis pada anak ternak'],
    komplikasi: ['Kematian pada anak ternak di bawah 6 bulan', 'Gangguan pertumbuhan jangka panjang pada yang sembuh'],
    penyebab: 'Infeksi protozoa Eimeria spp. pada saluran usus.',
    caraPenularan: ['Konsumsi ookista dari lingkungan/pakan/air terkontaminasi feses'],
    faktorRisiko: ['Kandang lembap dan padat', 'Anak ternak yang baru disapih/stres'],
    penanganan: ['Terapi antikoksidia sesuai anjuran dokter hewan', 'Rehidrasi oral pada kasus dehidrasi', 'Isolasi anak ternak yang bergejala dari kelompok'],
    pencegahan: ['Sanitasi kandang rutin, jaga alas kering', 'Hindari kepadatan kandang berlebihan', 'Pemberian koksidiostat preventif pada periode risiko tinggi'],
    referensiObatId: ['amprolium', 'toltrazuril', 'diclazuril', 'sulfaquinoxaline'],
  },

  // ══ PENYAKIT JAMUR ════════════════════════════════════════════════════════
  {
    penyakitUuid: 'dp-jam-001', // Ringworm
    gejalaAwal: ['Bercak kebotakan berbentuk bulat', 'Sisik keabuan pada kulit'],
    gejalaLanjutan: ['Lesi menyebar ke area kulit lain', 'Gatal ringan hingga sedang'],
    komplikasi: ['Infeksi sekunder bakteri pada kulit yang tergores'],
    penyebab: 'Infeksi jamur superfisial Trichophyton verrucosum.',
    caraPenularan: ['Kontak langsung antar ternak', 'Peralatan/tali kandang yang terkontaminasi spora'],
    faktorRisiko: ['Kandang lembap dan kurang cahaya matahari', 'Kepadatan kandang tinggi'],
    penanganan: ['Pemberian salep/obat antijamur topikal pada lesi', 'Isolasi hewan terinfeksi', 'Disinfeksi peralatan dan area kandang yang terkontaminasi'],
    pencegahan: ['Jaga kandang tetap kering dan cukup sinar matahari', 'Disinfeksi rutin peralatan grooming', 'Karantina ternak baru'],
    referensiObatId: ['salep-antijamur-topikal', 'gentian-violet'],
    catatan: 'Zoonosis ringan — gunakan sarung tangan saat menangani hewan terinfeksi.',
  },
  {
    penyakitUuid: 'dp-jam-002', // Aspergillosis
    gejalaAwal: ['Batuk dan sesak napas ringan', 'Nafsu makan turun'],
    gejalaLanjutan: ['Sesak napas berat', 'Aborsi mikotik pada hewan bunting'],
    komplikasi: ['Pneumonia jamur berat yang sulit disembuhkan'],
    penyebab: 'Infeksi jamur oportunistik Aspergillus fumigatus dari spora yang terhirup.',
    caraPenularan: ['Inhalasi spora dari pakan/bedding yang berjamur — tidak menular antar hewan'],
    faktorRisiko: ['Pakan atau jerami yang disimpan lembap dan berjamur', 'Imunitas rendah'],
    penanganan: ['Hentikan segera pemberian pakan/bedding yang berjamur', 'Terapi antijamur sistemik atas anjuran dokter hewan pada kasus berat', 'Perawatan suportif pernapasan'],
    pencegahan: ['Simpan pakan dan jerami di tempat kering dan berventilasi baik', 'Buang pakan yang berjamur atau berbau apek', 'Periksa kualitas bedding secara rutin'],
    referensiObatId: [],
  },
  {
    penyakitUuid: 'dp-jam-003', // Aktinomikosis
    gejalaAwal: ['Pembengkakan ringan pada rahang', 'Nafsu makan sedikit menurun'],
    gejalaLanjutan: ['Pembengkakan keras dan membesar pada rahang/tulang wajah', 'Kesulitan makan akibat pembengkakan'],
    komplikasi: ['Deformasi tulang wajah permanen jika tidak ditangani'],
    penyebab: 'Infeksi kronis Actinomyces bovis, sering dipicu luka pada mukosa mulut.',
    caraPenularan: ['Bakteri oportunistik masuk melalui luka mukosa mulut — tidak menular langsung antar hewan'],
    faktorRisiko: ['Pakan berserat kasar/tajam yang melukai mulut', 'Benda asing pada pakan'],
    penanganan: ['Terapi antibiotik jangka panjang sesuai anjuran dokter hewan', 'Drainase bedah pada abses jika diperlukan', 'Berikan pakan lunak selama masa pemulihan'],
    pencegahan: ['Periksa dan bersihkan pakan dari benda asing/tajam', 'Pemeriksaan rutin kondisi mulut ternak'],
    referensiObatId: ['penicillin-g-procaine', 'streptomycin'],
  },
  {
    penyakitUuid: 'dp-jam-004', // Kandidiasis
    gejalaAwal: ['Bercak putih pada mukosa mulut', 'Nafsu makan sedikit turun'],
    gejalaLanjutan: ['Lesi meluas ke saluran pencernaan atau ambing', 'Iritasi dan nyeri pada area terinfeksi'],
    komplikasi: ['Jarang berat, namun dapat memperpanjang masa pemulihan pasca terapi antibiotik'],
    penyebab: 'Infeksi jamur oportunistik Candida albicans, sering muncul setelah terapi antibiotik jangka panjang.',
    caraPenularan: ['Pertumbuhan berlebih flora normal akibat gangguan keseimbangan mikroba — tidak menular antar hewan'],
    faktorRisiko: ['Terapi antibiotik spektrum luas jangka panjang', 'Imunitas rendah'],
    penanganan: ['Hentikan/evaluasi ulang terapi antibiotik yang sedang berjalan bila memungkinkan', 'Terapi antijamur topikal pada lesi', 'Dukung pemulihan flora normal dengan probiotik'],
    pencegahan: ['Gunakan antibiotik hanya sesuai indikasi dan anjuran dokter hewan', 'Pemberian probiotik pendukung selama terapi antibiotik panjang'],
    referensiObatId: ['salep-antijamur-topikal', 'probiotik-ternak'],
  },
  {
    penyakitUuid: 'dp-jam-005', // Mikotoksikosis
    gejalaAwal: ['Nafsu makan turun', 'Produksi menurun tanpa sebab jelas'],
    gejalaLanjutan: ['Gangguan fungsi hati', 'Imunosupresi — mudah terserang penyakit lain'],
    komplikasi: ['Kerusakan hati kronis', 'Kontaminasi produk (susu/daging) oleh residu toksin'],
    penyebab: 'Konsumsi mikotoksin (aflatoksin, fumonisin) dari pakan berjamur.',
    caraPenularan: ['Konsumsi pakan yang terkontaminasi jamur penghasil toksin — tidak menular antar hewan'],
    faktorRisiko: ['Penyimpanan pakan lembap dan berjamur', 'Bahan pakan berkualitas rendah'],
    penanganan: ['Hentikan segera pakan yang dicurigai terkontaminasi', 'Pemberian adsorben toksin (mycotoxin binder) sesuai anjuran', 'Dukung fungsi hati dengan nutrisi tambahan'],
    pencegahan: ['Simpan pakan di tempat kering, gunakan dalam batas waktu penyimpanan aman', 'Uji kualitas pakan secara berkala', 'Gunakan bahan pakan dari sumber terpercaya'],
    referensiObatId: ['arang-aktif'],
  },

  // ══ GANGGUAN PENCERNAAN ═══════════════════════════════════════════════════
  {
    penyakitUuid: 'dp-penc-001', // Bloat
    gejalaAwal: ['Perut kiri membesar (distensi)', 'Gelisah dan tidak nyaman'],
    gejalaLanjutan: ['Sesak napas berat', 'Tidak mampu berdiri', 'Kematian dalam beberapa jam jika tidak ditangani'],
    komplikasi: ['Asfiksia akibat tekanan pada diafragma dan paru'],
    penyebab: 'Akumulasi gas berlebih di rumen akibat fermentasi cepat, sering setelah konsumsi leguminosa segar.',
    caraPenularan: ['Tidak menular — kondisi metabolik/pencernaan individu'],
    faktorRisiko: ['Konsumsi leguminosa segar berlebihan (alfalfa, clover)', 'Perubahan pakan mendadak'],
    penanganan: ['Segera keluarkan gas melalui trocar/stomach tube atas bantuan dokter hewan pada kasus berat', 'Pemberian anti-bloat/defoaming agent', 'Gerakkan hewan untuk membantu keluarnya gas', 'Hindari pemberian pakan hijauan basah sementara'],
    pencegahan: ['Perkenalkan leguminosa secara bertahap dalam ransum', 'Sediakan hijauan berserat kasar sebelum penggembalaan di padang leguminosa', 'Pemberian anti-bloat preventif pada musim risiko tinggi'],
    referensiObatId: ['dimethyl-sulfoxide'],
  },
  {
    penyakitUuid: 'dp-penc-002', // Diare Akut
    gejalaAwal: ['Feses cair', 'Nafsu makan menurun'],
    gejalaLanjutan: ['Dehidrasi', 'Gangguan elektrolit', 'Kelemahan progresif'],
    komplikasi: ['Kematian pada anak ternak akibat dehidrasi berat'],
    penyebab: 'Infeksi (bakteri/virus/parasit), perubahan pakan mendadak, atau stres.',
    caraPenularan: ['Bervariasi tergantung penyebab — infeksius menular melalui feses/pakan terkontaminasi'],
    faktorRisiko: ['Perubahan pakan mendadak', 'Sanitasi kandang buruk', 'Stres lingkungan'],
    penanganan: ['Rehidrasi oral/intravena segera', 'Identifikasi penyebab dasar dengan bantuan dokter hewan', 'Sesuaikan pakan sementara ke bentuk lebih mudah dicerna'],
    pencegahan: ['Perubahan pakan dilakukan secara bertahap', 'Sanitasi kandang dan sumber air rutin', 'Minimalkan stres transportasi/lingkungan'],
    referensiObatId: ['elektrolit-oral-rehidrasi', 'ringer-laktat', 'probiotik-ternak'],
  },
  {
    penyakitUuid: 'dp-penc-003', // Asidosis Rumen Akut
    gejalaAwal: ['Nafsu makan turun mendadak', 'Depresi dan lesu'],
    gejalaLanjutan: ['Atoni rumen (rumen berhenti bergerak)', 'Dehidrasi berat', 'Kolaps jika tidak ditangani'],
    komplikasi: ['Laminitis sekunder', 'Kematian pada kasus berat'],
    penyebab: 'Penurunan pH rumen akibat konsumsi karbohidrat mudah fermentasi (biji-bijian) secara berlebihan.',
    caraPenularan: ['Tidak menular — gangguan metabolik akibat pakan'],
    faktorRisiko: ['Akses tidak sengaja ke gudang pakan biji-bijian', 'Perubahan ransum konsentrat mendadak'],
    penanganan: ['Hentikan segera pemberian konsentrat', 'Netralisasi pH rumen dengan bikarbonat atas anjuran dokter hewan', 'Cairan infus untuk rehidrasi', 'Pada kasus berat, lavage rumen oleh dokter hewan'],
    pencegahan: ['Perkenalkan konsentrat secara bertahap', 'Kontrol akses ke gudang pakan biji-bijian', 'Sediakan hijauan berserat kasar dalam ransum harian'],
    referensiObatId: ['sodium-bikarbonat', 'ringer-laktat'],
  },
  {
    penyakitUuid: 'dp-penc-004', // Kolik
    gejalaAwal: ['Gelisah dan menendang perut', 'Berguling-guling'],
    gejalaLanjutan: ['Berkeringat berlebihan', 'Nafsu makan hilang total', 'Distensi abdomen'],
    komplikasi: ['Torsi/volvulus usus yang mengancam jiwa', 'Kematian bila tidak ditangani segera'],
    penyebab: 'Sumbatan, kejang, atau distensi usus; lebih umum pada kuda.',
    caraPenularan: ['Tidak menular — gangguan pencernaan individu'],
    faktorRisiko: ['Perubahan pakan mendadak', 'Kurang minum air', 'Konsumsi pasir/benda asing'],
    penanganan: ['Segera hubungi dokter hewan — kolik adalah kondisi darurat', 'Hindari memberi pakan sampai diperiksa', 'Jaga hewan tetap berdiri, hindari berguling berlebihan yang memperparah torsi', 'Anti-nyeri/spasmolitik sesuai anjuran dokter hewan'],
    pencegahan: ['Perubahan pakan dilakukan bertahap', 'Pastikan akses air bersih selalu tersedia', 'Program deworming rutin untuk cegah sumbatan parasit'],
    referensiObatId: ['flunixin-meglumine', 'dimethyl-sulfoxide'],
  },
  {
    penyakitUuid: 'dp-penc-005', // Enteritis
    gejalaAwal: ['Diare ringan', 'Nafsu makan turun'],
    gejalaLanjutan: ['Kolik dan diare berat', 'Dehidrasi progresif'],
    komplikasi: ['Sepsis pada kasus berat akibat kerusakan dinding usus'],
    penyebab: 'Peradangan usus halus akibat bakteri, virus, parasit, atau iritasi kimia pada pakan.',
    caraPenularan: ['Bervariasi — infeksius dapat menular melalui feses/pakan terkontaminasi'],
    faktorRisiko: ['Sanitasi kandang buruk', 'Pakan terkontaminasi bahan kimia/toksin'],
    penanganan: ['Rehidrasi segera', 'Identifikasi dan hilangkan sumber iritasi/infeksi dengan bantuan dokter hewan', 'Pemberian pakan lunak sementara'],
    pencegahan: ['Sanitasi kandang dan pakan rutin', 'Hindari kontaminasi bahan kimia pada area pakan'],
    referensiObatId: ['elektrolit-oral-rehidrasi', 'enrofloxacin'],
  },
  {
    penyakitUuid: 'dp-penc-006', // Displacement Abomasum
    gejalaAwal: ['Nafsu makan turun setelah melahirkan', 'Produksi susu menurun'],
    gejalaLanjutan: ['Distensi abdomen sisi kiri/kanan', 'Suara "ping" khas saat perkusi abdomen', 'Ketosis sekunder'],
    komplikasi: ['Torsi abomasum yang mengancam jiwa bila tidak dioperasi'],
    penyebab: 'Perpindahan posisi abomasum akibat rongga perut yang kosong pasca melahirkan.',
    caraPenularan: ['Tidak menular — kondisi anatomi pasca partus'],
    faktorRisiko: ['Periode transisi pasca melahirkan pada sapi perah', 'Ketosis atau asupan pakan rendah sebelum melahirkan'],
    penanganan: ['Konsultasi dokter hewan untuk koreksi bedah (reposisi abomasum)', 'Dukungan nutrisi dan cairan pasca operasi', 'Pantau fungsi pencernaan pasca tindakan'],
    pencegahan: ['Manajemen nutrisi periode transisi yang baik', 'Cegah asupan pakan rendah sebelum melahirkan', 'Deteksi dini ketosis pada periode awal laktasi'],
    referensiObatId: ['propilen-glikol', 'kalsium-propionat'],
  },
  {
    penyakitUuid: 'dp-penc-007', // Impaksi Rumen
    gejalaAwal: ['Nafsu makan turun', 'Rumen teraba keras/penuh'],
    gejalaLanjutan: ['Atoni rumen', 'Konstipasi', 'Dehidrasi'],
    komplikasi: ['Gangguan pencernaan kronis jika berulang'],
    penyebab: 'Sumbatan rumen oleh pakan kering/berserat tinggi, terutama saat kekurangan air minum.',
    caraPenularan: ['Tidak menular — gangguan pencernaan akibat manajemen pakan/air'],
    faktorRisiko: ['Akses air minum terbatas', 'Pakan kering berserat tinggi tanpa cukup air'],
    penanganan: ['Berikan akses air yang cukup segera', 'Cairan oral/infus untuk melunakkan isi rumen atas anjuran dokter hewan', 'Pada kasus berat, lavage rumen oleh dokter hewan'],
    pencegahan: ['Pastikan akses air bersih tersedia sepanjang waktu', 'Seimbangkan rasio pakan kering dan hijauan segar'],
    referensiObatId: ['ringer-laktat'],
  },

  // ══ GANGGUAN PERNAPASAN ═══════════════════════════════════════════════════
  {
    penyakitUuid: 'dp-nap-001', // Pneumonia
    gejalaAwal: ['Demam dan batuk', 'Sekret hidung'],
    gejalaLanjutan: ['Sesak napas berat', 'Nafsu makan hilang', 'Napas cepat dan dangkal'],
    komplikasi: ['Pleuropneumonia', 'Kematian pada sapi/domba muda bila terlambat ditangani'],
    penyebab: 'Infeksi bakteri, virus, atau kombinasi keduanya pada saluran pernapasan bawah.',
    caraPenularan: ['Droplet pernapasan antar hewan', 'Bakteri oportunistik saat imunitas turun'],
    faktorRisiko: ['Ventilasi kandang buruk', 'Kepadatan kandang tinggi', 'Stres transportasi/cuaca'],
    penanganan: ['Terapi antibiotik sesuai anjuran dokter hewan', 'Anti-inflamasi untuk demam dan nyeri dada', 'Perbaiki ventilasi kandang segera', 'Isolasi hewan sakit dari kawanan'],
    pencegahan: ['Vaksinasi respirasi rutin', 'Ventilasi kandang yang baik', 'Minimalkan stres transportasi'],
    referensiObatId: ['oxytetracycline', 'danofloxacin', 'flunixin-meglumine'],
  },
  {
    penyakitUuid: 'dp-nap-002', // BRSV
    gejalaAwal: ['Batuk dan demam ringan', 'Sekret hidung'],
    gejalaLanjutan: ['Bronkiolitis dan sesak napas berat', 'Emfisema paru pada kasus berat'],
    komplikasi: ['Infeksi sekunder bakteri yang memperparah kondisi'],
    penyebab: 'Infeksi Bovine orthopneumovirus (BRSV), sangat menular.',
    caraPenularan: ['Droplet pernapasan antar hewan, terutama pada anak sapi'],
    faktorRisiko: ['Kandang padat dengan anak sapi', 'Ventilasi buruk dan perubahan cuaca'],
    penanganan: ['Perawatan suportif — antipiretik dan bronkodilator', 'Antibiotik untuk mencegah infeksi sekunder', 'Perbaiki ventilasi kandang'],
    pencegahan: ['Vaksinasi BRSV pada program kesehatan anak sapi', 'Ventilasi kandang yang baik', 'Minimalkan kepadatan kandang anak sapi'],
    referensiObatId: ['bromhexine', 'oxytetracycline'],
  },
  {
    penyakitUuid: 'dp-nap-003', // Rhinitis
    gejalaAwal: ['Sekret hidung encer', 'Bersin ringan'],
    gejalaLanjutan: ['Sekret hidung mengental', 'Dapat berkembang menjadi infeksi pernapasan lebih serius'],
    komplikasi: ['Berkembang menjadi pneumonia bila tidak ditangani'],
    penyebab: 'Peradangan selaput lendir hidung, sering merupakan gejala awal infeksi pernapasan.',
    caraPenularan: ['Droplet pernapasan antar hewan'],
    faktorRisiko: ['Ventilasi kandang buruk', 'Perubahan cuaca mendadak'],
    penanganan: ['Perawatan suportif dan pantau perkembangan gejala', 'Dekongestan/ekspektoran sesuai anjuran dokter hewan', 'Isolasi bila gejala memburuk'],
    pencegahan: ['Ventilasi kandang yang baik', 'Vaksinasi respirasi rutin'],
    referensiObatId: ['nasal-decongestant-ternak', 'ekspektoran-ammonium-klorida'],
  },
  {
    penyakitUuid: 'dp-nap-004', // Pleuropneumonia
    gejalaAwal: ['Demam tinggi dan batuk berat', 'Nyeri saat bernapas'],
    gejalaLanjutan: ['Sesak napas berat', 'Efusi pleura (cairan di rongga dada)'],
    komplikasi: ['Gagal napas', 'Kematian pada kasus tidak ditangani'],
    penyebab: 'Infeksi berat yang melibatkan paru-paru dan pleura, sering merupakan komplikasi pneumonia bakteri.',
    caraPenularan: ['Droplet pernapasan antar hewan'],
    faktorRisiko: ['Pneumonia yang tidak ditangani tuntas', 'Stres dan imunitas rendah'],
    penanganan: ['Terapi antibiotik dosis tinggi segera atas anjuran dokter hewan', 'Drainase cairan pleura bila diperlukan oleh dokter hewan', 'Perawatan suportif intensif'],
    pencegahan: ['Tangani pneumonia secara tuntas sejak dini', 'Vaksinasi respirasi dan minimalkan stres kawanan'],
    referensiObatId: ['ceftiofur', 'flunixin-meglumine'],
  },
  {
    penyakitUuid: 'dp-nap-005', // Dictyocaulosis
    gejalaAwal: ['Batuk ringan', 'Napas sedikit cepat'],
    gejalaLanjutan: ['Batuk keras (husk) dan sesak napas berat', 'Penurunan berat badan'],
    komplikasi: ['Infeksi sekunder bakteri pada paru yang rusak'],
    penyebab: 'Infestasi cacing paru Dictyocaulus viviparus.',
    caraPenularan: ['Konsumsi larva cacing pada rumput tercemar feses'],
    faktorRisiko: ['Penggembalaan padat tanpa rotasi', 'Anak ternak yang baru digembalakan pertama kali'],
    penanganan: ['Pemberian obat cacing sesuai anjuran dokter hewan', 'Perawatan suportif pernapasan pada kasus berat', 'Pindahkan ke padang penggembalaan yang lebih bersih'],
    pencegahan: ['Rotasi lahan penggembalaan', 'Program deworming terjadwal', 'Vaksinasi cacing paru pada area endemik bila tersedia'],
    referensiObatId: ['albendazole', 'fenbendazole', 'levamisole'],
  },
  {
    penyakitUuid: 'dp-nap-006', // Emfisema Paru Atipik
    gejalaAwal: ['Napas cepat mendadak setelah pindah padang rumput'],
    gejalaLanjutan: ['Sesak napas berat', 'Napas mulut terbuka dan lidah menjulur'],
    komplikasi: ['Kematian mendadak pada kasus berat'],
    penyebab: 'Kondisi non-infeksius akibat metabolisme tryptophan pada rumput segar setelah periode kekurangan pakan.',
    caraPenularan: ['Tidak menular — reaksi metabolik individu terhadap pakan'],
    faktorRisiko: ['Perpindahan mendadak ke padang rumput segar setelah kekurangan pakan', 'Rumput muda dengan kandungan tryptophan tinggi'],
    penanganan: ['Segera hentikan akses ke padang rumput yang dicurigai', 'Perawatan suportif pernapasan atas anjuran dokter hewan', 'Istirahatkan hewan di area tenang dengan ventilasi baik'],
    pencegahan: ['Pindahkan ternak ke padang rumput segar secara bertahap', 'Beri pakan kering terlebih dahulu sebelum penggembalaan penuh'],
    referensiObatId: ['bronkodilator-clenbuterol'],
  },

  // ══ GANGGUAN REPRODUKSI ═══════════════════════════════════════════════════
  {
    penyakitUuid: 'dp-rep-001', // Retensi Plasenta
    gejalaAwal: ['Plasenta belum keluar >12-24 jam setelah melahirkan', 'Sekret vagina berbau tidak normal'],
    gejalaLanjutan: ['Demam dan depresi', 'Berkembang menjadi metritis'],
    komplikasi: ['Metritis akut', 'Infertilitas berkelanjutan'],
    penyebab: 'Kegagalan ekspulsi plasenta, sering terkait defisiensi selenium/vitamin E atau persalinan abnormal.',
    caraPenularan: ['Tidak menular — kondisi pasca persalinan individu'],
    faktorRisiko: ['Defisiensi selenium dan vitamin E', 'Distokia/persalinan sulit', 'Kebuntingan kembar'],
    penanganan: ['Konsultasi dokter hewan — jangan menarik plasenta secara manual paksa', 'Terapi hormonal/antibiotik sesuai anjuran bila terjadi infeksi', 'Pantau suhu tubuh dan tanda infeksi'],
    pencegahan: ['Suplementasi selenium dan vitamin E pada periode akhir kebuntingan', 'Manajemen persalinan yang baik untuk mencegah distokia'],
    referensiObatId: ['vitamin-e-selenium', 'oxytocin'],
  },
  {
    penyakitUuid: 'dp-rep-002', // Endometritis
    gejalaAwal: ['Sekret vagina abnormal', 'Siklus estrus terlambat kembali'],
    gejalaLanjutan: ['Infertilitas berkelanjutan', 'Sekret purulen berbau'],
    komplikasi: ['Kegagalan kebuntingan berulang'],
    penyebab: 'Peradangan endometrium, sering sebagai komplikasi retensi plasenta atau distokia.',
    caraPenularan: ['Tidak menular langsung — terkait komplikasi pasca partus'],
    faktorRisiko: ['Riwayat retensi plasenta/distokia', 'Sanitasi kandang beranak buruk'],
    penanganan: ['Terapi antibiotik intrauterin/sistemik sesuai anjuran dokter hewan', 'Terapi hormonal untuk mendukung involusi uterus', 'Pantau kondisi reproduksi secara berkala'],
    pencegahan: ['Sanitasi kandang beranak', 'Penanganan tepat pada retensi plasenta dan distokia'],
    referensiObatId: ['pgf2-alpha', 'oxytetracycline'],
  },
  {
    penyakitUuid: 'dp-rep-003', // Kista Ovarium
    gejalaAwal: ['Siklus estrus tidak teratur', 'Birahi berkepanjangan atau tidak muncul'],
    gejalaLanjutan: ['Anestrus berkepanjangan', 'Perubahan perilaku (seperti gejala jantan pada betina)'],
    komplikasi: ['Infertilitas jangka panjang bila tidak ditangani'],
    penyebab: 'Struktur folikular/luteal persisten pada ovarium akibat gangguan hormonal.',
    caraPenularan: ['Tidak menular — gangguan hormonal individu'],
    faktorRisiko: ['Produksi susu tinggi pasca melahirkan', 'Ketidakseimbangan energi negatif'],
    penanganan: ['Terapi hormonal (GnRH/prostaglandin) sesuai anjuran dokter hewan', 'Pemeriksaan ginekologi rutin untuk pemantauan', 'Perbaikan manajemen nutrisi pasca melahirkan'],
    pencegahan: ['Manajemen nutrisi periode transisi yang baik', 'Deteksi dini melalui pemeriksaan reproduksi rutin'],
    referensiObatId: ['gnrh-analog', 'cloprostenol'],
  },
  {
    penyakitUuid: 'dp-rep-004', // Distokia
    gejalaAwal: ['Proses melahirkan berlangsung lama tanpa progres', 'Induk terlihat lelah/mengejan tanpa hasil'],
    gejalaLanjutan: ['Anak terjebak pada posisi abnormal', 'Kelelahan ekstrem pada induk'],
    komplikasi: ['Kematian anak dan/atau induk bila tidak segera dibantu', 'Retensi plasenta dan endometritis pasca kejadian'],
    penyebab: 'Proses kelahiran abnormal/berkepanjangan akibat anak terlalu besar, posisi abnormal, atau panggul sempit.',
    caraPenularan: ['Tidak menular — kondisi mekanis persalinan'],
    faktorRisiko: ['Anak terlalu besar relatif terhadap induk', 'Posisi anak abnormal saat kelahiran', 'Induk pertama kali melahirkan (dara)'],
    penanganan: ['Segera panggil dokter hewan/tenaga terlatih bila tidak ada progres dalam waktu wajar', 'Reposisi manual anak bila memungkinkan dan aman', 'Bantuan tarikan terkendali atau tindakan bedah (sectio caesarea) bila diperlukan'],
    pencegahan: ['Pantau kondisi tubuh induk selama kebuntingan agar tidak berlebihan', 'Pilih pejantan dengan riwayat kelahiran mudah untuk induk dara', 'Pengawasan ketat menjelang waktu kelahiran'],
    referensiObatId: ['oxytocin', 'oxytocin-sintetik-partus'],
  },
  {
    penyakitUuid: 'dp-rep-005', // Anestrus
    gejalaAwal: ['Tidak menunjukkan tanda birahi pada waktu yang diharapkan'],
    gejalaLanjutan: ['Kegagalan bunting berkepanjangan', 'Kondisi tubuh menurun (bila terkait defisiensi nutrisi)'],
    komplikasi: ['Perpanjangan interval antar kelahiran secara signifikan'],
    penyebab: 'Ketidakmampuan menunjukkan birahi, sering akibat defisiensi nutrisi, kondisi tubuh rendah, atau gangguan hormonal pasca melahirkan.',
    caraPenularan: ['Tidak menular — gangguan fisiologis individu'],
    faktorRisiko: ['Kondisi tubuh (body condition score) rendah', 'Periode menyusui yang panjang', 'Defisiensi nutrisi'],
    penanganan: ['Evaluasi dan perbaiki status nutrisi', 'Terapi hormonal sinkronisasi birahi sesuai anjuran dokter hewan', 'Pemeriksaan ginekologi untuk menyingkirkan penyebab lain'],
    pencegahan: ['Manajemen nutrisi dan kondisi tubuh yang optimal', 'Program pemantauan birahi rutin'],
    referensiObatId: ['gnrh-analog', 'progesterone-cidr', 'estradiol-benzoate'],
  },
  {
    penyakitUuid: 'dp-rep-006', // Metritis Akut
    gejalaAwal: ['Demam dan depresi dalam 21 hari pasca melahirkan', 'Sekret uterus berbau busuk'],
    gejalaLanjutan: ['Nafsu makan hilang', 'Produksi susu turun drastis'],
    komplikasi: ['Septicemia', 'Infertilitas jangka panjang'],
    penyebab: 'Infeksi akut seluruh lapisan rahim pasca melahirkan.',
    caraPenularan: ['Tidak menular langsung — terkait komplikasi pasca partus/kontaminasi saat persalinan'],
    faktorRisiko: ['Distokia atau retensi plasenta', 'Sanitasi kandang beranak buruk'],
    penanganan: ['Terapi antibiotik sistemik segera sesuai anjuran dokter hewan', 'Cairan infus dan anti-inflamasi untuk demam', 'Terapi hormonal pendukung involusi uterus'],
    pencegahan: ['Sanitasi kandang beranak', 'Penanganan segera pada distokia dan retensi plasenta'],
    referensiObatId: ['oxytetracycline', 'ceftiofur', 'flunixin-meglumine'],
  },
  {
    penyakitUuid: 'dp-rep-007', // Prolaps Uterus
    gejalaAwal: ['Jaringan merah muncul dari vulva segera setelah melahirkan'],
    gejalaLanjutan: ['Jaringan uterus membesar dan berisiko terluka/terkontaminasi', 'Syok pada kasus berat'],
    komplikasi: ['Kematian akibat syok atau pendarahan bila tidak ditangani segera'],
    penyebab: 'Eversi dan prolaps rahim keluar dari vulva, umumnya segera setelah melahirkan.',
    caraPenularan: ['Tidak menular — komplikasi mekanis pasca persalinan'],
    faktorRisiko: ['Persalinan sulit/dibantu berlebihan', 'Hipokalsemia pasca melahirkan'],
    penanganan: ['KEADAAN DARURAT — segera hubungi dokter hewan', 'Jaga jaringan yang keluar tetap lembap dan bersih sambil menunggu bantuan', 'Reposisi uterus oleh dokter hewan dan terapi pendukung pasca tindakan'],
    pencegahan: ['Penanganan persalinan yang tepat dan tidak dipaksakan', 'Koreksi hipokalsemia sebelum dan setelah melahirkan'],
    referensiObatId: ['kalsium-borogluconate', 'oxytocin'],
  },
  {
    penyakitUuid: 'dp-rep-008', // Repeat Breeder
    gejalaAwal: ['Kembali birahi setelah inseminasi/perkawinan tanpa bunting'],
    gejalaLanjutan: ['Berulang gagal bunting tiga kali atau lebih'],
    komplikasi: ['Perpanjangan interval kelahiran dan penurunan efisiensi reproduksi kawanan'],
    penyebab: 'Multifaktorial — infeksi subklinis saluran reproduksi, ketidakseimbangan hormonal, atau faktor genetik.',
    caraPenularan: ['Tidak menular langsung — dapat terkait infeksi subklinis pada beberapa kasus'],
    faktorRisiko: ['Riwayat endometritis subklinis', 'Waktu inseminasi yang tidak tepat', 'Kualitas semen/pejantan rendah'],
    penanganan: ['Pemeriksaan ginekologi menyeluruh oleh dokter hewan untuk mencari penyebab', 'Terapi hormonal atau antibiotik sesuai temuan diagnosis', 'Evaluasi waktu dan teknik inseminasi'],
    pencegahan: ['Deteksi birahi yang akurat dan waktu inseminasi yang tepat', 'Pemeriksaan reproduksi rutin', 'Gunakan semen/pejantan berkualitas terverifikasi'],
    referensiObatId: ['gnrh-analog', 'hcg'],
  },

  // ══ GANGGUAN NUTRISI & METABOLIK ══════════════════════════════════════════
  {
    penyakitUuid: 'dp-nut-001', // Milk Fever
    gejalaAwal: ['Kelemahan otot ringan di sekitar waktu melahirkan', 'Nafsu makan turun'],
    gejalaLanjutan: ['Tidak mampu berdiri (down cow)', 'Suhu tubuh rendah dan denyut jantung lemah'],
    komplikasi: ['Kematian bila tidak ditangani dengan cepat'],
    penyebab: 'Penurunan kalsium darah (hipokalsemia) di sekitar waktu melahirkan.',
    caraPenularan: ['Tidak menular — gangguan metabolik individu'],
    faktorRisiko: ['Sapi perah produksi tinggi', 'Ransum tinggi kalsium menjelang melahirkan (mengurangi mobilisasi kalsium tubuh)'],
    penanganan: ['Pemberian kalsium intravena/subkutan segera atas anjuran dokter hewan', 'Pantau respons pemulihan (biasanya cepat setelah terapi kalsium)', 'Dukungan berdiri dengan bantuan jika perlu'],
    pencegahan: ['Manajemen ransum anion rendah (DCAD) pada periode pra-partus', 'Suplementasi kalsium preventif pada sapi berisiko tinggi'],
    referensiObatId: ['kalsium-borogluconate', 'vitamin-d3-tunggal'],
  },
  {
    penyakitUuid: 'dp-nut-002', // Ketosis
    gejalaAwal: ['Nafsu makan menurun selektif (menolak konsentrat)', 'Produksi susu sedikit turun'],
    gejalaLanjutan: ['Bau aseton pada napas/susu', 'Penurunan berat badan cepat', 'Gejala saraf pada kasus berat'],
    komplikasi: ['Displacement abomasum sekunder', 'Penurunan produksi jangka panjang'],
    penyebab: 'Defisit energi pada awal laktasi yang menyebabkan akumulasi badan keton.',
    caraPenularan: ['Tidak menular — gangguan metabolik individu'],
    faktorRisiko: ['Body condition score berlebihan sebelum melahirkan', 'Asupan pakan rendah pasca melahirkan'],
    penanganan: ['Pemberian propilen glikol/glukosa sesuai anjuran dokter hewan', 'Perbaiki manajemen pakan segera untuk tingkatkan energi', 'Pantau produksi susu dan berat badan'],
    pencegahan: ['Manajemen body condition score yang tepat sebelum melahirkan', 'Pastikan asupan energi cukup pada awal laktasi'],
    referensiObatId: ['propilen-glikol', 'kalsium-propionat', 'niasin-suplemen'],
  },
  {
    penyakitUuid: 'dp-nut-003', // White Muscle Disease
    gejalaAwal: ['Kelemahan ringan pada anak ternak', 'Kesulitan berdiri'],
    gejalaLanjutan: ['Kesulitan menyusu', 'Detak jantung tidak teratur', 'Kelumpuhan otot'],
    komplikasi: ['Kematian mendadak akibat gagal jantung pada kasus berat'],
    penyebab: 'Degenerasi otot akibat defisiensi selenium dan/atau vitamin E.',
    caraPenularan: ['Tidak menular — defisiensi nutrisi'],
    faktorRisiko: ['Tanah/pakan rendah selenium di area tertentu', 'Induk yang kurang suplementasi selama kebuntingan'],
    penanganan: ['Suplementasi selenium dan vitamin E segera atas anjuran dokter hewan', 'Perawatan suportif — bantu berdiri dan menyusu', 'Pantau fungsi jantung'],
    pencegahan: ['Suplementasi selenium dan vitamin E pada induk selama kebuntingan', 'Uji kadar selenium tanah/pakan di area berisiko'],
    referensiObatId: ['vitamin-e-selenium', 'vitamin-e-tunggal'],
  },
  {
    penyakitUuid: 'dp-nut-004', // Hipomagnesemia
    gejalaAwal: ['Gelisah dan hiperestesia (sensitif berlebihan)', 'Otot berkedut'],
    gejalaLanjutan: ['Kejang otot hebat', 'Kematian mendadak'],
    komplikasi: ['Kematian cepat tanpa peringatan bila tidak terdeteksi dini'],
    penyebab: 'Penurunan magnesium darah, sering terjadi pada ternak yang digembalakan di rumput muda saat cuaca dingin.',
    caraPenularan: ['Tidak menular — gangguan metabolik terkait pakan/cuaca'],
    faktorRisiko: ['Penggembalaan di rumput muda pada cuaca dingin/basah', 'Ransum rendah magnesium'],
    penanganan: ['Pemberian magnesium intravena/subkutan segera atas anjuran dokter hewan — kondisi darurat', 'Hindari penanganan kasar yang dapat memicu kejang fatal', 'Pindahkan dari padang rumput berisiko'],
    pencegahan: ['Suplementasi magnesium pada musim risiko tinggi', 'Sediakan hijauan berserat kasar sebagai pendamping rumput muda'],
    referensiObatId: ['magnesium-sulfate'],
  },
  {
    penyakitUuid: 'dp-nut-005', // Defisiensi Tembaga
    gejalaAwal: ['Bulu kasar dan warna pudar', 'Pertumbuhan lambat'],
    gejalaLanjutan: ['Anemia', 'Ataksia (penyakit ayun-ayun) pada anak ternak'],
    komplikasi: ['Gangguan pertumbuhan permanen pada kasus berat sejak usia dini'],
    penyebab: 'Kekurangan mineral tembaga dalam ransum atau akibat antagonis mineral (molibdenum/sulfur tinggi).',
    caraPenularan: ['Tidak menular — defisiensi nutrisi'],
    faktorRisiko: ['Tanah/pakan rendah tembaga atau tinggi molibdenum', 'Kurangnya suplementasi mineral'],
    penanganan: ['Suplementasi tembaga sesuai anjuran dokter hewan/nutrisionis', 'Evaluasi kadar mineral pakan dan tanah', 'Pantau pertumbuhan dan kondisi bulu'],
    pencegahan: ['Suplementasi mineral mix seimbang secara rutin', 'Uji kadar mineral tanah/pakan di area berisiko'],
    referensiObatId: ['copper-sulfate', 'mineral-mix-ternak'],
  },
  {
    penyakitUuid: 'dp-nut-006', // Defisiensi Fosfor
    gejalaAwal: ['Nafsu makan menurun', 'Pica (menjilat tanah/kayu/tulang)'],
    gejalaLanjutan: ['Gangguan reproduksi', 'Penurunan produksi susu', 'Kelemahan tulang (rakhitis pada anak)'],
    komplikasi: ['Gangguan pertumbuhan tulang permanen pada anak ternak'],
    penyebab: 'Kekurangan fosfor dalam ransum, sering bersamaan dengan defisiensi kalsium.',
    caraPenularan: ['Tidak menular — defisiensi nutrisi'],
    faktorRisiko: ['Ransum berbasis hijauan tua/kering tanpa suplementasi mineral', 'Tanah rendah fosfor'],
    penanganan: ['Suplementasi fosfor dan kalsium seimbang sesuai anjuran nutrisionis', 'Evaluasi dan perbaiki formulasi ransum'],
    pencegahan: ['Suplementasi mineral mix seimbang kalsium-fosfor', 'Uji kadar mineral pakan secara berkala'],
    referensiObatId: ['mineral-mix-ternak'],
  },
  {
    penyakitUuid: 'dp-nut-007', // PEM
    gejalaAwal: ['Kebutaan mendadak', 'Berjalan tidak terarah'],
    gejalaLanjutan: ['Opistotonus (kepala tertarik ke belakang)', 'Kejang berat'],
    komplikasi: ['Kematian bila tidak ditangani cepat', 'Gangguan neurologis permanen pada yang sembuh terlambat'],
    penyebab: 'Degenerasi otak akibat defisiensi thiamin (vitamin B1) atau keracunan sulfur.',
    caraPenularan: ['Tidak menular — gangguan metabolik/nutrisi'],
    faktorRisiko: ['Ransum tinggi sulfur/konsentrat berlebihan', 'Perubahan pakan mendadak ke konsentrat tinggi'],
    penanganan: ['Pemberian thiamin dosis tinggi segera atas anjuran dokter hewan — respons cepat penting untuk prognosis', 'Perawatan suportif saraf dan cairan', 'Evaluasi dan koreksi ransum'],
    pencegahan: ['Perkenalkan konsentrat secara bertahap', 'Batasi kadar sulfur dalam ransum dan air minum'],
    referensiObatId: ['vitamin-b-kompleks'],
  },
  {
    penyakitUuid: 'dp-nut-008', // Hipoglikemia Neonatal
    gejalaAwal: ['Lemas dan enggan menyusu pada anak ternak baru lahir'],
    gejalaLanjutan: ['Kelemahan ekstrem', 'Suhu tubuh rendah', 'Tidak mampu berdiri'],
    komplikasi: ['Kematian cepat bila tidak ditangani, terutama pada cuaca dingin'],
    penyebab: 'Penurunan gula darah pada anak ternak baru lahir akibat kekurangan kolostrum/energi.',
    caraPenularan: ['Tidak menular — kondisi metabolik individu'],
    faktorRisiko: ['Kolostrum tertunda atau tidak cukup', 'Cuaca dingin tanpa perlindungan memadai'],
    penanganan: ['Pemberian glukosa oral/intravena segera atas anjuran dokter hewan', 'Hangatkan tubuh anak ternak', 'Pastikan kolostrum/susu diberikan sesegera mungkin'],
    pencegahan: ['Pastikan kolostrum diberikan dalam 6 jam pertama kelahiran', 'Sediakan perlindungan dari cuaca dingin bagi anak ternak baru lahir'],
    referensiObatId: ['elektrolit-oral-rehidrasi'],
  },
  {
    penyakitUuid: 'dp-nut-009', // SARA
    gejalaAwal: ['Konsumsi pakan tidak stabil', 'Produksi susu sedikit turun tanpa sebab jelas'],
    gejalaLanjutan: ['Masalah kaki (laminitis subklinis)', 'Feses tidak konsisten (bervariasi kekentalannya)'],
    komplikasi: ['Kerusakan hati jangka panjang (abses hati)', 'Penurunan produktivitas kronis'],
    penyebab: 'Penurunan pH rumen kronis akibat ransum tinggi konsentrat yang sering tidak terdeteksi.',
    caraPenularan: ['Tidak menular — gangguan metabolik terkait manajemen pakan'],
    faktorRisiko: ['Ransum tinggi konsentrat dengan serat efektif rendah', 'Pemberian pakan tidak konsisten sepanjang hari'],
    penanganan: ['Evaluasi dan seimbangkan kembali rasio konsentrat-hijauan bersama nutrisionis/dokter hewan', 'Pemberian buffer rumen (sodium bikarbonat) sesuai anjuran', 'Pantau kondisi kaki dan konsistensi feses secara rutin'],
    pencegahan: ['Formulasi ransum dengan serat efektif cukup', 'Konsistensi waktu dan jumlah pemberian pakan harian'],
    referensiObatId: ['sodium-bikarbonat', 'toner-rumen-yeast-culture'],
  },

  // ══ GANGGUAN KULIT ════════════════════════════════════════════════════════
  {
    penyakitUuid: 'dp-kul-001', // Dermatitis
    gejalaAwal: ['Kemerahan dan gatal pada kulit', 'Area kontak lantai basah terlihat iritasi'],
    gejalaLanjutan: ['Eksudasi dan luka terbuka', 'Infeksi sekunder bila digaruk berlebihan'],
    komplikasi: ['Infeksi bakteri sekunder'],
    penyebab: 'Peradangan kulit akibat alergi, iritasi kimia, atau infeksi sekunder.',
    caraPenularan: ['Tidak menular — reaksi kulit individu, kecuali penyebab dasarnya infeksius'],
    faktorRisiko: ['Lantai kandang basah/kotor', 'Kontak dengan bahan kimia/iritan'],
    penanganan: ['Bersihkan dan keringkan area kulit yang terkena', 'Salep antiseptik/antiinflamasi topikal sesuai anjuran', 'Perbaiki kondisi lantai kandang segera'],
    pencegahan: ['Jaga lantai kandang kering dan bersih', 'Hindari kontak dengan bahan kimia iritan'],
    referensiObatId: ['salep-antipruritus', 'chlorhexidine'],
  },
  {
    penyakitUuid: 'dp-kul-002', // Foot Rot
    gejalaAwal: ['Pincang ringan', 'Bau tidak sedap dari sela kuku'],
    gejalaLanjutan: ['Pincang berat', 'Pembengkakan di atas kuku', 'Luka nekrotik berbau busuk'],
    komplikasi: ['Penyebaran infeksi ke jaringan lebih dalam (septic arthritis)'],
    penyebab: 'Infeksi bakteri anaerob Fusobacterium necrophorum di sela-sela kuku.',
    caraPenularan: ['Kontak dengan tanah/lumpur terkontaminasi bakteri melalui luka kecil pada kuku'],
    faktorRisiko: ['Kandang berlumpur dan kebersihan buruk', 'Kuku yang terluka/tidak terawat'],
    penanganan: ['Bersihkan dan rendam kuku dengan larutan antiseptik', 'Terapi antibiotik sistemik pada kasus berat sesuai anjuran dokter hewan', 'Isolasi hewan pincang dari area basah/berlumpur'],
    pencegahan: ['Perbaiki drainase kandang agar tidak berlumpur', 'Perawatan kuku rutin (trimming)', 'Footbath antiseptik berkala'],
    referensiObatId: ['salep-luka-kaki-footrot', 'oxytetracycline'],
  },
  {
    penyakitUuid: 'dp-kul-003', // Demodectic Mange
    gejalaAwal: ['Nodul kecil di bawah kulit', 'Tidak terlalu gatal'],
    gejalaLanjutan: ['Nodul membesar dan berisi nanah', 'Menyebar ke area kulit lain'],
    komplikasi: ['Infeksi bakteri sekunder pada nodul yang pecah'],
    penyebab: 'Infestasi tungau folikel rambut Demodex bovis.',
    caraPenularan: ['Kontak langsung antar ternak, terutama induk-anak'],
    faktorRisiko: ['Imunitas rendah', 'Kepadatan kandang tinggi'],
    penanganan: ['Terapi antiparasit topikal/sistemik sesuai anjuran dokter hewan', 'Pantau perkembangan nodul', 'Isolasi bila menyebar luas'],
    pencegahan: ['Pemeriksaan kulit rutin', 'Karantina ternak baru sebelum digabung ke kawanan'],
    referensiObatId: ['amitraz', 'ivermectin'],
  },
  {
    penyakitUuid: 'dp-kul-004', // Laminitis
    gejalaAwal: ['Pincang ringan', 'Enggan berjalan/berdiri lama'],
    gejalaLanjutan: ['Nyeri hebat pada kuku', 'Postur tubuh berubah untuk mengurangi beban pada kaki'],
    komplikasi: ['Deformasi kuku kronis', 'Penurunan produksi jangka panjang'],
    penyebab: 'Peradangan lamina sensitif kuku, sering komplikasi dari asidosis rumen atau ketosis.',
    caraPenularan: ['Tidak menular — gangguan metabolik/mekanis individu'],
    faktorRisiko: ['Riwayat asidosis rumen/SARA', 'Berdiri terlalu lama di lantai keras'],
    penanganan: ['Anti-inflamasi/analgesik sesuai anjuran dokter hewan', 'Perawatan kuku dan sediakan alas lunak', 'Evaluasi dan koreksi ransum penyebab dasar (asidosis)'],
    pencegahan: ['Formulasi ransum dengan serat efektif cukup untuk cegah asidosis', 'Sediakan alas kandang yang nyaman', 'Perawatan kuku rutin'],
    referensiObatId: ['meloxicam', 'ketoprofen'],
  },
  {
    penyakitUuid: 'dp-kul-005', // Digital Dermatitis
    gejalaAwal: ['Pincang ringan', 'Lesi merah kecil di atas kuku'],
    gejalaLanjutan: ['Lesi meluas seperti strawberry, sangat nyeri', 'Pincang berat'],
    komplikasi: ['Infeksi kronis berulang', 'Penurunan performa reproduksi akibat nyeri kronis'],
    penyebab: 'Infeksi bakteri Treponema spp. pada kulit di atas kuku.',
    caraPenularan: ['Sangat menular antar ternak melalui kontak lantai/lumpur terkontaminasi'],
    faktorRisiko: ['Lantai kandang basah dan kotor', 'Kepadatan kandang tinggi'],
    penanganan: ['Footbath antibiotik/antiseptik topikal sesuai anjuran dokter hewan', 'Perawatan luka individual pada kasus berat', 'Perbaiki kebersihan dan drainase lantai kandang'],
    pencegahan: ['Footbath rutin dengan larutan antiseptik', 'Perbaikan drainase dan kebersihan lantai kandang', 'Perawatan kuku berkala'],
    referensiObatId: ['salep-luka-kaki-footrot', 'quaternary-ammonium-teat-dip'],
  },
  {
    penyakitUuid: 'dp-kul-006', // Photosensitization
    gejalaAwal: ['Kemerahan pada kulit tak berpigmen setelah terpapar matahari'],
    gejalaLanjutan: ['Luka bakar dan pengelupasan kulit', 'Nyeri hebat pada area terkena'],
    komplikasi: ['Infeksi sekunder pada luka kulit', 'Kerusakan hati bila terkait hepatogenik'],
    penyebab: 'Reaksi kulit abnormal terhadap sinar matahari, dipicu konsumsi tanaman fotodinamik atau kerusakan hati.',
    caraPenularan: ['Tidak menular — reaksi individu terhadap tanaman/kondisi hati'],
    faktorRisiko: ['Konsumsi tanaman tertentu (mis. St. John\'s Wort)', 'Gangguan fungsi hati yang mendasari'],
    penanganan: ['Segera lindungi hewan dari paparan sinar matahari langsung', 'Perawatan luka kulit topikal', 'Evaluasi fungsi hati oleh dokter hewan bila dicurigai hepatogenik'],
    pencegahan: ['Identifikasi dan singkirkan tanaman fotodinamik dari padang penggembalaan', 'Sediakan area berlindung dari matahari (shade)'],
    referensiObatId: ['salep-antipruritus'],
  },

  // ══ KERACUNAN ═════════════════════════════════════════════════════════════
  {
    penyakitUuid: 'dp-ker-001', // Keracunan Tanaman Beracun
    gejalaAwal: ['Gejala bervariasi — mulai dari air liur berlebih hingga gangguan pencernaan'],
    gejalaLanjutan: ['Kejang, gangguan jantung, atau kematian mendadak tergantung jenis tanaman'],
    komplikasi: ['Kematian mendadak pada toksin dosis tinggi'],
    penyebab: 'Konsumsi tanaman yang mengandung alkaloid, glikosida, atau toksin lain.',
    caraPenularan: ['Tidak menular — akibat konsumsi langsung tanaman beracun'],
    faktorRisiko: ['Padang penggembalaan dengan tanaman beracun tidak teridentifikasi', 'Kelaparan yang memicu konsumsi tanaman tidak biasa'],
    penanganan: ['Segera hubungi dokter hewan dan identifikasi tanaman yang dikonsumsi', 'Pemberian adsorben (arang aktif) bila masih dalam fase awal', 'Perawatan suportif sesuai gejala yang muncul'],
    pencegahan: ['Identifikasi dan singkirkan tanaman beracun dari padang penggembalaan', 'Pastikan pakan cukup agar ternak tidak mencoba tanaman asing'],
    referensiObatId: ['arang-aktif'],
  },
  {
    penyakitUuid: 'dp-ker-002', // Keracunan Nitrat/Nitrit
    gejalaAwal: ['Lemas dan napas cepat', 'Selaput lendir kebiruan/coklat (sianosis)'],
    gejalaLanjutan: ['Sesak napas berat', 'Kolaps dan kematian pada dosis tinggi'],
    komplikasi: ['Kematian cepat akibat methemoglobinemia berat'],
    penyebab: 'Konsumsi berlebihan tanaman bernitrat tinggi yang diubah menjadi nitrit dalam rumen.',
    caraPenularan: ['Tidak menular — akibat konsumsi pakan bernitrat tinggi'],
    faktorRisiko: ['Jagung/sorghum muda yang dipupuk nitrogen berlebihan', 'Tanaman yang stres kekeringan'],
    penanganan: ['Segera hubungi dokter hewan — kondisi darurat', 'Terapi methylene blue intravena oleh dokter hewan', 'Hentikan segera pakan yang dicurigai'],
    pencegahan: ['Uji kadar nitrat pakan sebelum diberikan dalam jumlah besar', 'Hindari pemberian tanaman muda yang dipupuk nitrogen berlebihan'],
    referensiObatId: [],
  },
  {
    penyakitUuid: 'dp-ker-003', // Aflatoksikosis
    gejalaAwal: ['Nafsu makan turun', 'Produksi menurun bertahap'],
    gejalaLanjutan: ['Gangguan fungsi hati', 'Imunosupresi'],
    komplikasi: ['Kerusakan hati kronis', 'Kontaminasi susu/daging berbahaya bagi konsumen'],
    penyebab: 'Keracunan kronis akibat aflatoksin dari jamur Aspergillus pada pakan berjamur.',
    caraPenularan: ['Tidak menular — akibat konsumsi pakan terkontaminasi aflatoksin'],
    faktorRisiko: ['Penyimpanan pakan/biji-bijian lembap', 'Kualitas bahan pakan rendah'],
    penanganan: ['Hentikan segera pakan yang terkontaminasi', 'Pemberian adsorben mikotoksin sesuai anjuran', 'Dukung fungsi hati dengan nutrisi tambahan'],
    pencegahan: ['Simpan pakan/biji-bijian di tempat kering dan sesuai masa simpan', 'Uji kadar aflatoksin pakan secara berkala'],
    referensiObatId: ['arang-aktif'],
  },
  {
    penyakitUuid: 'dp-ker-004', // Keracunan Pestisida
    gejalaAwal: ['Hipersalivasi berlebihan', 'Gelisah dan tremor'],
    gejalaLanjutan: ['Kejang', 'Kesulitan bernapas', 'Kematian pada dosis tinggi'],
    komplikasi: ['Kematian cepat akibat gagal napas'],
    penyebab: 'Paparan insektisida organofosfat yang menghambat enzim asetilkolinesterase.',
    caraPenularan: ['Tidak menular — akibat paparan langsung pestisida'],
    faktorRisiko: ['Penyemprotan pestisida di dekat area pakan/kandang', 'Penyimpanan pestisida yang tidak aman'],
    penanganan: ['Segera hubungi dokter hewan — kondisi darurat', 'Terapi antidot (atropine) oleh dokter hewan', 'Cuci kulit/bulu bila kontak eksternal'],
    pencegahan: ['Simpan pestisida jauh dari area pakan dan kandang', 'Ikuti masa tunggu (interval) setelah penyemprotan sebelum penggembalaan'],
    referensiObatId: [],
  },
  {
    penyakitUuid: 'dp-ker-005', // Keracunan Timbal
    gejalaAwal: ['Kehilangan nafsu makan', 'Perubahan perilaku ringan'],
    gejalaLanjutan: ['Gangguan saraf (kebutaan, ataksia)', 'Kejang'],
    komplikasi: ['Kerusakan saraf permanen — bersifat kumulatif dan tidak sembuh sempurna'],
    penyebab: 'Menelan material yang mengandung timbal (aki bekas, cat lama, pipa).',
    caraPenularan: ['Tidak menular — akibat menelan material mengandung timbal'],
    faktorRisiko: ['Akses ke sampah/material bekas di area penggembalaan', 'Bangunan tua dengan cat berbahan timbal'],
    penanganan: ['Segera hubungi dokter hewan — kondisi darurat', 'Terapi khelasi oleh dokter hewan untuk mengikat timbal', 'Singkirkan sumber timbal dari lingkungan ternak'],
    pencegahan: ['Singkirkan material mengandung timbal dari area kandang/penggembalaan', 'Periksa lingkungan secara berkala untuk sampah berbahaya'],
    referensiObatId: [],
  },

  // ══ CEDERA & TRAUMA ═══════════════════════════════════════════════════════
  {
    penyakitUuid: 'dp-ced-001', // Fraktur
    gejalaAwal: ['Pincang mendadak setelah kejadian trauma', 'Enggan menopang berat badan pada kaki terkena'],
    gejalaLanjutan: ['Pembengkakan dan deformitas pada area fraktur', 'Nyeri hebat saat disentuh'],
    komplikasi: ['Infeksi tulang (osteomielitis) pada fraktur terbuka', 'Kelumpuhan permanen bila tidak ditangani tepat'],
    penyebab: 'Benturan keras, kecelakaan, atau tekanan berlebih pada tulang.',
    caraPenularan: ['Tidak menular — akibat trauma fisik'],
    faktorRisiko: ['Lantai kandang licin/tidak rata', 'Kepadatan kandang yang memicu benturan antar hewan'],
    penanganan: ['Imobilisasi area yang cedera dan hubungi dokter hewan segera', 'Pembidaian/gips sesuai lokasi dan derajat fraktur oleh dokter hewan', 'Anti-nyeri sesuai anjuran selama masa pemulihan'],
    pencegahan: ['Perbaiki lantai kandang agar tidak licin', 'Kurangi kepadatan kandang untuk cegah benturan antar hewan'],
    referensiObatId: ['meloxicam', 'flunixin-meglumine'],
  },
  {
    penyakitUuid: 'dp-ced-002', // Lacerasi
    gejalaAwal: ['Luka terbuka dengan tepi tidak rata', 'Pendarahan'],
    gejalaLanjutan: ['Infeksi luka bila tidak dibersihkan', 'Miasis (belatung) pada iklim tropis'],
    komplikasi: ['Tetanus pada luka dalam yang terkontaminasi tanah', 'Infeksi sistemik bila luka luas'],
    penyebab: 'Trauma akibat benda tajam atau benturan tumpul.',
    caraPenularan: ['Tidak menular — akibat trauma fisik'],
    faktorRisiko: ['Pagar/peralatan kandang yang rusak/berduri', 'Kandang tanpa pengawasan yang memadai'],
    penanganan: ['Bersihkan luka segera dengan antiseptik', 'Jahit luka bila diperlukan oleh dokter hewan', 'Pemberian antibiotik/anti-tetanus sesuai anjuran', 'Pantau tanda infeksi setiap hari'],
    pencegahan: ['Perbaiki dan periksa pagar/peralatan kandang secara berkala', 'Vaksinasi tetanus toksoid pada area berisiko'],
    referensiObatId: ['povidone-iodine', 'chlorhexidine', 'vaksin-tetanus-toksoid', 'semprot-luka-alumunium'],
  },
  {
    penyakitUuid: 'dp-ced-003', // Trauma Mata
    gejalaAwal: ['Mata berair dan setengah tertutup', 'Kemerahan pada mata'],
    gejalaLanjutan: ['Ulkus kornea', 'Uveitis (peradangan dalam mata)'],
    komplikasi: ['Kebutaan permanen bila tidak ditangani tepat waktu'],
    penyebab: 'Cedera pada bola mata akibat benda asing, goresan, atau benturan.',
    caraPenularan: ['Tidak menular — akibat trauma fisik'],
    faktorRisiko: ['Pakan berserat kasar/berduri di sekitar wajah', 'Kandang dengan benda tajam setinggi mata'],
    penanganan: ['Bersihkan area mata dan singkirkan benda asing dengan hati-hati', 'Salep mata antibiotik sesuai anjuran dokter hewan', 'Lindungi mata dari sinar matahari/debu selama pemulihan'],
    pencegahan: ['Singkirkan benda tajam/berduri dari area kandang', 'Periksa mata ternak secara rutin, terutama setelah penggembalaan'],
    referensiObatId: ['salep-mata-antibiotik'],
  },
  {
    penyakitUuid: 'dp-ced-004', // Dislokasi Sendi
    gejalaAwal: ['Pincang mendadak setelah trauma', 'Pembengkakan pada sendi yang terkena'],
    gejalaLanjutan: ['Ketidakmampuan menggunakan anggota gerak', 'Nyeri hebat pada perabaan sendi'],
    komplikasi: ['Kerusakan ligamen permanen bila tidak segera direposisi'],
    penyebab: 'Perpindahan posisi tulang dari sendi normal akibat trauma.',
    caraPenularan: ['Tidak menular — akibat trauma fisik'],
    faktorRisiko: ['Lantai licin', 'Aktivitas fisik berlebihan/perkelahian antar ternak'],
    penanganan: ['Hubungi dokter hewan untuk reposisi sendi', 'Imobilisasi sendi pasca reposisi', 'Anti-nyeri dan istirahat selama masa pemulihan'],
    pencegahan: ['Perbaiki lantai kandang agar tidak licin', 'Kurangi kepadatan kandang untuk cegah perkelahian'],
    referensiObatId: ['meloxicam', 'ketoprofen'],
  },

  // ══ LAINNYA ═══════════════════════════════════════════════════════════════
  {
    penyakitUuid: 'dp-lain-001', // Stres Termal
    gejalaAwal: ['Napas cepat dan terengah-engah', 'Konsumsi pakan menurun'],
    gejalaLanjutan: ['Produksi susu turun drastis', 'Penurunan fertilitas', 'Kolaps pada kasus berat (heat stroke)'],
    komplikasi: ['Kematian pada kasus heat stroke berat'],
    penyebab: 'Paparan suhu tinggi yang melebihi kemampuan tubuh untuk termoregulasi.',
    caraPenularan: ['Tidak menular — respons fisiologis terhadap lingkungan'],
    faktorRisiko: ['Kandang tanpa naungan/ventilasi memadai', 'Kelembapan tinggi disertai suhu panas'],
    penanganan: ['Sediakan naungan dan ventilasi/kipas segera', 'Pastikan akses air minum segar berlimpah', 'Pemberian elektrolit untuk mendukung hidrasi', 'Kurangi aktivitas fisik pada jam terpanas'],
    pencegahan: ['Perbaiki desain kandang untuk sirkulasi udara optimal', 'Sediakan naungan yang cukup di area penggembalaan', 'Jadwalkan aktivitas berat di luar jam terpanas'],
    referensiObatId: ['elektrolit-oral-rehidrasi', 'vitamin-c'],
  },
  {
    penyakitUuid: 'dp-lain-002', // Dehidrasi
    gejalaAwal: ['Mata cekung', 'Nafsu makan turun'],
    gejalaLanjutan: ['Turgor kulit menurun (kulit lambat kembali saat dicubit)', 'Depresi dan kelemahan'],
    komplikasi: ['Gagal ginjal akut pada dehidrasi berat berkepanjangan'],
    penyebab: 'Kekurangan cairan tubuh signifikan, sering sebagai komplikasi diare, muntah, atau paparan panas.',
    caraPenularan: ['Tidak menular — kondisi sekunder dari penyebab dasar'],
    faktorRisiko: ['Diare atau penyakit yang mendasari', 'Akses air minum terbatas', 'Cuaca panas'],
    penanganan: ['Rehidrasi oral/intravena segera sesuai derajat dehidrasi', 'Identifikasi dan tangani penyebab dasar', 'Pantau produksi urin dan kondisi umum'],
    pencegahan: ['Pastikan akses air bersih tersedia sepanjang waktu', 'Tangani penyebab dasar (diare, dll) sedini mungkin'],
    referensiObatId: ['elektrolit-oral-rehidrasi', 'ringer-laktat'],
  },
  {
    penyakitUuid: 'dp-lain-003', // Anemia
    gejalaAwal: ['Selaput lendir pucat', 'Kelemahan dan lesu'],
    gejalaLanjutan: ['Napas cepat saat beraktivitas', 'Penurunan berat badan progresif'],
    komplikasi: ['Gagal jantung pada anemia berat berkepanjangan'],
    penyebab: 'Penurunan hemoglobin/eritrosit akibat parasit (cacing, caplak), perdarahan kronis, defisiensi nutrisi, atau penyakit kronis.',
    caraPenularan: ['Tidak menular langsung — tergantung penyebab dasar (parasit dapat menular melalui vektor)'],
    faktorRisiko: ['Infestasi parasit berat (cacing/caplak)', 'Defisiensi zat besi/mineral'],
    penanganan: ['Identifikasi dan tangani penyebab dasar (deworming, kontrol caplak, dll)', 'Suplementasi zat besi/mineral sesuai anjuran', 'Transfusi darah pada kasus sangat berat'],
    pencegahan: ['Program deworming dan kontrol caplak rutin', 'Suplementasi mineral seimbang'],
    referensiObatId: ['albendazole', 'mineral-mix-ternak', 'vitamin-b-kompleks'],
  },
  {
    penyakitUuid: 'dp-lain-004', // Kelainan Kongenital
    gejalaAwal: ['Defek fisik terlihat sejak lahir', 'Kesulitan berdiri/menyusu sejak awal'],
    gejalaLanjutan: ['Gangguan fungsi organ tergantung jenis kelainan', 'Pertumbuhan terhambat'],
    komplikasi: ['Kematian dini pada kelainan berat yang tidak sesuai dengan kehidupan'],
    penyebab: 'Defek anatomi/fisiologis sejak lahir akibat faktor genetik, infeksi prenatal, atau defisiensi nutrisi induk saat kebuntingan.',
    caraPenularan: ['Tidak menular — kondisi bawaan sejak lahir'],
    faktorRisiko: ['Perkawinan sedarah (inbreeding)', 'Infeksi virus tertentu pada induk saat awal kebuntingan', 'Defisiensi nutrisi berat pada induk'],
    penanganan: ['Evaluasi oleh dokter hewan untuk menentukan prognosis dan kelayakan perawatan', 'Perawatan suportif sesuai jenis kelainan', 'Pertimbangan eutanasia humanis pada kelainan yang tidak sesuai dengan kehidupan'],
    pencegahan: ['Hindari perkawinan sedarah', 'Pastikan nutrisi induk tercukupi selama kebuntingan', 'Vaksinasi induk terhadap penyakit yang dapat menyebabkan kelainan janin'],
    referensiObatId: [],
  },

  // ── SP-005: Detail penyakit tambahan Kuda & Babi ────────────────────────
  // ── KUDA: Penyakit Virus ──
  {
    penyakitUuid: 'dp-vir-hb-1', // Equine Influenza
    gejalaAwal: ['Demam tinggi mendadak (39–41°C)', 'Batuk keras dan kering', 'Sekret hidung encer bilateral'],
    gejalaLanjutan: ['Sekret hidung mengental dan purulen', 'Lesu ekstrem dan nafsu makan hilang', 'Pembengkakan kelenjar limfe submandibula', 'Mialgea (nyeri otot) dan enggan bergerak'],
    komplikasi: ['Pneumonia sekunder bakteri', 'Myokarditis pada kasus berat', 'Pemulihan lambat dengan penurunan performa jangka panjang'],
    penyebab: 'Infeksi virus Influenza A subtipe H3N8 atau H7N7 yang menyerang epitel saluran pernapasan kuda.',
    caraPenularan: ['Droplet aerosol dari kuda terinfeksi dalam jarak dekat', 'Kontak dengan peralatan, tali kekang, atau alas kandang yang terkontaminasi', 'Manusia sebagai vektor mekanis antar kandang'],
    faktorRisiko: ['Kuda muda (di bawah 3 tahun) tanpa riwayat vaksinasi', 'Pengumpulan kuda dari berbagai sumber (perlombaan, pasar)', 'Stres transportasi dan perubahan cuaca ekstrem'],
    penanganan: ['Istirahatkan kuda penuh minimal 2–3 minggu bahkan setelah gejala hilang', 'Perawatan suportif — cairan, pakan berkualitas, dan lingkungan kering dan berventilasi baik', 'Anti-inflamasi/antipiretik untuk mengendalikan demam atas anjuran dokter hewan', 'Antibiotik hanya bila ada indikasi infeksi sekunder bakteri', 'Isolasi ketat dari kuda sehat selama masa infeksi'],
    pencegahan: ['Vaksinasi influenza kuda rutin setiap 6–12 bulan', 'Karantina kuda baru selama minimal 2 minggu sebelum digabung ke kawanan', 'Sanitasi kandang, peralatan, dan alat grooming secara rutin'],
    referensiObatId: ['flunixin-meglumine', 'phenylbutazone', 'oxytetracycline'],
  },
  {
    penyakitUuid: 'dp-vir-hb-2', // Equine Herpesvirus
    gejalaAwal: ['Demam bifasik (demam muncul dua kali)', 'Sekret hidung serosa', 'Depresi ringan'],
    gejalaLanjutan: ['Aborsi pada kuda betina bunting (biasanya tanpa tanda sebelumnya)', 'Kelumpuhan anggota gerak belakang progresif (EHM)', 'Inkontinensia urin dan feses pada kasus mielitis'],
    komplikasi: ['Kehilangan kebuntingan massal pada satu peternakan', 'Kelumpuhan permanen pada kasus EHM yang tidak ditangani dini'],
    penyebab: 'Infeksi Equid alphaherpesvirus 1 (EHV-1, menyebabkan aborsi dan EHM) atau EHV-4 (terutama pernapasan).',
    caraPenularan: ['Kontak langsung antar kuda melalui hidung-ke-hidung', 'Aerosol pernapasan', 'Virus dapat laten di ganglion trigeminal dan reaktivasi saat stres'],
    faktorRisiko: ['Stres transportasi, pergantian pemilik, atau perlombaan', 'Kuda betina bunting tanpa vaksinasi', 'Penggabungan kuda dari berbagai lokasi'],
    penanganan: ['Isolasi ketat segera saat gejala pertama muncul', 'Perawatan suportif — cairan, analgesik, dan fisioterapi pada kasus EHM', 'Antiviral (valacyclovir) atas anjuran dokter hewan spesialis kuda pada kasus EHM berat', 'Laporkan wabah aborsi ke otoritas veteriner setempat'],
    pencegahan: ['Vaksinasi EHV-1/4 rutin, terutama pada kuda betina bunting di bulan ke-5, 7, dan 9 kebuntingan', 'Karantina kuda baru dan kuda yang baru kembali dari acara kuda', 'Minimalisasi stres pada kawanan kuda'],
    referensiObatId: ['flunixin-meglumine', 'vitamin-e-selenium'],
    catatan: 'EHM (Equine Herpesvirus Myeloencephalopathy) merupakan kegawatan veteriner — hubungi dokter hewan segera bila muncul gejala saraf pada kuda.',
  },
  {
    penyakitUuid: 'dp-vir-hb-3', // Classical Swine Fever
    gejalaAwal: ['Demam tinggi (40–42°C) mendadak', 'Lesu ekstrem dan menggigil', 'Nafsu makan hilang total'],
    gejalaLanjutan: ['Pendarahan (petekie) pada kulit telinga, perut, dan kaki', 'Diare atau konstipasi, kemudian diare berdarah', 'Gejala saraf: sempoyongan dan kejang pada babi muda', 'Kematian massal dalam 1–2 minggu'],
    komplikasi: ['Kematian hampir seluruh kawanan yang rentan', 'Infeksi sekunder bakteri memperparah kondisi'],
    penyebab: 'Infeksi Classical Swine Fever Virus (Pestivirus A), sangat menular antar babi.',
    caraPenularan: ['Kontak langsung antar babi terinfeksi', 'Pemberian pakan sisa (swill) yang mengandung produk babi mentah', 'Peralatan, kendaraan, dan pakaian yang terkontaminasi'],
    faktorRisiko: ['Kawanan tanpa vaksinasi CSF', 'Pemberian pakan sisa rumah tangga/restoran tanpa pengolahan panas', 'Lalu lintas babi tanpa karantina dan tanpa kontrol biosekuriti'],
    penanganan: ['TIDAK ADA pengobatan spesifik — segera isolasi dan laporkan ke dinas peternakan (penyakit wajib lapor)', 'Pemusnahan kawanan terinfeksi sesuai protokol resmi otoritas veteriner', 'Disinfeksi total kandang, kendaraan, dan peralatan'],
    pencegahan: ['Vaksinasi CSF rutin sesuai program pemerintah di area endemik', 'Biosekuriti ketat — larang pakan sisa tanpa perebusan', 'Karantina babi baru minimal 3 minggu sebelum digabung ke kawanan'],
    referensiObatId: [],
    catatan: 'Penyakit wajib lapor — pelaporan dini ke otoritas veteriner adalah tindakan paling kritis untuk mencegah penyebaran lebih luas.',
  },
  {
    penyakitUuid: 'dp-vir-hb-4', // PRRS
    gejalaAwal: ['Demam ringan hingga sedang pada induk bunting', 'Napas cepat dan sesak pada anak babi', 'Nafsu makan turun pada babi dewasa'],
    gejalaLanjutan: ['Aborsi, lahir mati, dan lahir prematur pada induk', 'Kebiruan (sianosis) pada telinga induk pada kasus akut', 'Pneumonia berat pada anak babi yang baru lahir dan pascasapih', 'Kematian tinggi pada anak babi muda'],
    komplikasi: ['Imunosupresi yang memudahkan infeksi sekunder (PRDC — Porcine Respiratory Disease Complex)', 'Penurunan performa reproduksi kawanan jangka panjang'],
    penyebab: 'Infeksi PRRS Virus (Arterivirus), dengan galur NA (Amerika Utara) dan EU (Eropa) yang berbeda patogenisitasnya.',
    caraPenularan: ['Kontak langsung antar babi', 'Aerosol dalam jarak dekat hingga beberapa kilometer pada kondisi tertentu', 'Semen pejantan terinfeksi', 'Peralatan dan kendaraan yang terkontaminasi'],
    faktorRisiko: ['Peternakan babi intensif dengan kepadatan tinggi', 'Sistem produksi campuran umur (all-in all-out tidak diterapkan)', 'Pengenalan babi baru tanpa karantina dan uji serologi'],
    penanganan: ['Tidak ada pengobatan antiviral spesifik — manajemen penyakit berbasis biosekuriti dan vaksinasi', 'Antibiotik untuk mengendalikan infeksi sekunder bakteri atas anjuran dokter hewan', 'Tingkatkan manajemen kandang: ventilasi, sanitasi, dan densitas ternak', 'Isolasi babi bergejala dari kelompok produksi'],
    pencegahan: ['Vaksinasi PRRS pada kawanan positif PRRS sesuai rekomendasi dokter hewan', 'Biosekuriti ketat pada semua jalur masuk peternakan', 'Uji serologi pada babi baru sebelum digabung ke kawanan', 'Terapkan sistem all-in all-out per ruang produksi'],
    referensiObatId: ['oxytetracycline', 'danofloxacin', 'vitamin-e-selenium'],
    catatan: 'PRRS merupakan penyakit paling merugikan secara ekonomi di industri babi intensif global — manajemen preventif jauh lebih efektif dibanding pengendalian wabah.',
  },
  {
    penyakitUuid: 'dp-vir-hb-5', // Porcine Parvovirus
    gejalaAwal: ['Tidak ada gejala klinis pada induk yang terinfeksi pertama kali', 'Kegagalan kembali birahi (return to service) pada induk yang sudah dikawinkan'],
    gejalaLanjutan: ['Lahir mati, mumi fetus dengan berbagai ukuran dalam satu uterus', 'Anak babi yang lahir lemah dan tidak viable', 'Penurunan ukuran litter secara keseluruhan'],
    komplikasi: ['Penurunan performa reproduksi kawanan secara signifikan', 'Kombinasi dengan faktor lain dapat memperparah kegagalan reproduksi (SMEDI)'],
    penyebab: 'Infeksi Porcine parvovirus 1 yang menyerang fetus babi pada awal kebuntingan, menyebabkan kematian embrio.',
    caraPenularan: ['Kontak dengan feses, urin, atau sekret reproduksi babi terinfeksi', 'Lingkungan kandang yang terkontaminasi (virus sangat tahan di lingkungan)', 'Semen dari pejantan terinfeksi'],
    faktorRisiko: ['Induk babi dara (gilts) yang belum terekspos PPV sebelumnya', 'Kawanan tanpa program vaksinasi PPV', 'Peternakan dengan turnover induk tinggi dan sering memasukkan gilts baru'],
    penanganan: ['Tidak ada pengobatan spesifik — manajemen fokus pada pencegahan', 'Evaluasi program vaksinasi dan pastikan gilts divaksinasi sebelum perkawinan pertama', 'Pemeriksaan patologi fetus untuk konfirmasi diagnosis bersama dokter hewan'],
    pencegahan: ['Vaksinasi PPV pada semua gilts minimal 2 minggu sebelum perkawinan pertama', 'Vaksinasi booster pada induk yang sedang produksi sesuai jadwal', 'Higiene kandang beranak dan sanitasi ketat pada peralatan reproduksi'],
    referensiObatId: [],
  },
  {
    penyakitUuid: 'dp-vir-hb-6', // TGE
    gejalaAwal: ['Diare cair profus tiba-tiba pada semua kelompok umur', 'Muntah pada anak babi muda', 'Anoreksia dan depresi'],
    gejalaLanjutan: ['Dehidrasi berat dan cepat pada anak babi di bawah 2 minggu', 'Penurunan berat badan drastis pada babi dewasa', 'Kematian hampir 100% pada anak babi neonatal dalam 3–5 hari'],
    komplikasi: ['Kematian massal anak babi pada kawanan yang belum pernah terekspos', 'Penurunan produksi susu induk akibat dehidrasi'],
    penyebab: 'Infeksi Transmissible Gastroenteritis Virus (TGEV), coronavirus yang menghancurkan enterosit vili usus halus, menyebabkan malabsorpsi parah.',
    caraPenularan: ['Kontak langsung antar babi melalui feses', 'Pakan atau air yang terkontaminasi feses babi terinfeksi', 'Manusia, peralatan, dan hewan lain sebagai vektor mekanis'],
    faktorRisiko: ['Kawanan naif tanpa imunitas terhadap TGE', 'Musim dingin (puncak kejadian TGE secara historis)', 'Biosekuriti kandang yang lemah'],
    penanganan: ['Rehidrasi oral agresif pada anak babi yang masih bisa menyusu', 'Cairan elektrolit intravena atau intraperitoneal untuk anak babi berat atas anjuran dokter hewan', 'Jaga kehangatan anak babi untuk mengurangi mortalitas', 'Antibiotik untuk mencegah infeksi bakteri sekunder'],
    pencegahan: ['Vaksinasi induk untuk memberikan imunitas pasif melalui kolostrum pada anak babi', 'Biosekuriti ketat — pembatasan akses ke kandang beranak', 'Sanitasi dan disinfeksi kandang menyeluruh setelah wabah'],
    referensiObatId: ['elektrolit-oral-rehidrasi', 'ringer-laktat', 'imunoglobulin-kolostrum'],
  },
  // ── KUDA: Penyakit Bakteri ──
  {
    penyakitUuid: 'dp-bak-hb-1', // Strangles
    gejalaAwal: ['Demam (39–40°C) dan lesu', 'Nafsu makan turun', 'Sekret hidung serosa bilateral'],
    gejalaLanjutan: ['Sekret hidung mengental dan purulen', 'Pembengkakan kelenjar limfe submandibula dan retrofaringeal', 'Abses kelenjar limfe yang matang dan pecah spontan', 'Kesulitan menelan akibat pembengkakan tenggorok'],
    komplikasi: ['Bastard strangles — penyebaran abses ke organ internal (paru, hati, otak)', 'Purpura hemorrhagika — vaskulitis imuno-mediata pasca infeksi', 'Kuda karier asimtomatik yang terus menyebarkan bakteri'],
    penyebab: 'Infeksi bakteri Streptococcus equi subsp. equi yang sangat menular di antara kuda.',
    caraPenularan: ['Kontak langsung antar kuda', 'Kontaminasi tempat makan/minum bersama', 'Kuda karier asimtomatik sebagai sumber utama penularan tersembunyi'],
    faktorRisiko: ['Kuda muda di bawah 5 tahun tanpa kekebalan', 'Pengumpulan kuda dari berbagai sumber (perlombaan, lelang)', 'Stres transportasi dan perubahan kelompok'],
    penanganan: ['Isolasi ketat kuda bergejala — jangan paksakan pecahnya abses sebelum matang', 'Kompres hangat untuk mempercepat pematangan abses', 'Antibiotik (penisilin) hanya atas arahan dokter hewan — kontraindikasi bila abses sudah terbentuk', 'Drainase abses yang matang oleh dokter hewan', 'Perawatan suportif — pakan lunak dan akses air'],
    pencegahan: ['Karantina minimum 3 minggu untuk kuda baru, idealnya uji swab nasofaringeal', 'Vaksinasi strangles pada kawanan berisiko tinggi', 'Desinfeksi peralatan dan tempat pakan/minum secara rutin'],
    referensiObatId: ['penicillin-g-procaine', 'trimethoprim-sulfa'],
  },
  {
    penyakitUuid: 'dp-bak-hb-2', // Glanders
    gejalaAwal: ['Demam intermiten', 'Sekret hidung mukopurulen, kadang berdarah', 'Ulkus pada selaput lendir hidung'],
    gejalaLanjutan: ['Nodul keras pada paru dan saluran limfatik (form paru)', 'Pembengkakan kaki akibat limfangitis (farcy/form kulit)', 'Kelemahan progresif dan kehilangan berat badan'],
    komplikasi: ['Kematian pada form paru akut dalam beberapa minggu', 'Penularan ke manusia (zoonosis serius)'],
    penyebab: 'Infeksi bakteri Burkholderia mallei, bersifat intraseluler dan sangat virulen.',
    caraPenularan: ['Kontak dengan sekret hidung atau lesi kulit kuda terinfeksi', 'Pakan dan air yang terkontaminasi', 'Manusia dapat terinfeksi melalui kontak dengan lesi atau aerosol'],
    faktorRisiko: ['Kuda kerja dalam kondisi buruk, kelelahan, dan imunitas rendah', 'Kontak dengan kuda yang berasal dari area endemik', 'Tidak ada program surveilans di populasi kuda'],
    penanganan: ['TIDAK ADA pengobatan yang direkomendasikan — penyakit wajib lapor dengan kebijakan test-and-slaughter', 'Segera laporkan ke otoritas veteriner bila dicurigai', 'Isolasi ketat dan penggunaan APD lengkap oleh semua penanganan'],
    pencegahan: ['Karantina dan uji mallein test pada kuda yang baru datang dari area endemik', 'Surveilans rutin pada populasi kuda di area berisiko', 'Hindari kontak dengan kuda yang bergejala tanpa APD lengkap'],
    referensiObatId: [],
    catatan: 'Zoonosis berbahaya dan penyakit wajib lapor — potensi digunakan sebagai agen bioterorisme. Penanganan tanpa APD lengkap sangat berbahaya bagi manusia.',
  },
  {
    penyakitUuid: 'dp-bak-hb-3', // Rhodococcus equi
    gejalaAwal: ['Demam ringan persisten pada foal usia 1–2 bulan', 'Napas sedikit lebih cepat dari normal', 'Terkadang tanpa gejala klinis jelas pada tahap sangat awal'],
    gejalaLanjutan: ['Sesak napas progresif dan napas perut', 'Batuk produktif', 'Penurunan berat badan dan kelemahan', 'Gejala ekstra-paru: artritis, limfadenitis, kolitis (pada 50% kasus)'],
    komplikasi: ['Kematian foal akibat gagal napas bila tidak terdeteksi dan ditangani dini', 'Abses hati dan limpa pada infeksi sistemik'],
    penyebab: 'Infeksi bakteri intraseluler Rhodococcus equi yang membentuk abses paru multipel pada foal.',
    caraPenularan: ['Inhalasi bakteri dari debu tanah yang terkontaminasi feses kuda (bakteri bertahan lama di tanah)', 'Tidak menular antar foal secara langsung'],
    faktorRisiko: ['Peternakan kuda dengan riwayat kasus R. equi (tanah endemik)', 'Foal di bawah 6 bulan yang terpapar tanah berdebu dan panas', 'Peternakan kuda besar dengan padang berdebu'],
    penanganan: ['Kombinasi antibiotik jangka panjang (rifampicin + eritromisin/azitromisin) atas anjuran dokter hewan selama minimal 4–9 minggu', 'Pemantauan dengan ultrasonografi paru untuk evaluasi abses', 'Perawatan suportif — nutrisi dan lingkungan bersih berventilasi baik'],
    pencegahan: ['Pemantauan rutin foal dengan ultrasonografi paru di peternakan endemik mulai usia 4 minggu', 'Kurangi paparan debu tanah pada foal — lembabkan paddock, hindari lahan berdebu', 'Penggunaan plasma hiperimun profilaksis pada foal berisiko tinggi bila tersedia'],
    referensiObatId: ['erythromycin', 'vitamin-b-kompleks', 'multivitamin-ternak'],
  },
  // ── BABI: Penyakit Bakteri ──
  {
    penyakitUuid: 'dp-bak-hb-4', // Swine Erysipelas
    gejalaAwal: ['Demam tinggi mendadak (40–42°C)', 'Depresi dan nafsu makan hilang', 'Enggan bergerak dan menjerit saat disentuh'],
    gejalaLanjutan: ['Lesi kulit berbentuk berlian (diamond skin disease) berwarna merah hingga ungu', 'Artritis akut pada sendi kaki', 'Kematian mendadak tanpa gejala pada form akut perakut'],
    komplikasi: ['Endokarditis (vegetasi katup jantung) pada form kronis', 'Artritis kronis yang menyebabkan pincang permanen', 'Kulit nekrosis pada lesi akut yang tidak ditangani'],
    penyebab: 'Infeksi bakteri Erysipelothrix rhusiopathiae yang tersebar luas di tanah dan usus babi sehat sebagai karier.',
    caraPenularan: ['Kontak dengan feses, urin, atau tanah terkontaminasi', 'Masuk melalui luka kecil di kulit', 'Tonsilitas asimtomatik pada babi karier'],
    faktorRisiko: ['Babi dewasa (4–12 bulan) yang tidak divaksinasi', 'Cuaca panas ekstrem sebagai pemicu stres', 'Kondisi kandang kotor dan padat'],
    penanganan: ['Terapi penisilin dosis tinggi sesuai anjuran dokter hewan — responsif bila diberikan dini', 'Anti-inflamasi untuk demam dan artritis akut', 'Isolasi babi sakit dari kelompok', 'Perawatan suportif — cairan dan pakan lunak'],
    pencegahan: ['Vaksinasi erysipelas rutin pada babi induk dan penggemukan', 'Sanitasi kandang secara rutin', 'Hindari paparan babi ke tanah terkontaminasi tanpa pengelolaan yang baik'],
    referensiObatId: ['penicillin-g-procaine', 'ampicillin', 'flunixin-meglumine'],
    catatan: 'Zoonosis ringan — manusia dapat terinfeksi melalui luka pada kulit saat kontak dengan babi atau produk babi mentah (erysipeloid).',
  },
  {
    penyakitUuid: 'dp-bak-hb-5', // Swine Dysentery
    gejalaAwal: ['Diare lunak dengan lendir berlebihan', 'Nafsu makan turun ringan', 'Sedikit demam atau normotermi'],
    gejalaLanjutan: ['Diare berdarah dan berlendir (karakteristik)', 'Penurunan berat badan progresif', 'Dehidrasi sedang hingga berat', 'Perut buncit dan babi tampak bungkuk'],
    komplikasi: ['Kematian pada kasus yang tidak ditangani, terutama babi lemah', 'Penurunan performa pertumbuhan jangka panjang pada yang sembuh'],
    penyebab: 'Infeksi bakteri anaerobik Brachyspira hyodysenteriae yang menyebabkan kolitis hemoragik mukoid.',
    caraPenularan: ['Kontak dengan feses babi terinfeksi', 'Pakan atau air yang terkontaminasi', 'Tikus sebagai reservoir dan vektor mekanis antar kandang'],
    faktorRisiko: ['Kepadatan kandang tinggi dengan sanitasi buruk', 'Introduksi babi baru pembawa bakteri tanpa karantina', 'Keberadaan tikus di sekitar kandang'],
    penanganan: ['Terapi antibiotik (tiamulin, tylosin) sesuai anjuran dokter hewan', 'Rehidrasi oral pada kasus dehidrasi sedang', 'Isolasi babi bergejala dari kelompok', 'Kontrol tikus secara intensif di lingkungan kandang'],
    pencegahan: ['Program kontrol tikus yang ketat', 'Karantina babi baru dan uji kesehatan sebelum digabung', 'Sanitasi dan desinfeksi kandang menyeluruh setelah wabah', 'Hindari pencampuran babi dari kawanan berbeda'],
    referensiObatId: ['tylosin', 'lincomycin', 'elektrolit-oral-rehidrasi'],
  },
  {
    penyakitUuid: 'dp-bak-hb-6', // Streptococcus suis Meningitis
    gejalaAwal: ['Demam tinggi mendadak pada anak babi pascasapih', 'Goyah/sempoyongan saat berjalan', 'Anoreksia dan depresi'],
    gejalaLanjutan: ['Kejang dan opistotonus (kepala tertarik ke belakang)', 'Nistagmus (gerakan bola mata cepat abnormal)', 'Kelumpuhan total', 'Artritis akut pada beberapa kasus'],
    komplikasi: ['Kematian cepat pada kasus meningitis yang tidak ditangani', 'Tuli permanen pada hewan yang sembuh'],
    penyebab: 'Infeksi bakteri Streptococcus suis, biasanya serotipe 2, yang menyebar dari amandel ke sistem saraf pusat melalui aliran darah.',
    caraPenularan: ['Penularan vertikal dari induk ke anak babi melalui saluran lahir', 'Kontak antar babi melalui sekret hidung dan tonsilar', 'Stres sapih sebagai pemicu aktivasi dari karier'],
    faktorRisiko: ['Sapih dini (di bawah 21 hari)', 'Kepadatan kandang pascasapih yang tinggi', 'Higiene kandang buruk dan ventilasi tidak memadai'],
    penanganan: ['Antibiotik (penisilin/amoksisilin) dosis tinggi sesegera mungkin — prognosis buruk bila terlambat', 'Anti-inflamasi/kortikosteroid untuk mengurangi edema otak atas anjuran dokter hewan', 'Perawatan suportif — cairan, isolasi dari stimulus bising/cahaya terang', 'Isolasi babi bergejala untuk mencegah trauma dari babi lain'],
    pencegahan: ['Minimalkan stres sapih dengan manajemen bertahap', 'Vaksinasi S. suis bila tersedia di wilayah setempat', 'Sanitasi kandang pascasapih secara menyeluruh', 'Hindari kepadatan berlebihan pada pen pascasapih'],
    referensiObatId: ['penicillin-g-procaine', 'amoxicillin', 'dexamethasone'],
    catatan: 'Zoonosis penting — manusia yang bekerja di peternakan babi atau industri pengolahan babi dapat terinfeksi S. suis, terutama melalui luka dan menyebabkan meningitis pada manusia.',
  },
  {
    penyakitUuid: 'dp-bak-hb-7', // Atrophic Rhinitis
    gejalaAwal: ['Bersin-bersin dan sekret hidung', 'Lakrimasi (air mata berlebih)', 'Bercak air mata coklat di bawah mata'],
    gejalaLanjutan: ['Hidung bengkok (snout deviation) ke satu sisi', 'Perdarahan dari hidung', 'Distorsi wajah akibat atrofi tulang turbinat', 'Pertumbuhan terhambat dibanding teman sekelompok'],
    komplikasi: ['Kerusakan turbinat permanen yang meningkatkan risiko pneumonia sekunder', 'Gangguan makan akibat deformitas wajah'],
    penyebab: 'Toksin dermonecrotic Pasteurella multocida tipe D (dikombinasi dengan Bordetella bronchiseptica sebagai predisposisi) menyebabkan atrofi tulang turbinat.',
    caraPenularan: ['Aerosol dari babi terinfeksi', 'Penularan vertikal dari induk ke anak babi saat laktasi', 'Introduksi babi carrier tanpa gejala klinis'],
    faktorRisiko: ['Introduksi gilts/babi baru dari kawanan positif AR', 'Ventilasi kandang buruk dengan konsentrasi amonia tinggi', 'Kepadatan kandang anak babi berlebihan'],
    penanganan: ['Terapi antibiotik pada anak babi muda untuk menekan infeksi B. bronchiseptica', 'Pemberian sulfadiazin atau tulathromycin atas anjuran dokter hewan', 'Perbaikan ventilasi kandang untuk mengurangi kadar amonia', 'Kerusakan turbinat yang sudah terjadi tidak dapat disembuhkan'],
    pencegahan: ['Vaksinasi induk dengan vaksin P. multocida dan B. bronchiseptica sebelum kelahiran untuk imunitas pasif', 'Biosekuriti ketat — uji kesehatan babi baru', 'Perbaikan ventilasi dan pengurangan amonia di kandang'],
    referensiObatId: ['trimethoprim-sulfa', 'oxytetracycline', 'vitamin-c'],
  },
  {
    penyakitUuid: 'dp-bak-hb-8', // Greasy Pig Disease
    gejalaAwal: ['Kulit kemerahan dan basah di sekitar kepala dan leher', 'Vesikula kecil atau erosi kulit pada anak babi di bawah 6 minggu', 'Anak babi tampak berminyak dan berbau apek'],
    gejalaLanjutan: ['Lesi kulit menyebar ke seluruh tubuh dalam 24–48 jam', 'Kerak coklat tebal menutupi kulit (greasy exudate)', 'Dehidrasi dan anoreksia berat', 'Kematian pada anak babi sangat muda tanpa penanganan'],
    komplikasi: ['Sepsis akibat infeksi bakteri sekunder pada kulit yang rusak', 'Kematian 70–100% pada anak babi di bawah 1 minggu'],
    penyebab: 'Infeksi kulit oleh Staphylococcus hyicus yang menghasilkan eksfoliatif toksin, menyebabkan pemisahan lapisan epidermis.',
    caraPenularan: ['Kontak langsung antar anak babi', 'Luka kecil akibat perkelahian atau lantai kandang kasar sebagai pintu masuk bakteri', 'Induk sebagai karier yang menginfeksi anak saat kelahiran'],
    faktorRisiko: ['Lantai kandang beranak kasar yang melukai anak babi', 'Luka kanibalisme antar anak babi', 'Higiene kandang beranak buruk'],
    penanganan: ['Terapi antibiotik parenteral sesegera mungkin atas anjuran dokter hewan', 'Pembersihan lembut lesi dengan antiseptik lembut (klorheksidin)', 'Pelembab kulit atau emolien pada kulit yang terluka', 'Jaga kehangatan anak babi yang sakit'],
    pencegahan: ['Haluskan atau lapisi lantai kandang beranak agar tidak melukai anak babi', 'Potong gigi taring anak babi baru lahir untuk mengurangi luka kanibalisme', 'Higiene dan desinfeksi kandang beranak secara menyeluruh'],
    referensiObatId: ['penicillin-g-procaine', 'amoxicillin', 'chlorhexidine', 'povidone-iodine'],
  },
  {
    penyakitUuid: 'dp-bak-hb-9', // Ileitis Babi
    gejalaAwal: ['Diare coklat lunak tanpa darah (form kronis)', 'Pertumbuhan tidak merata dalam satu kelompok', 'Nafsu makan fluktuatif'],
    gejalaLanjutan: ['Diare berdarah hitam mendadak (form akut/PHE — Proliferative Hemorrhagic Enteropathy)', 'Pucat ekstrem dan kelemahan mendadak pada babi dewasa (form akut)', 'Kematian mendadak babi yang tampak sehat (form akut)'],
    komplikasi: ['Kematian mendadak pada babi dewasa muda akibat hemorrhagic enteropathy', 'Penurunan performa pertumbuhan jangka panjang pada form kronis'],
    penyebab: 'Infeksi bakteri intraseluler obligat Lawsonia intracellularis yang menginfeksi enterosit usus halus dan menyebabkan proliferasi abnormal mukosa.',
    caraPenularan: ['Rute fecal-oral — kontak dengan feses babi terinfeksi', 'Bakteri sangat persisten di lingkungan kandang', 'Tikus sebagai reservoir dan vektor mekanis'],
    faktorRisiko: ['Babi pascasapih dan babi berumur 6–20 minggu paling rentan untuk form kronis', 'Babi dewasa muda (20–40 minggu) untuk form akut hemorrhagik', 'Stres perubahan kandang dan penggabungan kelompok baru'],
    penanganan: ['Antibiotik (tylosin, linkomycin, atau tiamulin) dalam pakan/air atas anjuran dokter hewan', 'Transfusi atau terapi besi untuk kasus anemia berat akibat PHE', 'Isolasi babi bergejala dan perawatan suportif', 'Kontrol tikus di sekitar kandang'],
    pencegahan: ['Vaksinasi Lawsonia intracellularis bila tersedia', 'Program kontrol tikus yang ketat', 'Sanitasi kandang menyeluruh saat transisi kelompok', 'Hindari stres berlebihan saat penggabungan kelompok babi'],
    referensiObatId: ['tylosin', 'lincomycin', 'trimethoprim-sulfa'],
  },
  // ── BABI: Gangguan Pernapasan ──
  {
    penyakitUuid: 'dp-nap-hb-1', // Enzootic Pneumonia Babi
    gejalaAwal: ['Batuk kering tidak produktif persisten', 'Laju pertumbuhan sedikit di bawah normal', 'Tanpa demam yang jelas'],
    gejalaLanjutan: ['Batuk makin sering terutama saat babi digerakkan', 'Penurunan konversi pakan (FCR memburuk)', 'Pada kasus parah dengan infeksi sekunder: demam dan sesak napas'],
    komplikasi: ['PRDC (Porcine Respiratory Disease Complex) akibat infeksi sekunder oleh virus dan bakteri lain', 'Penurunan performa produksi yang signifikan seluruh kawanan'],
    penyebab: 'Infeksi Mycoplasma hyopneumoniae yang menyebabkan bronkopneumonia kronis apikal-lobar dan merusak silia saluran pernapasan.',
    caraPenularan: ['Aerosol dari babi terinfeksi (jarak hingga 3 km pada kondisi tertentu)', 'Kontak langsung antar babi — induk ke anak babi', 'Introduksi babi carrier ke kawanan naif'],
    faktorRisiko: ['Peternakan intensif dengan kepadatan tinggi', 'Ventilasi kandang buruk dan fluktuasi suhu', 'Campuran umur yang berbeda dalam satu ruang produksi'],
    penanganan: ['Antibiotik golongan makrolid atau tetrasiklin dalam pakan/air pada periode risiko atas anjuran dokter hewan', 'Perbaikan ventilasi kandang secara menyeluruh', 'Isolasi babi bergejala berat dari kelompok produksi', 'Evaluasi densitas kandang dan kondisi lingkungan'],
    pencegahan: ['Vaksinasi M. hyopneumoniae pada anak babi di usia 3 minggu', 'Terapkan sistem produksi all-in all-out per ruang', 'Optimalkan ventilasi kandang dan kurangi fluktuasi suhu', 'Uji serologi babi baru sebelum digabung ke kawanan'],
    referensiObatId: ['oxytetracycline', 'tylosin', 'bromhexine', 'danofloxacin'],
  },
  // ── KUDA: Gangguan Pernapasan ──
  {
    penyakitUuid: 'dp-nap-hb-2', // Heaves / RAO
    gejalaAwal: ['Batuk kronis intermiten', 'Napas sedikit lebih cepat dari normal', 'Sekret hidung bilateral encer'],
    gejalaLanjutan: ['Sesak napas saat istirahat pada kasus berat', 'Pengembangan otot perut berlebihan (heave line) akibat usaha bernapas kronis', 'Intoleransi olahraga', 'Flaring nostril (lubang hidung melebar)'],
    komplikasi: ['Penurunan performa permanen pada kuda kerja/olahraga', 'Kegagalan napas pada kasus berat yang tidak dikelola'],
    penyebab: 'Hipersensitivitas kronis saluran napas terhadap debu, spora jamur, dan endotoksin dari jerami/pakan berkualitas buruk di lingkungan kandang.',
    caraPenularan: ['Tidak menular — reaksi imunologi individual terhadap alergen lingkungan'],
    faktorRisiko: ['Kuda dewasa di atas 7 tahun yang dikandangkan', 'Pemberian jerami debu tinggi atau pakan berjamur', 'Ventilasi kandang buruk dengan akumulasi debu'],
    penanganan: ['Manajemen lingkungan — pindahkan kuda ke padang terbuka bila memungkinkan', 'Basahi jerami sebelum diberikan atau ganti dengan silase/pakan alternatif rendah debu', 'Bronkodilator (clenbuterol) dan kortikosteroid inhalasi atas anjuran dokter hewan', 'Perbaiki ventilasi kandang secara signifikan'],
    pencegahan: ['Hindari pemberian jerami berdebu — gunakan silase atau hay rendah debu', 'Kandangkan kuda di lingkungan berventilasi baik atau sistem pasture', 'Pemantauan dini gejala batuk kronis pada kuda dewasa'],
    referensiObatId: ['bronkodilator-clenbuterol', 'dexamethasone', 'bromhexine'],
  },
  // ── KUDA: Gangguan Kulit / Kuku ──
  {
    penyakitUuid: 'dp-kul-hb-1', // Laminitis Kuda
    gejalaAwal: ['Pincang mendadak, terutama pada kaki depan', 'Postur khas: kaki depan direntangkan ke depan, berat badan di kaki belakang', 'Pulsasi arteri digital meningkat dan terasa saat diraba di atas kuku'],
    gejalaLanjutan: ['Kuku terasa panas saat disentuh', 'Enggan berjalan atau bergerak sama sekali', 'Berkeringat dan nyeri hebat', 'Rotasi coffin bone pada kasus kronis (terlihat pada radiografi)'],
    komplikasi: ['Rotasi dan penetrasi coffin bone melalui sol kuku pada kasus berat', 'Laminitis kronis dengan deformitas kuku permanen', 'Eutanasia diperlukan pada kasus ekstrem'],
    penyebab: 'Gangguan aliran darah ke lamela kuku akibat overfeeding karbohidrat, penyakit sistemik berat (infeksi, retensi plasenta), atau berdiri terlalu lama di permukaan keras.',
    caraPenularan: ['Tidak menular — gangguan metabolik/vaskular individual'],
    faktorRisiko: ['Pemberian konsentrat berlebih pada kuda yang tidak bekerja (obesity)', 'Equine Metabolic Syndrome atau Equine Cushings (PPID)', 'Beban kerja berlebih di permukaan keras (road founder)', 'Retensi plasenta pada kuda betina pasca melahirkan'],
    penanganan: ['Segera panggil dokter hewan — laminitis adalah kegawatan veteriner', 'Berikan alas kaki lunak (pasir atau bedding tebal) untuk menyangga sol kuku', 'Anti-inflamasi (flunixin, phenylbutazone) atas anjuran dokter hewan', 'Hentikan segera semua pakan konsentrat/tinggi gula', 'Perawatan kuku remedial oleh farrier berpengalaman'],
    pencegahan: ['Manajemen pakan ketat — hindari overfeeding konsentrat', 'Kontrol berat badan kuda secara rutin', 'Rutinkan perawatan dan pemangkasan kuku', 'Tangani penyakit sistemik secara tuntas untuk mencegah laminitis sekunder'],
    referensiObatId: ['flunixin-meglumine', 'phenylbutazone', 'dimethyl-sulfoxide'],
  },
  {
    penyakitUuid: 'dp-kul-hb-2', // Navicular Disease
    gejalaAwal: ['Pincang intermiten pada satu atau kedua kaki depan', 'Berdiri di ujung kuku (toe-standing)', 'Langkah pendek dan hati-hati di permukaan keras'],
    gejalaLanjutan: ['Pincang progresif yang memburuk seiring waktu', 'Atrofi otot bahu akibat kurang penggunaan', 'Respons positif pada tes tekan pada daerah tengah tumit kuku'],
    komplikasi: ['Pincang permanen yang menghentikan karir kuda kerja/olahraga', 'Perforasi tendon fleksor digitalis profundus pada kasus lanjut'],
    penyebab: 'Degenerasi progresif tulang navicular (distal sesamoid) dan jaringan pendukungnya akibat tekanan mekanis berulang dan gangguan aliran darah lokal.',
    caraPenularan: ['Tidak menular — kondisi ortopedi degeneratif individual'],
    faktorRisiko: ['Kuda Thoroughbred dan Warmbloods dengan kaki kecil relatif terhadap badan berat', 'Perawatan kuku buruk atau kuku tidak seimbang', 'Latihan intensif di permukaan keras tanpa persiapan'],
    penanganan: ['Pemangkasan dan pengesetan kuku korektif oleh farrier berpengalaman bersama dokter hewan', 'Anti-inflamasi untuk manajemen nyeri kronis atas anjuran dokter hewan', 'Injeksi kortikosteroid atau hyaluronat ke bursa navicularis atas anjuran dokter hewan spesialis', 'Pembatasan latihan di permukaan keras'],
    pencegahan: ['Perawatan kuku rutin setiap 6–8 minggu oleh farrier terlatih', 'Hindari latihan intensif berlebihan di permukaan keras tanpa sepatu protektif', 'Seleksi pembibitan memperhatikan konformasi kaki yang baik'],
    referensiObatId: ['phenylbutazone', 'flunixin-meglumine', 'dimethyl-sulfoxide'],
  },
  // ── KUDA: Gangguan Nutrisi-Metabolik ──
  {
    penyakitUuid: 'dp-nut-hb-1', // Equine Metabolic Syndrome
    gejalaAwal: ['Penambahan berat badan mudah meski pakan terbatas', 'Timbunan lemak di leher (cresty neck), bahu, dan pangkal ekor', 'Riwayat episode laminitis ringan berulang'],
    gejalaLanjutan: ['Laminitis berulang terutama saat mengonsumsi rumput muda/segar', 'Polidipsia dan poliuria (minum dan kencing banyak)', 'Resistensi insulin yang dapat dikonfirmasi dengan uji laboratorium'],
    komplikasi: ['Laminitis kronis yang menyebabkan deformitas kuku permanen', 'Infertilitas pada kuda betina akibat disfungsi hormonal'],
    penyebab: 'Ketidakseimbangan metabolik yang menyebabkan resistensi insulin, akibat genetik dan manajemen pakan yang tidak tepat — overfeeding pada kuda/poni dengan kecenderungan genetik hemat energi.',
    caraPenularan: ['Tidak menular — kondisi metabolik dengan komponen genetik dan manajemen'],
    faktorRisiko: ['Ras poni (Welsh, Shetland), Morgan, Paso Fino yang secara genetik cenderung hemat energi', 'Pemberian akses bebas ke rumput muda yang tinggi nonstructural carbohydrate', 'Kurang olahraga dan overfeeding konsentrat'],
    penanganan: ['Manajemen pakan ketat — batasi rumput segar, pilih hay rendah NSC yang sudah diuji kadar gulanya', 'Program latihan fisik rutin sesuai kemampuan kuda', 'Suplemen chromium atau levothyroxine atas anjuran dokter hewan untuk mendukung sensitivitas insulin', 'Monitoring rutin berat badan dan kondisi tubuh'],
    pencegahan: ['Manajemen pakan berbasis berat badan dan kebutuhan energi aktual', 'Hindari pemberian rumput muda berlebih, terutama di musim semi', 'Pemeriksaan kesehatan rutin tahunan termasuk uji insulin pada ras berisiko'],
    referensiObatId: ['vitamin-e-tunggal', 'mineral-mix-ternak', 'karnitin-l'],
  },
  // ── BABI: Gangguan Reproduksi ──
  {
    penyakitUuid: 'dp-rep-hb-1', // SMEDI Syndrome
    gejalaAwal: ['Kegagalan bunting setelah perkawinan (return to estrus)', 'Tidak ada gejala klinis sistemik pada induk', 'Penurunan ukuran litter yang tidak dapat dijelaskan'],
    gejalaLanjutan: ['Lahir mati pada berbagai tahap kebuntingan', 'Fetus termumi (berbagai ukuran dalam satu rahim, menandakan kematian pada waktu berbeda)', 'Anak babi lahir lemah dan tidak viable'],
    komplikasi: ['Penurunan angka reproduksi kawanan (farrowing rate, litter size) secara signifikan', 'Kerugian ekonomi besar pada peternakan pembibitan'],
    penyebab: 'Infeksi multietiologi — Porcine Parvovirus (PPV), PRRSV, Enterovirus, dan agen lain yang dapat menyebabkan kematian embrio/fetus tergantung waktu infeksi selama kebuntingan.',
    caraPenularan: ['Bervariasi tergantung agen penyebab — umumnya melalui fecal-oral dan kontak antar babi', 'Semen pejantan terinfeksi (terutama untuk PPV dan PRRSV)'],
    faktorRisiko: ['Gilts yang belum pernah terekspos agen penyebab sebelumnya', 'Kawanan tanpa program vaksinasi PPV dan PRRS yang komprehensif', 'Introduksi babi baru tanpa karantina dan serologi'],
    penanganan: ['Diagnosis etiologi melalui pemeriksaan laboratorium fetus (PCR, histopatologi)', 'Tidak ada pengobatan spesifik — fokus pada identifikasi agen penyebab dan vaksinasi', 'Evaluasi dan perbaiki program vaksinasi bersama dokter hewan', 'Karantina dan uji babi baru sebelum masuk ke kawanan'],
    pencegahan: ['Program vaksinasi komprehensif: PPV, PRRS sesuai status kawanan', 'Aklimatisasi gilts dengan paparan terkontrol ke agen sebelum perkawinan', 'Manajemen ketat lalu lintas hewan dan biosekuriti peternakan pembibitan'],
    referensiObatId: [],
    catatan: 'Diagnosis banding penting — SMEDI dapat melibatkan beberapa agen sekaligus. Pemeriksaan patologi fetus oleh laboratorium veteriner sangat dianjurkan untuk perencanaan program pencegahan yang tepat.',
  },
  // ── KUDA: Penyakit Bakteri (Tetanus) ──
  {
    penyakitUuid: 'dp-bak-hb-10', // Tetanus Kuda
    gejalaAwal: ['Kekakuan otot rahang (trismus) — tidak bisa membuka mulut dengan normal', 'Kepekaan berlebih terhadap suara, cahaya, dan sentuhan', 'Berjalan kaku dengan langkah sangat pendek'],
    gejalaLanjutan: ['Kekakuan otot menyeluruh — postur kuda kayu seperti kuda mainan', 'Telinga tegak dan kaku', 'Membran nictitans menonjol dari sudut mata', 'Kejang tetanik yang dipicu rangsang eksternal', 'Kematian akibat gagal napas bila tidak ditangani'],
    komplikasi: ['Kematian 50–80% pada kasus yang tidak ditangani dini', 'Pneumonia aspirasi akibat kesulitan menelan'],
    penyebab: 'Toksin tetanospasmin dari Clostridium tetani yang tumbuh di luka terkontaminasi tanah, menghambat inhibisi motor neuron sehingga terjadi spasme otot terus-menerus.',
    caraPenularan: ['Tidak menular — spora C. tetani dari tanah masuk melalui luka (terutama luka tusuk, luka kuku, luka kastrasi)', 'Kuda adalah spesies paling sensitif terhadap neurotoksin tetanus'],
    faktorRisiko: ['Luka tusuk dalam, terutama di telapak kuku', 'Kastrasi atau prosedur bedah tanpa profilaksis antibiotik dan vaksinasi', 'Kuda tanpa riwayat vaksinasi tetanus', 'Peternakan dengan tanah yang banyak mengandung kotoran kuda (spora berlimpah)'],
    penanganan: ['Antitoksin tetanus dosis tinggi sesegera mungkin atas anjuran dokter hewan', 'Penisilin untuk membunuh C. tetani aktif di luka', 'Sedasi (diazepam/acepromazine) untuk mengendalikan spasme otot', 'Perawatan intensif di ruang gelap dan tenang untuk meminimalkan rangsang kejang', 'Cairan dan nutrisi via nasogastric tube bila kesulitan menelan'],
    pencegahan: ['Vaksinasi tetanus toksoid rutin — primer dua dosis, booster tahunan', 'Booster vaksin segera pada luka berisiko bila jadwal vaksin tidak terkini', 'Manajemen luka yang benar dan segera — pembersihan dan debridement', 'Perawatan antiseptik pada luka kastrasi dan prosedur bedah'],
    referensiObatId: ['vaksin-tetanus-toksoid', 'penicillin-g-procaine', 'flunixin-meglumine'],
    catatan: 'Kuda adalah spesies yang paling peka terhadap tetanus di antara hewan ternak — vaksinasi rutin mutlak dilakukan dan bukan opsional.',
  },

  // ── SP-005: Detail penyakit tambahan Ruminansia (spesifik spesies) ──────
  {
    penyakitUuid: 'dp-vir-rx-1', // Contagious Ecthyma (Orf)
    gejalaAwal: ['Papul dan vesikel pada bibir, moncong, dan sudut mulut', 'Lesi awal berwarna merah muda yang cepat membentuk kerak tebal'],
    gejalaLanjutan: ['Keropeng tebal kecoklatan menutupi bibir dan moncong, menyulitkan makan', 'Lesi dapat menyebar ke ambing induk yang menyusui', 'Penurunan berat badan akibat kesulitan makan pada anak'],
    komplikasi: ['Infeksi bakteri sekunder pada lesi (myiasis di iklim tropis)', 'Mastitis akibat lesi ambing pada induk menyusui'],
    penyebab: 'Infeksi Parapoxvirus ovis yang menyerang kulit dan mukosa.',
    caraPenularan: ['Kontak langsung dengan hewan terinfeksi atau lesi aktif', 'Peralatan, pagar, dan kandang terkontaminasi virus', 'Virus sangat tahan di lingkungan kering hingga bertahun-tahun'],
    faktorRisiko: ['Kepadatan kandang tinggi', 'Anak ternak baru disapih atau baru datang', 'Musim hujan dengan kelembapan tinggi'],
    penanganan: ['Isolasi hewan bergejala dari kawanan', 'Perawatan lesi topikal untuk mencegah infeksi sekunder dan myiasis', 'Pastikan anak ternak tetap mendapat asupan susu yang cukup', 'Antibiotik hanya bila ada infeksi sekunder yang nyata sesuai anjuran dokter hewan'],
    pencegahan: ['Vaksinasi ORF pada kawanan di area endemik', 'Karantina ternak baru sebelum digabung ke kawanan', 'Disinfeksi peralatan dan kandang secara rutin'],
    referensiObatId: ['vaksin-orf', 'povidone-iodine', 'oxytetracycline'],
    catatan: 'Zoonosis — peternak dan dokter hewan yang menangani lesi aktif harus menggunakan sarung tangan; manusia dapat terinfeksi melalui luka kulit.',
  },
  {
    penyakitUuid: 'dp-vir-rx-2', // CAE
    gejalaAwal: ['Anak kambing: kelemahan progresif dan ataksia pada usia 2-6 bulan', 'Kambing dewasa: pembengkakan sendi karpal (lutut depan) yang tidak nyeri awal'],
    gejalaLanjutan: ['Artritis kronis dengan sendi membesar, nyeri, dan pincang berat pada kambing dewasa', 'Ensefalitis fatal pada anak (paralisis flaksid progresif)', 'Mastitis indurasi (hard udder) dan penurunan produksi susu kronis'],
    komplikasi: ['Kelumpuhan permanen pada anak yang bertahan hidup', 'Penurunan produktivitas kawanan secara keseluruhan jangka panjang'],
    penyebab: 'Infeksi Caprine Arthritis Encephalitis Virus (CAEV), retrovirus kelompok lentivirus.',
    caraPenularan: ['Kolostrum dan susu dari induk terinfeksi ke anak (jalur utama)', 'Kontak dekat antar hewan dewasa melalui cairan tubuh'],
    faktorRisiko: ['Kawanan tanpa program uji CAEV', 'Pemberian kolostrum/susu tanpa pasteurisasi dari induk seropositif', 'Introduksi kambing baru tanpa uji serologis'],
    penanganan: ['Tidak ada pengobatan kuratif — manajemen paliatif untuk mengurangi nyeri sendi', 'Anti-inflamasi jangka panjang untuk kasus artritis sesuai anjuran dokter hewan', 'Eutanasia humanis pada kasus ensefalitis berat pada anak'],
    pencegahan: ['Program uji serologis rutin dan eliminasi hewan positif', 'Pemberian kolostrum yang dipasteurisasi (56°C/1 jam) atau kolostrum domba untuk anak kambing', 'Pisahkan anak dari induk segera setelah lahir pada kawanan bebas CAEV'],
    referensiObatId: ['meloxicam', 'flunixin-meglumine'],
    catatan: 'Tidak ada vaksin tersedia — pengendalian berbasis program test-and-cull dan manajemen kolostrum steril.',
  },
  {
    penyakitUuid: 'dp-vir-rx-3', // Maedi-Visna
    gejalaAwal: ['Penurunan berat badan progresif selama berbulan-bulan', 'Napas sedikit cepat saat beraktivitas (gejala maedi awal)'],
    gejalaLanjutan: ['Sesak napas berat bahkan saat istirahat, bunyi napas kasar', 'Kelemahan otot posterior dan ataksia (gejala visna)', 'Keemasan dan kondisi tubuh sangat kurus meski nafsu makan masih ada', 'Mastitis indurasi kronis pada induk'],
    komplikasi: ['Kematian akibat gagal napas atau inanisi', 'Penurunan produktivitas kawanan selama bertahun-tahun'],
    penyebab: 'Infeksi Ovine Lentivirus (OvLV), retrovirus kronis pada domba.',
    caraPenularan: ['Kolostrum dan susu dari induk terinfeksi', 'Kontak pernapasan dekat jangka panjang antar domba dewasa'],
    faktorRisiko: ['Kawanan tanpa program skrining lentivirus', 'Kepadatan kandang tinggi yang meningkatkan transmisi pernapasan', 'Pemberian kolostrum tidak terpasteurisasi'],
    penanganan: ['Tidak ada pengobatan kuratif — perawatan suportif dan manajemen nutrisi', 'Isolasi hewan bergejala untuk mengurangi penularan', 'Eutanasia humanis pada tahap akhir penyakit'],
    pencegahan: ['Uji serologis rutin dan eliminasi hewan positif', 'Pasteurisasi kolostrum untuk anak domba', 'Pisahkan anak domba dari induk positif segera setelah lahir'],
    referensiObatId: ['multivitamin-ternak', 'mineral-mix-ternak'],
    catatan: 'Penyakit wajib lapor di beberapa negara — perlu koordinasi dengan otoritas veteriner untuk program eradikasi.',
  },
  {
    penyakitUuid: 'dp-vir-rx-4', // MCF
    gejalaAwal: ['Demam tinggi mendadak (>41°C)', 'Keluarnya sekret hidung dan mata yang semakin banyak'],
    gejalaLanjutan: ['Kekeruhan kornea bilateral (mata memutih)', 'Lesi erosif di rongga mulut dan moncong', 'Pembesaran kelenjar limfe', 'Diare berdarah dan gangguan saraf'],
    komplikasi: ['Kematian hampir pasti pada sapi/kerbau yang terinfeksi (angka kematian mendekati 100%)'],
    penyebab: 'Infeksi Ovine Herpesvirus-2 (OvHV-2) yang tidak menimbulkan gejala pada domba sebagai reservoir.',
    caraPenularan: ['Kontak dekat antara sapi/kerbau dengan domba yang membawa virus secara laten', 'Melalui sekresi hidung domba yang mengandung virus'],
    faktorRisiko: ['Pemeliharaan sapi/kerbau bersama atau berdekatan dengan domba', 'Musim kelahiran domba (anak domba baru lahir melepaskan banyak virus)'],
    penanganan: ['Tidak ada pengobatan efektif', 'Perawatan suportif intensif (cairan, antipiretik) dapat memperpanjang hidup sementara', 'Pisahkan segera dari domba dan laporkan ke dokter hewan'],
    pencegahan: ['Pisahkan kandang sapi/kerbau dari domba secara permanen', 'Hindari kontak langsung maupun tidak langsung antara dua spesies ini', 'Jaga kebersihan peralatan yang digunakan bergantian'],
    referensiObatId: ['flunixin-meglumine', 'ringer-laktat'],
    catatan: 'Tidak ada vaksin tersedia — pencegahan satu-satunya adalah pemisahan ketat sapi/kerbau dari domba.',
  },
  {
    penyakitUuid: 'dp-vir-rx-5', // BEF
    gejalaAwal: ['Demam tinggi mendadak (>40°C)', 'Pincang berpindah-pindah antar kaki'],
    gejalaLanjutan: ['Kelumpuhan sementara — hewan tidak mampu berdiri', 'Hipersalivasi dan sekret hidung', 'Rumen berhenti (atoni) dan nafsu makan hilang'],
    komplikasi: ['Aspirasi pneumonia akibat kelumpuhan otot menelan', 'Kehilangan produksi susu yang tidak kembali penuh hingga musim berikutnya'],
    penyebab: 'Infeksi Bovine Ephemeral Fever Virus (rhabdovirus), ditularkan oleh vektor serangga penghisap darah.',
    caraPenularan: ['Gigitan serangga vektor (Culicoides, Culex, Anopheles) — tidak menular kontak langsung antar hewan'],
    faktorRisiko: ['Musim hujan dengan populasi vektor serangga tinggi', 'Kandang dekat area perairan tempat vektor berkembang biak', 'Sapi jantan dewasa dan sapi perah berproduksi tinggi paling rentan'],
    penanganan: ['Istirahat total — jangan memaksa hewan yang tumbang untuk berdiri', 'Anti-inflamasi (NSAID) untuk meredakan demam dan nyeri sendi', 'Suplementasi kalsium intravena bila ada hipokalsemia sekunder', 'Pastikan hidrasi dan nutrisi terjaga selama fase kelumpuhan'],
    pencegahan: ['Vaksinasi BEF pada musim sebelum puncak populasi vektor', 'Kontrol vektor serangga di sekitar kandang', 'Kandangkan ternak di malam hari saat vektor paling aktif'],
    referensiObatId: ['flunixin-meglumine', 'kalsium-borogluconate', 'vitamin-b-kompleks'],
  },
  {
    penyakitUuid: 'dp-vir-rx-6', // EBL
    gejalaAwal: ['Tidak ada gejala klinis pada sebagian besar hewan terinfeksi (fase laten bertahun-tahun)', 'Penurunan berat badan bertahap pada kasus yang berkembang'],
    gejalaLanjutan: ['Pembesaran kelenjar limfe superfisial yang masif dan dapat diraba', 'Eksoftalmus (mata menonjol ke luar) akibat limfoma retrobulbar', 'Depresi, penurunan produksi susu, dan kondisi tubuh sangat buruk'],
    komplikasi: ['Limfoma maligna yang menekan organ vital — selalu fatal'],
    penyebab: 'Infeksi Bovine Leukemia Virus (BLV), retrovirus yang menginfeksi limfosit B.',
    caraPenularan: ['Transmisi iatrogenik melalui alat suntik/peralatan medis terkontaminasi darah', 'Kontak darah melalui serangga penghisap darah', 'Transmisi vertikal dari induk ke anak melalui kolostrum/susu'],
    faktorRisiko: ['Penggunaan alat suntik berulang tanpa sterilisasi', 'Tidak ada program skrining BLV pada kawanan', 'Pembelian ternak baru tanpa uji serologis'],
    penanganan: ['Tidak ada pengobatan kuratif', 'Hewan dengan limfoma aktif harus dikeluarkan dari kawanan', 'Perawatan suportif paliatif untuk memperpanjang kenyamanan'],
    pencegahan: ['Uji serologis rutin seluruh kawanan', 'Gunakan alat suntik sekali pakai atau sterilisasi ketat antar hewan', 'Karantina dan uji ternak baru sebelum bergabung ke kawanan', 'Pasteurisasi kolostrum/susu dari induk positif'],
    referensiObatId: [],
    catatan: 'Di banyak negara diklasifikasikan sebagai penyakit yang perlu pengendalian — konsultasikan dengan dinas peternakan untuk regulasi setempat.',
  },
  {
    penyakitUuid: 'dp-vir-rx-7', // BPS
    gejalaAwal: ['Papul kemerahan kecil pada mukosa mulut dan moncong', 'Nafsu makan sedikit turun pada kasus dengan banyak lesi'],
    gejalaLanjutan: ['Papul berkembang menjadi erosi dangkal berwarna kecoklatan', 'Lesi dapat muncul juga di lubang hidung dan esofagus'],
    komplikasi: ['Infeksi bakteri sekunder pada erosi mukosa', 'Dapat menjadi pintu masuk penyakit lain yang lebih serius'],
    penyebab: 'Infeksi Parapoxvirus (Bovine Papular Stomatitis Virus) pada sapi muda.',
    caraPenularan: ['Kontak langsung dengan hewan terinfeksi', 'Peralatan pakan yang terkontaminasi virus'],
    faktorRisiko: ['Sapi muda di bawah 2 tahun paling rentan', 'Kepadatan kandang tinggi dan stres'],
    penanganan: ['Umumnya sembuh sendiri dalam 2-4 minggu tanpa intervensi', 'Berikan pakan lunak untuk mengurangi nyeri makan', 'Antibiotik topikal/sistemik hanya bila terjadi infeksi sekunder nyata'],
    pencegahan: ['Karantina ternak baru sebelum bergabung ke kawanan', 'Jaga kebersihan tempat pakan dan minum', 'Kurangi stres untuk mempertahankan daya tahan tubuh'],
    referensiObatId: ['povidone-iodine', 'chlorhexidine'],
    catatan: 'Zoonosis ringan — petugas yang menangani lesi aktif sebaiknya menggunakan sarung tangan.',
  },
  {
    penyakitUuid: 'dp-vir-rx-8', // RVF
    gejalaAwal: ['Demam tinggi mendadak', 'Penurunan nafsu makan dan depresi'],
    gejalaLanjutan: ['Badai aborsi massal pada betina bunting dari berbagai umur kebuntingan', 'Kematian tinggi pada anak ternak dengan gejala hepatitis akut', 'Ikterus dan sekret hidung/mata berdarah pada kasus berat'],
    komplikasi: ['Angka aborsi mencapai 100% pada kawanan yang belum terpapar', 'Kematian massal pada anak dan ternak muda'],
    penyebab: 'Infeksi Rift Valley Fever Phlebovirus, ditularkan oleh nyamuk genus Aedes dan Culex.',
    caraPenularan: ['Gigitan nyamuk vektor yang terinfeksi — tidak menular kontak langsung antar hewan', 'Kontak dengan cairan aborsi/darah hewan terinfeksi dapat menular ke manusia'],
    faktorRisiko: ['Musim hujan lebat yang meningkatkan populasi nyamuk vektor', 'Kawanan tanpa vaksinasi di area yang pernah terjadi wabah', 'Letak kandang dekat area genangan air'],
    penanganan: ['Laporkan segera ke dinas peternakan/karantina sebagai penyakit wajib lapor', 'Perawatan suportif — cairan dan antipiretik', 'Kontrol vektor nyamuk secara intensif di area wabah', 'Gunakan APD lengkap saat menangani kasus mengingat potensi zoonosis tinggi'],
    pencegahan: ['Vaksinasi sebelum musim hujan di area risiko', 'Kontrol populasi nyamuk di sekitar kandang', 'Hindari kandang di area rawan genangan air'],
    referensiObatId: ['flunixin-meglumine', 'oxytetracycline'],
    catatan: 'Zoonosis berat dan penyakit wajib lapor internasional — manusia dapat terinfeksi melalui kontak dengan cairan abortus/darah ternak dan gigitan nyamuk. Konsultasi dokter segera bila terpajan.',
  },
  {
    penyakitUuid: 'dp-bak-rx-1', // CLA
    gejalaAwal: ['Pembengkakan keras dan tidak nyeri pada kelenjar limfe superfisial (parotis, prefemoralis, supramamari)', 'Tidak ada gejala sistemik pada tahap awal'],
    gejalaLanjutan: ['Abses matang dan pecah mengeluarkan nanah kaseosa (seperti keju kering) berwarna kuning-hijau', 'Penurunan berat badan progresif bila terjadi abses internal (paru, limpa, hati)', 'Batuk kronis pada kasus dengan abses paru'],
    komplikasi: ['Bentuk viseral (abses organ dalam) yang sulit dideteksi dan berakibat kematian', 'Kontaminasi lingkungan kandang dengan isi abses yang menular'],
    penyebab: 'Infeksi bakteri Corynebacterium pseudotuberculosis yang membentuk abses kaseosa pada kelenjar limfe.',
    caraPenularan: ['Bakteri masuk melalui luka kulit (pencukuran bulu, kastrasi, tanduk)', 'Kontaminasi lingkungan dari abses yang pecah', 'Kontak langsung dengan hewan terinfeksi'],
    faktorRisiko: ['Prosedur pencukuran bulu tanpa desinfeksi alat', 'Kandang dengan luka potensial (kawat berduri, pagar kasar)', 'Kepadatan kandang tinggi'],
    penanganan: ['Isolasi hewan bergejala dari kawanan', 'Jangan memecah abses secara sembarangan — konsultasikan dengan dokter hewan', 'Bila diperlukan, drainase bedah abses harus dilakukan secara terkontrol dan isi abses dibuang secara aman', 'Antibiotik sistemik memiliki efektivitas terbatas karena bakteri terisolasi dalam abses'],
    pencegahan: ['Desinfeksi alat gunting bulu, kastrasi, dan pencucuk tanduk antar hewan', 'Vaksinasi CLA pada kawanan di area endemik bila tersedia', 'Hindari luka tidak perlu pada ternak', 'Buang ternak positif dari program pembibitan'],
    referensiObatId: ['penicillin-g-procaine', 'chlorhexidine', 'povidone-iodine'],
  },
  {
    penyakitUuid: 'dp-bak-rx-2', // CCPP
    gejalaAwal: ['Demam tinggi mendadak', 'Batuk kering dan sesak napas ringan'],
    gejalaLanjutan: ['Sesak napas berat — kambing bernapas dengan mulut terbuka', 'Suara pernapasan basah dan nyeri saat bernapas', 'Sekret hidung dan air liur berlebihan', 'Kematian dalam 1-3 hari pada kasus perakut'],
    komplikasi: ['Angka kematian 80-100% pada kawanan yang belum pernah terpapar', 'Penyebaran cepat ke seluruh kawanan'],
    penyebab: 'Infeksi Mycoplasma capricolum subsp. capripneumoniae (Mccp) yang menyebabkan pleuropneumonia fibrinosa berat.',
    caraPenularan: ['Droplet pernapasan antar kambing — penularan sangat cepat', 'Kontak dengan kambing karier tanpa gejala'],
    faktorRisiko: ['Kawanan tanpa vaksinasi di area endemik', 'Pencampuran kambing dari sumber berbeda tanpa karantina', 'Transportasi jarak jauh yang menimbulkan stres'],
    penanganan: ['Terapi antibiotik golongan tetrasiklin atau makrolida dini atas anjuran dokter hewan', 'Isolasi ketat hewan bergejala dan laporkan ke dinas peternakan', 'Perawatan suportif — cairan dan anti-inflamasi', 'Pertimbangkan vaksinasi darurat pada kawanan yang terancam'],
    pencegahan: ['Vaksinasi rutin di area endemik', 'Karantina ketat kambing baru sebelum bergabung', 'Hindari pencampuran kambing dari sumber berbeda tanpa uji kesehatan'],
    referensiObatId: ['oxytetracycline', 'tylosin', 'flunixin-meglumine'],
    catatan: 'Penyakit lintas batas yang wajib dilaporkan ke OIE — penanganan harus melibatkan otoritas veteriner resmi.',
  },
  {
    penyakitUuid: 'dp-bak-rx-3', // CBPP
    gejalaAwal: ['Demam dan batuk ringan', 'Penurunan nafsu makan dan produksi susu'],
    gejalaLanjutan: ['Sesak napas berat dan napas perut', 'Efusi pleura masif (cairan di rongga dada)', 'Sapi/kerbau berdiri dengan kaki depan terbuka lebar untuk memperluas dada'],
    komplikasi: ['Kematian pada 50-70% kasus yang tidak ditangani', 'Hewan sembuh dapat menjadi karier kronis (sequester paru)'],
    penyebab: 'Infeksi Mycoplasma mycoides subsp. mycoides (MmmSC) yang menyebabkan pneumonia fibrinosa luas.',
    caraPenularan: ['Droplet pernapasan — sangat menular pada kontak dekat', 'Lalu lintas ternak antar daerah/negara tanpa karantina'],
    faktorRisiko: ['Kawanan tanpa vaksinasi CBPP', 'Lalu lintas ternak dari daerah endemik', 'Kepadatan kandang atau penggembalaan padat'],
    penanganan: ['Laporkan segera ke dinas peternakan/karantina sebagai penyakit wajib lapor', 'Terapi antibiotik (tetrasiklin, makrolida) atas arahan otoritas veteriner', 'Isolasi ketat kawanan yang terinfeksi', 'Pemusnahan hewan sesuai regulasi bila diperlukan'],
    pencegahan: ['Vaksinasi CBPP rutin di area endemik', 'Karantina ternak impor/baru secara ketat', 'Kontrol lalu lintas ternak antar daerah'],
    referensiObatId: ['oxytetracycline', 'tylosin', 'flunixin-meglumine'],
    catatan: 'Penyakit lintas batas yang wajib dilaporkan ke OIE — berdampak besar pada perdagangan sapi internasional.',
  },
  {
    penyakitUuid: 'dp-bak-rx-4', // Q Fever
    gejalaAwal: ['Umumnya subklinis atau tidak bergejala pada ternak', 'Aborsi sporadis pada domba dan kambing'],
    gejalaLanjutan: ['Badai aborsi endemik pada kawanan yang belum terpapar', 'Kelahiran anak lemah atau mati', 'Metritis pasca aborsi'],
    komplikasi: ['Infertilitas sementara pada kawanan yang terkena wabah', 'Risiko wabah pada manusia di sekitar peternakan'],
    penyebab: 'Infeksi bakteri intraseluler obligat Coxiella burnetii yang berkembang biak dalam plasenta dan jaringan reproduksi.',
    caraPenularan: ['Inhalasi aerosol dari plasenta, cairan aborsi, dan feses ternak terinfeksi', 'Konsumsi susu mentah yang terkontaminasi (zoonosis)', 'Caplak sebagai vektor mekanis di beberapa wilayah'],
    faktorRisiko: ['Peternakan dengan riwayat aborsi endemik tidak jelas sebabnya', 'Petugas yang sering kontak dengan proses kelahiran ternak', 'Kawanan di area dengan populasi caplak tinggi'],
    penanganan: ['Terapi tetrasiklin pada hewan yang aborsi untuk mengurangi ekskresi bakteri', 'Buang plasenta dan jaringan aborsi secara aman menggunakan APD', 'Disinfeksi area kelahiran dengan desinfektan yang efektif terhadap Coxiella', 'Laporkan kluster kasus aborsi ke otoritas veteriner dan kesehatan masyarakat'],
    pencegahan: ['Pembakaran/penguburan dalam semua jaringan aborsi', 'Pembatasan akses orang ke area kelahiran', 'Pasteurisasi susu wajib di area endemik', 'Vaksinasi ternak bila tersedia di wilayah tersebut'],
    referensiObatId: ['oxytetracycline', 'doxycycline'],
    catatan: 'Zoonosis penting — Coxiella burnetii sangat tahan di lingkungan dan dapat menyebabkan wabah pada manusia di sekitar peternakan. Koordinasi dengan dinas kesehatan sangat diperlukan.',
  },
  {
    penyakitUuid: 'dp-bak-rx-5', // Vibriosis Reproduksi Sapi
    gejalaAwal: ['Tidak ada gejala klinis yang tampak pada sapi betina', 'Kegagalan bunting setelah perkawinan berulang'],
    gejalaLanjutan: ['Kematian embrio dini (28-35 hari kebuntingan) menyebabkan return to service', 'Penurunan angka kebuntingan kawanan secara menyeluruh', 'Aborsi sporadis pada kebuntingan yang lebih tua'],
    komplikasi: ['Perpanjangan calving interval secara signifikan', 'Kerugian ekonomi besar pada sistem perkawinan alami'],
    penyebab: 'Infeksi Campylobacter fetus subsp. venerealis pada saluran reproduksi sapi, ditularkan eksklusif melalui perkawinan.',
    caraPenularan: ['Perkawinan alami dengan pejantan karier (karier tanpa gejala seumur hidup)', 'Inseminasi buatan dengan semen terkontaminasi yang tidak diproses dengan benar'],
    faktorRisiko: ['Penggunaan pejantan alam tanpa uji kesehatan reproduksi periodik', 'Sistem perkawinan alami dengan satu pejantan untuk banyak betina', 'Pejantan dewasa di atas 4 tahun lebih sering menjadi karier kronis'],
    penanganan: ['Uji bakteriologis smegma preputial pada pejantan yang dicurigai', 'Terapi antibiotik lokal dan sistemik pada pejantan karier atas anjuran dokter hewan', 'Istirahatkan pejantan dari perkawinan minimal 60 hari selama terapi', 'Alihkan ke program IB dengan semen bersertifikat bebas penyakit'],
    pencegahan: ['Uji kesehatan reproduksi pejantan alam setahun sekali', 'Utamakan inseminasi buatan dengan semen dari pusat IB berlisensi', 'Vaksinasi vibriosis pada kawanan yang menggunakan perkawinan alam di area endemik'],
    referensiObatId: ['streptomycin', 'penicillin-g-procaine'],
    catatan: 'Berbeda dari dp-bak-012 (Campylobacter fetus subsp. fetus yang menyebabkan aborsi domba/sapi) — subspesies venerealis eksklusif ditularkan secara venereal pada sapi.',
  },
  {
    penyakitUuid: 'dp-par-rx-1', // Trypanosomiasis/Surra
    gejalaAwal: ['Demam intermiten', 'Penurunan nafsu makan dan produksi susu'],
    gejalaLanjutan: ['Anemia progresif, selaput lendir pucat', 'Edema pada bagian bawah tubuh (dewlap, dada, kaki)', 'Kelemahan ekstrem dan penurunan berat badan drastis', 'Gangguan saraf (kelemahan kaki belakang) pada kasus kronis'],
    komplikasi: ['Kematian pada kasus yang tidak ditangani dalam beberapa bulan', 'Aborsi pada betina bunting yang terinfeksi'],
    penyebab: 'Infeksi protozoa Trypanosoma evansi yang menyerang dan merusak sel darah merah.',
    caraPenularan: ['Gigitan mekanis lalat penghisap darah (Tabanus, Stomoxys, Haematopota) — tidak menular kontak langsung', 'Alat suntik/peralatan terkontaminasi darah'],
    faktorRisiko: ['Area dengan populasi lalat penghisap darah tinggi', 'Musim penghujan dan area dekat semak lebat', 'Ternak dalam kondisi tubuh dan nutrisi rendah'],
    penanganan: ['Terapi antiprotozoa (diminazene aceturate) sesuai anjuran dokter hewan', 'Perawatan suportif — perbaikan nutrisi dan vitamin', 'Kontrol vektor lalat di sekitar kandang', 'Pemeriksaan darah untuk konfirmasi diagnosis'],
    pencegahan: ['Kontrol populasi lalat dengan insektisida dan manajemen lingkungan', 'Pemeriksaan darah berkala pada kawanan di area endemik', 'Hindari penggembalaan di area dengan populasi vektor sangat tinggi', 'Pemberian profilaksis antiprotozoa pada ternak di area endemik berat bila dianjurkan dokter hewan'],
    referensiObatId: ['diminazene', 'vitamin-b-kompleks', 'mineral-mix-ternak'],
    catatan: 'Endemik di beberapa wilayah Indonesia — konsultasikan dengan dinas peternakan setempat untuk protokol penanganan yang berlaku.',
  },
  {
    penyakitUuid: 'dp-par-rx-2', // Hidatidosis
    gejalaAwal: ['Umumnya tidak bergejala selama bertahun-tahun (kista berkembang lambat)', 'Penurunan berat badan bertahap bila kista menjadi besar'],
    gejalaLanjutan: ['Sesak napas bila kista besar di paru', 'Penurunan produksi dan kondisi tubuh kronis', 'Hati atau paru teraba abnormal pada pemeriksaan'],
    komplikasi: ['Ruptur kista yang menyebabkan reaksi anafilaksis fatal', 'Penyebaran kista sekunder bila ruptur', 'Kerugian saat pemotongan — organ terkena harus diafkir'],
    penyebab: 'Infeksi larva cestoda Echinococcus granulosus; ternak adalah inang antara, anjing adalah inang definitif.',
    caraPenularan: ['Konsumsi pakan/air terkontaminasi telur dari feses anjing yang terinfeksi', 'Anjing yang memakan organ ternak mengandung kista hydatid mengembangkan cacing dewasa dan menyebarkan telur'],
    faktorRisiko: ['Keberadaan anjing penjaga ternak yang diberi pakan sisa organ mentah', 'Pemotongan ternak tidak di RPH resmi dengan pengelolaan organ sembarangan', 'Area dengan tradisi memberi organ mentah ke anjing'],
    penanganan: ['Tidak ada pengobatan efektif untuk kista yang sudah terbentuk pada ternak', 'Organ terkena harus diafkir saat pemotongan dan dibuang secara aman (jangan diberikan ke anjing)', 'Obati anjing penjaga dengan praziquantel secara berkala'],
    pencegahan: ['Larang pemberian organ ternak mentah kepada anjing', 'Obati anjing penjaga ternak dengan praziquantel setiap 6 minggu', 'Afkir dan bakar/kubur organ yang mengandung kista dari RPH', 'Higiene saat menangani kotoran anjing'],
    referensiObatId: ['praziquantel'],
    catatan: 'Zoonosis penting — manusia dapat terinfeksi melalui kontak dengan kotoran anjing yang terinfeksi; kista hidatid di hati/paru manusia memerlukan penanganan bedah.',
  },
  {
    penyakitUuid: 'dp-par-rx-3', // Scrapie
    gejalaAwal: ['Perubahan perilaku — hewan tampak cemas atau menyendiri', 'Gatal ringan yang ditunjukkan dengan menggosokkan tubuh ke pagar/kandang'],
    gejalaLanjutan: ['Gatal hebat menyebabkan kerontokan bulu masif', 'Ataksia progresif — gaya berjalan sempoyongan terutama pada kaki belakang', 'Gemetar dan kelemahan otot', 'Kematian dalam hitungan bulan setelah gejala muncul'],
    komplikasi: ['Selalu fatal — tidak ada penyembuhan setelah gejala klinis muncul'],
    penyebab: 'Akumulasi protein prion abnormal (PrPSc) di jaringan saraf pusat; bukan infeksi konvensional.',
    caraPenularan: ['Kontak dengan cairan tubuh, plasenta, dan tanah terkontaminasi prion dari hewan terinfeksi', 'Penularan vertikal dari induk ke anak mungkin terjadi'],
    faktorRisiko: ['Predisposisi genetik (genotipe PrP tertentu sangat rentan)', 'Kawanan dengan riwayat kasus scrapie', 'Penggabungan domba dari sumber tanpa status scrapie yang jelas'],
    penanganan: ['Tidak ada pengobatan — eutanasia humanis saat gejala klinis muncul', 'Laporkan segera ke otoritas veteriner sebagai penyakit wajib lapor', 'Pembatasan pergerakan kawanan yang terkena sesuai regulasi'],
    pencegahan: ['Seleksi genetik domba dengan genotipe PrP yang resisten (ARR/ARR)', 'Hindari membeli domba dari kawanan dengan status scrapie tidak diketahui', 'Buang plasenta dan jaringan abortus dari hewan berisiko secara aman'],
    referensiObatId: [],
    catatan: 'Penyakit TSE (Transmissible Spongiform Encephalopathy) yang wajib dilaporkan. Prion sangat tahan di lingkungan — tanah yang terkontaminasi dapat tetap infeksius selama bertahun-tahun.',
  },
  {
    penyakitUuid: 'dp-penc-rx-1', // Liver Abscess
    gejalaAwal: ['Umumnya tidak bergejala klinis yang spesifik (subklinis)', 'Penurunan konsumsi pakan dan penurunan pertambahan berat badan'],
    gejalaLanjutan: ['Penurunan kinerja pertumbuhan di bawah ekspektasi', 'Demam intermiten ringan', 'Ditemukan abses hati saat pemotongan (diagnosis post-mortem paling umum)'],
    komplikasi: ['Infeksi vena cava posterior (vena cava thrombosis) dari abses besar yang pecah — menyebabkan batuk berdarah dan kematian', 'Kerugian ekonomi saat pemotongan akibat hati diafkir'],
    penyebab: 'Migrasi bakteri Fusobacterium necrophorum (dan sering Trueperella pyogenes) dari rumen yang terluka akibat asidosis ke hati melalui aliran darah portal.',
    caraPenularan: ['Tidak menular — kondisi metabolik individual akibat manajemen pakan konsentrat tinggi'],
    faktorRisiko: ['Ransum konsentrat tinggi tanpa cukup serat kasar (roughage)', 'Peralihan pakan mendadak ke konsentrat tinggi tanpa adaptasi', 'Asidosis subakut rumen (SARA) yang tidak terdeteksi dan berulang'],
    penanganan: ['Sulit dideteksi dan diobati saat masih hidup tanpa pemeriksaan USG', 'Pemberian antibiotik preventif (klortetrasiklin) pada pakan feedlot dapat mengurangi insiden', 'Evaluasi ulang manajemen pakan — tingkatkan proporsi hijauan', 'Konsultasikan dengan dokter hewan untuk program pencegahan di feedlot'],
    pencegahan: ['Pertahankan rasio serat kasar (roughage) minimal 15% bahan kering dalam ransum feedlot', 'Adaptasi konsentrat secara bertahap saat awal penggemukan', 'Pemberian buffer rumen (sodium bikarbonat) untuk menstabilkan pH', 'Monitor konsumsi pakan secara individual bila memungkinkan'],
    referensiObatId: ['chlortetracycline', 'sodium-bikarbonat', 'toner-rumen-yeast-culture'],
  },
  {
    penyakitUuid: 'dp-lain-rx-1', // Urolitiasis
    gejalaAwal: ['Sering mengejan untuk buang air kecil dengan urin yang keluar sedikit atau tidak ada', 'Gelisah dan menendang-nendang perut'],
    gejalaLanjutan: ['Distensi abdomen akibat kandung kemih yang tidak bisa dikosongkan', 'Nyeri hebat, tampak kolik', 'Uretra pecah — urin merembes ke bawah kulit (uroperineum) atau kandung kemih pecah'],
    komplikasi: ['Ruptur kandung kemih yang berakibat fatal bila tidak ditangani darurat', 'Uremia (keracunan produk limbah) dan kematian'],
    penyebab: 'Pembentukan kristal atau batu mineral (struvit, kalsium karbonat, silikat) yang menyumbat uretra, terutama pada jantan yang dikebiri (kastrasi) dengan diameter uretra yang kecil.',
    caraPenularan: ['Tidak menular — gangguan metabolik mineral individu'],
    faktorRisiko: ['Rasio kalsium:fosfor tidak seimbang dalam ransum (fosfor berlebih dari biji-bijian)', 'Konsumsi air minum kurang', 'Kastrasi dini pada domba/kambing jantan sebelum pertumbuhan uretra sempurna', 'Ransum konsentrat tinggi tanpa hijauan cukup'],
    penanganan: ['Hubungi dokter hewan segera — kondisi darurat', 'Amputation processus urethralis (ujung penis) sebagai tindakan pertama pada domba/kambing', 'Pembedahan (urethrostomy) bila diperlukan', 'Infus dan terapi suportif untuk menstabilkan kondisi', 'Evaluasi ulang ransum secara menyeluruh'],
    pencegahan: ['Jaga rasio kalsium:fosfor ransum 2:1 hingga 2,5:1', 'Pastikan akses air minum segar dan bersih sepanjang hari', 'Tambahkan garam (NaCl 0,5-1%) ke ransum untuk merangsang konsumsi air', 'Hindari kastrasi terlalu dini pada domba/kambing jantan', 'Kurangi proporsi biji-bijian dan tambahkan hijauan kasar dalam ransum'],
    referensiObatId: ['flunixin-meglumine', 'ringer-laktat', 'sodium-bikarbonat'],
  },
  {
    penyakitUuid: 'dp-lain-rx-2', // Pizzle Rot
    gejalaAwal: ['Preputium tampak basah dan berbau amonia', 'Sedikit bengkak pada ujung preputium'],
    gejalaLanjutan: ['Ulserasi dan lesi keropeng pada preputium dan ujung penis', 'Nyeri saat buang air kecil — hewan mengejan atau menghindari urinasi', 'Pincang akibat nyeri dan bengkak pada daerah preputium yang mengganggu pergerakan'],
    komplikasi: ['Penyempitan preputium (fimosis) akibat jaringan parut', 'Infeksi sekunder bakteri yang memperparah lesi', 'Gangguan atau ketidakmampuan perkawinan pada pejantan'],
    penyebab: 'Akumulasi urea pada preputium yang diurai oleh Corynebacterium renale menjadi amonia, menyebabkan dermatitis alkalin dan ulserasi.',
    caraPenularan: ['Tidak menular — kondisi metabolik individu akibat ekskresi urea tinggi'],
    faktorRisiko: ['Konsumsi protein kasar berlebihan dalam ransum', 'Domba/kambing jantan kastrasi lebih rentan (preputium lebih tergantung)', 'Kebersihan area perineum yang buruk', 'Lingkungan kandang basah dan lembap'],
    penanganan: ['Kurangi kadar protein dalam ransum segera', 'Bersihkan lesi preputium dengan antiseptik yang sesuai', 'Salep antibiotik topikal pada ulserasi untuk mencegah infeksi sekunder', 'Antibiotik sistemik bila infeksi menyebar sesuai anjuran dokter hewan'],
    pencegahan: ['Atur kadar protein kasar ransum tidak melebihi 16% bahan kering untuk domba dewasa', 'Jaga area kandang tetap kering', 'Periksa kondisi preputium secara rutin terutama pada ternak yang baru diganti ransumnya', 'Tambahkan sulfur (0,5% bahan kering) ke ransum untuk mengurangi ekskresi urea bila diperlukan'],
    referensiObatId: ['chlorhexidine', 'povidone-iodine', 'oxytetracycline'],
  },
  {
    penyakitUuid: 'dp-nut-rx-1', // Toksemia Kebuntingan
    gejalaAwal: ['Pemisahan diri dari kawanan dan depresi pada induk bunting tua', 'Penurunan nafsu makan drastis dalam 2-6 minggu sebelum melahirkan'],
    gejalaLanjutan: ['Kebutaan (amaurosis) dan gerakan berputar akibat hipoglikemia otak', 'Gemetar dan ketidakmampuan berdiri', 'Bau aseton pada napas', 'Kematian induk dan anak bila tidak ditangani dalam 24-48 jam'],
    komplikasi: ['Kematian anak dalam kandungan', 'Kematian induk akibat ketoasidosis dan gangguan organ', 'Induk yang sembuh sering mengalami penurunan fertilitas jangka panjang'],
    penyebab: 'Defisit energi berat (negative energy balance) pada domba/kambing yang bunting kembar atau triplet, memaksa mobilisasi lemak tubuh berlebihan yang menghasilkan badan keton toksik.',
    caraPenularan: ['Tidak menular — gangguan metabolik akibat manajemen nutrisi dan kebuntingan kembar'],
    faktorRisiko: ['Kebuntingan kembar atau triplet (faktor risiko utama)', 'Pemberian pakan tidak cukup pada trimester akhir kebuntingan', 'Induk dengan kondisi tubuh terlalu gemuk di awal kebuntingan', 'Stres lingkungan atau cuaca ekstrem menjelang melahirkan', 'Penyakit atau kondisi lain yang mengurangi nafsu makan menjelang melahirkan'],
    penanganan: ['Pemberian glukosa/propilen glikol oral sesegera mungkin (50-100 ml setiap 8 jam)', 'Infus dekstrosa intravena pada kasus berat atas anjuran dokter hewan', 'Pertimbangkan induksi kelahiran atau caesar bila janin sudah cukup dewasa', 'Injeksi kortikosteroid untuk menginduksi partus dini pada kasus sangat berat', 'Perawatan intensif — isolasi, pakan energi tinggi, air selalu tersedia'],
    pencegahan: ['Scanning kebuntingan (USG) untuk mendeteksi kembar lebih awal dan menyesuaikan manajemen', 'Penuhi kebutuhan energi secara bertahap sejak 6 minggu sebelum melahirkan', 'Pertahankan kondisi tubuh induk pada BCS 3-3,5 saat bunting', 'Hindari stres dan perubahan manajemen mendadak pada periode akhir kebuntingan'],
    referensiObatId: ['propilen-glikol', 'kalsium-propionat', 'vitamin-b-kompleks', 'multivitamin-ternak'],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getPenyakitDetailByUuid(uuid: string): PenyakitDetail | undefined {
  return PENYAKIT_DETAIL_DB.find((d) => d.penyakitUuid === uuid);
}
