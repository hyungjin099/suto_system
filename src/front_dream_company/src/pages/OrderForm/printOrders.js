/* 주문 내역 인쇄 (표 형태)
 * - 화면과 분리된 보이지 않는 iframe에 인쇄용 HTML을 만들어 그 iframe만 인쇄한다.
 *   (현재 페이지에 인쇄 전용 스타일을 덮어씌우는 방식보다 다른 화면 요소가 섞일 여지가 없다)
 * - A4 가로, 주문 1건 = 품목 수만큼의 행(주문번호/일시는 rowspan)
 */

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const num = (v) => (v === null || v === undefined || v === "" ? "-" : Number(v).toLocaleString("ko-KR"));

const pad = (n) => String(n).padStart(2, "0");
const fmtDateTime = (d) =>
  d
    ? `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    : "-";

export function buildPrintHtml({ clientName, periodLabel, orders }) {
  const totalItems = orders.reduce((s, o) => s + o.items.length, 0);
  const totalRolls = orders.reduce(
    (s, o) => s + o.items.reduce((t, it) => t + (Number(it.rolls) || 0), 0),
    0
  );

  const rows = orders
    .map((o) => {
      const items = o.items.length ? o.items : [null];
      return items
        .map((it, i) => {
          const head =
            i === 0
              ? `<td class="c mono" rowspan="${items.length}">${esc(o.orderId)}</td>
                 <td class="c" rowspan="${items.length}">${esc(fmtDateTime(o.orderDate))}</td>`
              : "";
          if (!it) return `<tr>${head}<td colspan="6" class="c muted">품목 없음</td></tr>`;
          return `<tr>${head}
            <td>${esc(it.productLabel || it.product)}</td>
            <td class="r">${num(it.width)}</td>
            <td class="r">${num(it.length)}</td>
            <td class="r">${num(it.rolls)}</td>
            <td>${esc(it.destination)}</td>
            <td class="note">${esc(it.note)}</td>
          </tr>`;
        })
        .join("");
    })
    .join("");

  // 용지 여백(@page margin)을 0으로 두면 브라우저가 찍는 머리글/바닥글(날짜·제목·URL)이 들어갈 자리가 없어 나오지 않는다.
  // 대신 여백을 직접 만든다: 좌우는 body 패딩, 위아래는 쪽마다 반복되는 thead/tfoot의 빈 행.
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><title>주문 내역</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0 12mm; font-family: "Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif; color: #111; font-size: 11px; }
  h1 { margin: 0 0 6px; font-size: 18px; }
  .meta { margin-bottom: 8px; font-size: 11.5px; color: #333; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th, td { border: 1px solid #555; padding: 4px 6px; vertical-align: middle; word-break: break-word; }
  th { background: #eee; font-size: 11px; }
  thead { display: table-header-group; }          /* 여러 쪽일 때 머리글 반복 */
  tfoot { display: table-footer-group; }
  tr { page-break-inside: avoid; }
  .sp td { border: 0; padding: 0; height: 12mm; }   /* 쪽마다 위/아래 여백 */
  .titleRow td { border: 0; padding: 0 0 2px; }
  .c { text-align: center; } .r { text-align: right; } .mono { font-family: Consolas,monospace; }
  .note { white-space: pre-wrap; } .muted { color: #777; }
  .total { margin: 8px 0 12mm; text-align: right; font-weight: 700; font-size: 12px; }
</style></head><body>
  <table>
    <colgroup>
      <col style="width:11%"><col style="width:11%"><col style="width:20%">
      <col style="width:6%"><col style="width:6%"><col style="width:5%">
      <col style="width:17%"><col style="width:24%">
    </colgroup>
    <thead>
      <tr class="sp"><td colspan="8"></td></tr>
      <tr class="titleRow"><td colspan="8">
        <h1>주문 내역</h1>
        <div class="meta">${clientName ? `거래처: <b>${esc(clientName)}</b> &nbsp;|&nbsp; ` : ""}조회 기간: <b>${esc(periodLabel)}</b></div>
      </td></tr>
      <tr>
        <th>주문번호</th><th>주문일시</th><th>제품명</th>
        <th>폭(mm)</th><th>길이(m)</th><th>롤수</th><th>납품처</th><th>비고</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="8" class="c muted">해당 기간에 주문 내역이 없습니다.</td></tr>'}</tbody>
    <tfoot><tr class="sp"><td colspan="8"></td></tr></tfoot>
  </table>
  <div class="total">총 ${orders.length}건 (품목 ${totalItems}개) · ${totalRolls.toLocaleString("ko-KR")}롤</div>
</body></html>`;
}

/** 숨은 iframe에 인쇄용 문서를 만들어 인쇄 대화상자를 연다 */
export function printOrders(data) {
  const html = buildPrintHtml(data);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const cleanup = () => setTimeout(() => iframe.remove(), 1000);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  // 문서가 그려진 뒤에 인쇄해야 빈 페이지가 나오지 않는다
  const run = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.addEventListener("afterprint", cleanup);
      iframe.contentWindow.print();
    } catch (_) {
      cleanup();
    }
  };
  if (iframe.contentWindow.document.readyState === "complete") setTimeout(run, 50);
  else iframe.onload = () => setTimeout(run, 50);
}

/** 터치가 주 입력인 기기(폰·태블릿) 또는 모바일 UA면 인쇄를 막는다 */
export function isTouchDevice() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua)) return true;
  return window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
}
