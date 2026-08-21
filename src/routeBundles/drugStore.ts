// ─── Drug Store route bundle ────────────────────────────────────────────────────
//
// All Drug Store CRUD pages are bundled here to avoid over-splitting lazy
// imports in App.tsx. Each page is workspace-scoped via URL param :id.

import DrugStoreWorkspaceRoute from '../pages/workspaceDashboards/DrugStoreWorkspaceRoute';
import DrugStoreSupplierList from '../pages/drugStore/DrugStoreSupplierList';
import DrugStoreSupplierForm from '../pages/drugStore/DrugStoreSupplierForm';
import DrugStoreSupplierDetail from '../pages/drugStore/DrugStoreSupplierDetail';
import DrugStoreCustomerList from '../pages/drugStore/DrugStoreCustomerList';
import DrugStoreCustomerForm from '../pages/drugStore/DrugStoreCustomerForm';
import DrugStoreCustomerDetail from '../pages/drugStore/DrugStoreCustomerDetail';
import DrugStoreOrderList from '../pages/drugStore/DrugStoreOrderList';
import DrugStoreOrderForm from '../pages/drugStore/DrugStoreOrderForm';
import DrugStoreOrderDetail from '../pages/drugStore/DrugStoreOrderDetail';
import DrugStoreSalesList from '../pages/drugStore/DrugStoreSalesList';
import DrugStoreSalesForm from '../pages/drugStore/DrugStoreSalesForm';
import DrugStoreSalesDetail from '../pages/drugStore/DrugStoreSalesDetail';
import DrugStoreStokKeluar from '../pages/drugStore/DrugStoreStokKeluar';

export {
  DrugStoreWorkspaceRoute,
  DrugStoreSupplierList,
  DrugStoreSupplierForm,
  DrugStoreSupplierDetail,
  DrugStoreCustomerList,
  DrugStoreCustomerForm,
  DrugStoreCustomerDetail,
  DrugStoreOrderList,
  DrugStoreOrderForm,
  DrugStoreOrderDetail,
  DrugStoreSalesList,
  DrugStoreSalesForm,
  DrugStoreSalesDetail,
  DrugStoreStokKeluar,
};
