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
import { openDaumPostcode } from "../utils";
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
    address: initial?.address || "",       // 기본 주소 (도로명/지번)
    addressDetail: "",                       // 상세 주소 (동/호수 등)
    useType: initial?.useType || "YES",
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

  // 정규식 모음
  const RE_CODE  = /^\d{8,12}$/;
  const RE_PHONE = /^[0-9]+(-[0-9]+)+$/; // 반드시 '-' 포함
  const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const submit = () => {
    const e = {};
    const cliCode = form.cliCode.trim();
    const name = form.name.trim();
    const tel = form.tel.trim();
    const fax = form.fax.trim();
    const managerPhone = form.managerPhone.trim();
    const email = form.email.trim();

    if (!cliCode) e.cliCode = "거래처코드를 입력해 주세요";
    else if (!RE_CODE.test(cliCode))
      e.cliCode = "거래처코드는 숫자 8~12자리여야 합니다";

    if (!name) e.name = "거래처명을 입력해 주세요";
    else if (name.length > 100) e.name = "거래처명은 100자 이내여야 합니다";

    if (form.ceoName.length > 50) e.ceoName = "대표자명은 50자 이내여야 합니다";
    if (form.managerName.length > 50) e.managerName = "담당자명은 50자 이내여야 합니다";

    if (tel && !RE_PHONE.test(tel))
      e.tel = "전화는 '-'을 포함한 숫자로 입력해 주세요 (예: 02-555-1180)";
    if (fax && !RE_PHONE.test(fax))
      e.fax = "Fax는 '-'을 포함한 숫자로 입력해 주세요 (예: 02-555-1181)";
    if (managerPhone && !RE_PHONE.test(managerPhone))
      e.managerPhone =
        "담당자 모바일은 '-'을 포함한 숫자로 입력해 주세요 (예: 010-1234-5678)";

    if (email && !RE_EMAIL.test(email))
      e.email = "올바른 이메일 형식이 아닙니다";
    if (email.length > 100) e.email = "이메일은 100자 이내여야 합니다";

    if ((form.address + " " + form.addressDetail).length > 200)
      e.address = "주소는 200자 이내여야 합니다";

    setErrs(e);
    if (Object.keys(e).length) return;

    const fullAddress = [form.address.trim(), form.addressDetail.trim()]
      .filter(Boolean)
      .join(" ");
    const payload = {
      cliCode: form.cliCode.trim(),
      name: form.name.trim(),
      ceoName: form.ceoName.trim(),
      tel: form.tel.trim(),
      fax: form.fax.trim(),
      managerName: form.managerName.trim(),
      managerPhone: form.managerPhone.trim(),
      email: form.email.trim(),
      address: fullAddress,
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
        {/* ── 거래처 정보 섹션 ───────────────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>SECTION 01</span>
            <h3 className={styles.sectionTitle}>거래처 정보</h3>
          </div>

          <div className={styles.sectionBody}>
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

            <AField label="대표자명" error={errs.ceoName}>
              <AInput
                value={form.ceoName}
                onChange={(v) => set("ceoName", v)}
                placeholder="예: 김진곤"
                error={!!errs.ceoName}
              />
            </AField>

            <div className={styles.row2}>
              <AField label="전화" error={errs.tel} hint="'-' 포함 (예: 02-555-1180)">
                <AInput
                  value={form.tel}
                  onChange={(v) => set("tel", v)}
                  placeholder="예: 053-255-0300"
                  error={!!errs.tel}
                />
              </AField>
              <AField label="Fax" error={errs.fax} hint="'-' 포함 (예: 02-555-1181)">
                <AInput
                  value={form.fax}
                  onChange={(v) => set("fax", v)}
                  placeholder="예: 053-256-0501"
                  error={!!errs.fax}
                />
              </AField>
            </div>

            <AField label="주소" hint="기본 주소 검색 + 상세주소 입력" error={errs.address}>
              <div className={styles.addressStack}>
                <div className={styles.addressRow}>
                  <AInput
                    value={form.address}
                    onChange={(v) => set("address", v)}
                    placeholder="주소 검색 버튼을 눌러 주소를 선택해 주세요"
                    readOnly
                  />
                  <button
                    type="button"
                    className={styles.addressBtn}
                    onClick={() =>
                      openDaumPostcode((data) => {
                        const base = data.roadAddress || data.jibunAddress || "";
                        set("address", base);
                      })
                    }
                  >
                    주소 검색
                  </button>
                </div>
                <AInput
                  value={form.addressDetail}
                  onChange={(v) => set("addressDetail", v)}
                  placeholder="상세주소 (동/호수, 층 등)"
                />
              </div>
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
        </section>

        {/* ── 담당자 정보 섹션 ───────────────────────── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>SECTION 02</span>
            <h3 className={styles.sectionTitle}>담당자 정보</h3>
          </div>

          <div className={styles.sectionBody}>
            <div className={styles.row2}>
              <AField label="담당자명" error={errs.managerName}>
                <AInput
                  value={form.managerName}
                  onChange={(v) => set("managerName", v)}
                  placeholder="담당자 이름"
                  error={!!errs.managerName}
                />
              </AField>
              <AField label="담당자 모바일" error={errs.managerPhone} hint="'-' 포함 (예: 010-1234-5678)">
                <AInput
                  value={form.managerPhone}
                  onChange={(v) => set("managerPhone", v)}
                  placeholder="예: 010-1234-5678"
                  error={!!errs.managerPhone}
                />
              </AField>
            </div>

            <AField label="담당자 Email" error={errs.email}>
              <AInput
                value={form.email}
                onChange={(v) => set("email", v)}
                placeholder="예: contact@example.com"
                error={!!errs.email}
              />
            </AField>
          </div>
        </section>
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
