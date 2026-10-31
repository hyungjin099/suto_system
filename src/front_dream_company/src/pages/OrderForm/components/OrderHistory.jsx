/* 주문 내역 — 거래처별 과거 주문을 기간으로 조회해 카드 리스트로 표시, PC에서는 표 형태로 인쇄 */

import { useEffect, useMemo, useState } from "react";
import { fetchClientOrders } from "../api";
import { formatNumber } from "../utils";
import { printOrders, isTouchDevice } from "../printOrders";
import { matchFabric } from "../reorder";
import styles from "./OrderHistory.module.css";

const fmtDate = (d) =>
  d
    ? new Intl.DateTimeFormat("ko-KR", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: false,
      }).format(d)
    : "-";

/* ── 기간 계산 (모두 'yyyy-MM-dd', 양끝 포함) ───────────────── */
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const PRESETS = [
  { key: "today", label: "오늘" },
  { key: "week",  label: "이번 주" },
  { key: "month", label: "이번 달" },
];

function rangeFor(preset) {
  const now = new Date();
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === "today") return { from: ymd(t), to: ymd(t) };
  if (preset === "week") {
    // 월요일 ~ 일요일
    const mon = new Date(t);
    mon.setDate(t.getDate() - ((t.getDay() + 6) % 7));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { from: ymd(mon), to: ymd(sun) };
  }
  // month: 이번 달 1일 ~ 말일
  return {
    from: ymd(new Date(t.getFullYear(), t.getMonth(), 1)),
    to: ymd(new Date(t.getFullYear(), t.getMonth() + 1, 0)),
  };
}

