/* 알림 유틸 */

/** 'yyyy-MM-dd HH:mm:ss' or ISO 문자열 → "YY.MM.DD HH:mm" */
export function formatOrderTime(input) {
  if (!input) return "";
  const d = input instanceof Date ? input : new Date(String(input).replace(" ", "T"));
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    "-" + pad(d.getMonth() + 1) +
    "-" + pad(d.getDate()) +
    " " + pad(d.getHours()) +
    ":" + pad(d.getMinutes())
  );
}

/** "삼지30 외 2건 · 총 10롤" */
export function formatOrderSummary(ev) {
  if (!ev) return "";
  const first = ev.firstProductLabel || "제품";
  const extra = (ev.itemCount || 1) > 1 ? ` 외 ${(ev.itemCount - 1)}건` : "";
  const rolls = ev.totalRolls != null ? ` · 총 ${ev.totalRolls}롤` : "";
  return `${first}${extra}${rolls}`;
}

/** DEFERRED 여부 등 뱃지용 */
export function statusBadge(status) {
  if (status === "DEFERRED") return { label: "내일 시트", bg: "#fff3cd", color: "#8a6d3b" };
  if (status === "FAILED")   return { label: "시트 실패", bg: "#f8d7da", color: "#a94442" };
  return null;
}
