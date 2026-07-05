/* 관리자 로그인 페이지 */

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { adminLogin } from "./adminAuth";
import styles from "./AdminLogin.module.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setSubmitting(true);
    try {
      const res = await adminLogin(username, password);
      if (res?.mustChangePassword) {
        navigate("/admin/change-password", { replace: true });
        return;
      }
      const redirectTo = location.state?.from?.pathname || "/admin";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <form onSubmit={submit} className={styles.card}>
        <div className={styles.eyebrow}>ADMIN</div>
        <h1 className={styles.title}>관리자 로그인</h1>
        <p className={styles.desc}>아이디와 비밀번호를 입력해 주세요.</p>

        <label className={styles.label}>아이디</label>
        <input
          autoFocus
          className={styles.input}
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError(""); }}
        />

        <label className={styles.label}>비밀번호</label>
        <input
          type="password"
          className={styles.input}
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
        />

        {error && <div className={styles.error}>{error}</div>}

        <button
          type="submit"
          disabled={submitting || !username || !password}
          className={styles.submit}
        >
          {submitting ? "확인 중…" : "로그인"}
        </button>
      </form>
    </div>
  );
}
