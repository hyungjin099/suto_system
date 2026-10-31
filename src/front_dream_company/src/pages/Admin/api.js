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

// 여러 원단을 한 거래처에 일괄 별칭 등록 (별칭명·단가는 원단의 공식값 사용)
// 응답: { created: [ClientAliasAdminDto...], skipped: [{prodNum, prodName, reason}...] }
export async function createAliasesBulk(cliNum, prodNums) {
  const res = await axios.post(`${BASE_URL}/api/aliases/bulk`, { cliNum, prodNums });
  return res.data;
}

export async function fetchAliasCounts() {
  const res = await axios.get(`${BASE_URL}/api/aliases/counts`);
  return res.data; // { cliNum: count }
}

/** 거래처별 제품 목록 정렬 순서 저장 (aliasNums 순서대로 1,2,3...) */
export async function saveAliasSortOrder(cliNum, aliasNums) {
  await axios.put(`${BASE_URL}/api/aliases/sort-order`, { aliasNums }, { params: { cliNum } });
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
    createdBy: r.createdBy || "",   // 'CUSTOMER' | 관리자 username | ''(접수 기록 없는 과거 주문)
    cutDone: r.cutDone === "Y",     // 재단 작업 완료 여부
    cancelled: r.cancelled === "Y", // 취소 여부 (취소해도 행은 남아 이력으로 조회됨)
    cancelledAt: r.cancelledAt ? new Date(r.cancelledAt) : null,
    restoredOrderId: r.restoredOrderId && r.restoredOrderId !== "-" ? r.restoredOrderId : "", // 새 주문으로 복구된 경우 그 주문번호
  }));
}

/** 재단 작업 완료 체크/해제. 시트와 연동 없음(관리자 화면 전용) */
export async function setOrderItemCutDone(itemNum, done) {
  const res = await axios.patch(`${BASE_URL}/api/admin/orders/items/${itemNum}/cut-done`, { done });
  return res.data; // { itemNum, cutDone }
}

export async function updateAdminOrderItem(itemNum, body) {
  const res = await axios.patch(`${BASE_URL}/api/admin/orders/items/${itemNum}`, body);
  return res.data; // AdminOrderRow (서버 반환 그대로)
}

/** 주문 품목 취소. 행은 지우지 않는다. 시트와 연동 없음 */
export async function cancelAdminOrderItem(itemNum) {
  const res = await axios.patch(`${BASE_URL}/api/admin/orders/items/${itemNum}/cancel`);
  return res.data; // { itemNum, cancelled }
}

/** 취소된 품목을 새 주문으로 복구 (새 주문번호·현재 시각으로 접수, 시트에도 새로 전송) */
export async function restoreAdminOrderItem(itemNum) {
  const res = await axios.post(`${BASE_URL}/api/admin/orders/items/${itemNum}/restore`);
  return res.data; // { itemNum, newOrderId, deliveryDate }
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

// ── 고객 주문 페이지 팝업 ─────────────────────────────────
function toPopup(p) {
  return {
    popupNum: p.popupNum,
    title: p.title || "",
    content: p.content || "",
    startAt: p.startAt ? new Date(p.startAt) : null,
    endAt: p.endAt ? new Date(p.endAt) : null,
    use: p.useYn === "Y",
    targetAll: p.targetAll === "Y",
    cliCodes: p.cliCodes || [],
    contentVer: p.contentVer,
  };
}

// Date → 'yyyy-MM-ddTHH:mm' (서버는 KST 로컬 시각으로 해석)
function toLocalIso(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toPopupReq(form) {
  return {
    title: form.title,
    content: form.content,
    startAt: toLocalIso(form.startAt),
    endAt: toLocalIso(form.endAt),
    use: form.use,
    targetAll: form.targetAll,
    cliCodes: form.targetAll ? [] : form.cliCodes,
    replaceConflicts: !!form.replaceConflicts,
  };
}

export async function fetchPopups() {
  const res = await axios.get(`${BASE_URL}/api/admin/popups`);
  return res.data.map(toPopup);
}

export async function createPopup(form) {
  const res = await axios.post(`${BASE_URL}/api/admin/popups`, toPopupReq(form));
  return toPopup(res.data);
}

export async function updatePopup(popupNum, form) {
  const res = await axios.put(`${BASE_URL}/api/admin/popups/${popupNum}`, toPopupReq(form));
  return toPopup(res.data);
}

export async function setPopupUse(popupNum, use, replace = false) {
  const res = await axios.patch(`${BASE_URL}/api/admin/popups/${popupNum}/use`, { use, replace });
  return toPopup(res.data);
}

export async function deletePopup(popupNum) {
  await axios.delete(`${BASE_URL}/api/admin/popups/${popupNum}`);
}

/** 자주 주문한 품목 (최근 90일, 같은 제품+규격 반복 횟수순) — 새 주문 추가 창의 빠른 담기용 */
export async function fetchFrequentItems(cliCode) {
  if (!cliCode) return [];
  const res = await axios.get(`${BASE_URL}/api/clients/${cliCode}/frequent-items`);
  return res.data; // [{ product, productLabel, width, length, rolls, destination, note, orderCount }]
}
