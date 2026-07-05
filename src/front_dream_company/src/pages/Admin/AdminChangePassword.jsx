/* 관리자 비밀번호 변경 페이지
 * - 최초 로그인 시 강제 진입: AdminGuard가 mustChangePassword를 감지하고 여기로 리다이렉트
 * - 정상 로그인 상태에서도 자발적 변경 가능
 */

import { useState } from "react";
import { adminChangePassword } from "./adminAuth";
import styles from "./AdminLogin.module.css";

export default function AdminChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호와 확인 값이 다릅니다.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("새 비밀번호는 현재 비밀번호와 달라야 합니다.");
      return;
    }
    setSubmitting(true);
    try {
      await adminChangePassword(currentPassword, newPassword);
      // 하드 리로드: AdminGuard가 새 세션 상태 그대로 /me를 다시 조회하도록
      window.location.replace("/admin");
    } catch (err) {
      setError(err?.response?.data?.message || "변경 중 오류가 발생했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <form onSubmit={submit} className={styles.card}>
        <div className={styles.eyebrow}>ADMIN</div>
        <h1 className={styles.title}>비밀번호 변경</h1>
        <p className={styles.desc}>
          초기 비밀번호는 반드시 변경해야 합니다. 새 비밀번호는 8자 이상이어야 합니다.
        </p>

        <label className={styles.label}>현재 비밀번호</label>
        <input
          autoFocus
          type="password"
          className={styles.input}
          value={currentPassword}
          onChange={(e) => { setCurrentPassword(e.target.value); setError(""); }}
        />

        <label className={styles.label}>새 비밀번호</label>
        <input
          type="password"
          className={styles.input}
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
        />

        <label className={styles.label}>새 비밀번호 확인</label>
        <input
          type="password"
          className={styles.input}
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
        />

        {error && <div className={styles.error}>{error}</div>}

        <button
          type="submit"
          disabled={submitting || !currentPassword || !newPassword || !confirmPassword}
          className={styles.submit}
        >
          {submitting ? "변경 중…" : "비밀번호 변경"}
        </button>
      </form>
    </div>
  );
}
