/* 고객사 검색/필터 바 */

import { AField, AInput, ASelect } from "./Fields";
import { IconSearch } from "./Icons";
import styles from "./ClientFilterBar.module.css";

const ACTIVE_OPTIONS = [
  { value: "1", label: "활성" },
  { value: "0", label: "비활성" },
];

export default function ClientFilterBar({
  filters,
  setFilters,
  onReset,
  hasFilters,
  totalShown,
  totalAll,
}) {
  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        <AField label="검색" hint="고객사명 / 담당자 / 접속코드">
          <AInput
            value={filters.q}
            onChange={(v) => set("q", v)}
            placeholder="예: 서울베이커리, 김민준, 10245"
            leftIcon={<IconSearch />}
          />
        </AField>

        <AField label="활동 여부">
          <ASelect
            value={filters.active}
            onChange={(v) => set("active", v)}
            options={ACTIVE_OPTIONS}
            placeholder="전체"
          />
        </AField>

        <div className={styles.resetCol}>
          <button type="button" onClick={onReset} className={styles.resetBtn}>
            초기화
          </button>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>
          총{" "}
          <strong className={styles.numStrong}>
            {totalAll.toLocaleString()}
          </strong>
          개 중{" "}
          <strong className={styles.numStrongBrand}>
            {totalShown.toLocaleString()}
          </strong>
          개 표시
        </span>
        {hasFilters && (
          <span className={styles.filterChip}>
            <span className={styles.filterDot} />
            필터 적용 중
          </span>
        )}
      </div>
    </div>
  );
}
