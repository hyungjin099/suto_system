/* 관리자 페이지 공통 유틸리티 */

export const won = (n) => Number(n || 0).toLocaleString("ko-KR") + "원";

export const onlyDigits = (s) => String(s ?? "").replace(/[^\d]/g, "");

export const formatNumber = (s) => {
  const d = onlyDigits(s);
  return d ? Number(d).toLocaleString("ko-KR") : "";
};

export const fmtDate = (d) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(d)
    .replace(/\. /g, ".")
    .replace(/\.$/, "");

export const cx = (...args) => args.filter(Boolean).join(" ");
