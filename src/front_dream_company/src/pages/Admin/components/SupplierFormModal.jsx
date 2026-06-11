/* 입고처 등록/수정 모달 */

import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";
import { AField, AInput } from "./Fields";
import { IconX } from "./Icons";
import styles from "./SupplierFormModal.module.css";

export default function SupplierFormModal({ mode, initial, saving, onClose, onSave }) {
  const [form, setForm] = useState({
    name:        initial?.name        || "",
    tel:         initial?.tel         || "",
    managerName: initial?.managerName || "",
    managerTel:  initial?.managerTel  || "",
  });
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
    if (!form.name.trim()) e.name = "입고처명을 입력해 주세요";
    setErrs(e);
    if (Object.keys(e).length) return;
    onSave({
      name:        form.name.trim(),
      tel:         form.tel.trim(),
      managerName: form.managerName.trim(),
      managerTel:  form.managerTel.trim(),
    });
  };

  return (
    <ModalShell onClose={onClose} maxWidth={480}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            {mode === "create" ? "입고처 등록" : "입고처 수정"}
          </h2>
          <p className={styles.subtitle}>
            {mode === "create" ? "새 입고처 정보를 입력하세요." : "변경할 내용을 입력하세요."}
          </p>
        </div>
        <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="닫기">
          <IconX />
        </button>
      </div>

      <div className={styles.body}>
        <AField label="입고처명" required error={errs.name}>
          <AInput
            value={form.name}
            onChange={(v) => set("name", v)}
            placeholder="예: 한솔제지 영업부"
            error={!!errs.name}
          />
        </AField>

        <AField label="연락처" error={errs.tel} hint="선택">
          <AInput
            value={form.tel}
            onChange={(v) => set("tel", v)}
            placeholder="예: 02-1234-5678"
          />
        </AField>

        <div className={styles.row2}>
          <AField label="담당자명" error={errs.managerName} hint="선택">
            <AInput
              value={form.managerName}
              onChange={(v) => set("managerName", v)}
              placeholder="예: 홍길동"
            />
          </AField>
          <AField label="담당자 연락처" error={errs.managerTel} hint="선택">
            <AInput
              value={form.managerTel}
              onChange={(v) => set("managerTel", v)}
              placeholder="예: 010-1234-5678"
            />
          </AField>
        </div>
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