export default function OrderHistory({ cliCode, clientName, fabricOptions = [], fabricsLoading, onReorder }) {
  const [preset, setPreset] = useState("week");              // 기본: 이번 주(월~일)
  const [{ from, to }, setRange] = useState(() => rangeFor("week"));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(() => new Set());   // 다시 담을 품목(itemNum)

  const canPrint = useMemo(() => !isTouchDevice(), []);      // 폰/태블릿은 인쇄 불가
  const rangeInvalid = !from || !to || from > to;

  useEffect(() => {
    if (!cliCode || rangeInvalid) return undefined;
    let cancelled = false;
    setLoading(true); setError(""); setSelected(new Set());
    fetchClientOrders(cliCode, { from, to })
      .then((rows) => { if (!cancelled) setOrders(rows); })
      .catch(() => { if (!cancelled) setError("주문 내역을 불러오지 못했습니다."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };       // 기간을 빠르게 바꿀 때 늦게 온 응답이 덮어쓰지 않도록
  }, [cliCode, from, to, rangeInvalid]);

  const pickPreset = (key) => {
    setPreset(key);
    setRange(rangeFor(key));
  };
  const changeDate = (field, value) => {
    setPreset("custom");
    setRange((r) => ({ ...r, [field]: value }));
  };

  const totalRolls = orders.reduce(
    (s, o) => s + o.items.reduce((t, it) => t + (Number(it.rolls) || 0), 0), 0
  );
  const periodText = from === to ? from : `${from} ~ ${to}`;
  const presetLabel = PRESETS.find((p) => p.key === preset)?.label;

  // 지금도 주문할 수 있는 품목(별칭이 살아 있는 것)만 다시 담을 수 있다
  const orderable = (it) => !fabricsLoading && !!matchFabric(fabricOptions, it);
  const toggleItem = (itemNum) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(itemNum)) next.delete(itemNum); else next.add(itemNum);
      return next;
    });
  const toggleOrder = (o) => {
    const ids = o.items.filter(orderable).map((it) => it.itemNum);
    if (!ids.length) return;
    setSelected((prev) => {
      const next = new Set(prev);
      const all = ids.every((id) => next.has(id));
      ids.forEach((id) => (all ? next.delete(id) : next.add(id)));
      return next;
    });
  };
  const doReorder = () => {
    // 오래된 주문부터 순서대로 담는다(화면 목록은 최신순)
    const entries = [...orders].reverse().flatMap((o) => o.items.filter((it) => selected.has(it.itemNum)));
    if (!entries.length) return;
    onReorder(entries);
    setSelected(new Set());
  };

  const onPrint = () => {
    printOrders({
      clientName,
      periodLabel: presetLabel ? `${presetLabel} (${periodText})` : periodText,
      orders,
    });
  };

  return (
    <div>
      {/* 기간 선택 */}
      <div className={styles.filterBar}>
        <div className={styles.chips}>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`${styles.chip} ${preset === p.key ? styles.chipActive : ""}`}
              onClick={() => pickPreset(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className={styles.dateRange}>
          <input
            type="date"
            className={styles.dateInput}
            value={from}
            max={to || undefined}
            onChange={(e) => changeDate("from", e.target.value)}
            aria-label="조회 시작일"
          />
          <span className={styles.dateSep}>~</span>
          <input
            type="date"
            className={styles.dateInput}
            value={to}
            min={from || undefined}
            onChange={(e) => changeDate("to", e.target.value)}
            aria-label="조회 종료일"
          />
        </div>
      </div>

      <div className={styles.resultBar}>
        <span className={styles.resultText}>
          {rangeInvalid
            ? "조회 기간을 확인해 주세요"
            : loading
            ? `${periodText} 조회 중…`
            : `${periodText} · ${orders.length}건 · ${totalRolls.toLocaleString("ko-KR")}롤`}
        </span>
        {canPrint ? (
          <button
            type="button"
            className={styles.printBtn}
            onClick={onPrint}
            disabled={loading || !!error || rangeInvalid || orders.length === 0}
            title="현재 조회된 기간의 주문 내역을 표로 인쇄합니다"
          >
            🖨 인쇄
          </button>
        ) : (
          <span className={styles.printHint}>인쇄는 PC에서 이용해 주세요</span>
        )}
      </div>

      {/* 본문 */}
      {rangeInvalid ? (
        <div className={styles.empty}>시작일이 종료일보다 늦을 수 없습니다.</div>
      ) : loading ? (
        <div className={styles.empty}>불러오는 중…</div>
      ) : error ? (
        <div className={styles.empty}>{error}</div>
      ) : orders.length === 0 ? (
        <div className={styles.empty}>해당 기간에 주문 내역이 없습니다.</div>
      ) : (
        <div className={styles.list}>
          {orders.map((o) => {
            const rolls = o.items.reduce((s, it) => s + (it.rolls || 0), 0);
            return (
              <div key={o.orderNum} className={styles.card}>
                <div className={styles.head}>
                  <div className={styles.headMain}>
                    <span className={styles.orderId}>{o.orderId}</span>
                    <span className={styles.date}>{fmtDate(o.orderDate)}</span>
                  </div>
                  <div className={styles.headRight}>
                    {onReorder && o.items.some(orderable) && (
                      <button type="button" className={styles.selOrderBtn} onClick={() => toggleOrder(o)}>
                        {o.items.filter(orderable).every((it) => selected.has(it.itemNum)) ? "전체 추가 해제" : "전체 추가"}
                      </button>
                    )}
                    <div className={styles.summary}>
                      {o.items.length}개 제품 · {rolls}롤
                    </div>
                  </div>
                </div>
                <div className={styles.items}>
                  {o.items.map((it) => (
                    <div key={it.itemNum} className={styles.itemRow}>
                      <div className={styles.itemMain}>
                        <div className={styles.itemTitle}>
                          <span className={styles.itemName}>
                            {it.productLabel || it.product}
                          </span>
                          <span className={styles.itemDims}>
                            {formatNumber(it.width)}mm × {formatNumber(it.length)}m · {it.rolls}롤
                          </span>
                        </div>
                        {(it.destination || "").trim() && (
                          <div className={styles.itemMeta}>
                            <span className={styles.tag}>납품처</span>
                            <span className={styles.metaText}>{it.destination}</span>
                          </div>
                        )}
                        {(it.note || "").trim() && (
                          <div className={styles.itemMeta}>
                            <span className={styles.tag}>비고</span>
                            <span className={styles.metaText}>{it.note}</span>
                          </div>
                        )}
                      </div>
                      {onReorder && (
                        orderable(it) ? (
                          <button
                            type="button"
                            className={`${styles.addBtn} ${selected.has(it.itemNum) ? styles.addBtnOn : ""}`}
                            onClick={() => toggleItem(it.itemNum)}
                            aria-pressed={selected.has(it.itemNum)}
                          >
                            <span className={styles.addIcon} aria-hidden="true">
                              {selected.has(it.itemNum) ? "✓" : "+"}
                            </span>
                            재주문에 추가
                          </button>
                        ) : (
                          <span className={styles.noPick} title="지금은 주문할 수 없는 품목입니다">주문 불가</span>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected.size > 0 && (
        <div className={styles.reorderBar}>
          <button type="button" className={styles.reorderBtn} onClick={doReorder}>
            {selected.size}개 품목 다시 주문하기
          </button>
          <button type="button" className={styles.reorderClear} onClick={() => setSelected(new Set())}>
            전체 해제
          </button>
        </div>
      )}
    </div>
  );
}
