/* 관리자 영역 공통 레이아웃 라우트
 * - NotificationProvider를 자식 라우트 전환과 무관하게 유지
 *   (여기 위에 두면 /admin/products ↔ /admin/orders 이동 시 SSE 재연결 발생 안 함)
 * - 로그인 페이지에는 Provider가 걸리지 않도록 /admin/login은 별도 라우트
 */

import { Outlet } from "react-router-dom";
import { NotificationProvider } from "./notifications/NotificationContext";

export default function AdminArea() {
  return (
    <NotificationProvider enabled={true}>
      <Outlet />
    </NotificationProvider>
  );
}
