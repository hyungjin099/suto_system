/* 주문 접수 완료 화면
 * - 접수 요약 + 3버튼 (새 주문 / 발주 내역 확인 / 주문 종료)
 * - 주문 종료: 실제 브라우저 종료는 불가하므로 "이용 감사" 안내 화면 전환
 */

import { useState } from "react";
import { formatNumber } from "../utils";
import styles from "./SuccessScreen.module.css";

export default function SuccessScreen({ data, onReset, onGoHistory }) {
  const [ended, setEnded] = useState(false);

  const dt = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(data.at);

  const deliveryLabel = data.deliveryDate || "-";

  // === 주문 종료 화면 ===
  if (ended) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.heroBox}>
            <h1 className={styles.heading}>이용해 주셔서 감사합니다</h1>
            <p className={styles.lead}>
              발주 접수가 완료되었습니다.
              <br />
              브라우저 탭을 닫거나, 아래 버튼으로 새 주문을 시작하실 수 있습니다.
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
            <button type="button" onClick={onReset} className={styles.resetBtn} style={{ maxWidth: 280 }}>
              새 주문 시작
            </button>
          </div>
        </main>
      </div>
    );
  }

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
            납기 예정일은 <b>{deliveryLabel}</b> 입니다. 변경 발생 시 연락드리겠습니다.
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
                {(it.destination || "").trim() && (
                  <div className={styles.itemDest}>
                    <span className={styles.itemDestLabel}>납품처</span>
                    {it.destination.trim()}
                  </div>
                )}
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
        </div>

        {/* 3버튼 가로 배치 */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button type="button" onClick={onReset} className={styles.resetBtn} style={{ flex: 1 }}>
            새 주문 작성
          </button>
          <button
            type="button"
            onClick={onGoHistory}
            className={styles.resetBtn}
            style={{
              flex: 1,
              background: "var(--surface, #fff)",
              color: "var(--brand, #4a7c59)",
              border: "1px solid var(--brand, #4a7c59)",
            }}
          >
            발주 내역 확인
          </button>
          <button
            type="button"
            onClick={() => setEnded(true)}
            className={styles.resetBtn}
            style={{
              flex: 1,
              background: "var(--surface, #fff)",
              color: "var(--ink-2, #444)",
              border: "1px solid var(--line, #ddd)",
            }}
          >
            주문 종료
          </button>
        </div>
      </main>
    </div>
  );
}
