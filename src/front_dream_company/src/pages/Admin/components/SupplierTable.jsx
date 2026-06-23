/* 매입처 목록 테이블 */

import { IconEdit, IconTrash, IconSearch } from "./Icons";
import styles from "./SupplierTable.module.css";

const COLS = [
  { key: "no",      label: "번호",     align: "center" },
  { key: "name",    label: "매입처명", align: "center" },
  { key: "actions", label: "",        align: "center" },
];

export default function SupplierTable({ items, loading, empty, onEdit, onDelete }) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <colgroup>
          <col width="80px" />
          <col width="*" />
          <col width="220px" />
        </colgroup>
        <thead>
          <tr className={styles.headRow}>
            {COLS.map((c) => (
              <th key={c.key} className={styles.th} style={{ textAlign: c.align }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={COLS.length} className={styles.stateCell}>불러오는 중…</td></tr>
          ) : empty ? (
            <tr><td colSpan={COLS.length}><EmptyState /></td></tr>
          ) : (
            items.map((s) => (
              <tr key={s.id} className={styles.row}>
                <td className={styles.cellNo}>{s.supNum}</td>
                <td className={styles.cellName}>{s.name}</td>
                <td className={styles.cellActions}>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      onClick={() => onEdit(s)}
                      className={styles.actionBtn}
                      title="수정"
                    >
                      <IconEdit /><span>수정</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(s)}
                      className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                      title="삭제"
                    >
                      <IconTrash /><span>삭제</span>
                    </button>
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

function EmptyState() {
  return (
    <div className={styles.emptyWrap}>
      <div className={styles.emptyIcon}><IconSearch size={22} /></div>
      <div className={styles.emptyTitle}>등록된 매입처가 없습니다</div>
      <div className={styles.emptyDesc}>우측 상단 버튼으로 매입처를 등록해 주세요.</div>
    </div>
  );
}
