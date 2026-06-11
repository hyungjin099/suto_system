/* 입고처 목록 테이블 */

import { IconBtn } from "./Buttons";
import { IconEdit, IconTrash, IconSearch } from "./Icons";
import { fmtDate } from "../utils";
import styles from "./SupplierTable.module.css";

const COLS = [
  { key: "name",        label: "입고처명",      align: "left"  },
  { key: "tel",         label: "연락처",        align: "left"  },
  { key: "managerName", label: "담당자명",      align: "left"  },
  { key: "managerTel",  label: "담당자 연락처", align: "left"  },
  { key: "regDate",     label: "등록일",        align: "left"  },
  { key: "actions",     label: "",             align: "right" },
];

export default function SupplierTable({ items, loading, empty, onEdit, onDelete }) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <colgroup>
          <col className={styles.colName} />
          <col className={styles.colTel} />
          <col className={styles.colManager} />
          <col className={styles.colManagerTel} />
          <col className={styles.colDate} />
          <col className={styles.colActions} />
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
            <tr>
              <td colSpan={COLS.length} className={styles.stateCell}>
                불러오는 중…
              </td>
            </tr>
          ) : empty ? (
            <tr>
              <td colSpan={COLS.length}>
                <EmptyState />
              </td>
            </tr>
          ) : (
            items.map((s) => (
              <tr key={s.id} className={styles.row}>
                <td className={styles.cellName}>{s.name}</td>
                <td className={styles.cell}>{s.tel || <span className={styles.empty}>-</span>}</td>
                <td className={styles.cell}>{s.managerName || <span className={styles.empty}>-</span>}</td>
                <td className={styles.cell}>{s.managerTel || <span className={styles.empty}>-</span>}</td>
                <td className={styles.cellDate}>{fmtDate(s.regDate)}</td>
                <td className={styles.cellActions}>
                  <div className={styles.actions}>
                    <IconBtn onClick={() => onEdit(s)} title="수정">
                      <IconEdit />
                    </IconBtn>
                    <IconBtn onClick={() => onDelete(s)} title="삭제" danger>
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
    <div className={styles.emptyWrap}>
      <div className={styles.emptyIcon}>
        <IconSearch size={22} />
      </div>
      <div className={styles.emptyTitle}>등록된 입고처가 없습니다</div>
      <div className={styles.emptyDesc}>우측 상단 버튼으로 입고처를 등록해 주세요.</div>
    </div>
  );
}
