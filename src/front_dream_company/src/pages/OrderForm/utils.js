/* 숫자 포맷 / 입력 정제 유틸 */

export const formatNumber = (s) => {
  const digits = String(s ?? "").replace(/[^\d]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("ko-KR");
};

export const onlyDigits = (s) => String(s ?? "").replace(/[^\d]/g, "");
