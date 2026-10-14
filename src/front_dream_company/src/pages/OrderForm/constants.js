/* 주문 폼 관련 상수 및 빈 아이템/규격 생성기
 *
 * 구조:
 *   item (제품 1개) → specs: [spec, spec, ...]  (가로/길이/롤수 조합 N개)
 *   제출 시 각 spec을 개별 라인으로 펼쳐 전송 → 시트에 각각 한 행으로 들어감
 */

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

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Math.random());
}

export const emptySpec = () => ({
  id: newId(),
  width: "1530",
  length: "1000",
  rolls: "1",
});

export const emptyItem = (destination = "") => ({
  id: newId(),
  product: "",   // 공식 원단 코드 (DB 저장)
  prodName: "",  // 공식 원단명 (DB·시트 저장)
  prodCode: "",
  aliasName: "",
  destination,
  note: "",
  specs: [emptySpec()],
});

export function validateItem(it) {
  const e = {};
  if (!it.product) e.product = true;
  const specErrs = {};
  (it.specs || []).forEach((sp) => {
    const se = {};
    if (!sp.width || parseInt(sp.width, 10) <= 0) se.width = true;
    if (!sp.length || parseInt(sp.length, 10) <= 0) se.length = true;
    if (!sp.rolls || parseInt(sp.rolls, 10) <= 0) se.rolls = true;
    if (Object.keys(se).length) specErrs[sp.id] = se;
  });
  if (Object.keys(specErrs).length) e.specs = specErrs;
  return e;
}
