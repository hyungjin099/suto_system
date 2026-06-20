/* 제품 검색/필터 바 */

import { AField, AInput } from "./Fields";
import { IconSearch } from "./Icons";
import { formatNumber, onlyDigits } from "../utils";
import styles from "./FilterBar.module.css";

export default function FilterBar({
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
        <AField label="제품코드 / 제품명">
          <AInput
            value={filters.q}
            onChange={(v) => set("q", v)}
            placeholder="예: AT-1680 또는 아트지 무광"
            leftIcon={<IconSearch />}
          />
        </AField>

        <AField label="단가 범위" hint="원">
          <div className={styles.priceRow}>
            <AInput
              value={formatNumber(filters.priceMin)}
              onChange={(v) => set("priceMin", onlyDigits(v))}
              placeholder="최소"
              inputMode="numeric"
            />
            <span className={styles.tilde}>~</span>
            <AInput
              value={formatNumber(filters.priceMax)}
              onChange={(v) => set("priceMax", onlyDigits(v))}
              placeholder="최대"
              inputMode="numeric"
            />
          </div>
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
