/* 페이지네이션: 5칸 윈도우 + 처음/이전/다음/끝 */

import { useMemo } from "react";
import { IconChevL, IconChevR } from "./Icons";
import { cx } from "../utils";
import styles from "./Pagination.module.css";

export default function Pagination({ page, totalPages, total, onChange }) {
  const pages = useMemo(() => {
    const arr = [];
    const win = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + win - 1);
    start = Math.max(1, end - win + 1);
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [page, totalPages]);

  return (
    <div className={styles.wrap}>
      <div className={styles.info}>
        총{" "}
        <strong className={styles.numStrong}>{total.toLocaleString()}</strong>개
        · 페이지{" "}
        <strong className={cx(styles.numStrong, styles.numMarginLeft)}>
          {page} / {totalPages}
        </strong>
      </div>
      <div className={styles.buttons}>
        <PageBtn onClick={() => onChange(1)} disabled={page === 1}>
          «
        </PageBtn>
        <PageBtn
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          <IconChevL />
        </PageBtn>
        {pages.map((n) => (
          <PageBtn key={n} onClick={() => onChange(n)} active={n === page}>
            {n}
          </PageBtn>
        ))}
        <PageBtn
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        >
          <IconChevR />
        </PageBtn>
        <PageBtn
          onClick={() => onChange(totalPages)}
          disabled={page === totalPages}
        >
          »
        </PageBtn>
      </div>
    </div>
  );
}

function PageBtn({ children, onClick, active, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        styles.pageBtn,
        active && styles.pageBtnActive,
        disabled && styles.pageBtnDisabled
      )}
    >
      {children}
    </button>
  );
}
