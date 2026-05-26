/* 제품 목록 테이블 + EmptyState */

import { IconBtn } from "./Buttons";
import { IconEdit, IconTrash, IconSearch } from "./Icons";
import { fmtDate } from "../utils";
import styles from "./ProductTable.module.css";

const COLS = [
  { key: "code", label: "제품코드", align: "left" },
  { key: "category", label: "카테고리", align: "left" },
  { key: "name", label: "제품명", align: "left" },
  { key: "price", label: "단가 (원/m)", align: "right" },
  { key: "updated", label: "수정일", align: "left" },
  { key: "actions", label: "", align: "right" },
];

export default function ProductTable({ items, empty, onEdit, onDelete }) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <colgroup>
          <col className={styles.colCode} />
          <col className={styles.colCategory} />
          <col className={styles.colName} />
          <col className={styles.colPrice} />
          <col className={styles.colUpdated} />
          <col className={styles.colActions} />
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
            items.map((p) => (
              <tr key={p.id} className={styles.row}>
                <td className={styles.cellCode}>{p.code}</td>
                <td className={styles.cell}>
                  <span className={styles.catChip}>{p.category}</span>
                </td>
                <td className={styles.cellName}>{p.name}</td>
                <td className={styles.cellPrice}>
                  {p.price.toLocaleString("ko-KR")}
                  <span className={styles.priceUnit}>원</span>
                </td>
                <td className={styles.cellUpdated}>{fmtDate(p.updatedAt)}</td>
                <td className={styles.cellActions}>
                  <div className={styles.actions}>
                    <IconBtn onClick={() => onEdit(p)} title="수정">
                      <IconEdit />
                    </IconBtn>
                    <IconBtn onClick={() => onDelete(p)} title="삭제" danger>
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
