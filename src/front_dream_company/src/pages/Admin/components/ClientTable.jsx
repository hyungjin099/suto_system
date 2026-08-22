/* 거래처 목록 테이블 + URL 복사 셀 + 거래처/담당자 정보 모달 + EmptyState */

import { useState } from "react";
import {
  IconEdit,
  IconSearch,
  IconCopy,
  IconCheck,
  IconX,
} from "./Icons";
import ModalShell from "./ModalShell";
import { cx } from "../utils";
import styles from "./ClientTable.module.css";

const COLS = [
  { key: "id", label: "번호", align: "center" },
  { key: "useType", label: "사용구분", align: "center" },
  { key: "cliCode", label: "거래처코드", align: "center" },
  { key: "company", label: "거래처정보", align: "center" },
  { key: "ceo", label: "대표자", align: "center" },
  { key: "manager", label: "담당자정보", align: "center" },
  { key: "url", label: "주문 페이지 URL", align: "center" },
  { key: "actions", label: "", align: "center" },
];

export default function ClientTable({ items, empty, onEdit, onResetPassword }) {
  const [infoModal, setInfoModal] = useState(null); // { type: 'company'|'manager', item }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <colgroup>
          <col width="60px" />   {/* 번호 */}
          <col width="80px" />   {/* 사용구분 */}
          <col width="140px" />  {/* 거래처코드 */}
          <col width="180px" />  {/* 거래처정보 */}
          <col width="100px" />  {/* 대표자 */}
          <col width="140px" />  {/* 담당자정보 */}
          <col width="360px" />  {/* 주문 페이지 URL */}
          <col width="200px" />  {/* actions */}
        </colgroup>
        <thead>
          <tr className={styles.headRow}>
            {COLS.map((c) => (
              <th
                key={c.key}
                className={styles.th}
                style={{ textAlign: c.align }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empty ? (
            <tr>
              <td colSpan={COLS.length}>
                <EmptyState />
              </td>
            </tr>
          ) : (
            items.map((c) => (
              <tr key={c.id} className={styles.row}>
                <td className={styles.cellId}>{c.id}</td>
                <td className={styles.cell}>
                  <UseTypeChip useType={c.useType} />
                </td>
                <td className={styles.cell}>{c.cliCode || "-"}</td>
                <td className={styles.cellName}>
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => setInfoModal({ type: "company", item: c })}
                    title="거래처 상세 보기"
                  >
                    {c.name}
                  </button>
                </td>
                <td className={styles.cell}>{c.ceoName || "-"}</td>
                <td className={styles.cell}>
                  {(() => {
                    const label = c.managerName || c.managerPhone || c.email;
                    return label ? (
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => setInfoModal({ type: "manager", item: c })}
                        title="담당자 상세 보기"
                      >
                        {c.managerName || "정보 보기"}
                      </button>
                    ) : (
                      "-"
                    );
                  })()}
                </td>
                <td className={styles.cellUrl}>
                  <CopyableUrl cliCode={c.cliCode} />
                </td>
                <td className={styles.cellActions}>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      onClick={() => onEdit(c)}
                      className={styles.editBtn}
                      title="수정"
                    >
                      <IconEdit />
                      <span className={styles.editLabel}>수정</span>
                    </button>
                    {onResetPassword && (
                      <button
                        type="button"
                        onClick={() => onResetPassword(c)}
                        className={styles.editBtn}
                        title="비밀번호를 '1234'로 초기화"
                        style={{ marginLeft: 6 }}
                      >
                        <span className={styles.editLabel}>비번 초기화</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {infoModal?.type === "company" && (
        <CompanyInfoModal
          item={infoModal.item}
          onClose={() => setInfoModal(null)}
        />
      )}
      {infoModal?.type === "manager" && (
        <ManagerInfoModal
          item={infoModal.item}
          onClose={() => setInfoModal(null)}
        />
      )}
    </div>
  );
}

function UseTypeChip({ useType }) {
  const active = useType === "YES" || useType === "등록";
  return (
    <span
      className={cx(
        styles.statusChip,
        active ? styles.statusActive : styles.statusInactive
      )}
    >
      <span className={styles.statusDot} />
      {useType || "-"}
    </span>
  );
}

function CopyableUrl({ cliCode }) {
  const [copied, setCopied] = useState(false);

  if (!cliCode) {
    return <span className={styles.urlEmpty}>URL 미발급</span>;
  }

  const url = `${window.location.origin}/${cliCode}`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch (_) {
        // noop
      }
      document.body.removeChild(ta);
    }
  };

  return (
    <div className={styles.urlBox}>
      <span className={styles.urlText} title={url}>
        {url}
      </span>
      <button
        type="button"
        onClick={onCopy}
        className={cx(styles.copyBtn, copied && styles.copyBtnCopied)}
        title={copied ? "복사됨" : "URL 복사"}
      >
        {copied ? <IconCheck /> : <IconCopy />}
        <span className={styles.copyLabel}>{copied ? "복사됨" : "복사"}</span>
      </button>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className={styles.infoRow}>
      <div className={styles.infoLabel}>{label}</div>
      <div className={styles.infoValue}>{value || "-"}</div>
    </div>
  );
}

function DetailModal({ title, subtitle, rows, onClose }) {
  return (
    <ModalShell onClose={onClose} maxWidth={460}>
      <div className={styles.infoHeader}>
        <div className={styles.infoHeaderText}>
          <div className={styles.infoEyebrow}>{subtitle}</div>
          <h3 className={styles.infoTitle}>{title}</h3>
        </div>
        <button
          type="button"
          className={styles.infoCloseBtn}
          onClick={onClose}
          aria-label="닫기"
        >
          <IconX />
        </button>
      </div>
      <div className={styles.infoBody}>
        {rows.map((r) => (
          <InfoRow key={r.label} label={r.label} value={r.value} />
        ))}
      </div>
    </ModalShell>
  );
}

function CompanyInfoModal({ item, onClose }) {
  return (
    <DetailModal
      title={item.name || "거래처 정보"}
      subtitle="거래처 정보"
      rows={[
        { label: "거래처코드", value: item.cliCode },
        { label: "거래처명", value: item.name },
        { label: "대표자명", value: item.ceoName },
        { label: "거래처 연락처", value: item.tel },
        { label: "Fax", value: item.fax },
        { label: "주소", value: item.address },
      ]}
      onClose={onClose}
    />
  );
}

function ManagerInfoModal({ item, onClose }) {
  return (
    <DetailModal
      title={item.managerName || "담당자 정보"}
      subtitle="담당자 정보"
      rows={[
        { label: "담당자명", value: item.managerName },
        { label: "담당자 연락처", value: item.managerPhone },
        { label: "담당자 이메일", value: item.email },
      ]}
      onClose={onClose}
    />
  );
}

function EmptyState() {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>
        <IconSearch size={22} />
      </div>
      <div className={styles.emptyTitle}>조건에 맞는 거래처가 없습니다</div>
      <div className={styles.emptyDesc}>
        필터를 조정하거나 새 거래처를 등록해 주세요.
      </div>
    </div>
  );
}
