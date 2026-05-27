/* 주문 폼 → Spring 백엔드 API 연결 */

import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function fetchClientFabrics(urlNum) {
  const res = await axios.get(`${BASE_URL}/api/clients/${urlNum}/fabrics`);
  return res.data.map((f) => ({
    value: f.prodCode,
    label: f.aliasName,
    prodName: f.prodName,
  }));
}

export async function submitOrder({ urlNum, destination, clientName, managerPhone, items }) {
  const payload = {
    urlNum,
    destination: destination || "",
    clientName: clientName || "",
    managerPhone: managerPhone || "",
    items: items.map((it) => ({
      product: it.product,
      productLabel: it.prodName || it.product,
      width: parseInt(it.width, 10) || 0,
      length: parseInt(it.length, 10) || 0,
      rolls: parseInt(it.rolls, 10) || 1,
    })),
  };

  const res = await axios.post(`${BASE_URL}/api/orders`, payload);
  return res.data;
}
