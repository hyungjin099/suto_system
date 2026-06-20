/* 거래처 검색/필터 바
 * - 검색: 거래처명/거래처코드/담당자
 * - 사용구분: 라디오 (전체 / YES / NO)
 */

import { AField, AInput } from "./Fields";
import { IconSearch } from "./Icons";
import { cx } from "../utils";
import styles from "./ClientFilterBar.module.css";

const USE_TYPE_OPTIONS = [
  { value: "", label: "전체" },
  { value: "YES", label: "YES" },
  { value: "NO", label: "NO" },
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
        <AField label="사용구분">
          <div className={styles.radioGroup} role="radiogroup" aria-label="사용구분">
            {USE_TYPE_OPTIONS.map((opt) => {
              const checked = filters.useType === opt.value;
              return (
                <label
                  key={opt.value || "all"}
                  className={cx(styles.radio, checked && styles.radioChecked)}
                >
                  <input
                    type="radio"
                    name="useTypeFilter"
                    value={opt.value}
                    checked={checked}
                    onChange={() => set("useType", opt.value)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioDot} />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </AField>

        <AField label="검색" hint="거래처명 / 거래처코드 / 담당자">
          <AInput
            value={filters.q}
            onChange={(v) => set("q", v)}
            placeholder="예: 시스픽, 5048179051"
            leftIcon={<IconSearch />}
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
