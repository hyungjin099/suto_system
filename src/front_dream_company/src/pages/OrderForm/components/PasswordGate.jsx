/* 주문 페이지 진입 비밀번호 게이트
 * - 거래처별 로그인 → 기본 비번('1234')이면 변경 화면 → 통과 시 children 렌더
 * - sessionStorage로 동일 탭 내 재요청 방지 (탭 닫으면 사라짐)
 *
 * 최초 접속 판단은 서버가 함:
 *   /api/clients/{cliCode}/login 응답의 mustChangePassword 플래그
 *   = 저장된 비번이 DEFAULT('1234')와 일치할 때 true
 */

import { useState, useEffect } from "react";
import { loginClient, changeClientPassword } from "../api";
import styles from "./PasswordGate.module.css";

const STORAGE_KEY = (cliCode) => `orderAuth:${cliCode}`;

export default function PasswordGate({ cliCode, children }) {
  const [stage, setStage] = useState("loading"); // loading | login | change | authed
  const [password, setPassword] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!cliCode) return;
    if (sessionStorage.getItem(STORAGE_KEY(cliCode)) === "ok") setStage("authed");
    else setStage("login");
  }, [cliCode]);

  const onLogin = async (e) => {
    e?.preventDefault();
    setError(""); setSubmitting(true);
    try {
      const res = await loginClient(cliCode, password);
      if (res.mustChangePassword) {
        setStage("change");
      } else {
        sessionStorage.setItem(STORAGE_KEY(cliCode), "ok");
        setStage("authed");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const onChange = async (e) => {
    e?.preventDefault();
    setError("");
    if (newPwd.length < 4) { setError("새 비밀번호는 4자 이상이어야 합니다."); return; }
    if (newPwd !== newPwd2) { setError("새 비밀번호가 일치하지 않습니다."); return; }
    if (newPwd === "1234") { setError("기본 비밀번호로는 변경할 수 없습니다."); return; }
    setSubmitting(true);
    try {
      await changeClientPassword(cliCode, password, newPwd);
      sessionStorage.setItem(STORAGE_KEY(cliCode), "ok");
      setStage("authed");
    } catch (err) {
      setError(err?.response?.data?.message || "비밀번호 변경 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (stage === "loading") return null;
  if (stage === "authed") return children;

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        {stage === "login" ? (
          <form onSubmit={onLogin}>
            <h1 className={styles.title}>주문 페이지 접속</h1>
            <p className={styles.desc}>비밀번호를 입력해 주세요.</p>
            <input
              type="password"
              autoFocus
              className={styles.input}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="비밀번호"
            />
            {error && <div className={styles.error}>{error}</div>}
            <button type="submit" className={styles.submit} disabled={submitting || !password}>
              {submitting ? "확인 중…" : "확인"}
            </button>
            <p className={styles.hint}>
              비밀번호 분실 시 관리자에게 초기화를 요청해 주세요.
            </p>
          </form>
        ) : (
          <form onSubmit={onChange}>
            <h1 className={styles.title}>비밀번호 변경 필요</h1>
            <p className={styles.desc}>
              기본 비밀번호로 접속 중입니다. 새 비밀번호를 설정해 주세요.
              <br />(4자 이상)
            </p>
            <input
              type="password"
              autoFocus
              className={styles.input}
              value={newPwd}
              onChange={(e) => { setNewPwd(e.target.value); setError(""); }}
              placeholder="새 비밀번호"
            />
            <input
              type="password"
              className={styles.input}
              value={newPwd2}
              onChange={(e) => { setNewPwd2(e.target.value); setError(""); }}
              placeholder="새 비밀번호 확인"
            />
            {error && <div className={styles.error}>{error}</div>}
            <button type="submit" className={styles.submit} disabled={submitting || !newPwd}>
              {submitting ? "변경 중…" : "변경 후 진입"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
