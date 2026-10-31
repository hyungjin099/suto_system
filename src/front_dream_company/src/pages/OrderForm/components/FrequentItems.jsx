/* 자주 주문한 품목 — 누르면 아래 주문서에 카드로 추가 (롤수는 지난번 그대로)
 * - 폰(좁은 화면)에서는 기본으로 접어 두고, 제목 줄을 눌러 펼친다. 열고 닫은 상태는 기억하지 않는다.
 */

import { useState } from "react";
import { formatNumber } from "../utils";
import styles from "./FrequentItems.module.css";

const isNarrow = () =>
  typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 600px)").matches;

export default function FrequentItems({ entries, onPick }) {
  const [open, setOpen] = useState(() => !isNarrow());
  if (!entries.length) return null;
  return (
    <section className={styles.box} aria-label="자주 주문한 품목">
      <button
        type="button"
        className={styles.head}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={styles.title}>
          자주 주문한 품목 <span className={styles.count}>{entries.length}</span>
        </span>
        <span className={styles.hint}>{open ? "누르면 주문서에 추가됩니다" : "펼쳐서 보기"}</span>
        <span className={`${styles.arrow} ${open ? styles.arrowOpen : ""}`} aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className={styles.chips}>
          {entries.map((e) => (
            <button
              key={`${e.product}|${e.productLabel}|${e.width}|${e.length}`}
              type="button"
              className={styles.chip}
              onClick={() => onPick(e)}
              title={`최근 ${e.rolls}롤 주문 · 최근 3개월 ${e.orderCount}회`}
            >
              <span className={styles.plus} aria-hidden="true">+</span>
              <span className={styles.text}>
                <span className={styles.name}>{e.productLabel || e.product}</span>
                <span className={styles.spec}>
                  {formatNumber(e.width)}mm × {formatNumber(e.length)}m · {e.rolls}롤
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
