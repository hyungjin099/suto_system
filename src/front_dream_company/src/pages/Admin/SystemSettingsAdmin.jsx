/* 시스템 설정 (superadmin 전용)
 * - 스프레드시트 웹훅 URL을 상반기(H1) / 하반기(H2)로 각각 저장
 * - 백엔드가 현재 KST 월에 따라 자동으로 H1/H2 중 하나를 선택해 사용
 * - 담당자는 반기 전환 전에 미리 다음 URL을 넣어두면 됨. 사람 개입은 12월 중 한 번뿐.
 */

import { useEffect, useState } from "react";
import { AdminShell } from "./components/Layout";
import { fetchSystemSettings, updateSystemSetting } from "./adminAuth";

const KEY_H1 = "SHEETS_WEBHOOK_URL_H1";
const KEY_H2 = "SHEETS_WEBHOOK_URL_H2";

export default function SystemSettingsAdmin() {
  const [rows, setRows] = useState({ [KEY_H1]: null, [KEY_H2]: null });
  const [inputs, setInputs] = useState({ [KEY_H1]: "", [KEY_H2]: "" });
  const [currentPeriod, setCurrentPeriod] = useState("");
  const [currentKey, setCurrentKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [toast, setToast] = useState(null); // { text, tone: 'ok'|'err' }

  const load = async () => {
    setLoading(true);
    setErr(""); setMsg("");
    try {
      const res = await fetchSystemSettings();
      const items = res?.items || [];
      const nextRows = { [KEY_H1]: null, [KEY_H2]: null };
      items.forEach((r) => {
        if (r.key === KEY_H1 || r.key === KEY_H2) nextRows[r.key] = r;
      });
      setRows(nextRows);
      setInputs({
        [KEY_H1]: nextRows[KEY_H1]?.value || "",
        [KEY_H2]: nextRows[KEY_H2]?.value || "",
      });
      setCurrentPeriod(res?.currentPeriod || "");
      setCurrentKey(res?.currentWebhookKey || "");
    } catch (e) {
      setErr(e?.response?.data?.message || "설정을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showToast = (text, tone = "ok") => {
    setToast({ text, tone });
    setTimeout(() => setToast(null), 3200);
  };

  const onSave = async (key) => {
    setErr(""); setMsg("");
    const value = (inputs[key] || "").trim();
    if (!value) {
      setErr("웹훅 URL을 입력해 주세요.");
      showToast("웹훅 URL을 입력해 주세요.", "err");
      return;
    }
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec/.test(value)) {
      if (!window.confirm(
        "일반적인 Apps Script 웹앱 URL 형식(https://script.google.com/macros/s/.../exec)이 아닙니다. 그래도 저장하시겠습니까?"
      )) return;
    }
    setSavingKey(key);
    try {
      await updateSystemSetting(key, value);
      setMsg(labelFor(key) + " 저장 완료.");
      showToast("✓ " + labelFor(key) + " 저장 완료");
      await load();
    } catch (e) {
      const emsg = e?.response?.data?.message || "저장에 실패했습니다.";
      setErr(emsg);
      showToast(emsg, "err");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <AdminShell>
      <div style={{ maxWidth: 860 }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 20 }}>시스템 설정</h2>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--ink-2)" }}>
          최고 관리자만 편집할 수 있습니다.
        </p>

        <div style={cardStyle}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
              스프레드시트 웹훅 URL
            </div>
            <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.55 }}>
              반기별로 스프레드시트가 나뉘어 있어 URL도 두 개를 저장합니다.
              <b> 현재 시각의 월에 따라 시스템이 자동으로 골라서 사용</b>합니다.
              6월/12월 새 시트가 만들어지면, 반기 전환 전에 미리 다음 반기의 URL만 넣어두면 됩니다.
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 20, color: "var(--ink-2)" }}>불러오는 중…</div>
          ) : (
            <div>
              <PeriodRow
                periodKey={KEY_H1}
                label="상반기 (1~6월)"
                current={currentKey === KEY_H1}
                row={rows[KEY_H1]}
                value={inputs[KEY_H1]}
                onChange={(v) => setInputs((s) => ({ ...s, [KEY_H1]: v }))}
                onSave={() => onSave(KEY_H1)}
                saving={savingKey === KEY_H1}
              />
              <PeriodRow
                periodKey={KEY_H2}
                label="하반기 (7~12월)"
                current={currentKey === KEY_H2}
                row={rows[KEY_H2]}
                value={inputs[KEY_H2]}
                onChange={(v) => setInputs((s) => ({ ...s, [KEY_H2]: v }))}
                onSave={() => onSave(KEY_H2)}
                saving={savingKey === KEY_H2}
              />

              {err && <div style={{ ...msgBoxErr, margin: "0 20px 20px" }}>{err}</div>}
              {msg && <div style={{ ...msgBoxOk,  margin: "0 20px 20px" }}>{msg}</div>}
            </div>
          )}
        </div>

        <div style={{ marginTop: 20, padding: "14px 16px", background: "#f4f7f6", borderRadius: 8, fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.75 }}>
          <b>새 반기 시트 URL 준비 절차</b>
          <ol style={{ margin: "6px 0 0", paddingLeft: 20 }}>
            <li>매년 <b>6월 초 / 12월 초</b>, 시스템이 다음 반기용 새 스프레드시트를 자동 생성하고 이메일로 링크를 보냅니다.</li>
            <li>이메일의 링크로 새 시트 열기 → 상단 메뉴 <b>주문관리 → 🚨 초기 설정: 트리거 등록</b> 클릭 (한 번만)</li>
            <li>같은 시트 → <b>확장 프로그램 → Apps Script</b></li>
            <li>Apps Script 화면 오른쪽 위 <b>배포 → 새 배포</b> → 톱니바퀴 → <b>웹 앱</b></li>
            <li>다음 사용자로 실행: <b>나</b>, 액세스: <b>모든 사용자</b> → 배포 → 권한 승인 → <b>웹 앱 URL 복사</b></li>
            <li>이 페이지에서 해당 반기 칸에 붙여넣고 저장. <b>반기 첫날 00시에 자동으로 전환</b>됩니다.</li>
          </ol>
          <div style={{ marginTop: 8, color: "#8f5300" }}>
            💡 반기 전환일에 별도 조작이 필요 없습니다. 이 페이지에서 미리 저장만 해두면 시스템이 알아서 전환합니다.
          </div>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            minWidth: 260,
            maxWidth: 380,
            padding: "12px 16px",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            background: toast.tone === "err" ? "#fef3f2" : "#ecfdf3",
            color:      toast.tone === "err" ? "#b42318" : "#067647",
            border:     toast.tone === "err" ? "1px solid #fecdca" : "1px solid #abefc6",
            fontSize: 13.5,
            fontWeight: 600,
            animation: "toast-in 180ms ease-out",
          }}
        >
          {toast.text}
        </div>
      )}
      <style>{`@keyframes toast-in { from { opacity: 0; transform: translateY(-6px);} to { opacity: 1; transform: translateY(0);} }`}</style>
    </AdminShell>
  );
}

