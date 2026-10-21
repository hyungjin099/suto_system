/***************************************************************
 * 재단취합 — "오늘_" 시트 기반 (v6)
 *
 * v5 → v6 변경:
 *  - 상세 리스트에 "납품처" 열 추가 (I열, 9컬럼)
 *
 * [일자 탭 컬럼 — "오늘_" 시트 포함]
 *   A: No  B: 주문번호  C: 발주일  D: 제품코드  E: 제품명  F: 작업내용
 *   G: 폭  H: 길이  I: 롤수  J: 발주처  K: 납품처
 *   L: 출고  M: 비고  N: 납품예정일
 *   O: 확인1  P: 확인2  Q: 확인3  R: 행ID (itemNum)
 ***************************************************************/

const RC = {
  CUT_SHEET: '재단취합',
  REGION_SHEET: '지역코드',
  TODAY_PREFIX: '오늘_',
  SELECT_CELL: 'B2'
};

const CUT_KEYWORD = '짜는중';

const SYSTEM_SHEETS = ['양식', '공휴일', '재단취합', '지역코드'];

// ===========================================
// 공통 헬퍼
// ===========================================
function txt_(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}
function productKey_(v) {
  return txt_(v).replace(/\s+/g, '').toLowerCase();
}
function companyKey_(v) {
  return txt_(v)
    .replace(/\(주\)/g, '').replace(/㈜/g, '').replace(/주식회사/g, '')
    .replace(/\s+/g, '').replace(/[.,]/g, '').toLowerCase();
}
function simpleCompany_(v) {
  return companyKey_(v)
    .replace(/인쇄사$/g, '인쇄').replace(/산업사$/g, '산업').replace(/기획사$/g, '기획');
}
function isCutting_(v) {
  return txt_(v).replace(/\s+/g, '').indexOf(CUT_KEYWORD) !== -1;
}
function numberQty_(v) {
  const s = txt_(v).replace(/,/g, '');
  const m = s.match(/\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : 0;
}

// ===========================================
// 시트 접근
// ===========================================
function getCutSheet_() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(RC.CUT_SHEET);
  if (!sheet) throw new Error('"재단취합" 시트가 없습니다.');
  return sheet;
}

/** "오늘_" 접두어 시트 찾기 */
function getTodaySheet_() {
  const ss = SpreadsheetApp.getActive();
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().indexOf(RC.TODAY_PREFIX) === 0) return sheets[i];
  }
  throw new Error(
    '"오늘_" 접두어가 붙은 시트를 찾지 못했습니다.\n' +
    '주문관리 메뉴에서 "오늘 탭 만들기"를 먼저 실행해주세요.'
  );
}

