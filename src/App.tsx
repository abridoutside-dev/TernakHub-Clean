import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import Livestock from './pages/Livestock';
import AddLivestock from './pages/AddLivestock';
import LivestockProfile from './pages/LivestockProfile';
import CatatBobot from './pages/CatatBobot';
import RiwayatBobot from './pages/RiwayatBobot';
import KesehatanHewan        from './pages/KesehatanHewan';
import PemeriksaanKesehatan  from './pages/PemeriksaanKesehatan';
import DiagnosaKesehatan     from './pages/DiagnosaKesehatan';
import TindakanKesehatan     from './pages/TindakanKesehatan';
import PengobatanKesehatan  from './pages/PengobatanKesehatan';
import IntegrasiPengobatan  from './pages/IntegrasiPengobatan';
import KontrolKesehatan           from './pages/KontrolKesehatan';
import RiwayatKesehatanHewan      from './pages/RiwayatKesehatanHewan';
import RiwayatKesehatanHewanDetail from './pages/RiwayatKesehatanHewanDetail';
import PemberianPakan from './pages/PemberianPakan';
import JadwalPemberianPakan from './pages/JadwalPemberianPakan';
import RiwayatPemberianPakan from './pages/RiwayatPemberianPakan';
import RiwayatPemberianPakanDetail from './pages/RiwayatPemberianPakanDetail';
import RiwayatKesehatan from './pages/RiwayatKesehatan';
import RiwayatPakan from './pages/RiwayatPakan';
import Reproduksi from './pages/Reproduksi';
import RiwayatReproduksi from './pages/RiwayatReproduksi';
import Mutasi from './pages/Mutasi';
import RiwayatMutasi from './pages/RiwayatMutasi';
import StokPakan from './pages/StokPakan';
import MasterPakanKategoriDetail from './pages/MasterPakanKategoriDetail';
import MasterPakanJagung from './pages/MasterPakanJagung';
import MasterPakanPadi from './pages/MasterPakanPadi';
import MasterPakanRumput from './pages/MasterPakanRumput';
import MasterPakanLeguminosa from './pages/MasterPakanLeguminosa';
import MasterPakanUmbi from './pages/MasterPakanUmbi';
import MasterPakanDaunan from './pages/MasterPakanDaunan';
import MasterPakanKacangBijian from './pages/MasterPakanKacangBijian';
import MasterPakanSerealiaLain from './pages/MasterPakanSerealiaLain';
import MasterPakanKelapa from './pages/MasterPakanKelapa';
import MasterPakanKelapaSawit from './pages/MasterPakanKelapaSawit';
import MasterPakanTebu from './pages/MasterPakanTebu';
import MasterPakanBuahLimbah from './pages/MasterPakanBuahLimbah';
import MasterPakanLimbahIndustriPangan from './pages/MasterPakanLimbahIndustriPangan';
import MasterPakanSumberProteinHewani from './pages/MasterPakanSumberProteinHewani';
import MasterPakanMineral from './pages/MasterPakanMineral';
import MasterPakanVitaminFeedAdditive from './pages/MasterPakanVitaminFeedAdditive';
import MasterPakanBahanCair from './pages/MasterPakanBahanCair';
import MasterPakanLainnya from './pages/MasterPakanLainnya';
import ProdukKomersialKonsentrat from './pages/ProdukKomersialKonsentrat';
import ProdukKomersialDashboard from './pages/ProdukKomersialDashboard';
import ProdukKomersialAdmin from './pages/ProdukKomersialAdmin';
import MasterReferensiPK from './pages/MasterReferensiPK';
import KonsentratBrandSeri from './pages/KonsentratBrandSeri';
import KonsentratProdukDetail from './pages/KonsentratProdukDetail';
import ProdukKomersialKategoriGeneric from './pages/ProdukKomersialKategoriGeneric';
import ProdukKomersialBrandSeriGeneric from './pages/ProdukKomersialBrandSeriGeneric';
import ProdukKomersialSeriProdukGeneric from './pages/ProdukKomersialSeriProdukGeneric';
import ProdukKomersialProdukDetailGeneric from './pages/ProdukKomersialProdukDetailGeneric';
import KnowledgeBasePK from './pages/KnowledgeBasePK';
import KnowledgeBasePKArtikelDetail from './pages/KnowledgeBasePKArtikelDetail';
import KnowledgeBasePKAdmin from './pages/KnowledgeBasePKAdmin';
import AIReadinessPK from './pages/AIReadinessPK';
import MasterPakanItemDetail from './pages/MasterPakanItemDetail';
import KeluarkanStokPakan from './pages/KeluarkanStokPakan';
import RiwayatStokPakan from './pages/RiwayatStokPakan';
import TambahStokPakan from './pages/TambahStokPakan';
import StokInventarisDetail from './pages/StokInventarisDetail';
import PerubahanStok from './pages/PerubahanStok';
import FormulaDetail from './pages/FormulaDetail';
import FormulaEditor from './pages/FormulaEditor';
import FormulaProduksi from './pages/FormulaProduksi';
import RiwayatProduksiFormula from './pages/RiwayatProduksiFormula';
import RiwayatProduksiFormulaDetail from './pages/RiwayatProduksiFormulaDetail';
import TambahStokObat from './pages/TambahStokObat';
import PenyesuaianStokObat from './pages/PenyesuaianStokObat';
import StokObat from './pages/StokObat';
import MasterObatKategoriDetail from './pages/MasterObatKategoriDetail';
import MasterObatItemDetail from './pages/MasterObatItemDetail';
import MasterObatSubKategori from './pages/MasterObatSubKategori';
import MasterObatDetailPage from './pages/MasterObatDetail';

