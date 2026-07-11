/* 주문 품목 인라인 수정 모달 — DB + 시트 동시 반영 */

import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";
import { fetchOrderAudit, fetchClientDestinations } from "../api";

const fmtLocal = (d) => {
  if (!d) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function OrderEditModal({ row, onClose, onSave, onDelete, saving, deleting }) {
  const [form, setForm] = useState({
    product: "",
    productLabel: "",
    width: "",
    length: "",
    rolls: "",
    destination: "",
    note: "",
    deliveryDate: "",
    unitPrice: "",
    aliasName: "",
    orderDate: "",
  });
  const [errs, setErrs] = useState({});
  const [auditOpen, setAuditOpen] = useState(false);
  const [audit, setAudit] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [destinations, setDestinations] = useState([]);

  useEffect(() => {
    if (!row) return;
    setForm({
      product: row.product || "",
      productLabel: row.productLabel || "",
      width: row.width ?? "",
      length: row.length ?? "",
      rolls: row.rolls ?? "",
      destination: row.destination || "",
      note: row.note || "",
      deliveryDate: row.deliveryDate || "",
      unitPrice: row.unitPrice ?? "",
      aliasName: row.aliasName || "",
      orderDate: row.orderDate ? fmtLocal(row.orderDate) : "",
    });
    setErrs({});
    setAuditOpen(false);
    setAudit([]);
    // 자동완성: 이 거래처의 과거 납품처 목록
    if (row.cliCode) {
      fetchClientDestinations(row.cliCode).then(setDestinations).catch(() => setDestinations([]));
    } else {
      setDestinations([]);
    }
  }, [row]);

  const toggleAudit = async () => {
    const next = !auditOpen;
    setAuditOpen(next);
    if (next && audit.length === 0) {
      setAuditLoading(true);
      try { setAudit(await fetchOrderAudit(row.orderNum)); }
      catch (_) {}
      finally { setAuditLoading(false); }
    }
  };

  if (!row) return null;

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errs[k]) setErrs((e) => ({ ...e, [k]: undefined }));
  };

  const submit = (e) => {
    e?.preventDefault();
    const er = {};
    if (!form.product.trim()) er.product = "제품코드를 입력해 주세요";
    if (!form.productLabel.trim()) er.productLabel = "제품명을 입력해 주세요";
    if (form.rolls !== "" && (!Number.isFinite(+form.rolls) || +form.rolls < 0))
      er.rolls = "롤수는 0 이상 숫자여야 합니다";
    setErrs(er);
    if (Object.keys(er).length) return;

    onSave({
      product: form.product.trim(),
      productLabel: form.productLabel.trim(),
      width: form.width === "" ? null : parseInt(form.width, 10),
      length: form.length === "" ? null : parseInt(form.length, 10),
      rolls: form.rolls === "" ? null : parseInt(form.rolls, 10),
      destination: form.destination.trim(),
      note: form.note.trim(),
      deliveryDate: form.deliveryDate.trim() || null,
      unitPrice: form.unitPrice === "" ? null : parseInt(form.unitPrice, 10),
      aliasName: form.aliasName.trim() || null,
      orderDate: form.orderDate ? form.orderDate + ":00" : null,
    });
  };

  return (
    <ModalShell onClose={onClose} maxWidth={560}>
      <form onSubmit={submit} style={{ padding: "20px 24px" }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>
          주문 품목 수정
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: 12.5, color: "var(--muted)" }}>
          주문번호 <b style={{ fontFamily: "ui-monospace, monospace" }}>{row.orderId}</b>
          {" · "}{row.cliCompName}
          {" · "}<span style={{ color: "var(--muted)" }}>저장하면 스프레드시트에도 자동 반영됩니다.</span>
        </p>

        <div style={grid2}>
          <Field label="제품코드" error={errs.product}>
            <Input value={form.product} onChange={(v) => set("product", v)} />
          </Field>
          <Field label="제품명" error={errs.productLabel}>
            <Input value={form.productLabel} onChange={(v) => set("productLabel", v)} />
          </Field>
        </div>

        <div style={grid3}>
          <Field label="폭(mm)"><Input value={form.width} onChange={(v) => set("width", v.replace(/[^\d]/g, ""))} inputMode="numeric" /></Field>
          <Field label="길이(m)"><Input value={form.length} onChange={(v) => set("length", v.replace(/[^\d]/g, ""))} inputMode="numeric" /></Field>
          <Field label="롤수" error={errs.rolls}><Input value={form.rolls} onChange={(v) => set("rolls", v.replace(/[^\d]/g, ""))} inputMode="numeric" /></Field>
        </div>

        <Field label="납품처">
          <Input value={form.destination} onChange={(v) => set("destination", v)} list="edit-destinations" />
          <datalist id="edit-destinations">
            {destinations.map((d) => <option key={d} value={d} />)}
          </datalist>
        </Field>
        <Field label="비고"><Input value={form.note} onChange={(v) => set("note", v)} /></Field>
        <div style={grid2}>
          <Field label="단가 (원)" hint="비우면 가격 미지정">
            <Input
              value={form.unitPrice}
              onChange={(v) => set("unitPrice", v.replace(/[^\d]/g, ""))}
              inputMode="numeric"
            />
          </Field>
          <Field label="별칭" hint="주문 당시 거래처가 부르던 이름">
            <Input value={form.aliasName} onChange={(v) => set("aliasName", v)} />
          </Field>
        </div>

        <div style={grid2}>
          <Field label="납품예정일" hint="비우면 발주일 기준 자동계산">
            <Input type="date" value={form.deliveryDate} onChange={(v) => set("deliveryDate", v)} />
          </Field>
          <Field label="발주일시" hint="시트 색상도 이 시각 기준으로 재계산됩니다.">
            <Input type="datetime-local" value={form.orderDate} onChange={(v) => set("orderDate", v)} />
          </Field>
        </div>

        <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px dashed var(--line)" }}>
          <button
            type="button"
            onClick={toggleAudit}
            style={{
              padding: "6px 10px", borderRadius: 6, border: "1px solid var(--line)",
              background: "var(--surface)", fontSize: 12, color: "var(--ink-2)", cursor: "pointer",
            }}
          >
            {auditOpen ? "변경 이력 닫기 ▲" : "변경 이력 보기 ▼"}
          </button>
          {auditOpen && (
            <div style={{
              marginTop: 8, maxHeight: 220, overflow: "auto",
              border: "1px solid var(--line)", borderRadius: 8, padding: 8,
              background: "var(--bg)", fontSize: 12,
            }}>
              {auditLoading ? "불러오는 중…" :
                audit.length === 0 ? <div style={{ color: "var(--muted)" }}>기록 없음</div> :
                audit.map((a) => (
                  <div key={a.auditNum} style={{ padding: "6px 4px", borderBottom: "1px dashed var(--line)" }}>
                    <div style={{ fontWeight: 700, color: "var(--ink)" }}>
                      [{a.action}] <span style={{ color: "var(--muted)", fontWeight: 400 }}>by {a.actor}</span>
                      <span style={{ float: "right", color: "var(--muted)", fontWeight: 400 }}>
                        {a.at ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(a.at) : ""}
                      </span>
                    </div>
                    <div style={{ marginTop: 2, color: "var(--ink-2)" }}>{a.memo}</div>
                  </div>
                ))
              }
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 18 }}>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(row)}
              disabled={saving || deleting}
              style={btnDanger}
            >
              {deleting ? "삭제 중…" : "삭제"}
            </button>
          )}
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button type="button" onClick={onClose} disabled={saving || deleting} style={btnGhost}>취소</button>
            <button type="submit" disabled={saving || deleting} style={btnPrimary}>
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", letterSpacing: 0.04 }}>
          {label}
        </label>
        {hint && <span style={{ fontSize: 11, color: "var(--muted)" }}>{hint}</span>}
      </div>
      {children}
      {error && <div style={{ fontSize: 11.5, color: "var(--danger)", marginTop: 4 }}>{error}</div>}
    </div>
  );
}
function Input({ value, onChange, type = "text", inputMode, list }) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      list={list}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", height: 36, marginTop: 4, padding: "0 10px",
        border: "1px solid var(--line)", borderRadius: 8, fontSize: 13,
        outline: "none", background: "var(--surface)", boxSizing: "border-box",
      }}
    />
  );
}

const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };
const grid3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 };
const btnGhost = {
  height: 36, padding: "0 16px", borderRadius: 8, border: "1px solid var(--line)",
  background: "var(--surface)", color: "var(--ink)", fontSize: 13, cursor: "pointer",
};
const btnPrimary = {
  height: 36, padding: "0 18px", borderRadius: 8, border: "none",
  background: "var(--brand)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
};
const btnDanger = {
  height: 36, padding: "0 18px", borderRadius: 8, border: "1px solid var(--danger)",
  background: "var(--surface)", color: "var(--danger)", fontSize: 13, fontWeight: 700, cursor: "pointer",
};
