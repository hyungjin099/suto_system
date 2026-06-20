/* 관리자 페이지 API */

import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// ── 입고처 ─────────────────────────────────────────────
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
    tel: s.supTel || "",
    managerName: s.supManagerName || "",
    managerTel: s.supManagerTel || "",
    regDate: s.regDate ? new Date(s.regDate) : new Date(),
  };
}

function toSupplierReq(form) {
  return {
    supName: form.name,
    supTel: form.tel,
    supManagerName: form.managerName,
    supManagerTel: form.managerTel,
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
    updatedAt: p.regDate ? new Date(p.regDate) : new Date(),
  };
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

export async function deleteClient(cliNum) {
  await axios.delete(`${BASE_URL}/api/clients/${cliNum}`);
}
