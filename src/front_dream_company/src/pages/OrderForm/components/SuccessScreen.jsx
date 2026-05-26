/* 주문 접수 완료 화면 */

import { formatNumber } from "../utils";
import styles from "./SuccessScreen.module.css";

const cx = (...args) => args.filter(Boolean).join(" ");

export default function SuccessScreen({ data, onReset }) {
  const dt = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(data.at);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.heroBox}>
          <div className={styles.checkCircle}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12l5 5L20 6" />
            </svg>
          </div>
          <h1 className={styles.heading}>주문이 접수되었습니다</h1>
          <p className={styles.lead}>
            담당자가 확인 후 빠르게 연락드리겠습니다.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.metaRow}>
            <div>
              <div className={styles.metaLabel}>주문번호</div>
              <div className={styles.orderId}>{data.orderId}</div>
            </div>
            <div className={styles.metaRight}>
              <div className={styles.metaLabel}>접수 일시</div>
              <div className={styles.metaTime}>{dt}</div>
            </div>
          </div>

          {data.items.map((it) => (
            <div key={it.id} className={styles.itemRow}>
              <div>
                <div className={styles.itemName}>{it.productLabel}</div>
                <div className={styles.itemDims}>
                  {formatNumber(it.width)}mm × {formatNumber(it.length)}m
                </div>
              </div>
              <div className={styles.itemRolls}>
                {parseInt(it.rolls, 10)}롤
              </div>
            </div>
          ))}

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>합계</span>
            <span className={styles.totalValue}>
              {data.items.length}개 제품 · {data.totalRolls}롤
            </span>
          </div>

          <div className={styles.destBox}>
            <div className={styles.destLabel}>납품처</div>
            <div
              className={cx(
                styles.destValue,
                !data.destination.trim() && styles.empty
              )}
            >
              {data.destination.trim() || "미입력"}
            </div>
          </div>
        </div>

        <button type="button" onClick={onReset} className={styles.resetBtn}>
          새 주문 작성하기
        </button>
      </main>
    </div>
  );
}
