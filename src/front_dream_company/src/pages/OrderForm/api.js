/* 주문 폼 → Spring 백엔드 API 연결 */

import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function loginClient(cliCode, password) {
  const res = await axios.post(`${BASE_URL}/api/clients/${cliCode}/login`, { password });
  return res.data; // {ok, mustChangePassword}
}

export async function changeClientPassword(cliCode, currentPassword, newPassword) {
  const res = await axios.patch(`${BASE_URL}/api/clients/${cliCode}/password`, {
    currentPassword, newPassword,
  });
  return res.data;
}

export async function fetchClientOrders(cliCode) {
  const res = await axios.get(`${BASE_URL}/api/clients/${cliCode}/orders`);
  return res.data.map((o) => ({
    orderNum: o.orderNum,
    orderId: o.orderId,
    orderDate: o.orderDate ? new Date(o.orderDate) : null,
    status: o.status,
    items: (o.items || []).map((it) => ({
      itemNum: it.itemNum,
      product: it.product,
      productLabel: it.productLabel,
      width: it.width,
      length: it.length,
      rolls: it.rolls,
      destination: it.destination,
      note: it.note,
    })),
  }));
}

export async function fetchClientFabrics(cliCode) {
  const res = await axios.get(`${BASE_URL}/api/clients/${cliCode}/fabrics`);
  return res.data.map((f) => ({
    value: f.prodCode,
    label: f.aliasName,
    prodName: f.prodName,
    price: f.clientFabPrice,
  }));
}

export async function submitOrder({ cliCode, clientName, managerPhone, items }) {
  const payload = {
    cliCode,
    clientName: clientName || "",
    managerPhone: managerPhone || "",
    items: items.map((it) => ({
      product: it.product,
      productLabel: it.prodName || it.product,
      width: parseInt(it.width, 10) || 0,
      length: parseInt(it.length, 10) || 0,
      rolls: parseInt(it.rolls, 10) || 1,
      destination: it.destination?.trim() || clientName || "",
      note: it.note?.trim() || "",
    })),
  };

  const res = await axios.post(`${BASE_URL}/api/orders`, payload);
  return res.data;
}
