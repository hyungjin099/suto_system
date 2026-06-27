/* 관리자 라우트 보호 — /me로 세션 확인, 미인증이면 /admin/login으로 이동 */

import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { adminMe } from "./adminAuth";

export default function AdminGuard({ children }) {
  const location = useLocation();
  const [state, setState] = useState({ loading: true, authed: false });

  useEffect(() => {
    let alive = true;
    adminMe().then((r) => {
      if (alive) setState({ loading: false, authed: !!r.authenticated });
    });
    return () => { alive = false; };
  }, [location.pathname]);

  if (state.loading) return null;
  if (!state.authed) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }
  return children;
}
