import { Routes, Route, Navigate } from "react-router-dom";
import OrderForm from "./pages/OrderForm/OrderForm";
import ProductAdmin from "./pages/Admin/ProductAdmin";
import ClientAdmin from "./pages/Admin/ClientAdmin";
import FabricAliasAdmin from "./pages/Admin/FabricAliasAdmin";
import SupplierAdmin from "./pages/Admin/SupplierAdmin";
import OrderAdmin from "./pages/Admin/OrderAdmin";
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminGuard from "./pages/Admin/AdminGuard";
import AdminChangePassword from "./pages/Admin/AdminChangePassword";
import AdminUsers from "./pages/Admin/AdminUsers";

function App() {
  return (
    <Routes>
      {/* 고객 주문 페이지 */}
      <Route path="/" element={<OrderForm />} />
      <Route path="/:clientCode" element={<OrderForm />} />

      {/* 관리자 로그인 (가드 없음) */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* 비밀번호 변경 — 로그인은 되어 있어야 하나 mustChangePassword 우회 대상이므로 별도 처리 */}
      <Route path="/admin/change-password" element={<AdminGuard><AdminChangePassword /></AdminGuard>} />

      {/* 관리자 페이지 — 모두 AdminGuard로 보호 */}
      <Route path="/admin" element={<AdminGuard><Navigate to="/admin/products" replace /></AdminGuard>} />
      <Route path="/admin/products" element={<AdminGuard><ProductAdmin /></AdminGuard>} />
      <Route path="/admin/clients" element={<AdminGuard><ClientAdmin /></AdminGuard>} />
      <Route path="/admin/suppliers" element={<AdminGuard><SupplierAdmin /></AdminGuard>} />
      <Route path="/admin/fabric-alias" element={<AdminGuard><FabricAliasAdmin /></AdminGuard>} />
      <Route path="/admin/orders" element={<AdminGuard><OrderAdmin /></AdminGuard>} />

      {/* 관리자 계정 관리 — admin 계정만 접근 가능 */}
      <Route path="/admin/users" element={<AdminGuard superAdminOnly><AdminUsers /></AdminGuard>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
