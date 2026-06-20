/* 제품 목록 테이블 + EmptyState */

import { IconEdit, IconTrash, IconSearch } from "./Icons";
import { fmtDate } from "../utils";
import styles from "./ProductTable.module.css";

const COLS = [
  { key: "no", label: "번호", align: "center" },
  { key: "code", label: "제품코드", align: "center" },
  { key: "name", label: "제품명", align: "center" },
  { key: "manufacturer", label: "매입처", align: "center" },
  { key: "price", label: "단가 (원/m)", align: "center" },
  { key: "updated", label: "수정일", align: "center" },
  { key: "actions", label: "", align: "center" },
];

export default function ProductTable({
  items,
  empty,
  onEdit,
  onDelete,
  total = 0,
  page = 1,
  pageSize = 15,
}) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <colgroup>
          <col width="60px" />
          <col width="240px" />
          <col width="*" />
          <col width="160px" />
          <col width="140px" />
          <col width="120px" />
          <col width="180px" />
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
            items.map((p, i) => (
              <tr key={p.id} className={styles.row}>
                <td className={styles.cellNo}>
                  {total - ((page - 1) * pageSize + i)}
                </td>
                <td className={styles.cellCode}>{p.code}</td>
                <td className={styles.cellName}>{p.name}</td>
                <td className={styles.cell}>{p.manufacturer || "-"}</td>
                <td className={styles.cellPrice}>
                  {p.price != null ? (
                    <>
                      {p.price.toLocaleString("ko-KR")}
                      <span className={styles.priceUnit}>원</span>
                    </>
                  ) : (
                    "-"
                  )}
                </td>
                <td className={styles.cellUpdated}>{fmtDate(p.updatedAt)}</td>
                <td className={styles.cellActions}>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      onClick={() => onEdit(p)}
                      className={styles.actionBtn}
                      title="수정"
                    >
                      <IconEdit />
                      <span>수정</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(p)}
                      className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                      title="삭제"
                    >
                      <IconTrash />
                      <span>삭제</span>
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
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>
        <IconSearch size={22} />
      </div>
      <div className={styles.emptyTitle}>조건에 맞는 원단이 없습니다</div>
      <div className={styles.emptyDesc}>
        필터를 조정하거나 검색어를 다시 확인해 주세요.
      </div>
    </div>
  );
}
