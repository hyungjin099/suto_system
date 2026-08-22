/* 엑셀 다운로드 헬퍼 (SheetJS 사용)
 * - 관리자 화면들에서 재사용
 * - rows: [{ 한글컬럼명: 값, ... }, ...] 형태의 배열
 * - filename: 확장자 없이 넘김 (자동으로 .xlsx 붙음)
 */

import * as XLSX from "xlsx";

export function downloadXlsx(rows, filename, sheetName = "Sheet1") {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/** 파일명용 오늘 날짜 YYYYMMDD */
export function todayYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}
