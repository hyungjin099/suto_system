/* 주문 내역 — 거래처별 과거 주문을 카드 리스트로 표시 */

import { useEffect, useState } from "react";
import { fetchClientOrders } from "../api";
import { formatNumber } from "../utils";
import styles from "./OrderHistory.module.css";

const fmtDate = (d) =>
  d
    ? new Intl.DateTimeFormat("ko-KR", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: false,
      }).format(d)
    : "-";

export default function OrderHistory({ cliCode }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cliCode) return;
    setLoading(true); setError("");
    fetchClientOrders(cliCode)
      .then(setOrders)
      .catch(() => setError("주문 내역을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [cliCode]);

  if (loading) return <div className={styles.empty}>불러오는 중…</div>;
  if (error)   return <div className={styles.empty}>{error}</div>;
  if (orders.length === 0)
    return <div className={styles.empty}>아직 주문 내역이 없습니다.</div>;

  return (
    <div className={styles.list}>
      {orders.map((o) => {
        const totalRolls = o.items.reduce((s, it) => s + (it.rolls || 0), 0);
        return (
          <div key={o.orderNum} className={styles.card}>
            <div className={styles.head}>
              <div>
                <div className={styles.orderId}>{o.orderId}</div>
                <div className={styles.date}>{fmtDate(o.orderDate)}</div>
              </div>
              <div className={styles.summary}>
                {o.items.length}개 제품 · {totalRolls}롤
              </div>
            </div>
            <div className={styles.items}>
              {o.items.map((it) => (
                <div key={it.itemNum} className={styles.itemRow}>
                  <div className={styles.itemMain}>
                    <div className={styles.itemName}>
                      {it.productLabel || it.product}
                    </div>
                    <div className={styles.itemDims}>
                      {formatNumber(it.width)}mm × {formatNumber(it.length)}m · {it.rolls}롤
                    </div>
                    {(it.destination || "").trim() && (
                      <div className={styles.itemMeta}>
                        <span className={styles.tag}>납품처</span>
                        {it.destination}
                      </div>
                    )}
                    {(it.note || "").trim() && (
                      <div className={styles.itemMeta}>
                        <span className={styles.tag}>비고</span>
                        {it.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