import KategoriPenyakit from './pages/KategoriPenyakit';
import DaftarPenyakit from './pages/DaftarPenyakit';
import MasterPenyakitItemDetail from './pages/MasterPenyakitItemDetail';
import ProdukKomersialObatItemDetail from './pages/ProdukKomersialObatItemDetail';
import RiwayatObatDetail from './pages/RiwayatObatDetail';
import ProdukKomersialObatAdmin from './pages/ProdukKomersialObatAdmin';
import ProdukKomersialObatImportExport from './pages/ProdukKomersialObatImportExport';
import ProdukKomersialObatAdminBrand from './pages/ProdukKomersialObatAdminBrand';
import ProdukKomersialObatAdminProduk from './pages/ProdukKomersialObatAdminProduk';
import Marketplace from './pages/Marketplace';
import MarketplaceBuatListing from './pages/MarketplaceBuatListing';
import MarketplaceListingSaya from './pages/MarketplaceListingSaya';
import MarketplaceKelolaListing from './pages/MarketplaceKelolaListing';
import MarketplaceDetailListing from './pages/MarketplaceDetailListing';
import MarketplaceTransaksi from './pages/MarketplaceTransaksi';
import MarketplaceDetailTransaksi from './pages/MarketplaceDetailTransaksi';
import MarketplaceNegosiasi from './pages/MarketplaceNegosiasi';
import MarketplaceDetailNegosiasi from './pages/MarketplaceDetailNegosiasi';
import MarketplaceBuatNegosiasi from './pages/MarketplaceBuatNegosiasi';
import MarketplaceChatList from './pages/MarketplaceChatList';
import MarketplaceChat from './pages/MarketplaceChat';
import MarketplaceNotifikasi from './pages/MarketplaceNotifikasi';
import MarketplaceDashboard from './pages/MarketplaceDashboard';
import MarketplaceDashboardPembeli from './pages/MarketplaceDashboardPembeli';
import MarketplaceWishlist from './pages/MarketplaceWishlist';
import MarketplaceRiwayatAktivitas from './pages/MarketplaceRiwayatAktivitas';
import MarketplaceVerifikasi from './pages/MarketplaceVerifikasi';
import MarketplaceLaporan from './pages/MarketplaceLaporan';
import MarketplaceBuatLaporan from './pages/MarketplaceBuatLaporan';
import MarketplaceDetailLaporan from './pages/MarketplaceDetailLaporan';
import MarketplaceModerasiKasus from './pages/MarketplaceModerasiKasus';
import MarketplaceModerasiDetailKasus from './pages/MarketplaceModerasiDetailKasus';
import MarketplaceAiInsight from './pages/MarketplaceAiInsight';
import MarketplaceConversation from './pages/MarketplaceConversation';
import MarketplaceEvidenceTimeline from './pages/MarketplaceEvidenceTimeline';
import MarketplaceAuditTimeline from './pages/MarketplaceAuditTimeline';
import MarketplaceEscrowDetail from './pages/MarketplaceEscrowDetail';
import MarketplaceEscrowProviderDetail from './pages/MarketplaceEscrowProviderDetail';
import MarketplaceTransactionReceipt from './pages/MarketplaceTransactionReceipt';
import MarketplaceTransactionAttachments from './pages/MarketplaceTransactionAttachments';
import MarketplaceEscrowInfo from './pages/MarketplaceEscrowInfo';
import BatchProfile from './pages/BatchProfile';
import ArchiveLivestock from './pages/ArchiveLivestock';
import ActiveLivestock from './pages/ActiveLivestock';
import OutsideLivestock from './pages/OutsideLivestock';
import Silsilah from './pages/Silsilah';
import Keturunan from './pages/Keturunan';
import RiwayatKepemilikan from './pages/RiwayatKepemilikan';
import AllBatchMembers from './pages/AllBatchMembers';
import BatchOperasi from './pages/BatchOperasi';
import BatchList from './pages/BatchList';
import BatchRiwayat from './pages/BatchRiwayat';
import CreateBatch from './pages/CreateBatch';
import SiblingList from './pages/SiblingList';
import FotoHistory from './pages/FotoHistory';
import EditLivestock from './pages/EditLivestock';
import NewsEvent from './pages/NewsEvent';
import NewsEventDetail from './pages/NewsEventDetail';
import NewsEventSubmission from './pages/NewsEventSubmission';
import NewsSubmissionForm from './pages/NewsSubmissionForm';
import EventSubmissionForm from './pages/EventSubmissionForm';
import NewsEventSubmissionPreview from './pages/NewsEventSubmissionPreview';
import NewsEventSubmissionDetail from './pages/NewsEventSubmissionDetail';
import AdminNewsEventReview from './pages/AdminNewsEventReview';
import AdminNewsEventReviewDetail from './pages/AdminNewsEventReviewDetail';
import AdminRssSources from './pages/AdminRssSources';
import AdminRssQueue from './pages/AdminRssQueue';
import AdminPublicationManagement from './pages/AdminPublicationManagement';
import Profile from './pages/Profile';
import ProfileAccount from './pages/ProfileAccount';
import ProfileWorkspace from './pages/ProfileWorkspace';
import ProfileWorkspaceDetail from './pages/ProfileWorkspaceDetail';
import ProfileWorkspaceMembers from './pages/ProfileWorkspaceMembers';
import ProfileBusinessInsight from './pages/ProfileBusinessInsight';
import ProfileSubscription from './pages/ProfileSubscription';
import ProfileSecurity from './pages/ProfileSecurity';
import ProfileNotification from './pages/ProfileNotification';
import ProfileAbout from './pages/ProfileAbout';
import ProfileAboutRoadmap from './pages/ProfileAboutRoadmap';
import ProfileAboutChangelog from './pages/ProfileAboutChangelog';
import ProfileAboutLegal from './pages/ProfileAboutLegal';
import ProfileAboutPartner from './pages/ProfileAboutPartner';
import ProfileSupport from './pages/ProfileSupport';
import ProfileSupportHelp from './pages/ProfileSupportHelp';
import ProfileSupportFaq from './pages/ProfileSupportFaq';
import ProfileSupportReportBug from './pages/ProfileSupportReportBug';
import ProfileSupportFeedback from './pages/ProfileSupportFeedback';
import ProfileSupportContact from './pages/ProfileSupportContact';
import DashboardAiInsight from './pages/DashboardAiInsight';
import DashboardTodayActivity from './pages/DashboardTodayActivity';
import DashboardAlertReminder from './pages/DashboardAlertReminder';
import DashboardRecentActivity from './pages/DashboardRecentActivity';
import SearchPage from './pages/SearchPage';
import NotificationCenter from './pages/NotificationCenter';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import WorkspaceSelect from './pages/auth/WorkspaceSelect';
import WorkspaceCreate from './pages/auth/WorkspaceCreate';
import Onboarding from './pages/onboarding/Onboarding';
import { hasCompletedOnboarding } from './data/onboardingData';
import ResetPassword from './pages/auth/ResetPassword';
import WorkspaceSettingsProfile from './pages/WorkspaceSettingsProfile';
import WorkspacePublicProfile from './pages/WorkspacePublicProfile';
import TransportWorkspace from './pages/TransportWorkspace';
import VeterinaryWorkspace from './pages/VeterinaryWorkspace';
import KlinikHewanWorkspace from './pages/KlinikHewanWorkspace';
import FeedStoreWorkspaceRoute from './pages/workspaceDashboards/FeedStoreWorkspaceRoute';
import FeedStoreSupplierList   from './pages/feedStore/FeedStoreSupplierList';
import FeedStoreSupplierForm   from './pages/feedStore/FeedStoreSupplierForm';
import FeedStoreSupplierDetail from './pages/feedStore/FeedStoreSupplierDetail';
import FeedStoreCustomerList   from './pages/feedStore/FeedStoreCustomerList';
import FeedStoreCustomerForm   from './pages/feedStore/FeedStoreCustomerForm';
import FeedStoreCustomerDetail from './pages/feedStore/FeedStoreCustomerDetail';
import FeedStoreOrderList      from './pages/feedStore/FeedStoreOrderList';
import FeedStoreOrderForm      from './pages/feedStore/FeedStoreOrderForm';
import FeedStoreOrderDetail    from './pages/feedStore/FeedStoreOrderDetail';
import FeedStoreSalesList      from './pages/feedStore/FeedStoreSalesList';
import FeedStoreSalesForm      from './pages/feedStore/FeedStoreSalesForm';
import FeedStoreSalesDetail    from './pages/feedStore/FeedStoreSalesDetail';
import DrugStoreWorkspaceRoute from './pages/workspaceDashboards/DrugStoreWorkspaceRoute';
import FarmProfile from './pages/FarmProfile';
import WorkspaceSettingsMembers from './pages/WorkspaceSettingsMembers';
import WorkspaceSettingsArchive from './pages/WorkspaceSettingsArchive';
import WorkspaceSettingsRoles from './pages/WorkspaceSettingsRoles';
import AcceptInvitation from './pages/auth/AcceptInvitation';
import WorkspacePermissionGuard from './components/auth/WorkspacePermissionGuard';
import AdminGuard from './pages/admin/layout/AdminGuard';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './components/PublicLayout';
import ProtectedLayout from './components/ProtectedLayout';
import { WorkspaceProviderLayout } from './components/ProtectedLayout';
import { AuthenticatedRoute, OnboardingRoute } from './components/AuthenticatedRoute';
import Landing from './pages/Landing';
import InitializeGuard from './components/InitializeGuard';
import PlatformInitGuard from './components/PlatformInitGuard';
import Initialize from './pages/auth/Initialize';
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UsersModule = lazy(() => import('./pages/admin/modules/UsersModule'));
const WorkspacesModule = lazy(() => import('./pages/admin/modules/WorkspacesModule'));
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
const UsersRolesPage = lazy(() => import('./pages/admin/modules/UsersSubPages').then(m => ({ default: m.UsersRolesPage })));
const UsersActivityPage = lazy(() => import('./pages/admin/modules/UsersSubPages').then(m => ({ default: m.UsersActivityPage })));
const WorkspacesPlansPage = lazy(() => import('./pages/admin/modules/WorkspacesSubPages').then(m => ({ default: m.WorkspacesPlansPage })));
const WorkspacesVerificationPage = lazy(() => import('./pages/admin/modules/WorkspacesSubPages').then(m => ({ default: m.WorkspacesVerificationPage })));
const BlockedWorkspacesPage = lazy(() => import('./pages/admin/modules/WorkspacesSubPages').then(m => ({ default: m.BlockedWorkspacesPage })));
const PendingRequestsPage = lazy(() => import('./pages/admin/modules/WorkspacesSubPages').then(m => ({ default: m.PendingRequestsPage })));
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
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/marketplace/escrow-info" element={<MarketplaceEscrowInfo />} />
      <Route
        path="/marketplace/escrow-info/:providerId"
          element={<MarketplaceEscrowProviderDetail />} />
          <Route
            path="/marketplace/:kategoriSlug/:slug"
              element={<MarketplaceDetailListing />} 
              />
              <Route path="/news-event" element={<NewsEvent />} />
              <Route path="/news-event/:id" element={<NewsEventDetail />} />
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
      <Route path="/profile/workspace/:id/members" element={
        <WorkspacePermissionGuard module="memberManagement" action="view">
          <ProfileWorkspaceMembers />
        </WorkspacePermissionGuard>
      } />
      <Route path="/profile/business-insight"               element={<ProfileBusinessInsight />} />
      <Route path="/profile/subscription"                   element={<ProfileSubscription />} />
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
        {/* Users */}
        <Route path="/admin/users/roles"    element={<UsersRolesPage />} />
        <Route path="/admin/users/activity" element={<UsersActivityPage />} />
        {/* Workspaces */}
        <Route path="/admin/workspaces/plans"        element={<WorkspacesPlansPage />} />
        <Route path="/admin/workspaces/verification" element={<WorkspacesVerificationPage />} />
        <Route path="/admin/workspaces/blocked"      element={<BlockedWorkspacesPage />} />
        <Route path="/admin/workspaces/pending"      element={<PendingRequestsPage />} />
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
        {/* Subscription */}
        <Route path="/admin/subscription/billing"  element={<SubscriptionModule />} />
        <Route path="/admin/subscription/features" element={<SubscriptionModule />} />
        {/* Trust & Verification */}
        <Route path="/admin/trust/approved" element={<TrustModule />} />
        <Route path="/admin/trust/rejected" element={<TrustModule />} />
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