// ===========================================
// 원본 읽기 (오늘_ 시트) — 병합 셀 forward-fill + 가상 itemNum 할당
// ===========================================
function readTodaySource_() {
  const source = getTodaySheet_();
  const lastRow = source.getLastRow();
  if (lastRow < 4) return { sheet: source, rows: [] };

  const values = source.getRange(4, 1, lastRow - 3, 18).getDisplayValues();

  // ───── Pass 1: 각 부모의 childMax 수집 (멱등성 보장) ─────
  //   R열 = "1234" → 부모, "1234-N" → 하이픈 자식
  //   childMaxByParent["1234"] = 이미 할당된 자식 번호의 최대값
  const childMaxByParent = {};
  for (let i = 0; i < values.length; i++) {
    const r = txt_(values[i][17]);
    if (!r) continue;
    const dashIdx = r.indexOf('-');
    if (dashIdx === -1) {
      if (childMaxByParent[r] === undefined) childMaxByParent[r] = 0;
    } else {
      const parent = r.substring(0, dashIdx);
      const n = parseInt(r.substring(dashIdx + 1), 10);
      if (!isNaN(n)) {
        childMaxByParent[parent] = Math.max(childMaxByParent[parent] || 0, n);
      }
    }
  }

  // ───── Pass 2: 빈 R에 가상 itemNum 할당 + rows 생성 ─────
  const rows = [];
  const pendingWrites = [];   // {row, value} — source에 쓸 가상 itemNum
  let currentParent = '';     // 가장 최근 부모 R값 (순수 숫자형)
  let ffNo = '', ffOrderId = '', ffOrderDate = '',
      ffProductCode = '', ffProductName = '',
      ffCompany = '', ffDest = '';

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    const sheetRow = 4 + i;

    const work    = txt_(v[5]);
    const width   = txt_(v[6]);
    const length  = txt_(v[7]);
    const qty     = txt_(v[8]);
    let   itemNum = txt_(v[17]);

    // forward-fill (F 필터 전에)
    if (txt_(v[0]))  ffNo          = txt_(v[0]);
    if (txt_(v[1]))  ffOrderId     = txt_(v[1]);
    if (txt_(v[2]))  ffOrderDate   = txt_(v[2]);
    if (txt_(v[3]))  ffProductCode = txt_(v[3]);
    if (txt_(v[4]))  ffProductName = txt_(v[4]);
    if (txt_(v[9]))  ffCompany     = txt_(v[9]);
    if (txt_(v[10])) ffDest        = txt_(v[10]);

    // 완전 빈 행 skip
    if (!work && !width && !length && !qty && !itemNum) continue;
    if (ffProductCode === '제품코드' || ffProductName === '제품명') continue;

    // ★ 부모/자식 트래킹 + 가상 itemNum 할당
    if (itemNum) {
      const dashIdx = itemNum.indexOf('-');
      if (dashIdx === -1) currentParent = itemNum;  // 순수 부모 (숫자)
      // 하이픈 자식(1234-N)은 currentParent 유지
    } else if (currentParent) {
      // 빈 R + 실제 데이터 있음 + 부모 알고 있음 → 분할 자식
      childMaxByParent[currentParent] = (childMaxByParent[currentParent] || 0) + 1;
      itemNum = currentParent + '-' + childMaxByParent[currentParent];
      pendingWrites.push({ row: sheetRow, value: itemNum });
    }
    // currentParent 없으면 (최상단 고아 자식) itemNum=빈값 유지 → applyWorkChanges에서 skip

    rows.push({
      sourceRow:   sheetRow,
      no:          ffNo,
      orderId:     ffOrderId,
      productCode: ffProductCode,
      productName: ffProductName,
      work:        work,
      width:       width,
      length:      length,
      qty:         qty,
      company:     ffCompany,
      destination: ffDest,
      itemNum:     itemNum
    });
  }

  // 가상 itemNum을 '오늘_' 시트 R열에 persist
  pendingWrites.forEach(function(p) {
    source.getRange(p.row, 18).setValue(p.value);
  });

  return { sheet: source, rows: rows };
}

// ===========================================
// 제품코드 목록
// ===========================================
function getAllProductCodes_(rows) {
  const seen = {};
  const codes = [];
  for (let i = 0; i < rows.length; i++) {
    const code = txt_(rows[i].productCode);
    if (!code) continue;
    const key = productKey_(code);
    if (seen[key]) continue;
    seen[key] = true;
    codes.push(code);
  }
  codes.sort(function(a, b) {
    return a.localeCompare(b, 'ko', { numeric: true, sensitivity: 'base' });
  });
  return codes;
}

function makeProductDropdown_() {
  const cut = getCutSheet_();
  let data;
  try { data = readTodaySource_(); }
  catch (err) {
    const cell = cut.getRange(RC.SELECT_CELL);
    cell.clearDataValidations();
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['짜는중'], true).setAllowInvalid(false).build();
    cell.setDataValidation(rule);
    cell.setValue('짜는중');
    return;
  }

  let codes = getAllProductCodes_(data.rows)
    .filter(function(v) { return v !== '' && v !== '짜는중'; });
  const list = ['짜는중'].concat(codes);
  const cell = cut.getRange(RC.SELECT_CELL);
  cell.clearDataValidations();
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(list, true).setAllowInvalid(false).build();
  cell.setDataValidation(rule);
  const current = txt_(cell.getValue());
  if (current === '' || list.indexOf(current) === -1) cell.setValue('짜는중');
  cut.getRange('J1').setValue(data.sheet.getName());
  SpreadsheetApp.flush();
}

// ===========================================
// 지역코드
// ===========================================
function readRegions_() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(RC.REGION_SHEET);
  if (!sheet) return { list: [], exact: {} };
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { list: [], exact: {} };
  const values = sheet.getRange(2, 1, lastRow - 1, 2).getDisplayValues();
  const list = [];
  const exact = {};
  for (let i = 0; i < values.length; i++) {
    const region = txt_(values[i][0]);
    const company = txt_(values[i][1]);
    if (!region || !company) continue;
    const key = companyKey_(company);
    const item = { region: region, company: company, key: key };
    list.push(item);
    if (!exact[key]) exact[key] = item;
  }
  return { list: list, exact: exact };
}

