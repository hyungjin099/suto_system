/* 재주문 / 자주 주문한 품목 → 주문 폼 카드로 변환
 *
 * 과거 주문(또는 자주 주문한 품목)은 { product(제품코드), productLabel(별칭), width, length, rolls, destination, note } 형태.
 * 현재 이 거래처가 주문할 수 있는 원단 옵션(fabricOptions)과 맞춰 보고, 맞는 것만 폼에 담는다.
 */

import { emptyItem, emptySpec } from "./constants";

/** 과거 품목에 대응하는 현재 주문 가능 원단. 없으면 null(별칭 삭제·사용 중지 등) */
export function matchFabric(fabricOptions, entry) {
  const label = (entry.productLabel || "").trim();
  const exact = fabricOptions.find((f) => f.prodCode === entry.product && f.aliasName === label);
  if (exact) return exact;
  // 예전 주문은 별칭 대신 공식 원단명이 저장돼 있을 수 있다 → 그 제품코드의 별칭이 하나뿐일 때만 인정
  const sameCode = fabricOptions.filter((f) => f.prodCode === entry.product);
  return sameCode.length === 1 ? sameCode[0] : null;
}

/**
 * 품목 목록 → 폼 카드 목록.
 * 같은 원단 + 같은 납품처는 한 카드의 규격(spec) 여러 줄로 묶는다. 롤수·납품처는 과거 값 그대로, 비고는 비워서 담는다.
 * @returns {{ items: object[], skipped: string[] }} skipped = 지금은 주문할 수 없어 담지 못한 품목명
 */
export function entriesToItems(entries, fabricOptions, defaultDestination = "") {
  const groups = new Map();
  const skipped = [];

  entries.forEach((e) => {
    const fab = matchFabric(fabricOptions, e);
    if (!fab) {
      skipped.push(e.productLabel || e.product || "(이름 없음)");
      return;
    }
    const destination = (e.destination || "").trim();
    const note = "";   // 비고는 이번 주문에만 해당하는 요청이 따라오지 않도록 비워서 담는다
    const key = [fab.value, destination, note].join("\u0001");

    let g = groups.get(key);
    if (!g) {
      g = {
        ...emptyItem(destination || defaultDestination),
        product: fab.value,
        prodName: fab.prodName || "",
        prodCode: fab.prodCode || "",
        aliasName: fab.aliasName || "",
        note,
        specs: [],
      };
      groups.set(key, g);
    }

    const width = String(e.width ?? "");
    const length = String(e.length ?? "");
    const rolls = String(e.rolls ?? "1");
    const dup = g.specs.some((s) => s.width === width && s.length === length && s.rolls === rolls);
    if (!dup) g.specs.push({ ...emptySpec(), width, length, rolls });
  });

  return { items: [...groups.values()], skipped };
}

/** 제품을 아직 고르지 않은 빈 카드(처음 열었을 때의 기본 카드) 판별 */
export const isBlankItem = (it) => !it.product && !(it.note || "").trim();
