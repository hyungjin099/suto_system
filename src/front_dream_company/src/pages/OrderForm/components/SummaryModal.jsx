/* 주문 검토 모달 */

import { useEffect } from "react";
import { IconCheck } from "./Icons";
import { formatNumber } from "../utils";
import { PRODUCT_OPTIONS } from "../constants";
import styles from "./SummaryModal.module.css";

const cx = (...args) => args.filter(Boolean).join(" ");

export default function SummaryModal({
  items,
  destination,
  totalRolls,
  submitting = false,
  submitError = "",
  onClose,
  onSubmit,
}) {
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  return (
    <div onClick={onClose} className={styles.overlay}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />
        <h2 className={styles.heading}>주문 내용을 확인해 주세요</h2>
        <p className={styles.lead}>제출 후에는 담당자가 확인 연락을 드립니다.</p>

        {/* items table */}
        <div className={styles.itemsTable}>
          {items.map((it) => (
            <div key={it.id} className={styles.itemRow}>
              <div className={styles.itemHeader}>
                <span className={styles.itemName}>
                  {PRODUCT_OPTIONS.find((p) => p.value === it.product)?.label}
                </span>
                <span className={styles.itemRolls}>
                  {parseInt(it.rolls, 10)}롤
                </span>
              </div>
              <div className={styles.itemDims}>
                {formatNumber(it.width)}
                <span className={styles.unit}>mm</span>
                <span className={styles.timesSep}>×</span>
                {formatNumber(it.length)}
                <span className={styles.unit}>m</span>
              </div>
            </div>
          ))}
          <div className={styles.totalRow}>
            <span>합계</span>
            <span className={styles.totalVal}>
              {items.length}개 제품 · {totalRolls}롤
            </span>
          </div>
        </div>

        {/* destination */}
        <div className={styles.destBox}>
          <div className={styles.destLabel}>납품처</div>
          <div
            className={cx(
              styles.destValue,
              !destination.trim() && styles.empty
            )}
          >
            {destination.trim() || "미입력"}
          </div>
        </div>

        {submitError && (
          <p className={styles.errorMsg}>{submitError}</p>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className={styles.cancelBtn}
          >
            수정
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className={styles.submitBtn}
          >
            {submitting ? "접수 중…" : <><IconCheck /> 주문 제출</>}
          </button>
        </div>
      </div>
    </div>
  );
}
