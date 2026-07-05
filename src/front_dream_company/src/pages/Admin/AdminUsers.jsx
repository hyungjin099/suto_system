/* 관리자 계정 관리 (admin 계정만 접근)
 * - 목록/추가/비활성 토글
 * - admin 계정 본인은 상태 변경 불가
 */

import { useEffect, useState } from "react";
import { AdminShell } from "./components/Layout";
import { fetchAdminUsers, createAdminUser, setAdminUserActive } from "./adminAuth";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUsername, setNewUsername] = useState("");
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchAdminUsers();
      setUsers(list);
    } catch (e) {
      setErr(e?.response?.data?.message || "목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");
    if (!newUsername.trim()) return;
    setCreating(true);
    try {
      await createAdminUser(newUsername.trim());
      setMsg(`계정 "${newUsername.trim()}" 생성 완료. 초기 비밀번호는 1234이며 최초 로그인 시 변경이 강제됩니다.`);
      setNewUsername("");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "계정 생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  };

  const onToggle = async (user) => {
    const active = user.useYn === "Y";
    const label = active ? "비활성화" : "활성화";
    if (!window.confirm(`"${user.username}" 계정을 ${label}하시겠습니까?`)) return;
    setErr(""); setMsg("");
    try {
      await setAdminUserActive(user.adminNum, !active);
      setMsg(`"${user.username}" ${label} 완료.`);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "상태 변경에 실패했습니다.");
    }
  };

  return (
    <AdminShell>
      <div style={{ maxWidth: 720 }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 20 }}>관리자 계정 관리</h2>

        <form onSubmit={onCreate} style={rowStyle}>
          <input
            type="text"
            value={newUsername}
            onChange={(e) => { setNewUsername(e.target.value); setErr(""); setMsg(""); }}
            placeholder="새 관리자 아이디 (영문/숫자/._-, 3~50자)"
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={creating || !newUsername.trim()}
            style={primaryBtn}
          >
            {creating ? "생성 중…" : "계정 추가"}
          </button>
        </form>
        <p style={hintStyle}>
          신규 계정의 초기 비밀번호는 <b>1234</b>입니다. 해당 계정의 첫 로그인 시 비밀번호 변경이 강제됩니다.
        </p>

        {err && <div style={errStyle}>{err}</div>}
        {msg && <div style={msgStyle}>{msg}</div>}

        <div style={{ marginTop: 20 }}>
          {loading ? (
            <div style={{ color: "var(--ink-2)" }}>불러오는 중…</div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>아이디</th>
                  <th style={thStyle}>표시명</th>
                  <th style={thStyle}>상태</th>
                  <th style={thStyle}>비번 초기화 상태</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSuper = u.username === "admin";
                  const active = u.useYn === "Y";
                  return (
                    <tr key={u.adminNum}>
                      <td style={tdStyle}>
                        {u.username}
                        {isSuper && <span style={badgeStyle}>최고 관리자</span>}
                      </td>
                      <td style={tdStyle}>{u.displayName || "—"}</td>
                      <td style={tdStyle}>
                        <span style={active ? statusOn : statusOff}>
                          {active ? "활성" : "비활성"}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {u.passwordResetRequired === "Y" ? "변경 필요 (1234)" : "변경 완료"}
                      </td>
                      <td style={tdStyle}>
                        {isSuper ? (
                          <span style={{ color: "var(--ink-3)", fontSize: 12 }}>—</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onToggle(u)}
                            style={active ? dangerBtn : okBtn}
                          >
                            {active ? "비활성화" : "활성화"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr><td style={tdStyle} colSpan={5}>등록된 관리자 계정이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

// ===== 인라인 스타일 (Layout과 톤 맞춤) =====
const rowStyle    = { display: "flex", gap: 8, alignItems: "center" };
const inputStyle  = { flex: 1, height: 36, padding: "0 12px", border: "1px solid var(--line)", borderRadius: 8, fontSize: 14 };
const primaryBtn  = { height: 36, padding: "0 16px", background: "var(--brand, #4a7c59)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" };
const dangerBtn   = { height: 30, padding: "0 12px", background: "#fff", color: "#b42318", border: "1px solid #fecdca", borderRadius: 6, fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
const okBtn       = { height: 30, padding: "0 12px", background: "#fff", color: "#067647", border: "1px solid #abefc6", borderRadius: 6, fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
const hintStyle   = { margin: "8px 0 0", fontSize: 12.5, color: "var(--ink-2)" };
const errStyle    = { marginTop: 12, padding: "10px 12px", background: "#fef3f2", color: "#b42318", border: "1px solid #fecdca", borderRadius: 8, fontSize: 13 };
const msgStyle    = { marginTop: 12, padding: "10px 12px", background: "#ecfdf3", color: "#067647", border: "1px solid #abefc6", borderRadius: 8, fontSize: 13 };
const tableStyle  = { width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" };
const thStyle     = { textAlign: "left", padding: "10px 12px", background: "#f8faf9", borderBottom: "1px solid var(--line)", fontSize: 12.5, color: "var(--ink-2)", fontWeight: 600 };
const tdStyle     = { padding: "10px 12px", borderBottom: "1px solid var(--line)", fontSize: 13.5 };
const badgeStyle  = { marginLeft: 8, padding: "2px 6px", background: "#eff6ff", color: "#1849a9", border: "1px solid #b2ddff", borderRadius: 6, fontSize: 11, fontWeight: 600 };
const statusOn    = { color: "#067647", fontWeight: 600 };
const statusOff   = { color: "#b42318", fontWeight: 600 };