function findCompany_(company, master) {
  const key = companyKey_(company);
  if (!key) return null;
  if (master.exact[key]) return master.exact[key];
  const simple = simpleCompany_(company);
  const simpleMatches = [];
  for (let i = 0; i < master.list.length; i++) {
    if (simpleCompany_(master.list[i].company) === simple) simpleMatches.push(master.list[i]);
  }
  if (simpleMatches.length === 1) return simpleMatches[0];
  const partial = [];
  if (key.length >= 2) {
    for (let i = 0; i < master.list.length; i++) {
      const item = master.list[i];
      if (item.key.indexOf(key) !== -1 || key.indexOf(item.key) !== -1) partial.push(item);
    }
  }
  if (partial.length === 1) return partial[0];
  return null;
}

function getRegion_(rawCompany, master) {
  const raw = txt_(rawCompany);
  if (!raw) return '미분류';
  let parts = raw.split(/\s*(?:->|>)\s*/);
  if (parts.length > 1) {
    const found = findCompany_(txt_(parts[parts.length - 1]), master);
    if (found) return found.region;
  }
  parts = raw.split(/\s*-\s*/);
  if (parts.length > 1) {
    const found = findCompany_(txt_(parts[parts.length - 1]), master);
    if (found) return found.region;
  }
  let found = findCompany_(raw, master);
  if (found) return found.region;
  const words = raw.split(/\s+/).filter(Boolean);
  for (let start = 1; start < words.length; start++) {
    const candidate = words.slice(start).join(' ');
    found = findCompany_(candidate, master);
    if (found) return found.region;
  }
  return '미분류';
}

function regionColor_(region) {
  const r = txt_(region).toUpperCase();
  if (r === 'A' || r === 'B' || r === 'C') return '#E8F0FE';
  return '#FFFFFF';
}

// ===========================================
// 메인 렌더
// ===========================================
function drawCutSheet_() {
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(15000)) {
    SpreadsheetApp.getActive().toast('다른 작업 처리 중. 잠시 후 재시도.', '재단취합', 5);
    return;
  }
  try { _drawCutSheetImpl(); } finally { lock.releaseLock(); }
}

function _drawCutSheetImpl() {
  const cut = getCutSheet_();
  let data;
  try { data = readTodaySource_(); }
  catch (err) {
    const clearRows = Math.max(cut.getLastRow(), 50);
    cut.getRange(4, 1, clearRows - 3, 9).clearContent().setBackground('#FFFFFF');
    cut.getRange(4, 1).setValue(err.message);
    return;
  }

  const selected = txt_(cut.getRange(RC.SELECT_CELL).getValue());
  if (!selected) return;

  let details = data.rows.filter(function(row) {
    const workEmpty = txt_(row.work) === '';
    return (isCutting_(row.work) || workEmpty) &&
           row.productCode !== '' &&
           (row.width !== '' || row.qty !== '');
  });

  if (selected !== '짜는중') {
    const key = productKey_(selected);
    details = details.filter(function(row) { return productKey_(row.productCode) === key; });
  }

  const regionMaster = readRegions_();
  for (let i = 0; i < details.length; i++) {
    details[i].region = getRegion_(details[i].company, regionMaster);
  }

  const clearRows = Math.max(cut.getLastRow(), 300);
  cut.getRange(4, 1, clearRows - 3, 9).clearContent().clearFormat().setBackground('#FFFFFF');

  // 상단 요약 헤더 (4열 그대로)
  cut.getRange(4, 1, 1, 4)
    .setValues([['폭', '길이', '총 롤수', '주문 상세']])
    .setFontWeight('bold').setHorizontalAlignment('center').setBackground('#FFF2CC');

  const summary = {};
  const order = [];
  for (let i = 0; i < details.length; i++) {
    const row = details[i];
    const key = txt_(row.width) + '|' + txt_(row.length);
    if (!summary[key]) {
      summary[key] = { width: row.width, length: row.length, qty: 0, orders: [] };
      order.push(key);
    }
    const q = numberQty_(row.qty);
    summary[key].qty += q;
    let no = txt_(row.no);
    if (no && !no.endsWith('번')) no += '번';
    // ★ destination 사용 (업체 → 납품처)
    summary[key].orders.push((no + ' ' + row.destination + ' ' + q + '롤').trim());
  }

  const summaryValues = [];
  for (let i = 0; i < order.length; i++) {
    const item = summary[order[i]];
    summaryValues.push([item.width, item.length, item.qty, item.orders.join(' / ')]);
  }

  const needRows = 30 + summaryValues.length + details.length;
  if (cut.getMaxRows() < needRows) cut.insertRowsAfter(cut.getMaxRows(), needRows - cut.getMaxRows());

  if (summaryValues.length > 0) {
    cut.getRange(5, 1, summaryValues.length, 4)
       .setValues(summaryValues).setBackground('#FFFFFF')
       .setWrap(true).setVerticalAlignment('middle');
  }

  const summaryEnd = summaryValues.length ? 4 + summaryValues.length : 4;
  const detailHeader = summaryEnd + 3;
  const detailStart = detailHeader + 1;

  // ★ 상세 헤더 — "납품처" 추가 (8열 → 9열)
  cut.getRange(detailHeader, 1, 1, 9)
    .setValues([['지역', '번호', '제품', '현재 작업내용', '폭', '길이', '주문 롤수', '업체', '납품처']])
    .setFontWeight('bold').setHorizontalAlignment('center').setBackground('#FFF2CC');

  if (details.length > 0) {
    const values = [];
    const colors = [];
    const sourceInfo = [];
    for (let i = 0; i < details.length; i++) {
      const row = details[i];
      let no = txt_(row.no);
      if (no && !no.endsWith('번')) no += '번';
      // ★ 9열: 지역, 번호, 제품, 작업내용, 폭, 길이, 롤수, 업체, 납품처
      values.push([row.region, no, row.productCode, row.work,
                   row.width, row.length, row.qty, row.company, row.destination]);
      const color = regionColor_(row.region);
      colors.push([color,color,color,color,color,color,color,color,color]);
      // 숨긴 열(J/K/L = 10/11/12): itemNum, sourceRow, F스냅샷
      sourceInfo.push([row.itemNum, row.sourceRow, row.work]);
    }
    cut.getRange(detailStart, 1, values.length, 9)
       .setValues(values).setBackgrounds(colors)
       .setWrap(true).setVerticalAlignment('middle');
    cut.getRange(detailStart, 10, sourceInfo.length, 3).setValues(sourceInfo);
  }

  cut.getRange('L1').setValue(detailStart);
  cut.getRange('J1').setValue(data.sheet.getName());

  if (details.length === 0) {
    cut.getRange(detailStart, 1).setValue(
      selected === '짜는중'
        ? '현재 "짜는 중"이 포함된 주문이 없습니다.'
        : '해당 제품코드의 "짜는 중" 주문이 없습니다.'
    );
  }

  var endRow = Math.max(detailStart + Math.max(details.length, 1) - 1, 5);
  cut.getRange(4, 1, endRow - 3, 9)
     .setFontSize(16)
     .setBorder(true, true, true, true, true, true);

  try { cut.hideColumns(10, 3); } catch (err) {}
  SpreadsheetApp.flush();
}

