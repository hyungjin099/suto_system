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

/* Daum 우편번호 서비스 (Kakao Postcode v2) 동적 로드 + 팝업 오픈
 * 사용: openDaumPostcode((data) => { /* data.roadAddress, data.jibunAddress, data.zonecode ... */ /* })
 */
const DAUM_POSTCODE_SRC =
  "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

let daumScriptPromise = null;

function loadDaumPostcode() {
  if (typeof window !== "undefined" && window.daum?.Postcode) {
    return Promise.resolve();
  }
  if (daumScriptPromise) return daumScriptPromise;
  daumScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${DAUM_POSTCODE_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = DAUM_POSTCODE_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      daumScriptPromise = null;
      reject(new Error("Daum 우편번호 스크립트 로드 실패"));
    };
    document.head.appendChild(s);
  });
  return daumScriptPromise;
}

export async function openDaumPostcode(onComplete) {
  try {
    await loadDaumPostcode();
    new window.daum.Postcode({ oncomplete: onComplete }).open();
  } catch (e) {
    alert("주소 검색 서비스를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
}
