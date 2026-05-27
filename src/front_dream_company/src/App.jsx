import { Routes, Route, Navigate } from "react-router-dom";
import OrderForm from "./pages/OrderForm/OrderForm";
import ProductAdmin from "./pages/Admin/ProductAdmin";
import ClientAdmin from "./pages/Admin/ClientAdmin";
import FabricAliasAdmin from "./pages/Admin/FabricAliasAdmin";

function App() {
  return (
    <Routes>
      {/* 고객 주문 페이지 */}
      <Route path="/" element={<OrderForm />} />
      {/* 5자리 accessCode 를 URL parameter 로 받아 고객사 식별 */}
      <Route path="/:clientCode" element={<OrderForm />} />

      {/* 관리자 페이지 */}
      <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
      <Route path="/admin/products" element={<ProductAdmin />} />
      <Route path="/admin/clients" element={<ClientAdmin />} />
      <Route path="/admin/fabric-alias" element={<FabricAliasAdmin />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
