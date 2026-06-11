/* 주문 폼 관련 상수 및 빈 아이템 생성기 */

export const PRODUCT_OPTIONS = [
  { value: "stretch", label: "스트레치 필름" },
  { value: "shrink", label: "수축 필름" },
  { value: "pe-roll", label: "PE 롤백" },
  { value: "hdpe", label: "HDPE 비닐" },
  { value: "ldpe", label: "LDPE 비닐" },
  { value: "aircap", label: "에어캡 (뽁뽁이)" },
  { value: "opp", label: "OPP 필름" },
  { value: "eco", label: "친환경 생분해 필름" },
];

export const emptyItem = (destination = "") => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Math.random()),
  product: "",   // 공식 원단 코드 (DB 저장)
  prodName: "",  // 공식 원단명 (DB·시트 저장)
  width: "",
  length: "",
  rolls: "1",
  destination,
  note: "",
});

export function validateItem(it) {
  const e = {};
  if (!it.product) e.product = true;
  if (!it.width || parseInt(it.width, 10) <= 0) e.width = true;
  if (!it.length || parseInt(it.length, 10) <= 0) e.length = true;
  if (!it.rolls || parseInt(it.rolls, 10) <= 0) e.rolls = true;
  return e;
}
