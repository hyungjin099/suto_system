/* 거래처 검색/필터 바 */

import { AField, AInput, ASelect } from "./Fields";
import { IconSearch } from "./Icons";
import { CLI_USE_TYPES } from "../constants";
import styles from "./ClientFilterBar.module.css";

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
        <AField label="검색" hint="거래처명 / 거래처코드 / 담당자">
          <AInput
            value={filters.q}
            onChange={(v) => set("q", v)}
            placeholder="예: 시스픽, 5048179051"
            leftIcon={<IconSearch />}
          />
        </AField>

        <AField label="사용구분">
          <ASelect
            value={filters.useType}
            onChange={(v) => set("useType", v)}
            options={CLI_USE_TYPES}
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
