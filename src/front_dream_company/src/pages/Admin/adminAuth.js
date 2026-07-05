/* 관리자 인증 API — 모든 axios 호출은 withCredentials로 세션 쿠키 동봉 */

import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// 모든 axios 요청에 쿠키 자동 첨부 (관리자 세션 유지를 위해 필수)
axios.defaults.withCredentials = true;

// 401 응답이면 관리자 페이지일 때만 로그인 화면으로 보낸다 (고객 주문 페이지는 영향 X)
// 단, 인증 자체를 다루는 엔드포인트(/admin/auth/**)는 여기서 리다이렉트하지 않는다
//  - /me: 가드가 처리
//  - /login: 폼에서 에러 메시지 표시
//  - /change-password: 페이지에서 에러 메시지 표시
axios.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && window.location.pathname.startsWith("/admin")) {
      const url = err.config?.url || "";
      if (!url.includes("/admin/auth/")) {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(err);
  }
);

export async function adminLogin(username, password) {
  const res = await axios.post(`${BASE_URL}/api/admin/auth/login`, { username, password });
  return res.data; // { ok, authenticated, username, displayName, mustChangePassword, isSuperAdmin }
}

export async function adminLogout() {
  try { await axios.post(`${BASE_URL}/api/admin/auth/logout`); } catch (_) {}
}

export async function adminMe() {
  try {
    const res = await axios.get(`${BASE_URL}/api/admin/auth/me`);
    return res.data; // { authenticated, username, displayName, mustChangePassword, isSuperAdmin }
  } catch {
    return { authenticated: false };
  }
}

export async function adminChangePassword(currentPassword, newPassword) {
  const res = await axios.post(`${BASE_URL}/api/admin/auth/change-password`, {
    currentPassword, newPassword,
  });
  return res.data;
}

// ===== 관리자 계정 관리 (admin 전용) =====

export async function fetchAdminUsers() {
  const res = await axios.get(`${BASE_URL}/api/admin/users`);
  return res.data;
}

export async function createAdminUser(username) {
  const res = await axios.post(`${BASE_URL}/api/admin/users`, { username });
  return res.data;
}

export async function setAdminUserActive(adminNum, active) {
  const res = await axios.patch(`${BASE_URL}/api/admin/users/${adminNum}/active`, { active });
  return res.data;
}
