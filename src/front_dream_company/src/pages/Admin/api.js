/* 관리자 페이지 API */

import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// ── 매입처 ─────────────────────────────────────────────
export async function fetchSuppliers() {
  const res = await axios.get(`${BASE_URL}/api/suppliers`);
  return res.data.map(toSupplier);
}

export async function createSupplier(form) {
  const res = await axios.post(`${BASE_URL}/api/suppliers`, toSupplierReq(form));
  return toSupplier(res.data);
}

export async function updateSupplier(supNum, form) {
  const res = await axios.put(`${BASE_URL}/api/suppliers/${supNum}`, toSupplierReq(form));
  return toSupplier(res.data);
}

export async function deleteSupplier(supNum) {
  await axios.delete(`${BASE_URL}/api/suppliers/${supNum}`);
}

function toSupplier(s) {
  return {
    id: String(s.supNum),
    supNum: s.supNum,
    name: s.supName,
  };
}

function toSupplierReq(form) {
  return {
    supName: form.name,
  };
}

// ── 제품(원단) ──────────────────────────────────────────
function toProduct(p) {
  return {
    id: String(p.prodNum),
    prodNum: p.prodNum,
    code: p.prodCode,
    name: p.prodName,
    price: p.prodPrice,
    manufacturer: p.manufacturer,
    status: p.prodStatus || "사용",
    updatedAt: p.regDate ? new Date(p.regDate) : new Date(),
  };
}

export async function updateProductStatus(prodNum, prodStatus) {
  const res = await axios.patch(`${BASE_URL}/api/products/${prodNum}/status`, { prodStatus });
  return toProduct(res.data);
}

function toProductReq(form) {
  return {
    prodCode: form.code,
    prodName: form.name,
    prodPrice: form.price,
    manufacturer: form.manufacturer,
  };
}

export async function fetchProducts() {
  const res = await axios.get(`${BASE_URL}/api/products`);
  return res.data.map(toProduct);
}

export async function createProduct(form) {
  const res = await axios.post(`${BASE_URL}/api/products`, toProductReq(form));
  return toProduct(res.data);
}

export async function updateProduct(prodNum, form) {
  const res = await axios.put(`${BASE_URL}/api/products/${prodNum}`, toProductReq(form));
  return toProduct(res.data);
}

export async function deleteProduct(prodNum) {
  await axios.delete(`${BASE_URL}/api/products/${prodNum}`);
}

// ── 거래처 ──────────────────────────────────────────────
function toClient(c) {
  return {
    id: c.cliNum,
    cliNum: c.cliNum,
    cliCode: c.cliCode || "",
    name: c.cliCompName || "",
    ceoName: c.cliCeoName || "",
    tel: c.cliTel || "",
    fax: c.cliFax || "",
    managerName: c.cliManagerName || "",
    managerPhone: c.cliManagerTel || "",
    email: c.cliEmail || "",
    address: c.cliAddress || "",
    useType: c.cliUseType || "",
    createdAt: c.joinDate ? new Date(c.joinDate) : new Date(),
    updatedAt: c.joinDate ? new Date(c.joinDate) : new Date(),
  };
}

function toClientReq(form) {
  return {
    cliCode: form.cliCode,
    cliCompName: form.name,
    cliCeoName: form.ceoName,
    cliTel: form.tel,
    cliFax: form.fax,
    cliManagerName: form.managerName,
    cliManagerTel: form.managerPhone,
    cliEmail: form.email,
    cliAddress: form.address,
    cliUseType: form.useType, // 등록 시 null로 보내면 DB DEFAULT 'YES' 적용
  };
}

export async function fetchClients() {
  const res = await axios.get(`${BASE_URL}/api/clients`);
  return res.data.map(toClient);
}

export async function createClient(form) {
  const res = await axios.post(`${BASE_URL}/api/clients`, toClientReq(form));
  return toClient(res.data);
}

export async function updateClient(cliNum, form) {
  const res = await axios.put(`${BASE_URL}/api/clients/${cliNum}`, toClientReq(form));
  return toClient(res.data);
}

// ── 거래처 별칭(CLIENT_FABRIC_ALIAS) — 관리자용 ─────────
function toAlias(a) {
  return {
    aliasNum:  a.aliasNum,
    cliNum:    a.cliNum,
    prodNum:   a.prodNum,
    prodCode:  a.prodCode,
    prodName:  a.prodName,
    aliasName: a.clientFabName,
    price:     a.clientFabPrice,
  };
}

export async function fetchAliases(cliNum) {
  const res = await axios.get(`${BASE_URL}/api/aliases`, { params: { cliNum } });
  return res.data.map(toAlias);
}

export async function createAlias({ cliNum, prodNum, aliasName, price }) {
  const res = await axios.post(`${BASE_URL}/api/aliases`, {
    cliNum, prodNum,
    clientFabName: aliasName,
    clientFabPrice: price ?? null,
  });
  return toAlias(res.data);
}

export async function updateAlias(aliasNum, { aliasName, price }) {
  const res = await axios.put(`${BASE_URL}/api/aliases/${aliasNum}`, {
    cliNum: 0, prodNum: 0,
    clientFabName: aliasName,
    clientFabPrice: price ?? null,
  });
  return toAlias(res.data);
}

export async function deleteAlias(aliasNum) {
  await axios.delete(`${BASE_URL}/api/aliases/${aliasNum}`);
}

export async function fetchAliasCounts() {
  const res = await axios.get(`${BASE_URL}/api/aliases/counts`);
  return res.data; // { cliNum: count }
}

export async function resetClientPassword(cliNum) {
  const res = await axios.patch(`${BASE_URL}/api/clients/${cliNum}/reset-password`);
  return res.data;
}

// ── 관리자 주문 내역 (스프레드시트 비교용) ───────────────
export async function fetchAdminOrders() {
  const res = await axios.get(`${BASE_URL}/api/admin/orders`);
  return res.data.map((r) => ({
    orderNum: r.orderNum,
    itemNum: r.itemNum,
    orderId: r.orderId,
    orderDate: r.orderDate ? new Date(r.orderDate) : null,
    status: r.status,          // 'PENDING' | 'OK' | 'FAILED'
    cliCode: r.cliCode,
    cliCompName: r.cliCompName,
    product: r.product,
    productLabel: r.productLabel,
    width: r.width,
    length: r.length,
    rolls: r.rolls,
    destination: r.destination,
    note: r.note,
    deliveryDate: r.deliveryDate || "",
    unitPrice: r.unitPrice,
    aliasName: r.aliasName || "",
  }));
}

export async function updateAdminOrderItem(itemNum, body) {
  const res = await axios.patch(`${BASE_URL}/api/admin/orders/items/${itemNum}`, body);
  return res.data; // AdminOrderRow (서버 반환 그대로)
}

export async function deleteAdminOrderItem(itemNum) {
  await axios.delete(`${BASE_URL}/api/admin/orders/items/${itemNum}`);
}

export async function fetchClientDestinations(cliCode) {
  if (!cliCode) return [];
  const res = await axios.get(`${BASE_URL}/api/clients/${cliCode}/destinations`);
  return res.data;
}

export async function fetchOrderAudit(orderNum) {
  const res = await axios.get(`${BASE_URL}/api/admin/orders/${orderNum}/audit`);
  return res.data.map((a) => ({
    auditNum: a.auditNum,
    orderNum: a.orderNum,
    itemNum: a.itemNum,
    action: a.action,
    actor: a.actor,
    beforeJson: a.beforeJson,
    afterJson: a.afterJson,
    memo: a.memo,
    at: a.at ? new Date(a.at) : null,
  }));
}
