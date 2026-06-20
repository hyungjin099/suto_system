/* 관리자 페이지에서 사용하는 상수 */

export const PAGE_SIZE = 10;

// 원단 매입처 (PRODUCT_INFO.MANUFACTURER 드롭다운 옵션)
// 실제 매입처 마스터 테이블 도입 시 동적 조회로 교체 예정
export const MANUFACTURERS = [
  "한솔제지",
  "무림페이퍼",
  "신풍제지",
  "삼화제지",
  "SKC",
  "코오롱인더스트리",
];

// 거래처 사용구분 (DB CLI_USE_TYPE에 그대로 저장)
export const CLI_USE_TYPES = [
  { value: "YES", label: "YES" },
  { value: "NO", label: "NO" },
];

// ── FabricAliasAdmin 전용 시드 (실제 API 연결 전 임시 데이터) ─────────
export const CATEGORIES = [
  "아트지", "모조지", "크라프트", "투명 PET", "유포지", "은박", "금박", "형광지",
];

const PRODUCT_SEED = [
  ["AT-1680-080", "아트지", "아트지 무광 80g 1680mm", 420],
  ["AT-1080-080", "아트지", "아트지 무광 80g 1080mm", 280],
  ["AT-1680-100", "아트지", "아트지 유광 100g 1680mm", 560],
  ["AT-1080-100", "아트지", "아트지 유광 100g 1080mm", 370],
  ["AT-0800-080", "아트지", "아트지 무광 80g 800mm", 210],
  ["MO-1680-070", "모조지", "모조지 백색 70g 1680mm", 320],
  ["MO-1080-070", "모조지", "모조지 백색 70g 1080mm", 220],
  ["MO-1680-100", "모조지", "모조지 백색 100g 1680mm", 450],
  ["MO-0600-070", "모조지", "모조지 백색 70g 600mm", 130],
  ["KR-1680-090", "크라프트", "크라프트 내추럴 90g 1680mm", 380],
  ["KR-1080-090", "크라프트", "크라프트 내추럴 90g 1080mm", 260],
];

export const seedProducts = () =>
  PRODUCT_SEED.map(([code, category, name, price], i) => ({
    id: `p${i + 1}`,
    code, category, name, price,
    manufacturer: "한솔제지",
    updatedAt: new Date(),
  }));

export const seedAliases = () => ({});
