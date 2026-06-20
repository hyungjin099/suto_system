/* 원단 등록/수정 모달 */

import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";
import { AField, AInput, ASelect } from "./Fields";
import { IconX } from "./Icons";
import { MANUFACTURERS } from "../constants";
import { formatNumber, onlyDigits } from "../utils";
import styles from "./ProductFormModal.module.css";

export default function ProductFormModal({
  mode,
  initial,
  existingCodes,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(() => ({
    manufacturer: initial?.manufacturer || "",
    code: initial?.code || "",
    name: initial?.name || "",
    price: initial?.price ? String(initial.price) : "",
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
    if (!form.manufacturer) e.manufacturer = "매입처를 선택해 주세요";
    if (!form.code.trim()) e.code = "제품코드를 입력해 주세요";
    else if (existingCodes.includes(form.code.trim()))
      e.code = "이미 사용 중인 코드입니다";
    if (!form.name.trim()) e.name = "제품명을 입력해 주세요";
    const priceN = form.price ? parseInt(form.price, 10) : null;
    if (form.price && (!Number.isFinite(priceN) || priceN < 0))
      e.price = "유효한 단가를 입력해 주세요";
    setErrs(e);
    if (Object.keys(e).length) return;
    onSave({
      manufacturer: form.manufacturer,
      code: form.code.trim(),
      name: form.name.trim(),
      price: priceN,
    });
  };

  return (
    <ModalShell onClose={onClose} maxWidth={520}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            {mode === "create" ? "새 원단 등록" : "원단 정보 수정"}
          </h2>
          <p className={styles.subtitle}>
            {mode === "create"
              ? "본사에서 입고된 원단 정보를 등록합니다."
              : "변경할 내용을 입력하세요."}
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
        <AField
          label="매입처"
          required
          error={errs.manufacturer}
          hint="원단 공급 업체"
        >
          <ASelect
            value={form.manufacturer}
            onChange={(v) => set("manufacturer", v)}
            options={MANUFACTURERS}
            placeholder="매입처를 선택하세요"
            error={!!errs.manufacturer}
          />
        </AField>

        <div className={styles.row2}>
          <AField
            label="제품코드"
            required
            error={errs.code}
            hint="예: AT-1680-080"
          >
            <AInput
              value={form.code}
              onChange={(v) => set("code", v.toUpperCase())}
              placeholder="제품 고유 코드"
              error={!!errs.code}
            />
          </AField>
          <AField label="단가" error={errs.price} hint="원/m (선택)">
            <AInput
              value={formatNumber(form.price)}
              onChange={(v) => set("price", onlyDigits(v))}
              placeholder="0"
              suffix="원"
              inputMode="numeric"
              error={!!errs.price}
            />
          </AField>
        </div>

        <AField label="제품명" required error={errs.name}>
          <AInput
            value={form.name}
            onChange={(v) => set("name", v)}
            placeholder="예: 아트지 무광 80g 1680mm"
            error={!!errs.name}
          />
        </AField>
      </div>

      <div className={styles.footer}>
        <button type="button" onClick={onClose} className={styles.cancelBtn}>
          취소
        </button>
        <button type="button" onClick={submit} className={styles.submitBtn}>
          {mode === "create" ? "등록" : "저장"}
        </button>
      </div>
    </ModalShell>
  );
}
