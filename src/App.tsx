import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';

import { hasCompletedOnboarding } from './data/onboardingData';
import WorkspacePermissionGuard from './components/auth/WorkspacePermissionGuard';
import AdminGuard from './pages/admin/layout/AdminGuard';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './components/PublicLayout';
import ProtectedLayout from './components/ProtectedLayout';
import { WorkspaceProviderLayout } from './components/ProtectedLayout';
import PublicAppLayout from './components/PublicAppLayout';
import { AuthenticatedRoute, OnboardingRoute } from './components/AuthenticatedRoute';
import Landing from './pages/Landing';
import InitializeGuard from './components/InitializeGuard';
import PlatformInitGuard from './components/PlatformInitGuard';
import Initialize from './pages/auth/Initialize';
// Route-level bundles: each domain is fetched only when one of its routes is visited.
// Pages in the same domain intentionally share a chunk to avoid over-splitting.
// marketplace routes
const Marketplace = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.Marketplace })));
const MarketplaceBuatListing = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceBuatListing })));
const MarketplaceListingSaya = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceListingSaya })));
const MarketplaceKelolaListing = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceKelolaListing })));
const MarketplaceDetailListing = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceDetailListing })));
const MarketplaceTransaksi = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceTransaksi })));
const MarketplaceDetailTransaksi = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceDetailTransaksi })));
const MarketplaceNegosiasi = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceNegosiasi })));
const MarketplaceDetailNegosiasi = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceDetailNegosiasi })));
const MarketplaceBuatNegosiasi = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceBuatNegosiasi })));
const MarketplaceChatList = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceChatList })));
const MarketplaceChat = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceChat })));
const MarketplaceNotifikasi = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceNotifikasi })));
const MarketplaceDashboard = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceDashboard })));
const MarketplaceDashboardPembeli = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceDashboardPembeli })));
const MarketplaceWishlist = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceWishlist })));
const MarketplaceRiwayatAktivitas = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceRiwayatAktivitas })));
const MarketplaceVerifikasi = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceVerifikasi })));
const MarketplaceLaporan = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceLaporan })));
const MarketplaceBuatLaporan = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceBuatLaporan })));
const MarketplaceDetailLaporan = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceDetailLaporan })));
const MarketplaceModerasiKasus = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceModerasiKasus })));
const MarketplaceModerasiDetailKasus = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceModerasiDetailKasus })));
const MarketplaceAiInsight = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceAiInsight })));
const MarketplaceConversation = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceConversation })));
const MarketplaceEvidenceTimeline = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceEvidenceTimeline })));
const MarketplaceAuditTimeline = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceAuditTimeline })));
const MarketplaceEscrowDetail = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceEscrowDetail })));
const MarketplaceEscrowProviderDetail = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceEscrowProviderDetail })));
const MarketplaceTransactionReceipt = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceTransactionReceipt })));
const MarketplaceTransactionAttachments = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceTransactionAttachments })));
const MarketplaceEscrowInfo = lazy(() => import('./routeBundles/marketplace').then(m => ({ default: m.MarketplaceEscrowInfo })));
// farm routes
const Livestock = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.Livestock })));
const AddLivestock = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.AddLivestock })));
const LivestockProfile = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.LivestockProfile })));
const CatatBobot = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.CatatBobot })));
const RiwayatBobot = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.RiwayatBobot })));
const RiwayatKesehatanHewanDetail = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.RiwayatKesehatanHewanDetail })));
const PemberianPakan = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.PemberianPakan })));
const JadwalPemberianPakan = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.JadwalPemberianPakan })));
const RiwayatPemberianPakan = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.RiwayatPemberianPakan })));
const RiwayatPemberianPakanDetail = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.RiwayatPemberianPakanDetail })));
const RiwayatKesehatan = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.RiwayatKesehatan })));
const RiwayatPakan = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.RiwayatPakan })));
const Reproduksi = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.Reproduksi })));
const RiwayatReproduksi = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.RiwayatReproduksi })));
const Mutasi = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.Mutasi })));
const RiwayatMutasi = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.RiwayatMutasi })));
const StokPakan = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.StokPakan })));
const MasterPakanKategoriDetail = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.MasterPakanKategoriDetail })));
const MasterPakanJagung = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.MasterPakanJagung })));
const MasterPakanPadi = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.MasterPakanPadi })));
const MasterPakanRumput = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.MasterPakanRumput })));
const MasterPakanLeguminosa = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.MasterPakanLeguminosa })));
const MasterPakanUmbi = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.MasterPakanUmbi })));
const MasterPakanDaunan = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.MasterPakanDaunan })));
const MasterPakanKacangBijian = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.MasterPakanKacangBijian })));
const MasterPakanSerealiaLain = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.MasterPakanSerealiaLain })));
const MasterPakanKelapa = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.MasterPakanKelapa })));
const MasterPakanKelapaSawit = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.MasterPakanKelapaSawit })));
const MasterPakanTebu = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.MasterPakanTebu })));
const MasterPakanBuahLimbah = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.MasterPakanBuahLimbah })));
const MasterPakanLimbahIndustriPangan = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.MasterPakanLimbahIndustriPangan })));
const MasterPakanSumberProteinHewani = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.MasterPakanSumberProteinHewani })));
const MasterPakanMineral = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.MasterPakanMineral })));
const MasterPakanVitaminFeedAdditive = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.MasterPakanVitaminFeedAdditive })));
const MasterPakanBahanCair = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.MasterPakanBahanCair })));
const MasterPakanLainnya = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.MasterPakanLainnya })));
const ProdukKomersialKonsentrat = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.ProdukKomersialKonsentrat })));
const ProdukKomersialDashboard = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.ProdukKomersialDashboard })));
const ProdukKomersialAdmin = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.ProdukKomersialAdmin })));
const MasterReferensiPK = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.MasterReferensiPK })));
const KonsentratBrandSeri = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.KonsentratBrandSeri })));
const KonsentratProdukDetail = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.KonsentratProdukDetail })));
const ProdukKomersialKategoriGeneric = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.ProdukKomersialKategoriGeneric })));
const ProdukKomersialBrandSeriGeneric = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.ProdukKomersialBrandSeriGeneric })));
const ProdukKomersialSeriProdukGeneric = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.ProdukKomersialSeriProdukGeneric })));
const ProdukKomersialProdukDetailGeneric = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.ProdukKomersialProdukDetailGeneric })));
const KnowledgeBasePK = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.KnowledgeBasePK })));
const KnowledgeBasePKArtikelDetail = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.KnowledgeBasePKArtikelDetail })));
const KnowledgeBasePKAdmin = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.KnowledgeBasePKAdmin })));
const AIReadinessPK = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.AIReadinessPK })));
const MasterPakanItemDetail = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.MasterPakanItemDetail })));
const KeluarkanStokPakan = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.KeluarkanStokPakan })));
const RiwayatStokPakan = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.RiwayatStokPakan })));
const TambahStokPakan = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.TambahStokPakan })));
const StokInventarisDetail = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.StokInventarisDetail })));
const PerubahanStok = lazy(() => import('./routeBundles/feed').then(m => ({ default: m.PerubahanStok })));
const FormulaDetail = lazy(() => import('./routeBundles/formula').then(m => ({ default: m.FormulaDetail })));
const FormulaEditor = lazy(() => import('./routeBundles/formula').then(m => ({ default: m.FormulaEditor })));
const FormulaProduksi = lazy(() => import('./routeBundles/formula').then(m => ({ default: m.FormulaProduksi })));
const RiwayatProduksiFormula = lazy(() => import('./routeBundles/formula').then(m => ({ default: m.RiwayatProduksiFormula })));
const RiwayatProduksiFormulaDetail = lazy(() => import('./routeBundles/formula').then(m => ({ default: m.RiwayatProduksiFormulaDetail })));
const TambahStokObat = lazy(() => import('./routeBundles/medicine').then(m => ({ default: m.TambahStokObat })));
const PenyesuaianStokObat = lazy(() => import('./routeBundles/medicine').then(m => ({ default: m.PenyesuaianStokObat })));
const StokObat = lazy(() => import('./routeBundles/medicine').then(m => ({ default: m.StokObat })));
const MasterObatKategoriDetail = lazy(() => import('./routeBundles/medicine').then(m => ({ default: m.MasterObatKategoriDetail })));
const MasterObatItemDetail = lazy(() => import('./routeBundles/medicine').then(m => ({ default: m.MasterObatItemDetail })));
const MasterObatSubKategori = lazy(() => import('./routeBundles/medicine').then(m => ({ default: m.MasterObatSubKategori })));
const MasterObatDetailPage = lazy(() => import('./routeBundles/medicine').then(m => ({ default: m.MasterObatDetailPage })));
const KategoriPenyakit = lazy(() => import('./routeBundles/medicine').then(m => ({ default: m.KategoriPenyakit })));
const DaftarPenyakit = lazy(() => import('./routeBundles/medicine').then(m => ({ default: m.DaftarPenyakit })));
const MasterPenyakitItemDetail = lazy(() => import('./routeBundles/medicine').then(m => ({ default: m.MasterPenyakitItemDetail })));
const ProdukKomersialObatItemDetail = lazy(() => import('./routeBundles/medicine').then(m => ({ default: m.ProdukKomersialObatItemDetail })));
const RiwayatObatDetail = lazy(() => import('./routeBundles/medicine').then(m => ({ default: m.RiwayatObatDetail })));
const ProdukKomersialObatAdmin = lazy(() => import('./routeBundles/medicine').then(m => ({ default: m.ProdukKomersialObatAdmin })));
const ProdukKomersialObatImportExport = lazy(() => import('./routeBundles/medicine').then(m => ({ default: m.ProdukKomersialObatImportExport })));
const ProdukKomersialObatAdminBrand = lazy(() => import('./routeBundles/medicine').then(m => ({ default: m.ProdukKomersialObatAdminBrand })));
const ProdukKomersialObatAdminProduk = lazy(() => import('./routeBundles/medicine').then(m => ({ default: m.ProdukKomersialObatAdminProduk })));
const BatchProfile = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.BatchProfile })));
const ArchiveLivestock = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.ArchiveLivestock })));
const ActiveLivestock = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.ActiveLivestock })));
const OutsideLivestock = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.OutsideLivestock })));
const Silsilah = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.Silsilah })));
const Keturunan = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.Keturunan })));
const RiwayatKepemilikan = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.RiwayatKepemilikan })));
const AllBatchMembers = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.AllBatchMembers })));
const BatchOperasi = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.BatchOperasi })));
const BatchList = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.BatchList })));
const BatchRiwayat = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.BatchRiwayat })));
const CreateBatch = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.CreateBatch })));
const SiblingList = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.SiblingList })));
const FotoHistory = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.FotoHistory })));
const EditLivestock = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.EditLivestock })));
// feedStore routes
const FeedStoreWorkspaceRoute = lazy(() => import('./routeBundles/feedStore').then(m => ({ default: m.FeedStoreWorkspaceRoute })));
const FeedStoreSupplierDetail = lazy(() => import('./routeBundles/feedStore').then(m => ({ default: m.FeedStoreSupplierDetail })));
const FeedStoreCustomerDetail = lazy(() => import('./routeBundles/feedStore').then(m => ({ default: m.FeedStoreCustomerDetail })));
// drugStore routes
const DrugStoreSupplierList = lazy(() => import('./routeBundles/drugStore').then(m => ({ default: m.DrugStoreSupplierList })));
const DrugStoreSupplierForm = lazy(() => import('./routeBundles/drugStore').then(m => ({ default: m.DrugStoreSupplierForm })));
const DrugStoreSupplierDetail = lazy(() => import('./routeBundles/drugStore').then(m => ({ default: m.DrugStoreSupplierDetail })));
const DrugStoreCustomerList = lazy(() => import('./routeBundles/drugStore').then(m => ({ default: m.DrugStoreCustomerList })));
const DrugStoreCustomerForm = lazy(() => import('./routeBundles/drugStore').then(m => ({ default: m.DrugStoreCustomerForm })));
const DrugStoreCustomerDetail = lazy(() => import('./routeBundles/drugStore').then(m => ({ default: m.DrugStoreCustomerDetail })));
const DrugStoreOrderList = lazy(() => import('./routeBundles/drugStore').then(m => ({ default: m.DrugStoreOrderList })));
const DrugStoreOrderForm = lazy(() => import('./routeBundles/drugStore').then(m => ({ default: m.DrugStoreOrderForm })));
const DrugStoreOrderDetail = lazy(() => import('./routeBundles/drugStore').then(m => ({ default: m.DrugStoreOrderDetail })));
const DrugStoreSalesList = lazy(() => import('./routeBundles/drugStore').then(m => ({ default: m.DrugStoreSalesList })));
const DrugStoreSalesForm = lazy(() => import('./routeBundles/drugStore').then(m => ({ default: m.DrugStoreSalesForm })));
const DrugStoreSalesDetail = lazy(() => import('./routeBundles/drugStore').then(m => ({ default: m.DrugStoreSalesDetail })));
const DrugStoreStokKeluar = lazy(() => import('./routeBundles/drugStore').then(m => ({ default: m.DrugStoreStokKeluar })));
// workspace routes
const TransportWorkspace = lazy(() => import('./routeBundles/workspace').then(m => ({ default: m.TransportWorkspace })));
const VeterinaryWorkspace = lazy(() => import('./routeBundles/workspace').then(m => ({ default: m.VeterinaryWorkspace })));
const KlinikHewanWorkspace = lazy(() => import('./routeBundles/workspace').then(m => ({ default: m.KlinikHewanWorkspace })));
const DrugStoreWorkspaceRoute = lazy(() => import('./routeBundles/workspace').then(m => ({ default: m.DrugStoreWorkspaceRoute })));
const FarmProfile = lazy(() => import('./routeBundles/workspace').then(m => ({ default: m.FarmProfile })));
// profile routes
const Profile = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.Profile })));
const ProfileAccount = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.ProfileAccount })));
const ProfileWorkspace = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.ProfileWorkspace })));
const ProfileWorkspaceDetail = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.ProfileWorkspaceDetail })));
const ProfileBusinessInsight = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.ProfileBusinessInsight })));
const ProfileSecurity = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.ProfileSecurity })));
const ProfileNotification = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.ProfileNotification })));
const ProfileAbout = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.ProfileAbout })));
const ProfileAboutRoadmap = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.ProfileAboutRoadmap })));
const ProfileAboutChangelog = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.ProfileAboutChangelog })));
const ProfileAboutLegal = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.ProfileAboutLegal })));
const ProfileAboutPartner = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.ProfileAboutPartner })));
const ProfileSupport = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.ProfileSupport })));
const ProfileSupportHelp = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.ProfileSupportHelp })));
const ProfileSupportFaq = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.ProfileSupportFaq })));
const ProfileSupportReportBug = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.ProfileSupportReportBug })));
const ProfileSupportFeedback = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.ProfileSupportFeedback })));
const ProfileSupportContact = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.ProfileSupportContact })));
const WorkspaceSettingsProfile = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.WorkspaceSettingsProfile })));
const WorkspacePublicProfile = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.WorkspacePublicProfile })));
const WorkspaceSettingsMembers = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.WorkspaceSettingsMembers })));
const WorkspaceSettingsArchive = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.WorkspaceSettingsArchive })));
const WorkspaceSettingsRoles = lazy(() => import('./routeBundles/profile').then(m => ({ default: m.WorkspaceSettingsRoles })));
// dashboard routes
const DashboardAiInsight = lazy(() => import('./routeBundles/dashboard').then(m => ({ default: m.DashboardAiInsight })));
const DashboardTodayActivity = lazy(() => import('./routeBundles/dashboard').then(m => ({ default: m.DashboardTodayActivity })));
const DashboardAlertReminder = lazy(() => import('./routeBundles/dashboard').then(m => ({ default: m.DashboardAlertReminder })));
const DashboardRecentActivity = lazy(() => import('./routeBundles/dashboard').then(m => ({ default: m.DashboardRecentActivity })));
const SearchPage = lazy(() => import('./routeBundles/dashboard').then(m => ({ default: m.SearchPage })));
const NotificationCenter = lazy(() => import('./routeBundles/dashboard').then(m => ({ default: m.NotificationCenter })));
// news routes
const NewsEvent = lazy(() => import('./routeBundles/news').then(m => ({ default: m.NewsEvent })));
const NewsEventDetail = lazy(() => import('./routeBundles/news').then(m => ({ default: m.NewsEventDetail })));
const NewsEventSubmission = lazy(() => import('./routeBundles/news').then(m => ({ default: m.NewsEventSubmission })));
const NewsSubmissionForm = lazy(() => import('./routeBundles/news').then(m => ({ default: m.NewsSubmissionForm })));
const EventSubmissionForm = lazy(() => import('./routeBundles/news').then(m => ({ default: m.EventSubmissionForm })));
const NewsEventSubmissionPreview = lazy(() => import('./routeBundles/news').then(m => ({ default: m.NewsEventSubmissionPreview })));
const NewsEventSubmissionDetail = lazy(() => import('./routeBundles/news').then(m => ({ default: m.NewsEventSubmissionDetail })));
const AdminNewsEventReview = lazy(() => import('./routeBundles/news').then(m => ({ default: m.AdminNewsEventReview })));
const AdminNewsEventReviewDetail = lazy(() => import('./routeBundles/news').then(m => ({ default: m.AdminNewsEventReviewDetail })));
const AdminRssSources = lazy(() => import('./routeBundles/news').then(m => ({ default: m.AdminRssSources })));
const AdminRssQueue = lazy(() => import('./routeBundles/news').then(m => ({ default: m.AdminRssQueue })));
const AdminPublicationManagement = lazy(() => import('./routeBundles/news').then(m => ({ default: m.AdminPublicationManagement })));
// auth routes
const Login = lazy(() => import('./routeBundles/auth').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./routeBundles/auth').then(m => ({ default: m.Register })));
const VerifyEmail = lazy(() => import('./routeBundles/auth').then(m => ({ default: m.VerifyEmail })));
const ForgotPassword = lazy(() => import('./routeBundles/auth').then(m => ({ default: m.ForgotPassword })));
const WorkspaceSelect = lazy(() => import('./routeBundles/auth').then(m => ({ default: m.WorkspaceSelect })));
const WorkspaceCreate = lazy(() => import('./routeBundles/auth').then(m => ({ default: m.WorkspaceCreate })));
const Onboarding = lazy(() => import('./routeBundles/auth').then(m => ({ default: m.Onboarding })));
const ResetPassword = lazy(() => import('./routeBundles/auth').then(m => ({ default: m.ResetPassword })));
const AcceptInvitation = lazy(() => import('./routeBundles/auth').then(m => ({ default: m.AcceptInvitation })));
// Additional farm routes
const KesehatanHewan = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.KesehatanHewan })));
const PemeriksaanKesehatan = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.PemeriksaanKesehatan })));
const DiagnosaKesehatan = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.DiagnosaKesehatan })));
const TindakanKesehatan = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.TindakanKesehatan })));
const PengobatanKesehatan = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.PengobatanKesehatan })));
const IntegrasiPengobatan = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.IntegrasiPengobatan })));
const KontrolKesehatan = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.KontrolKesehatan })));
const RiwayatKesehatanHewan = lazy(() => import('./routeBundles/livestock').then(m => ({ default: m.RiwayatKesehatanHewan })));
// Additional feedStore routes
const FeedStoreSupplierList = lazy(() => import('./routeBundles/feedStore').then(m => ({ default: m.FeedStoreSupplierList })));
const FeedStoreSupplierForm = lazy(() => import('./routeBundles/feedStore').then(m => ({ default: m.FeedStoreSupplierForm })));
const FeedStoreCustomerList = lazy(() => import('./routeBundles/feedStore').then(m => ({ default: m.FeedStoreCustomerList })));
const FeedStoreCustomerForm = lazy(() => import('./routeBundles/feedStore').then(m => ({ default: m.FeedStoreCustomerForm })));
const FeedStoreOrderList = lazy(() => import('./routeBundles/feedStore').then(m => ({ default: m.FeedStoreOrderList })));
const FeedStoreOrderForm = lazy(() => import('./routeBundles/feedStore').then(m => ({ default: m.FeedStoreOrderForm })));
const FeedStoreOrderDetail = lazy(() => import('./routeBundles/feedStore').then(m => ({ default: m.FeedStoreOrderDetail })));
const FeedStoreSalesList = lazy(() => import('./routeBundles/feedStore').then(m => ({ default: m.FeedStoreSalesList })));
const FeedStoreSalesForm = lazy(() => import('./routeBundles/feedStore').then(m => ({ default: m.FeedStoreSalesForm })));
const FeedStoreSalesDetail = lazy(() => import('./routeBundles/feedStore').then(m => ({ default: m.FeedStoreSalesDetail })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UsersModule = lazy(() => import('./pages/admin/modules/UsersModule'));
const AdminUserProfilesModule = lazy(() => import('./pages/admin/modules/AdminUserProfilesModule'));
const WorkspacesModule = lazy(() => import('./pages/admin/modules/WorkspacesModule'));
const AdminWorkspaceDetail = lazy(() => import('./pages/admin/modules/AdminWorkspaceDetail'));
const AdminWorkspaceMembers = lazy(() => import('./pages/admin/modules/AdminWorkspaceMembers'));
const MarketplaceModule = lazy(() => import('./pages/admin/modules/MarketplaceModule'));
const LivestockModule = lazy(() => import('./pages/admin/modules/LivestockModule'));
const FeedModule = lazy(() => import('./pages/admin/modules/FeedModule'));
const MedicineModule = lazy(() => import('./pages/admin/modules/MedicineModule'));
const SubscriptionModule = lazy(() => import('./pages/admin/modules/SubscriptionModule'));
const TrustModule = lazy(() => import('./pages/admin/modules/TrustModule'));
const AnnouncementsModule = lazy(() => import('./pages/admin/modules/AnnouncementsModule'));
const NotificationsModule = lazy(() => import('./pages/admin/modules/NotificationsModule'));
const ReportsModule = lazy(() => import('./pages/admin/modules/ReportsModule'));
const MonitoringModule = lazy(() => import('./pages/admin/modules/MonitoringModule'));
const PlatformHealthModule = lazy(() => import('./pages/admin/modules/PlatformHealthModule'));
const BackupModule = lazy(() => import('./pages/admin/modules/BackupModule'));
const ActivityCenterModule = lazy(() => import('./pages/admin/modules/ActivityCenterModule'));
const DataMasterModule = lazy(() => import('./pages/admin/modules/DataMasterModule'));
const SettingsModule = lazy(() => import('./pages/admin/modules/SettingsModule'));
const GlobalSearchModule = lazy(() => import('./pages/admin/modules/GlobalSearchModule'));
const EscrowModule = lazy(() => import('./pages/admin/modules/EscrowModule'));
const MasterEscrowModule = lazy(() => import('./pages/admin/modules/MasterEscrowModule'));
const RelationshipModule = lazy(() => import('./pages/admin/modules/RelationshipModule'));
const OwnershipTransferModule = lazy(() => import('./pages/admin/modules/OwnershipTransferModule'));
const CrossWorkspaceLineageModule = lazy(() => import('./pages/admin/modules/CrossWorkspaceLineageModule'));
const FarmDashboardModule = lazy(() => import('./pages/admin/modules/FarmDashboardModule'));
const FarmBatchModule = lazy(() => import('./pages/admin/modules/FarmBatchModule'));
const FarmCatatBobotModule = lazy(() => import('./pages/admin/modules/FarmCatatBobotModule'));
const FarmPemberianPakanModule = lazy(() => import('./pages/admin/modules/FarmPemberianPakanModule'));
const FarmMasterPakanModule = lazy(() => import('./pages/admin/modules/FarmMasterPakanModule'));
const FarmFormulaPakanModule = lazy(() => import('./pages/admin/modules/FarmFormulaPakanModule'));
const FarmKesehatanModule = lazy(() => import('./pages/admin/modules/FarmKesehatanModule'));
const FarmReproduksiModule = lazy(() => import('./pages/admin/modules/FarmReproduksiModule'));
const FarmMutasiModule = lazy(() => import('./pages/admin/modules/FarmMutasiModule'));
const FarmStokPakanModule = lazy(() => import('./pages/admin/modules/FarmStokPakanModule'));
const FarmStokObatModule = lazy(() => import('./pages/admin/modules/FarmStokObatModule'));
const FarmMasterObatModule = lazy(() => import('./pages/admin/modules/FarmMasterObatModule'));
const WorkspacesPlansPage = lazy(() => import('./pages/admin/modules/WorkspacesSubPages').then(m => ({ default: m.WorkspacesPlansPage })));
const WorkspacesVerificationPage = lazy(() => import('./pages/admin/modules/WorkspacesSubPages').then(m => ({ default: m.WorkspacesVerificationPage })));
const BlockedWorkspacesPage = lazy(() => import('./pages/admin/modules/WorkspacesSubPages').then(m => ({ default: m.BlockedWorkspacesPage })));
const PendingRequestsPage = lazy(() => import('./pages/admin/modules/WorkspacesSubPages').then(m => ({ default: m.PendingRequestsPage })));
const AdminWorkspaceRolesPage = lazy(() => import('./pages/admin/modules/WorkspacesSubPages').then(m => ({ default: m.AdminWorkspaceRolesPage })));
const MarketplaceTransactionsPage = lazy(() => import('./pages/admin/modules/MarketplaceSubPages').then(m => ({ default: m.MarketplaceTransactionsPage })));
const MarketplaceReportsPage = lazy(() => import('./pages/admin/modules/MarketplaceSubPages').then(m => ({ default: m.MarketplaceReportsPage })));
const FeedStockPage = lazy(() => import('./pages/admin/modules/FeedSubPages').then(m => ({ default: m.FeedStockPage })));
const FeedConsumptionPage = lazy(() => import('./pages/admin/modules/FeedSubPages').then(m => ({ default: m.FeedConsumptionPage })));
const MedicineStockPage = lazy(() => import('./pages/admin/modules/MedicineSubPages').then(m => ({ default: m.MedicineStockPage })));
const MedicineUsagePage = lazy(() => import('./pages/admin/modules/MedicineSubPages').then(m => ({ default: m.MedicineUsagePage })));
// Transport domain — ADMIN-SYNC-008
const TransportModule = lazy(() => import('./pages/admin/modules/TransportModule'));
const TransportVehiclesAdmin = lazy(() => import('./pages/admin/modules/TransportSubPages').then(m => ({ default: m.TransportVehiclesAdmin })));
const TransportDriversAdmin = lazy(() => import('./pages/admin/modules/TransportSubPages').then(m => ({ default: m.TransportDriversAdmin })));
const TransportDeliveryAdmin = lazy(() => import('./pages/admin/modules/TransportSubPages').then(m => ({ default: m.TransportDeliveryAdmin })));
const TransportScheduleAdmin = lazy(() => import('./pages/admin/modules/TransportSubPages').then(m => ({ default: m.TransportScheduleAdmin })));
const TransportRouteAdmin = lazy(() => import('./pages/admin/modules/TransportSubPages').then(m => ({ default: m.TransportRouteAdmin })));
const TransportReportsAdmin = lazy(() => import('./pages/admin/modules/TransportSubPages').then(m => ({ default: m.TransportReportsAdmin })));

// ─── PublicRoute ──────────────────────────────────────────────────────────────
// AUTH-004 — Redirects already-authenticated users away from public auth pages
// (login, register, forgot-password) to prevent re-showing forms they don't
// need. /verify-email and /reset-password are intentionally excluded because
// they are useful to authenticated users (unverified, or mid-recovery).
//
// Renders null during the initial auth-loading window to avoid a flash of the
// form before the session is resolved.
//
// P0-007A / FLOW-001F: redirect authenticated users to the correct next step.
//   - Onboarding incomplete → /onboarding  (avoids double-redirect via /workspace/select)
//   - Onboarding complete   → /workspace/select  (mandatory selection checkpoint)
// This prevents the chain /login → /workspace/select → /onboarding when the
// user hasn't finished onboarding yet.

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading, userProfile } = useAuth();
  const location = useLocation();
  console.log('[PublicRoute] render', {
    loading,
    currentUser,
    userProfile,
    pathname: location.pathname,
  });
  if (loading) return null;
  if (currentUser) {
    // Redirect to onboarding first if not yet complete (and email is verified).
    if (!hasCompletedOnboarding() && currentUser.email_confirmed_at) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/workspace/select" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();

  // ONB-001 / PLATFORM-001: Redirect first-time authenticated visitors to onboarding.
  // Guests (unauthenticated) are never redirected here — ProtectedRoute handles
  // sending them to /login instead. Skips auth routes, workspace flows, admin,
  // onboarding itself, and public-access paths (marketplace browse, news-event).
  useEffect(() => {
    if (authLoading) return;   // wait for auth to resolve before acting
    if (!currentUser) return;  // guests: ProtectedRoute handles redirection

    const skipPrefixes = [
      '/login', '/register', '/verify-email', '/forgot-password',
      '/reset-password', '/workspace', '/onboarding', '/admin',
      '/marketplace', '/news-event', // public paths — guests access these freely
      '/initialize', // bootstrap page — no workspace/onboarding needed here
    ];
    const isSkipPath = skipPrefixes.some((p) => location.pathname.startsWith(p));
    // AUTH-002A: only redirect to onboarding if email is verified.
    // Unverified users are handled by ProtectedRoute → /verify-email.
    if (!isSkipPath && !hasCompletedOnboarding() && currentUser.email_confirmed_at) {
      navigate('/onboarding', { replace: true });
    }
  }, [authLoading, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Suspense fallback={null}>
    <Routes>
      {/* ── AUTH-001: /initialize — only accessible when not yet initialized ── */}
      <Route element={<InitializeGuard />}>
        <Route path="/initialize" element={<Initialize />} />
      </Route>

      {/* ── Public routes: no application chrome and no WorkspaceContext ──── */}
      {/* These are intentionally OUTSIDE PlatformInitGuard so guests can     */}
      {/* browse the landing page, marketplace, and auth pages without the    */}
      {/* platform-init check redirecting them to /initialize.                */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />

        {/* Help, FAQ, and Legal are public so any visitor can read them      */}
        {/* without logging in.                                               */}
        <Route path="/profile/support/help"                   element={<ProfileSupportHelp />} />
        <Route path="/profile/support/faq"                    element={<ProfileSupportFaq />} />
        <Route path="/profile/about/legal"                    element={<ProfileAboutLegal />} />

        {/* ── Auth pages ─────────────────────────────────────────────── */}
        <Route path="/login"           element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register"        element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/verify-email"    element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* ── Invitation accept (public — user may not be logged in yet) ── */}
        <Route path="/invite/:token"   element={<AcceptInvitation />} />

        {/* ── Public workspace profiles — visible to guests ──────────── */}
        <Route path="/workspace/:id/profile"     element={<WorkspacePublicProfile />} />

        {/* ── Public browsing — guests may explore without an account ── */}
        <Route element={<PublicAppLayout />}>
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/news-event" element={<NewsEvent />} />
          <Route path="/news-event/:id" element={<NewsEventDetail />} />
        </Route>
      </Route>

      {/* ── AUTH-001: All other routes — only accessible when initialized ─── */}
      <Route element={<PlatformInitGuard />}>

      {/* ── Protected application: auth → verified → onboarding → workspace ─ */}
      {/*                                                                       */}
      {/* FLOW-001F4: /workspace/select and /workspace/create share the SAME   */}
      {/* WorkspaceProviderLayout as the main protected routes.  This means    */}
      {/* the workspace injected via addWorkspaceLocally() after creation      */}
      {/* remains in context when React Router navigates to /dashboard —       */}
      {/* eliminating the two-provider remount and fresh-SELECT timing race    */}
      {/* that caused the redirect loop back to /workspace/create.             */}
      <Route element={<AuthenticatedRoute />}>
      <Route element={<OnboardingRoute />}>
      <Route element={<WorkspaceProviderLayout />}>

      {/* Workspace setup — inside the shared provider, but OUTSIDE            */}
      {/* ProtectedRoute so they render even when activeWorkspaces.length===0  */}
      <Route path="/workspace/select" element={<WorkspaceSelect />} />
      <Route path="/workspace/create" element={<WorkspaceCreate />} />

      <Route element={<ProtectedRoute />}>
      <Route element={<ProtectedLayout />}>
      <Route path="/dashboard"            element={<Dashboard />} />
      <Route path="/search"            element={<SearchPage />} />
      <Route path="/notifications"     element={<NotificationCenter />} />
      <Route path="/dashboard/ai-insight" element={<DashboardAiInsight />} />
      <Route path="/dashboard/aktivitas" element={<DashboardTodayActivity />} />
      <Route path="/dashboard/alert" element={<DashboardAlertReminder />} />
      <Route path="/dashboard/recent-activity" element={<DashboardRecentActivity />} />
      <Route path="/livestock"         element={<Livestock />} />
      <Route path="/marketplace/escrow-info" element={<MarketplaceEscrowInfo />} />
      <Route
        path="/marketplace/escrow-info/:providerId"
          element={<MarketplaceEscrowProviderDetail />} />
          <Route
            path="/marketplace/:kategoriSlug/:slug"
              element={<MarketplaceDetailListing />} 
               />
      <Route path="/livestock/add"     element={<AddLivestock />} />
      <Route path="/catat-bobot"       element={<CatatBobot />} />
      <Route path="/stok-pakan"         element={<StokPakan />} />
      <Route path="/stok-pakan/master/jagung" element={<MasterPakanJagung />} />
      <Route path="/stok-pakan/master/jagung/:itemSlug" element={<MasterPakanItemDetail />} />
      <Route path="/stok-pakan/master/padi" element={<MasterPakanPadi />} />
      <Route path="/stok-pakan/master/padi/:itemSlug" element={<MasterPakanItemDetail />} />
      <Route path="/stok-pakan/master/rumput" element={<MasterPakanRumput />} />
      <Route path="/stok-pakan/master/rumput/:itemSlug" element={<MasterPakanItemDetail />} />
      <Route path="/stok-pakan/master/leguminosa" element={<MasterPakanLeguminosa />} />
      <Route path="/stok-pakan/master/leguminosa/:itemSlug" element={<MasterPakanItemDetail />} />
      <Route path="/stok-pakan/master/umbi-umbian" element={<MasterPakanUmbi />} />
      <Route path="/stok-pakan/master/umbi-umbian/:itemSlug" element={<MasterPakanItemDetail />} />
      <Route path="/stok-pakan/master/daun-daunan" element={<MasterPakanDaunan />} />
      <Route path="/stok-pakan/master/daun-daunan/:itemSlug" element={<MasterPakanItemDetail />} />
      <Route path="/stok-pakan/master/kacang-biji-bijian" element={<MasterPakanKacangBijian />} />
      <Route path="/stok-pakan/master/kacang-biji-bijian/:itemSlug" element={<MasterPakanItemDetail />} />
      <Route path="/stok-pakan/master/serealia-lain" element={<MasterPakanSerealiaLain />} />
      <Route path="/stok-pakan/master/serealia-lain/:itemSlug" element={<MasterPakanItemDetail />} />
      <Route path="/stok-pakan/master/kelapa" element={<MasterPakanKelapa />} />
      <Route path="/stok-pakan/master/kelapa/:itemSlug" element={<MasterPakanItemDetail />} />
      <Route path="/stok-pakan/master/kelapa-sawit" element={<MasterPakanKelapaSawit />} />
      <Route path="/stok-pakan/master/kelapa-sawit/:itemSlug" element={<MasterPakanItemDetail />} />
      <Route path="/stok-pakan/master/tebu" element={<MasterPakanTebu />} />
      <Route path="/stok-pakan/master/tebu/:itemSlug" element={<MasterPakanItemDetail />} />
      <Route path="/stok-pakan/master/buah-limbah-buah" element={<MasterPakanBuahLimbah />} />
      <Route path="/stok-pakan/master/buah-limbah-buah/:itemSlug" element={<MasterPakanItemDetail />} />
      <Route path="/stok-pakan/master/limbah-industri-pangan" element={<MasterPakanLimbahIndustriPangan />} />
      <Route path="/stok-pakan/master/limbah-industri-pangan/:itemSlug" element={<MasterPakanItemDetail />} />
      <Route path="/stok-pakan/master/sumber-protein-hewani" element={<MasterPakanSumberProteinHewani />} />
      <Route path="/stok-pakan/master/sumber-protein-hewani/:itemSlug" element={<MasterPakanItemDetail />} />
      <Route path="/stok-pakan/master/mineral" element={<MasterPakanMineral />} />
      <Route path="/stok-pakan/master/mineral/:itemSlug" element={<MasterPakanItemDetail />} />
      <Route path="/stok-pakan/master/vitamin-feed-additive" element={<MasterPakanVitaminFeedAdditive />} />
      <Route path="/stok-pakan/master/vitamin-feed-additive/:itemSlug" element={<MasterPakanItemDetail />} />
      <Route path="/stok-pakan/master/bahan-cair" element={<MasterPakanBahanCair />} />
      <Route path="/stok-pakan/master/bahan-cair/:itemSlug" element={<MasterPakanItemDetail />} />
      <Route path="/stok-pakan/master/lainnya" element={<MasterPakanLainnya />} />
      <Route path="/stok-pakan/master/lainnya/:itemSlug" element={<MasterPakanItemDetail />} />
      <Route path="/stok-pakan/master/:slug" element={<MasterPakanKategoriDetail />} />
      <Route path="/stok-pakan/komersial/dashboard" element={<ProdukKomersialDashboard />} />
      <Route path="/stok-pakan/komersial/kelola" element={<ProdukKomersialAdmin />} />
      <Route path="/stok-pakan/komersial/referensi" element={<MasterReferensiPK />} />
      <Route path="/stok-pakan/komersial/konsentrat" element={<ProdukKomersialKonsentrat />} />
      <Route path="/stok-pakan/komersial/konsentrat/:brandSlug" element={<KonsentratBrandSeri />} />
      <Route path="/stok-pakan/komersial/konsentrat/:brandSlug/:seriSlug" element={<KonsentratProdukDetail />} />
      <Route path="/stok-pakan/komersial/:kategoriSlug" element={<ProdukKomersialKategoriGeneric />} />
      <Route path="/stok-pakan/komersial/:kategoriSlug/:brandSlug" element={<ProdukKomersialBrandSeriGeneric />} />
      <Route path="/stok-pakan/komersial/:kategoriSlug/:brandSlug/:seriSlug" element={<ProdukKomersialSeriProdukGeneric />} />
      <Route path="/stok-pakan/komersial/:kategoriSlug/:brandSlug/:seriSlug/:produkSlug" element={<ProdukKomersialProdukDetailGeneric />} />
      <Route path="/stok-pakan/komersial/knowledge-base" element={<KnowledgeBasePK />} />
      <Route path="/stok-pakan/komersial/knowledge-base/admin" element={<KnowledgeBasePKAdmin />} />
      <Route path="/stok-pakan/komersial/knowledge-base/:artikelId" element={<KnowledgeBasePKArtikelDetail />} />
      <Route path="/stok-pakan/komersial/ai-readiness" element={<AIReadinessPK />} />
      <Route path="/stok-pakan/tambah" element={<TambahStokPakan />} />
      <Route path="/stok-pakan/inventaris/:id" element={<StokInventarisDetail />} />
      <Route path="/stok-pakan/inventaris/:id/perubahan-stok" element={<PerubahanStok />} />
      <Route path="/stok-pakan/keluar"   element={<KeluarkanStokPakan />} />
      <Route path="/stok-pakan/riwayat" element={<RiwayatStokPakan />} />
      <Route path="/stok-pakan/formula/tambah" element={<FormulaEditor />} />
      <Route path="/stok-pakan/formula/:id/edit" element={<FormulaEditor />} />
      <Route path="/stok-pakan/formula/:id/produksi" element={<FormulaProduksi />} />
      <Route path="/stok-pakan/formula/riwayat" element={<RiwayatProduksiFormula />} />
      <Route path="/stok-pakan/formula/riwayat/:batchId" element={<RiwayatProduksiFormulaDetail />} />
      <Route path="/stok-pakan/formula/:id" element={<FormulaDetail />} />
      <Route path="/stok-obat"          element={<StokObat />} />
      <Route path="/stok-obat/tambah"  element={<TambahStokObat />} />
      <Route path="/stok-obat/stok/:uuid/penyesuaian" element={<PenyesuaianStokObat />} />
      <Route path="/stok-obat/master/:slug/sub" element={<MasterObatSubKategori />} />
      <Route path="/stok-obat/master/:slug/sub/:subKategoriUuid" element={<MasterObatDetailPage />} />
      <Route path="/stok-obat/master/:slug" element={<MasterObatKategoriDetail />} />
      <Route path="/stok-obat/master/:slug/:itemId" element={<MasterObatItemDetail />} />
      <Route path="/stok-obat/penyakit/:ternakSlug" element={<KategoriPenyakit />} />
      <Route path="/stok-obat/penyakit/:ternakSlug/:kategoriSlug" element={<DaftarPenyakit />} />
      <Route path="/stok-obat/penyakit/:ternakSlug/:kategoriSlug/:penyakitId" element={<MasterPenyakitItemDetail />} />
      <Route path="/stok-obat/komersial/produk/:slug" element={<ProdukKomersialObatItemDetail />} />
      <Route path="/stok-obat/komersial/admin" element={<ProdukKomersialObatAdmin />} />
      <Route path="/stok-obat/komersial/admin/brand" element={<ProdukKomersialObatAdminBrand />} />
      <Route path="/stok-obat/komersial/admin/produk" element={<ProdukKomersialObatAdminProduk />} />
      <Route path="/stok-obat/komersial/admin/import-export" element={<ProdukKomersialObatImportExport />} />
      <Route path="/stok-obat/riwayat/:id" element={<RiwayatObatDetail />} />
      <Route path="/livestock/active"   element={<ActiveLivestock />} />
      <Route path="/livestock/outside"  element={<OutsideLivestock />} />
      <Route path="/livestock/archive"  element={<ArchiveLivestock />} />
      <Route path="/livestock/:id"     element={<LivestockProfile />} />
      <Route path="/livestock/:id/bobot" element={<RiwayatBobot />} />
      <Route path="/kesehatan-hewan"                    element={<KesehatanHewan />} />
      <Route path="/kesehatan-hewan/pemeriksaan/baru" element={<PemeriksaanKesehatan />} />
      <Route path="/kesehatan-hewan/diagnosa/:id"     element={<DiagnosaKesehatan />} />
      <Route path="/kesehatan-hewan/tindakan/:id"    element={<TindakanKesehatan />} />
      <Route path="/kesehatan-hewan/pengobatan/:id"  element={<PengobatanKesehatan />} />
      <Route path="/kesehatan-hewan/integrasi/:id"  element={<IntegrasiPengobatan />} />
      <Route path="/kesehatan-hewan/kontrol/:id"    element={<KontrolKesehatan />} />
      <Route path="/kesehatan-hewan/riwayat"         element={<RiwayatKesehatanHewan />} />
      <Route path="/kesehatan-hewan/riwayat/:id"    element={<RiwayatKesehatanHewanDetail />} />
      <Route path="/pemberian-pakan"   element={<PemberianPakan />} />
      <Route path="/jadwal-pemberian-pakan" element={<JadwalPemberianPakan />} />
      <Route path="/riwayat-pemberian-pakan" element={<RiwayatPemberianPakan />} />
      <Route path="/riwayat-pemberian-pakan/:id" element={<RiwayatPemberianPakanDetail />} />
      <Route path="/reproduksi"        element={<Reproduksi />} />
      <Route path="/mutasi"            element={<Mutasi />} />
      <Route path="/livestock/:id/kesehatan" element={<RiwayatKesehatan />} />
      <Route path="/livestock/:id/pakan" element={<RiwayatPakan />} />
      <Route path="/livestock/:id/reproduksi" element={<RiwayatReproduksi />} />
      <Route path="/livestock/:id/mutasi"       element={<RiwayatMutasi />} />
      <Route path="/livestock/:id/kepemilikan" element={<RiwayatKepemilikan />} />
      <Route path="/livestock/:id/foto/riwayat" element={<FotoHistory />} />
      <Route path="/livestock/:id/edit"      element={<EditLivestock />} />
      <Route path="/livestock/:id/silsilah"   element={<Silsilah />} />
      <Route path="/livestock/:id/saudara"   element={<SiblingList />} />
      <Route path="/livestock/:id/keturunan" element={<Keturunan />} />
      <Route path="/batch"             element={<BatchList />} />
      <Route path="/batch/riwayat"     element={<BatchRiwayat />} />
      <Route path="/batch/add"         element={<CreateBatch />} />
      <Route path="/batch/:id"         element={<BatchProfile />} />
      <Route path="/batch/:id/members" element={<AllBatchMembers />} />
      <Route path="/batch/:id/operasi" element={<BatchOperasi />} />
      {/* ── Marketplace — transactional (auth + workspace required) ── */}
      <Route path="/marketplace/buat"  element={<MarketplaceBuatListing />} />
      <Route path="/marketplace/listing-saya" element={<MarketplaceListingSaya />} />
      <Route path="/marketplace/listing-saya/:uuid" element={<MarketplaceKelolaListing />} />
      <Route path="/marketplace/transaksi" element={<MarketplaceTransaksi />} />
      <Route path="/marketplace/transaksi/:id" element={<MarketplaceDetailTransaksi />} />
      <Route path="/marketplace/negosiasi" element={<MarketplaceNegosiasi />} />
      <Route path="/marketplace/negosiasi/buat" element={<MarketplaceBuatNegosiasi />} />
      <Route path="/marketplace/negosiasi/:id" element={<MarketplaceDetailNegosiasi />} />
      <Route path="/marketplace/dashboard" element={<MarketplaceDashboard />} />
      <Route path="/marketplace/dashboard-pembeli" element={<MarketplaceDashboardPembeli />} />
      <Route path="/marketplace/notifikasi" element={<MarketplaceNotifikasi />} />
      <Route path="/marketplace/chat" element={<MarketplaceChatList />} />
      <Route path="/marketplace/chat/:id" element={<MarketplaceChat />} />
      <Route path="/marketplace/wishlist" element={<MarketplaceWishlist />} />
      <Route path="/marketplace/riwayat" element={<MarketplaceRiwayatAktivitas />} />
      <Route path="/marketplace/verifikasi" element={<MarketplaceVerifikasi />} />
      <Route path="/marketplace/laporan" element={<MarketplaceLaporan />} />
      <Route path="/marketplace/laporan/buat" element={<MarketplaceBuatLaporan />} />
      <Route path="/marketplace/laporan/:id" element={<MarketplaceDetailLaporan />} />
      <Route path="/marketplace/moderasi" element={<MarketplaceModerasiKasus />} />
      <Route path="/marketplace/moderasi/:kasusId" element={<MarketplaceModerasiDetailKasus />} />
      <Route path="/marketplace/ai-insight" element={<MarketplaceAiInsight />} />
      <Route path="/marketplace/conversation/:transaksiId"  element={<MarketplaceConversation />} />
      <Route path="/marketplace/evidence/:transaksiId"     element={<MarketplaceEvidenceTimeline />} />
      <Route path="/marketplace/audit/:transaksiId"        element={<MarketplaceAuditTimeline />} />
      <Route path="/marketplace/escrow/:transaksiId"              element={<MarketplaceEscrowDetail />} />
      <Route path="/marketplace/receipt/:transaksiId"      element={<MarketplaceTransactionReceipt />} />
      <Route path="/marketplace/attachments/:transaksiId"  element={<MarketplaceTransactionAttachments />} />

      {/* ── News & Event — submission (auth + workspace required) ── */}
      <Route path="/news-event/submission"                 element={<NewsEventSubmission />} />
      <Route path="/news-event/submission/news/:id"        element={<NewsSubmissionForm />} />
      <Route path="/news-event/submission/event/:id"       element={<EventSubmissionForm />} />
      <Route path="/news-event/submission/:id/preview"     element={<NewsEventSubmissionPreview />} />
      <Route path="/news-event/submission/:id"             element={<NewsEventSubmissionDetail />} />

      {/* ── Workspace settings (auth + workspace + permission required) ── */}
      <Route path="/workspace/settings/profile" element={
        <WorkspacePermissionGuard module="workspaceSettings" action="view">
          <WorkspaceSettingsProfile />
        </WorkspacePermissionGuard>
      } />
      <Route path="/workspace/settings/members" element={
        <WorkspacePermissionGuard module="memberManagement" action="view">
          <WorkspaceSettingsMembers />
        </WorkspacePermissionGuard>
      } />
      <Route path="/workspace/settings/archive" element={
        <WorkspacePermissionGuard module="workspaceSettings" action="view">
          <WorkspaceSettingsArchive />
        </WorkspacePermissionGuard>
      } />
      <Route path="/workspace/settings/roles" element={
        <WorkspacePermissionGuard module="memberManagement" action="view">
          <WorkspaceSettingsRoles />
        </WorkspacePermissionGuard>
      } />

      {/* ── Profile (auth + workspace required) ── */}
      <Route path="/activity"                               element={<Navigate to="/dashboard/aktivitas" replace />} />
      <Route path="/profile"                                element={<Profile />} />
      <Route path="/profile/account"                        element={<ProfileAccount />} />
      <Route path="/profile/workspace" element={
        <WorkspacePermissionGuard module="workspaceSettings" action="view">
          <ProfileWorkspace />
        </WorkspacePermissionGuard>
      } />
      <Route path="/profile/workspace/:id" element={
        <WorkspacePermissionGuard module="workspaceSettings" action="view">
          <ProfileWorkspaceDetail />
        </WorkspacePermissionGuard>
      } />
      <Route path="/profile/workspace/:id/members" element={<Navigate to="/workspace/settings/members" replace />} />
      <Route path="/profile/business-insight"               element={<ProfileBusinessInsight />} />
      <Route path="/profile/security"                       element={<ProfileSecurity />} />
      <Route path="/profile/notification"                   element={<ProfileNotification />} />
      <Route path="/profile/about"                          element={<ProfileAbout />} />
      <Route path="/profile/about/roadmap"                  element={<ProfileAboutRoadmap />} />
      <Route path="/profile/about/changelog"                element={<ProfileAboutChangelog />} />
      <Route path="/profile/about/partner"                  element={<ProfileAboutPartner />} />
      <Route path="/profile/support"                        element={<ProfileSupport />} />
      <Route path="/profile/support/report-bug"             element={<ProfileSupportReportBug />} />
      <Route path="/profile/support/feedback"               element={<ProfileSupportFeedback />} />
      <Route path="/profile/support/contact"                element={<ProfileSupportContact />} />
      <Route path="/workspace/:id/transport"   element={<TransportWorkspace />} />
      <Route path="/workspace/:id/veterinary"  element={<VeterinaryWorkspace />} />
      <Route path="/workspace/:id/clinic"      element={<KlinikHewanWorkspace />} />
      <Route path="/workspace/:id/feed-store"  element={<FeedStoreWorkspaceRoute />} />
      <Route path="/workspace/:id/feed-store/suppliers"            element={<FeedStoreSupplierList />} />
      <Route path="/workspace/:id/feed-store/suppliers/new"        element={<FeedStoreSupplierForm />} />
      <Route path="/workspace/:id/feed-store/suppliers/:sid"       element={<FeedStoreSupplierDetail />} />
      <Route path="/workspace/:id/feed-store/suppliers/:sid/edit"  element={<FeedStoreSupplierForm />} />
      <Route path="/workspace/:id/feed-store/customers"            element={<FeedStoreCustomerList />} />
      <Route path="/workspace/:id/feed-store/customers/new"        element={<FeedStoreCustomerForm />} />
      <Route path="/workspace/:id/feed-store/customers/:cid"       element={<FeedStoreCustomerDetail />} />
      <Route path="/workspace/:id/feed-store/customers/:cid/edit"  element={<FeedStoreCustomerForm />} />
      <Route path="/workspace/:id/feed-store/orders"               element={<FeedStoreOrderList />} />
      <Route path="/workspace/:id/feed-store/orders/new"           element={<FeedStoreOrderForm />} />
      <Route path="/workspace/:id/feed-store/orders/:oid"          element={<FeedStoreOrderDetail />} />
      <Route path="/workspace/:id/feed-store/orders/:oid/edit"     element={<FeedStoreOrderForm />} />
      <Route path="/workspace/:id/feed-store/sales"                element={<FeedStoreSalesList />} />
      <Route path="/workspace/:id/feed-store/sales/new"            element={<FeedStoreSalesForm />} />
      <Route path="/workspace/:id/feed-store/sales/:sid"           element={<FeedStoreSalesDetail />} />
      <Route path="/workspace/:id/feed-store/sales/:sid/edit"      element={<FeedStoreSalesForm />} />
      <Route path="/workspace/:id/drug-store"  element={<DrugStoreWorkspaceRoute />} />
      <Route path="/workspace/:id/drug-store/suppliers"            element={<DrugStoreSupplierList />} />
      <Route path="/workspace/:id/drug-store/suppliers/new"        element={<DrugStoreSupplierForm />} />
      <Route path="/workspace/:id/drug-store/suppliers/:sid"       element={<DrugStoreSupplierDetail />} />
      <Route path="/workspace/:id/drug-store/suppliers/:sid/edit"  element={<DrugStoreSupplierForm />} />
      <Route path="/workspace/:id/drug-store/customers"            element={<DrugStoreCustomerList />} />
      <Route path="/workspace/:id/drug-store/customers/new"        element={<DrugStoreCustomerForm />} />
      <Route path="/workspace/:id/drug-store/customers/:cid"       element={<DrugStoreCustomerDetail />} />
      <Route path="/workspace/:id/drug-store/customers/:cid/edit"  element={<DrugStoreCustomerForm />} />
      <Route path="/workspace/:id/drug-store/orders"               element={<DrugStoreOrderList />} />
      <Route path="/workspace/:id/drug-store/orders/new"           element={<DrugStoreOrderForm />} />
      <Route path="/workspace/:id/drug-store/orders/:oid"          element={<DrugStoreOrderDetail />} />
      <Route path="/workspace/:id/drug-store/orders/:oid/edit"     element={<DrugStoreOrderForm />} />
      <Route path="/workspace/:id/drug-store/sales"                element={<DrugStoreSalesList />} />
      <Route path="/workspace/:id/drug-store/sales/new"            element={<DrugStoreSalesForm />} />
      <Route path="/workspace/:id/drug-store/sales/:sid"           element={<DrugStoreSalesDetail />} />
      <Route path="/workspace/:id/drug-store/sales/:sid/edit"      element={<DrugStoreSalesForm />} />
      <Route path="/workspace/:id/drug-store/stok-keluar"          element={<DrugStoreStokKeluar />} />
      <Route path="/workspace/:id/farm-profile" element={<FarmProfile />} />
      </Route>
      {/* ── End of ProtectedLayout block ────────────────────────────────── */}
      </Route>
      {/* ── End of ProtectedRoute block ─────────────────────────────────── */}
      </Route>
      </Route>
      </Route>
      {/* ── End of AuthenticatedRoute/OnboardingRoute/WorkspaceProviderLayout ─ */}

      {/* ── Platform Admin (ADM-001/ADM-002) — guarded by AdminGuard ─────── */}
      <Route element={<AuthenticatedRoute />}>
      <Route element={<OnboardingRoute />}>
      <Route element={<WorkspaceProviderLayout />}>
      <Route element={<AdminGuard />}>
        <Route path="/admin"                element={<AdminDashboard />} />
        <Route path="/admin/users"          element={<UsersModule />} />
        <Route path="/admin/users/profiles" element={<AdminUserProfilesModule />} />
        <Route path="/admin/workspaces"     element={<WorkspacesModule />} />
        <Route path="/admin/marketplace"    element={<MarketplaceModule />} />
        <Route path="/admin/livestock"      element={<LivestockModule />} />
        <Route path="/admin/feed"           element={<FeedModule />} />
        <Route path="/admin/medicine"       element={<MedicineModule />} />
        <Route path="/admin/subscription"   element={<SubscriptionModule />} />
        <Route path="/admin/trust"          element={<TrustModule />} />
        <Route path="/admin/announcements"  element={<AnnouncementsModule />} />
        <Route path="/admin/notifications"  element={<NotificationsModule />} />
        <Route path="/admin/reports"        element={<ReportsModule />} />
        <Route path="/admin/monitoring"       element={<MonitoringModule />} />
        <Route path="/admin/platform-health" element={<PlatformHealthModule />} />
        <Route path="/admin/data-master"    element={<DataMasterModule />} />
        <Route path="/admin/settings"       element={<SettingsModule />} />
        <Route path="/admin/activity"       element={<ActivityCenterModule />} />
        <Route path="/admin/search"         element={<GlobalSearchModule />} />
        <Route path="/admin/escrow"         element={<EscrowModule />} />
        <Route path="/admin/master-escrow"  element={<MasterEscrowModule />} />
        <Route path="/admin/relationships"       element={<RelationshipModule />} />
        <Route path="/admin/ownership-transfer"  element={<OwnershipTransferModule />} />
        <Route path="/admin/lineage"             element={<CrossWorkspaceLineageModule />} />
        <Route path="/admin/backup"              element={<BackupModule />} />

        {/* ── Admin sub-pages — ADMIN-001 ──────────────────────────────── */}
        {/* Workspaces */}
        <Route path="/admin/workspaces/plans"        element={<WorkspacesPlansPage />} />
        <Route path="/admin/workspaces/verification" element={<WorkspacesVerificationPage />} />
        <Route path="/admin/workspaces/blocked"      element={<BlockedWorkspacesPage />} />
        <Route path="/admin/workspaces/pending"      element={<PendingRequestsPage />} />
        <Route path="/admin/workspaces/members"      element={<AdminWorkspaceMembers />} />
        <Route path="/admin/workspaces/roles"        element={<AdminWorkspaceRolesPage />} />
        <Route path="/admin/workspaces/:id"          element={<AdminWorkspaceDetail />} />
        {/* Marketplace */}
        <Route path="/admin/marketplace/transactions" element={<MarketplaceTransactionsPage />} />
        <Route path="/admin/marketplace/reports"      element={<MarketplaceReportsPage />} />
        {/* Ownership Transfer */}
        <Route path="/admin/ownership-transfer/pending" element={<OwnershipTransferModule />} />
        <Route path="/admin/ownership-transfer/done"    element={<OwnershipTransferModule />} />
        {/* Relationships */}
        <Route path="/admin/relationships/active"  element={<RelationshipModule />} />
        <Route path="/admin/relationships/pending" element={<RelationshipModule />} />
        {/* Escrow */}
        <Route path="/admin/escrow/active"  element={<EscrowModule />} />
        <Route path="/admin/escrow/dispute" element={<EscrowModule />} />
        {/* Livestock */}
        <Route path="/admin/livestock/health"   element={<LivestockModule />} />
        <Route path="/admin/livestock/breeding" element={<LivestockModule />} />
        {/* Farm domain — ADMIN-SYNC-004 */}
        <Route path="/admin/farm/dashboard"       element={<FarmDashboardModule />} />
        <Route path="/admin/farm/batch"           element={<FarmBatchModule />} />
        <Route path="/admin/farm/catat-bobot"     element={<FarmCatatBobotModule />} />
        <Route path="/admin/farm/pemberian-pakan" element={<FarmPemberianPakanModule />} />
        <Route path="/admin/farm/stok-pakan"      element={<FarmStokPakanModule />} />
        <Route path="/admin/farm/master-pakan"    element={<FarmMasterPakanModule />} />
        <Route path="/admin/farm/formula-pakan"   element={<FarmFormulaPakanModule />} />
        <Route path="/admin/farm/stok-obat"       element={<FarmStokObatModule />} />
        <Route path="/admin/farm/kesehatan-hewan" element={<FarmKesehatanModule />} />
        <Route path="/admin/farm/reproduksi"      element={<FarmReproduksiModule />} />
        <Route path="/admin/farm/mutasi"          element={<FarmMutasiModule />} />
        <Route path="/admin/farm/master-obat"    element={<FarmMasterObatModule />} />
        {/* Cross-WS Lineage */}
        <Route path="/admin/lineage/cross-ws"     element={<CrossWorkspaceLineageModule />} />
        <Route path="/admin/lineage/verification" element={<CrossWorkspaceLineageModule />} />
        {/* Feed */}
        <Route path="/admin/feed/stock"       element={<FeedStockPage />} />
        <Route path="/admin/feed/consumption" element={<FeedConsumptionPage />} />
        {/* Medicine */}
        <Route path="/admin/medicine/stock" element={<MedicineStockPage />} />
        <Route path="/admin/medicine/usage" element={<MedicineUsagePage />} />
        {/* Announcements */}
        <Route path="/admin/announcements/drafts"    element={<AnnouncementsModule />} />
        <Route path="/admin/announcements/scheduled" element={<AnnouncementsModule />} />
        {/* Notifications */}
        <Route path="/admin/notifications/templates" element={<NotificationsModule />} />
        {/* Reports */}
        <Route path="/admin/reports/content"   element={<ReportsModule />} />
        <Route path="/admin/reports/financial" element={<ReportsModule />} />
        {/* Monitoring */}
        <Route path="/admin/monitoring/errors"      element={<MonitoringModule />} />
        <Route path="/admin/monitoring/performance" element={<MonitoringModule />} />
        {/* Data Master */}
        <Route path="/admin/data-master/master"  element={<DataMasterModule />} />
        <Route path="/admin/data-master/imports" element={<DataMasterModule />} />
        {/* Settings */}
        <Route path="/admin/settings/security" element={<SettingsModule />} />
        <Route path="/admin/settings/api"      element={<SettingsModule />} />
        <Route path="/admin/settings/email"    element={<SettingsModule />} />

        {/* Transport domain — ADMIN-SYNC-008 */}
        <Route path="/admin/transport"            element={<Navigate to="/admin/transport/dashboard" replace />} />
        <Route path="/admin/transport/dashboard"  element={<TransportModule />} />
        <Route path="/admin/transport/vehicles"   element={<TransportVehiclesAdmin />} />
        <Route path="/admin/transport/drivers"    element={<TransportDriversAdmin />} />
        <Route path="/admin/transport/delivery"   element={<TransportDeliveryAdmin />} />
        <Route path="/admin/transport/schedule"   element={<TransportScheduleAdmin />} />
        <Route path="/admin/transport/route"      element={<TransportRouteAdmin />} />
        <Route path="/admin/transport/reports"    element={<TransportReportsAdmin />} />

        {/* ── News / RSS / Publication — admin-only content management ── */}
        <Route path="/admin/news-event/review"               element={<AdminNewsEventReview />} />
        <Route path="/admin/news-event/review/:id"           element={<AdminNewsEventReviewDetail />} />
        <Route path="/admin/rss/sources"                     element={<AdminRssSources />} />
        <Route path="/admin/rss/queue"                       element={<AdminRssQueue />} />
        <Route path="/admin/publication"                     element={<AdminPublicationManagement />} />
      </Route>
      </Route>
      </Route>
      </Route>

      {/* Onboarding is authenticated and verified, but intentionally has no
          WorkspaceProvider because the user may not have a workspace yet. */}
      <Route element={<AuthenticatedRoute />}>
      <Route path="/onboarding"       element={<Onboarding />} />
      </Route>

      {/* ── End of PlatformInitGuard block ──────────────────────────────── */}
      </Route>

    </Routes>
    </Suspense>
  );
}
