/* 고객사 등록/수정 모달 (CLIENT_INFO 스키마 기준)
 * 필수: 거래처코드, 거래처명
 * 선택: 대표자명, 전화, Fax, 담당자명, 담당자모바일, Email, 주소
 * 사용구분: 등록/미사용
 */

import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";
import { AField, AInput, ASelect } from "./Fields";
import { IconX } from "./Icons";
import { CLI_USE_TYPES } from "../constants";
import styles from "./ClientFormModal.module.css";

export default function ClientFormModal({ mode, initial, onClose, onSave }) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState(() => ({
    cliCode: initial?.cliCode || "",
    name: initial?.name || "",
    ceoName: initial?.ceoName || "",
    tel: initial?.tel || "",
    fax: initial?.fax || "",
    managerName: initial?.managerName || "",
    managerPhone: initial?.managerPhone || "",
    email: initial?.email || "",
    address: initial?.address || "",
    useType: initial?.useType || "등록",
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
    if (!form.cliCode.trim()) e.cliCode = "거래처코드를 입력해 주세요";
    if (!form.name.trim()) e.name = "거래처명을 입력해 주세요";
    setErrs(e);
    if (Object.keys(e).length) return;

    const payload = {
      cliCode: form.cliCode.trim(),
      name: form.name.trim(),
      ceoName: form.ceoName.trim(),
      tel: form.tel.trim(),
      fax: form.fax.trim(),
      managerName: form.managerName.trim(),
      managerPhone: form.managerPhone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    };
    // 등록 시 사용구분은 DB DEFAULT('YES')에 맡김 — 수정 시에만 전송
    if (isEdit) payload.useType = form.useType;
    onSave(payload);
  };

  return (
    <ModalShell onClose={onClose} maxWidth={640}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            {isEdit ? "거래처 정보 수정" : "새 거래처 등록"}
          </h2>
          <p className={styles.subtitle}>
            {isEdit
              ? "변경할 내용을 입력하세요."
              : "거래처 정보를 입력해 주세요. 거래처코드는 주문 페이지 URL 식별자로 사용됩니다."}
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
        <div className={styles.row2}>
          <AField label="거래처코드" required error={errs.cliCode} hint="주문 URL 식별자">
            <AInput
              value={form.cliCode}
              onChange={(v) => set("cliCode", v)}
              placeholder="예: 5048179051"
              error={!!errs.cliCode}
              disabled={isEdit}
            />
          </AField>
          <AField label="거래처명" required error={errs.name}>
            <AInput
              value={form.name}
              onChange={(v) => set("name", v)}
              placeholder="예: (주)시스픽"
              error={!!errs.name}
            />
          </AField>
        </div>

        <AField label="대표자명">
          <AInput
            value={form.ceoName}
            onChange={(v) => set("ceoName", v)}
            placeholder="예: 김진곤"
          />
        </AField>

        <div className={styles.row2}>
          <AField label="전화">
            <AInput
              value={form.tel}
              onChange={(v) => set("tel", v)}
              placeholder="예: 053-255-0300"
            />
          </AField>
          <AField label="Fax">
            <AInput
              value={form.fax}
              onChange={(v) => set("fax", v)}
              placeholder="예: 053-256-0501"
            />
          </AField>
        </div>

        <div className={styles.row2}>
          <AField label="담당자명">
            <AInput
              value={form.managerName}
              onChange={(v) => set("managerName", v)}
              placeholder="담당자 이름"
            />
          </AField>
          <AField label="담당자 모바일">
            <AInput
              value={form.managerPhone}
              onChange={(v) => set("managerPhone", v)}
              placeholder="예: 010-1234-5678"
            />
          </AField>
        </div>

        <AField label="Email">
          <AInput
            value={form.email}
            onChange={(v) => set("email", v)}
            placeholder="예: contact@example.com"
          />
        </AField>

        <AField label="주소">
          <AInput
            value={form.address}
            onChange={(v) => set("address", v)}
            placeholder="예: 대구광역시 달서구 성서로9길 18"
          />
        </AField>

        {isEdit && (
          <AField label="사용구분">
            <ASelect
              value={form.useType}
              onChange={(v) => set("useType", v)}
              options={CLI_USE_TYPES}
              placeholder="사용구분 선택"
            />
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
