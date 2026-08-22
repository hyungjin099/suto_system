/* 매입처 등록/수정 모달 (매입처명만 입력) */

import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";
import { AField, AInput } from "./Fields";
import { IconX } from "./Icons";
import styles from "./SupplierFormModal.module.css";

export default function SupplierFormModal({ mode, initial, saving, onClose, onSave }) {
  const [form, setForm] = useState({ name: initial?.name || "" });
  const [errs, setErrs] = useState({});

  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = orig;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errs[k]) setErrs((e) => ({ ...e, [k]: undefined }));
  };

  const submit = () => {
    const e = {};
    const name = form.name.trim();
    if (!name) e.name = "매입처명을 입력해 주세요";
    else if (name.length > 100) e.name = "매입처명은 100자 이내여야 합니다";
    setErrs(e);
    if (Object.keys(e).length) return;
    onSave({ name });
  };

  return (
    <ModalShell onClose={onClose} maxWidth={460}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            {mode === "create" ? "매입처 등록" : "매입처 수정"}
          </h2>
          {mode !== "create" && (
            <p className={styles.subtitle}>매입처명을 변경합니다.</p>
          )}
        </div>
        <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="닫기">
          <IconX />
        </button>
      </div>

      <div className={styles.body}>
        <AField label="매입처명" required error={errs.name}>
          <AInput
            value={form.name}
            onChange={(v) => set("name", v)}
            placeholder="예: UPM"
            error={!!errs.name}
          />
        </AField>
      </div>

      <div className={styles.footer}>
        <button type="button" onClick={onClose} disabled={saving} className={styles.cancelBtn}>
          취소
        </button>
        <button type="button" onClick={submit} disabled={saving} className={styles.submitBtn}>
          {saving ? "저장 중…" : mode === "create" ? "등록" : "저장"}
        </button>
      </div>
    </ModalShell>
  );
}
