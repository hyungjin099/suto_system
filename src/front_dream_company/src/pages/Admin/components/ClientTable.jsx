/* 거래처 목록 테이블 + URL 복사 셀 + EmptyState */

import { useState } from "react";
import { IconBtn } from "./Buttons";
import {
  IconEdit,
  IconTrash,
  IconSearch,
  IconCopy,
  IconCheck,
} from "./Icons";
import { cx } from "../utils";
import styles from "./ClientTable.module.css";

const COLS = [
  { key: "id", label: "번호", align: "center" },
  { key: "useType", label: "사용구분", align: "center" },
  { key: "cliCode", label: "거래처코드", align: "center" },
  { key: "name", label: "거래처명", align: "center" },
  { key: "ceo", label: "대표자", align: "center" },
  { key: "phone", label: "연락처", align: "center" },
  { key: "url", label: "주문 페이지 URL", align: "center" },
  { key: "actions", label: "", align: "center" },
];

export default function ClientTable({ items, empty, onEdit, onDelete }) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <colgroup>
          <col width='5%'/>
          <col width='5%'/>
          <col width='12%'/>
          <col width='15%'/>
          <col width='6%'/>
          <col width='26%'/>
          <col width='24%'/>
          <col width='7%'/>
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
                <td className={styles.cellName}>{c.name}</td>
                <td className={styles.cell}>{c.ceoName || "-"}</td>
                <td className={styles.cellPhone}>
                  <div className={styles.phoneInline}>
                    <span className={styles.phoneLabel}>회사</span>
                    <span className={styles.phoneNum}>{c.tel || "-"}</span>
                    <span className={styles.phoneSep}>·</span>
                    <span className={styles.phoneLabel}>담당</span>
                    <span className={styles.phoneNum}>
                      {c.managerPhone || "-"}
                    </span>
                  </div>
                </td>
                <td className={styles.cellUrl}>
                  <CopyableUrl cliCode={c.cliCode} />
                </td>
                <td className={styles.cellActions}>
                  <div className={styles.actions}>
                    <IconBtn onClick={() => onEdit(c)} title="수정">
                      <IconEdit />
                    </IconBtn>
                    <IconBtn
                      onClick={() => onDelete(c)}
                      title="삭제"
                      danger
                    >
                      <IconTrash />
                    </IconBtn>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function UseTypeChip({ useType }) {
  const active = useType === "등록";
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
