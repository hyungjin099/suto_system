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
export async function fetchProducts() {
  const res = await axios.get(`${BASE_URL}/api/products`);
  return res.data.map((p) => ({
    id: String(p.prodNum),
    prodNum: p.prodNum,
    code: p.prodCode,
    category: p.prodCategory,
    name: p.prodName,
    price: p.prodPrice,
    manufacturer: p.manufacturer,
    updatedAt: p.regDate ? new Date(p.regDate) : new Date(),
  }));
}

export async function createProduct(form) {
  const res = await axios.post(`${BASE_URL}/api/products`, {
    prodCode: form.code,
    prodCategory: form.category,
    prodName: form.name,
    prodPrice: form.price,
    manufacturer: form.manufacturer,
  });
  const p = res.data;
  return {
    id: String(p.prodNum),
    prodNum: p.prodNum,
    code: p.prodCode,
    category: p.prodCategory,
    name: p.prodName,
    price: p.prodPrice,
    manufacturer: p.manufacturer,
    updatedAt: p.regDate ? new Date(p.regDate) : new Date(),
  };
}

export async function updateProduct(prodNum, form) {
  const res = await axios.put(`${BASE_URL}/api/products/${prodNum}`, {
    prodCode: form.code,
    prodCategory: form.category,
    prodName: form.name,
    prodPrice: form.price,
    manufacturer: form.manufacturer,
  });
  const p = res.data;
  return {
    id: String(p.prodNum),
    prodNum: p.prodNum,
    code: p.prodCode,
    category: p.prodCategory,
    name: p.prodName,
    price: p.prodPrice,
    manufacturer: p.manufacturer,
    updatedAt: p.regDate ? new Date(p.regDate) : new Date(),
  };
}

export async function deleteProduct(prodNum) {
  await axios.delete(`${BASE_URL}/api/products/${prodNum}`);
}