// ===========================================
// 메뉴 핸들러
// ===========================================
function refreshProductList() {
  makeProductDropdown_();
  drawCutSheet_();
  SpreadsheetApp.getActive().toast('제품목록을 새로 불러왔습니다.', '재단취합', 3);
}
function refreshCutSheet() {
  makeProductDropdown_();
  drawCutSheet_();
}
function setupCutSheet() {
  const cut = getCutSheet_();
  try { cut.getRange(1, 1, Math.min(cut.getMaxRows(), 2000), 9).breakApart(); } catch (err) {}
  cut.getRange(1, 1, cut.getMaxRows(), 9).clearContent().clearFormat();
  cut.getRange('A1:I1').merge().setValue('✂ 재단 취합')
     .setFontSize(18).setFontWeight('bold').setHorizontalAlignment('center');
  cut.getRange('A2').setValue('제품코드 선택').setFontWeight('bold');
  cut.getRange('B2').setFontSize(14).setFontWeight('bold');
  cut.getRange('D2:I2').merge()
     .setValue('"짜는중" = 전체 미재단 / 제품코드 선택 = 해당 제품  |  작업내용 수정 후 "💾 변경사항 원본에 반영" 클릭');
  cut.setColumnWidth(1, 80);   // A 지역
  cut.setColumnWidth(2, 100);  // B 번호
  cut.setColumnWidth(3, 200);  // C 제품
  cut.setColumnWidth(4, 300);  // D 작업내용
  cut.setColumnWidth(5, 90);   // E 폭
  cut.setColumnWidth(6, 90);   // F 길이
  cut.setColumnWidth(7, 110);  // G 롤수
  cut.setColumnWidth(8, 190);  // H 업체
  cut.setColumnWidth(9, 150);  // I 납품처 (신규)
  cut.setFrozenRows(2);
  makeProductDropdown_();
  drawCutSheet_();
}

function handleCutSheetEdit_(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== RC.CUT_SHEET) return;
  if (e.range.getA1Notation() === RC.SELECT_CELL) {
    drawCutSheet_();
    return;
  }
}