function PeriodRow({ label, current, row, value, onChange, onSave, saving }) {
  return (
    <div style={{ padding: 20, borderBottom: "1px solid var(--line)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{label}</span>
        {current && <span style={badgeOn}>현재 사용 중</span>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://script.google.com/macros/s/AKfyc.../exec"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          style={primaryBtn}
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
      {row?.updatedAt && (
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-3)" }}>
          마지막 수정: {formatDate(row.updatedAt)}
          {row.updatedBy ? ` · ${row.updatedBy}` : ""}
        </div>
      )}
    </div>
  );
}

function labelFor(key) {
  if (key === KEY_H1) return "상반기 URL";
  if (key === KEY_H2) return "하반기 URL";
  return key;
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  } catch { return String(iso); }
}

const cardStyle    = { background: "#fff", border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" };
const inputStyle   = { height: 40, padding: "0 12px", border: "1px solid var(--line)", borderRadius: 8, fontSize: 14, boxSizing: "border-box" };
const primaryBtn   = { height: 40, padding: "0 20px", background: "var(--brand, #4a7c59)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" };
const badgeOn      = { padding: "2px 8px", background: "#ecfdf3", color: "#067647", border: "1px solid #abefc6", borderRadius: 999, fontSize: 11, fontWeight: 700 };
const msgBoxErr    = { padding: "10px 12px", background: "#fef3f2", color: "#b42318", border: "1px solid #fecdca", borderRadius: 8, fontSize: 13 };
const msgBoxOk     = { padding: "10px 12px", background: "#ecfdf3", color: "#067647", border: "1px solid #abefc6", borderRadius: 8, fontSize: 13 };
