/* 주문 폼 → Spring 백엔드 API 연결 */

import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function fetchClientInfo(cliCode) {
  const res = await axios.get(`${BASE_URL}/api/clients/${cliCode}/info`);
  return res.data; // { cliCode, cliCompName, cliManagerTel, cliUseType }
}

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

export async function fetchClientDestinations(cliCode) {
  if (!cliCode) return [];
  const res = await axios.get(`${BASE_URL}/api/clients/${cliCode}/destinations`);
  return res.data;
}

export async function fetchClientFabrics(cliCode) {
  const res = await axios.get(`${BASE_URL}/api/clients/${cliCode}/fabrics`);
  // 같은 prodCode에 별칭이 여러 개일 수 있으므로 aliasNum 기반 유니크 키 사용
  return res.data.map((f) => ({
    value: String(f.aliasNum),   // select의 유니크 키
    aliasNum: f.aliasNum,
    aliasName: f.aliasName,
    prodCode: f.prodCode,
    prodName: f.prodName,
    label: f.aliasName,
    price: f.clientFabPrice,
  }));
}

export async function submitOrder({ cliCode, clientName, managerPhone, items }) {
  const payload = {
    cliCode,
    clientName: clientName || "",
    managerPhone: managerPhone || "",
    items: items.map((it) => ({
      // it.product는 이제 aliasNum(문자열). 백엔드엔 실제 prodCode를 보냄
      product: it.prodCode || "",
      // productLabel = 별칭(고객사가 부르는 이름). 백엔드가 가격 스냅샷 시 이걸로 별칭 매칭
      productLabel: it.aliasName || it.prodName || "",
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