// ===========================================
// 변경사항 일괄 반영
// ===========================================
function applyWorkChanges() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActive();
  const cut = getCutSheet_();

  const detailStart = Number(cut.getRange('L1').getValue());
  if (!detailStart) {
    ui.alert('재단취합이 아직 로드되지 않았습니다.\n먼저 "현재 취합 새로고침"을 실행해주세요.');
    return;
  }
  const lastRow = cut.getLastRow();
  if (lastRow < detailStart) {
    ss.toast('반영할 데이터가 없습니다.', '재단취합', 3);
    return;
  }

  const detailRows = lastRow - detailStart + 1;
  const workValues = cut.getRange(detailStart, 4, detailRows, 1).getDisplayValues();
  const itemNums   = cut.getRange(detailStart, 10, detailRows, 1).getDisplayValues();
  const snapshots  = cut.getRange(detailStart, 12, detailRows, 1).getDisplayValues();

  const changes = [];
  for (let i = 0; i < workValues.length; i++) {
    const itemNum = txt_(itemNums[i][0]);
    const newWork = txt_(workValues[i][0]);
    const oldWork = txt_(snapshots[i][0]);
    if (!itemNum) continue;
    if (!newWork) continue;
    if (newWork === oldWork) continue;
    changes.push({ itemNum: itemNum, cutRow: detailStart + i, oldWork: oldWork, newWork: newWork });
  }

  if (changes.length === 0) {
    ss.toast('변경된 작업내용이 없습니다.', '재단취합', 3);
    return;
  }

  let msg = '내용을 반영하면 "짜는중"에서 벗어난 주문은\n';
  msg += '재단취합 시트에서 사라집니다.\n\n오탈자 등 내용을 한번 더 확인하세요.\n';
  msg += '─────────────────────────────\n';
  msg += '변경 ' + changes.length + '건:\n\n반영할까요?';

  const result = ui.alert('재단취합 — 변경사항 반영', msg, ui.ButtonSet.YES_NO);
  if (result !== ui.Button.YES) {
    ss.toast('취소되었습니다.', '재단취합', 3);
    return;
  }

  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(15000)) {
    ui.alert('다른 작업 처리 중. 잠시 후 재시도.');
    return;
  }
  try { _applyWorkChangesImpl(changes); } finally { lock.releaseLock(); }
}

function _applyWorkChangesImpl(changes) {
  const ss = SpreadsheetApp.getActive();

  // "오늘_" 시트 1개만 스캔 (성능)
  let todaySheet;
  try { todaySheet = getTodaySheet_(); }
  catch (err) {
    ss.toast('"오늘_" 시트를 찾지 못했습니다.', '재단취합', 5);
    return;
  }

  // R(18)=행ID로 매핑 — 비병합 열
  const itemToRow = {};
  const last = todaySheet.getLastRow();
  if (last >= 2) {
    const qCol = todaySheet.getRange(2, 18, last - 1, 1).getValues();
    for (let i = 0; i < qCol.length; i++) {
      const inum = String(qCol[i][0]);
      if (inum && inum !== '') itemToRow[inum] = i + 2;
    }
  }

  let appliedCount = 0;
  const notFound = [];
  for (let i = 0; i < changes.length; i++) {
    const c = changes[i];
    const row = itemToRow[c.itemNum];
    if (!row) { notFound.push(c.itemNum); continue; }

    const cell = todaySheet.getRange(row, 6);  // F열 (비병합)
    cell.setValue(c.newWork);
    cell.setFontSize(16);
    cell.setFontColor('#000');
    appliedCount++;
  }

  SpreadsheetApp.flush();
  _drawCutSheetImpl();

  let toastMsg = appliedCount + '건 반영 완료';
  if (notFound.length > 0) {
    toastMsg += ' / 오늘 시트에 없음 ' + notFound.length + '건';
    Logger.log('applyWorkChanges — 못찾은 itemNum: ' + notFound.join(', '));
  }
  ss.toast(toastMsg, '재단취합', 5);
}

// ===========================================
// 메뉴 등록
// ===========================================
function addCutSheetMenu_() {
  SpreadsheetApp.getUi()
    .createMenu('✂ 재단취합')
    .addItem('현재 취합 새로고침', 'refreshCutSheet')
    .addItem('제품목록 새로고침', 'refreshProductList')
    .addSeparator()
    .addItem('💾 변경사항 원본에 반영', 'applyWorkChanges')
    .addSeparator()
    .addItem('취합 화면 초기화', 'setupCutSheet')
    .addToUi();
}
