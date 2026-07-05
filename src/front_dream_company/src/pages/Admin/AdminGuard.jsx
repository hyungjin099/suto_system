/* 관리자 라우트 보호
 * - /me로 세션 확인, 미인증이면 /admin/login으로 이동
 * - mustChangePassword=true인 상태에서 /admin/change-password 외 경로는 강제로 change-password로 이동
 * - superAdminOnly=true인 경우 admin 계정이 아니면 /admin으로 리다이렉트
 */

import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { adminMe } from "./adminAuth";

export default function AdminGuard({ children, superAdminOnly = false }) {
  const location = useLocation();
  const [state, setState] = useState({ loading: true, me: null });

  useEffect(() => {
    let alive = true;
    adminMe().then((r) => {
      if (alive) setState({ loading: false, me: r });
    });
    return () => { alive = false; };
  }, [location.pathname]);

  if (state.loading) return null;
  const me = state.me;
  if (!me?.authenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }
  if (me.mustChangePassword && location.pathname !== "/admin/change-password") {
    return <Navigate to="/admin/change-password" replace />;
  }
  if (superAdminOnly && !me.isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }
  return children;
}
