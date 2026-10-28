/* 팝업 등록/수정 모달 */

import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";
import { AField, AInput } from "./Fields";
import ClientPicker from "./ClientPicker";
import { IconX } from "./Icons";
import { fetchClients } from "../api";
import styles from "./PopupFormModal.module.css";

const pad = (n) => String(n).padStart(2, "0");
// Date → datetime-local 입력값 'yyyy-MM-ddTHH:mm'
const toInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

function defaults() {
  const s = new Date();
  s.setSeconds(0, 0);
  const e = new Date(s);
  e.setDate(e.getDate() + 7);
  e.setHours(23, 59, 0, 0);
  return { start: toInput(s), end: toInput(e) };
}

export default function PopupFormModal({ mode, initial, saving, escDisabled, onClose, onSave }) {
  const d = defaults();
  const [form, setForm] = useState({
    title: initial?.title || "",
    content: initial?.content || "",
    start: initial?.startAt ? toInput(initial.startAt) : d.start,
    end: initial?.endAt ? toInput(initial.endAt) : d.end,
    use: initial ? initial.use : true,
    targetAll: initial ? initial.targetAll : true,
    cliCodes: initial?.cliCodes || [],
  });
  const [errs, setErrs] = useState({});
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState("");

  useEffect(() => {
    fetchClients()
      .then((list) => setClients(list.filter((c) => c.cliCode)))
      .catch(() => setClientsError("거래처 목록을 불러오지 못했습니다."))
      .finally(() => setClientsLoading(false));
  }, []);

  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // 충돌 확인창이 위에 떠 있을 때의 Esc 는 그 창만 닫아야 한다 (입력 중인 폼이 같이 닫히지 않도록)
    const onKey = (e) => { if (e.key === "Escape" && !escDisabled) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = orig;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, escDisabled]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errs[k]) setErrs((e) => ({ ...e, [k]: undefined }));
  };

  const submit = () => {
    const e = {};
    const title = form.title.trim();
    const content = form.content.trim();
    if (!title) e.title = "제목을 입력해 주세요";
    else if (title.length > 100) e.title = "제목은 100자 이내여야 합니다";
    if (!content) e.content = "내용을 입력해 주세요";
    else if (content.length > 3000) e.content = "내용은 3000자 이내여야 합니다";
    const start = form.start ? new Date(form.start) : null;
    const end = form.end ? new Date(form.end) : null;
    if (!start) e.start = "시작 일시를 입력해 주세요";
    if (!end) e.end = "종료 일시를 입력해 주세요";
    if (start && end && end <= start) e.end = "종료 일시는 시작 일시보다 늦어야 합니다";
    if (!form.targetAll && form.cliCodes.length === 0) e.target = "대상 거래처를 1곳 이상 선택해 주세요";
    setErrs(e);
    if (Object.keys(e).length) return;
    onSave({
      title, content, startAt: start, endAt: end,
      use: form.use, targetAll: form.targetAll, cliCodes: form.cliCodes,
    });
  };

  return (
    <ModalShell onClose={onClose} maxWidth={620}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{mode === "create" ? "팝업 등록" : "팝업 수정"}</h2>
          <p className={styles.subtitle}>
            고객 주문 페이지(주문하기 화면)에 모달로 표시됩니다. 내용의 http(s):// 주소는 자동으로 링크가 됩니다.
          </p>
        </div>
        <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="닫기">
          <IconX />
        </button>
      </div>

      <div className={styles.body}>
        <AField label="제목" required error={errs.title}>
          <AInput value={form.title} onChange={(v) => set("title", v)} placeholder="예: 추석 연휴 배송 안내" error={!!errs.title} />
        </AField>

        <AField label="내용" required error={errs.content} hint={`${form.content.length}/3000`}>
          <textarea
            className={`${styles.textarea} ${errs.content ? styles.textareaErr : ""}`}
            value={form.content}
            onChange={(e) => set("content", e.target.value)}
            rows={7}
            placeholder={"고객에게 전달할 내용을 입력해 주세요. 줄바꿈은 그대로 표시됩니다."}
          />
        </AField>

        <div className={styles.row2}>
          <AField label="노출 시작" required error={errs.start}>
            <input type="datetime-local" className={styles.dt} value={form.start} onChange={(e) => set("start", e.target.value)} />
          </AField>
          <AField label="노출 종료" required error={errs.end}>
            <input type="datetime-local" className={styles.dt} value={form.end} onChange={(e) => set("end", e.target.value)} />
          </AField>
        </div>

        <AField label="대상 거래처" required error={errs.target}>
          <div className={styles.radios}>
            <label className={styles.radio}>
              <input type="radio" checked={form.targetAll} onChange={() => set("targetAll", true)} /> 전체 거래처
            </label>
            <label className={styles.radio}>
              <input type="radio" checked={!form.targetAll} onChange={() => set("targetAll", false)} /> 선택한 거래처만
            </label>
          </div>
          {!form.targetAll && (
            <ClientPicker
              clients={clients}
              selected={form.cliCodes}
              onChange={(v) => set("cliCodes", v)}
              loading={clientsLoading}
              error={clientsError}
            />
          )}
        </AField>

        <label className={styles.useRow}>
          <input type="checkbox" checked={form.use} onChange={(e) => set("use", e.target.checked)} />
          사용 (체크 해제하면 기간 중이어도 표시되지 않습니다)
        </label>
      </div>

      <div className={styles.footer}>
        <button type="button" onClick={onClose} disabled={saving} className={styles.cancelBtn}>취소</button>
        <button type="button" onClick={submit} disabled={saving} className={styles.submitBtn}>
          {saving ? "저장 중…" : mode === "create" ? "등록" : "저장"}
        </button>
      </div>
    </ModalShell>
  );
}
