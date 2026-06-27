/* 관리자 인증 API — 모든 axios 호출은 withCredentials로 세션 쿠키 동봉 */

import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// 모든 axios 요청에 쿠키 자동 첨부 (관리자 세션 유지를 위해 필수)
axios.defaults.withCredentials = true;

// 401 응답이면 관리자 페이지일 때만 로그인 화면으로 보낸다 (고객 주문 페이지는 영향 X)
axios.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && window.location.pathname.startsWith("/admin")) {
      // /me 호출의 401은 가드가 처리하므로 패스
      if (!err.config?.url?.includes("/admin/auth/me")) {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(err);
  }
);

export async function adminLogin(username, password) {
  const res = await axios.post(`${BASE_URL}/api/admin/auth/login`, { username, password });
  return res.data;
}

export async function adminLogout() {
  try { await axios.post(`${BASE_URL}/api/admin/auth/logout`); } catch (_) {}
}

export async function adminMe() {
  try {
    const res = await axios.get(`${BASE_URL}/api/admin/auth/me`);
    return res.data; // { authenticated, username, displayName }
  } catch {
    return { authenticated: false };
  }
}
