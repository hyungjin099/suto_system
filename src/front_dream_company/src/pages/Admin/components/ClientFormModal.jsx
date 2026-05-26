/* 고객사 등록/수정 모달
 * - 등록: 고객사명, 담당자명, 고객사 연락처, 담당자 연락처
 * - 수정: 위 4개 필드 + 활동여부 (라디오, 0/1)
 */

import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";
import { AField, AInput } from "./Fields";
import { IconX } from "./Icons";
import { cx } from "../utils";
import styles from "./ClientFormModal.module.css";

export default function ClientFormModal({ mode, initial, onClose, onSave }) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState(() => ({
    name: initial?.name || "",
    managerName: initial?.managerName || "",
    companyPhone: initial?.companyPhone || "",
    managerPhone: initial?.managerPhone || "",
    active: typeof initial?.active === "number" ? initial.active : 1,
  }));
  const [errs, setErrs] = useState({});

  useEffect(() => {
    const o = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = o;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errs[k]) setErrs((e) => ({ ...e, [k]: undefined }));
  };

  const submit = () => {
    const e = {};
    if (!form.name.trim()) e.name = "고객사명을 입력해 주세요";
    if (!form.managerName.trim()) e.managerName = "담당자명을 입력해 주세요";
    if (!form.companyPhone.trim())
      e.companyPhone = "고객사 연락처를 입력해 주세요";
    if (!form.managerPhone.trim())
      e.managerPhone = "담당자 연락처를 입력해 주세요";
    setErrs(e);
    if (Object.keys(e).length) return;

    onSave({
      name: form.name.trim(),
      managerName: form.managerName.trim(),
      companyPhone: form.companyPhone.trim(),
      managerPhone: form.managerPhone.trim(),
      active: isEdit ? form.active : 1,
    });
  };

  return (
    <ModalShell onClose={onClose} maxWidth={520}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            {isEdit ? "고객사 정보 수정" : "새 고객사 등록"}
          </h2>
          <p className={styles.subtitle}>
            {isEdit
              ? "변경할 내용을 입력하세요."
              : "고객사 정보를 등록하면 주문 페이지 URL이 발급됩니다."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className={styles.closeBtn}
        >
          <IconX />
        </button>
      </div>

      <div className={styles.body}>
        <AField label="고객사명" required error={errs.name}>
          <AInput
            value={form.name}
            onChange={(v) => set("name", v)}
            placeholder="예: 서울베이커리"
            error={!!errs.name}
          />
        </AField>

        <AField label="담당자명" required error={errs.managerName}>
          <AInput
            value={form.managerName}
            onChange={(v) => set("managerName", v)}
            placeholder="예: 김민준"
            error={!!errs.managerName}
          />
        </AField>

        <div className={styles.row2}>
          <AField
            label="고객사 연락처"
            required
            error={errs.companyPhone}
            hint="회사 대표 번호"
          >
            <AInput
              value={form.companyPhone}
              onChange={(v) => set("companyPhone", v)}
              placeholder="예: 02-555-1180"
              error={!!errs.companyPhone}
            />
          </AField>
          <AField
            label="담당자 연락처"
            required
            error={errs.managerPhone}
            hint="휴대전화 권장"
          >
            <AInput
              value={form.managerPhone}
              onChange={(v) => set("managerPhone", v)}
              placeholder="예: 010-2244-1180"
              error={!!errs.managerPhone}
            />
          </AField>
        </div>

        {isEdit && (
          <AField label="활동 여부" hint="비활성 처리 시 신규 주문 불가">
            <div className={styles.radioGroup}>
              <label
                className={cx(
                  styles.radio,
                  form.active === 1 && styles.radioCheckedActive
                )}
              >
                <input
                  type="radio"
                  name="active"
                  className={styles.radioInput}
                  checked={form.active === 1}
                  onChange={() => set("active", 1)}
                />
                <span className={styles.radioDot} />
                활성
              </label>
              <label
                className={cx(
                  styles.radio,
                  form.active === 0 && styles.radioCheckedInactive
                )}
              >
                <input
                  type="radio"
                  name="active"
                  className={styles.radioInput}
                  checked={form.active === 0}
                  onChange={() => set("active", 0)}
                />
                <span className={styles.radioDot} />
                비활성
              </label>
            </div>
          </AField>
        )}
      </div>

      <div className={styles.footer}>
        <button type="button" onClick={onClose} className={styles.cancelBtn}>
          취소
        </button>
        <button type="button" onClick={submit} className={styles.submitBtn}>
          {isEdit ? "저장" : "등록"}
        </button>
      </div>
    </ModalShell>
  );
}
