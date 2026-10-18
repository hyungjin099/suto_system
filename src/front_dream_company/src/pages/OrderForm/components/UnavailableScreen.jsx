/* 주문 접수 불가 안내 (전체 블록 UI)
 * - 주말 / 공휴일 / 23:00~03:00 심야 시간대에 접속한 고객에게 노출
 */

import styles from "./SuccessScreen.module.css";

const ICONS = {
  WEEKEND: "📅",
  HOLIDAY: "🎌",
  NIGHT: "🌙",
};

export default function UnavailableScreen({ reason, message }) {
  const icon = ICONS[reason] || "⏸";
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.heroBox}>
          <div
            className={styles.checkCircle}
            style={{ background: "#fff5e0", color: "#b4881a", fontSize: 28 }}
          >
            {icon}
          </div>
          <h1 className={styles.heading}>지금은 주문을 받지 않습니다</h1>
          <p className={styles.lead} style={{ marginTop: 12 }}>
            {message || "주문 접수 시간이 아닙니다."}
          </p>
          <div style={{
            marginTop: 24, padding: "12px 16px",
            background: "#f7f9f5",
            border: "1px solid #e3e7dc",
            borderRadius: 8,
            fontSize: 13, color: "#444", lineHeight: 1.7,
            textAlign: "left",
          }}>
            <div style={{ fontWeight: 700, color: "#1b3a2a", marginBottom: 4 }}>
              주문 접수 운영 시간
            </div>
            · 평일 (주말·공휴일 제외)<br />
            · 03:00 ~ 23:00
          </div>
        </div>
      </main>
    </div>
  );
}
