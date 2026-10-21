//=====================================
// 설정값
//=====================================
const CONFIG = {
  TEMPLATE_SHEET_NAME : '양식',
  HOLIDAY_SHEET_NAME : '공휴일',
  TIMEZONE : 'Asia/Seoul',
  MAX_DATA_ROWS : 1000,
  PARENT_FOLDER_ID : '1pH806EUn2jwIrNKsqgecUShWpws4Yse8',
  HOLIDAY_API : {
    BASE_URL : 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo',
    // 인증키는 코드에 두지 않고 스크립트 속성(HOLIDAY_SERVICE_KEY)에 저장.
    // 메뉴: 주문관리 → 🔑 공공데이터 인증키 설정
    SERVICE_KEY_PROP : 'HOLIDAY_SERVICE_KEY',
    KEY_EXPIRY : '2027-11-05'
  }
};

/** 스크립트 속성에서 공공데이터 인증키를 읽는다. 없으면 예외. */
function getServiceKey_() {
  const key = PropertiesService.getScriptProperties().getProperty(CONFIG.HOLIDAY_API.SERVICE_KEY_PROP);
  if (!key) throw new Error('공공데이터 인증키가 설정되지 않았습니다. 메뉴 [주문관리 → 🔑 공공데이터 인증키 설정]을 실행하세요.');
  return key;
}

/** 메뉴용: 인증키를 입력받아 스크립트 속성에 저장 */
function setServiceKey() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt('공공데이터 인증키 설정',
    '공공데이터포털에서 발급받은 일반 인증키(Encoding 아님, Decoding 키)를 입력하세요.\n' +
    '스크립트 속성에 저장되며 코드/깃에는 남지 않습니다.',
    ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  const key = res.getResponseText().trim();
  if (!key) { ui.alert('빈 값은 저장할 수 없습니다.'); return; }
  PropertiesService.getScriptProperties().setProperty(CONFIG.HOLIDAY_API.SERVICE_KEY_PROP, key);
  ui.alert('인증키 저장 완료');
}

const WORK_STATUS_TEXT = '짜는 중';
const DATA_FONT_SIZE = 16;
const PM_BG_COLOR = '#e3f2fd';   // 14~18시 배경 (더 진한 파랑)

const CUT_SHEET_NAME = '재단취합';
const REGION_SHEET_NAME = '지역코드';
const TODAY_PREFIX = '오늘_';
const NEW_SHEET_POSITION = 3;

/**
 * 일자 탭 컬럼 레이아웃:
 *  A: No (ARRAYFORMULA)
 *  B: 주문번호  C: 발주일  D: 제품코드  E: 제품명  F: 작업내용
 *  G: 폭  H: 길이  I: 롤수  J: 발주처  K: 납품처
 *  L: 출고  M: 비고  N: 납품예정일
 *  O: 확인1  P: 확인2  Q: 확인3  R: 행ID(itemNum, 숨김)
 *
 * F열 Bold/빨강 서식은 코드에서 손 떼고 시트의 조건부 서식으로 처리.
 *
 * 공휴일 시트 레이아웃 (3행부터 데이터):
 *  B: 날짜(yyyy-MM-dd)  C: 이름  D: 갱신시각
 *  - D가 비어 있으면 "수동 입력(임시공휴일 등)"으로 보고 자동 갱신이 지우지 않는다.
 *  - D가 채워진 행은 API가 관리하는 행이다.
 */

function _txt(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

const KOR_DOW = ['일','월','화','수','목','금','토'];

function _formatSheetName(date, withPrefix) {
  var s = Utilities.formatDate(date, CONFIG.TIMEZONE, 'MM-dd') + '(' + KOR_DOW[date.getDay()] + ')';
  return withPrefix ? TODAY_PREFIX + s : s;
}

function findTodaySheet_() {
  var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().indexOf(TODAY_PREFIX) === 0) return sheets[i];
  }
  return null;
}

// ===========================================
// 공통 헬퍼 — 체크박스 삽입 (TRUE 값 보존)
// ===========================================
function _applyCheckboxesPreservingTrue_(range) {
  var oldValues = range.getValues();
  range.insertCheckboxes();
  var preserved = oldValues.map(function(row) {
    return row.map(function(v) {
      return (v === true || String(v).toUpperCase() === 'TRUE');
    });
  });
  range.setValues(preserved);
}

// ===========================================
// 메뉴
// ===========================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('주문관리')
    .addItem('오늘 탭 만들기', 'manualCreateTodayTab')
    .addItem('공휴일 갱신', 'manualRefreshHolidays')
    .addItem('🔑 공공데이터 인증키 설정', 'setServiceKey')
    .addSeparator()
    .addItem('🚨 초기 설정: 트리거 등록', 'installTriggers')
    .addItem('🗑️ 모든 트리거 삭제', 'deleteAllTriggers')
    .addSeparator()
    .addItem('다음 기간 파일 수동 생성', 'manualCreateNextPeriod')
    .addSeparator()
    .addItem('🔧 체크박스 복구 (오늘 시트)', 'fixTodayCheckboxes')
    .addItem('🔧 체크박스 복구 (모든 일자 시트)', 'fixAllDailyCheckboxes')
    .addToUi();
  addCutSheetMenu_();
}

// ===========================================
// 트리거
// ===========================================
function installTriggers() {
  const existing = ScriptApp.getProjectTriggers();
  existing.forEach(function(t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('createTodayTab').timeBased().everyDays(1).atHour(0).create();
  // 공휴일 갱신은 23시: 00시 탭 생성 시점에 최신 공휴일이 반영되어 있도록 순서 보장
  ScriptApp.newTrigger('refreshHolidays').timeBased().everyDays(1).atHour(23).create();
  ScriptApp.newTrigger('checkApiKeyExpiry').timeBased().everyDays(1).atHour(9).create();
  ScriptApp.newTrigger('copyUnfinishedFromYesterday').timeBased().everyDays(1).atHour(1).create();
  ScriptApp.newTrigger('createNextPeriodSpreadsheet').timeBased().onMonthDay(1).atHour(2).create();
  SpreadsheetApp.getUi().alert('트리거 등록 완료');
}

function deleteAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) { ScriptApp.deleteTrigger(t); });
  SpreadsheetApp.getUi().alert('트리거 ' + triggers.length + '개 삭제 완료');
}

function manualCreateNextPeriod() {
  createNextPeriodSpreadsheet(true);
  SpreadsheetApp.getActiveSpreadsheet().toast('다음 기간 파일 생성 시도 완료', '완료', 5);
}

// ===========================================
// 시간대/납품일/배경색
// ===========================================
function getOrderShift(d) { return d.getHours() < 13 ? 'AM' : 'PM'; }

/** 14~18시 접수 데이터만 연한 파란 배경 */
function getRowColorByHour(date) {
  var h = date.getHours();
  if (h < 14 || h >= 18) return null;
  return PM_BG_COLOR;
}

function calculateDeliveryDate(orderDate) {
  var steps = getOrderShift(orderDate) === 'AM' ? 1 : 2;
  var d = new Date(orderDate.getTime());
  for (var i = 0; i < steps; i++) {
    d.setDate(d.getDate() + 1);
    while (isHoliday(d)) d.setDate(d.getDate() + 1);
  }
  return Utilities.formatDate(d, CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

// ===========================================
// 기간
// ===========================================
function getCurrentPeriod() {
  const name = SpreadsheetApp.getActiveSpreadsheet().getName();
  if (name.indexOf('상반기') !== -1) return 'H1';
  if (name.indexOf('하반기') !== -1) return 'H2';
  return null;
}
function isMonthInCurrentPeriod(month) {
  const p = getCurrentPeriod();
  if (p === 'H1') return month >= 1 && month <= 6;
  if (p === 'H2') return month >= 7 && month <= 12;
  return true;
}
function getFileNameForPeriod(year, p) {
  if (p === 'H1') return year + ' 상반기 주문 데이터';
  if (p === 'H2') return year + ' 하반기 주문 데이터';
  throw new Error('알 수 없는 기간');
}

function getNextBusinessDay() {
  var d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

// ===========================================
// 공휴일
// ===========================================
let _holidayCache = null;
function getHolidaySet() {
  if (_holidayCache !== null) return _holidayCache;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.HOLIDAY_SHEET_NAME);
  if (!sheet) { _holidayCache = new Set(); return _holidayCache; }
  const lastRow = sheet.getLastRow();
  if (lastRow < 3) { _holidayCache = new Set(); return _holidayCache; }
  const dateValues = sheet.getRange(3, 2, lastRow - 2, 1).getValues();
  const dateSet = new Set();
  dateValues.forEach(function(row) {
    const val = row[0];
    if (val instanceof Date) dateSet.add(Utilities.formatDate(val, CONFIG.TIMEZONE, 'yyyy-MM-dd'));
    else if (typeof val === 'string' && val) dateSet.add(val.trim());
  });
  _holidayCache = dateSet;
  return _holidayCache;
}
function isHoliday(date) {
  const day = date.getDay();
  if (day === 0 || day === 6) return true;
  return getHolidaySet().has(Utilities.formatDate(date, CONFIG.TIMEZONE, 'yyyy-MM-dd'));
}

// ===========================================
// 탭 생성 (보호 적용 안 함)
// ===========================================
function createTodayTab() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const today = new Date();
  const month = today.getMonth() + 1;

  if (!isMonthInCurrentPeriod(month)) {
    Logger.log('담당 기간 아님 (' + month + '월). 생성 생략');
    return null;
  }
  if (isHoliday(today)) {
    Logger.log('오늘은 비영업일. 시트 생성 생략');
    return null;
  }

  const newName = _formatSheetName(today, true);

  const existing = ss.getSheetByName(newName);
  if (existing) {
    ss.setActiveSheet(existing);
    ss.moveActiveSheet(NEW_SHEET_POSITION);
    return existing;
  }

  ss.getSheets().forEach(function(sh) {
    var n = sh.getName();
    if (n !== newName && n.indexOf(TODAY_PREFIX) === 0) {
      sh.setName(n.substring(TODAY_PREFIX.length));
    }
  });

  const template = ss.getSheetByName(CONFIG.TEMPLATE_SHEET_NAME);
  if (!template) throw new Error('양식 시트 없음');
  const newSheet = template.copyTo(ss);
  newSheet.setName(newName);
  ss.setActiveSheet(newSheet);
  ss.moveActiveSheet(NEW_SHEET_POSITION);
  Logger.log('오늘 시트 생성: ' + newName);
  return newSheet;
}

// ===========================================
// 공휴일 API
// ===========================================

/**
 * 해당 연도의 공휴일을 API에서 조회.
 * 반환: 성공 → [{date, name}] (공휴일이 없으면 빈 배열), 실패 → null
 * (실패와 "공휴일 없음"을 구분해야, 실패한 해의 기존 데이터를 보존할 수 있다)
 */
function getHolidayFromAPI(year) {
  const holidays = [];
  const apiUrl = CONFIG.HOLIDAY_API.BASE_URL +
    '?serviceKey=' + encodeURIComponent(getServiceKey_()) +
    '&solYear=' + year + '&_type=json&numOfRows=100';
  try {
    const response = UrlFetchApp.fetch(apiUrl, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) {
      Logger.log('[' + year + '] API 응답 코드: ' + response.getResponseCode());
      return null;
    }
    const data = JSON.parse(response.getContentText());
    const body = data.response && data.response.body;
    if (!body) return null;
    if (!body.items || !body.items.item) return holidays;
    const items = Array.isArray(body.items.item) ? body.items.item : [body.items.item];
    items.forEach(function(item) {
      if (item.isHoliday === 'Y') {
        const locdate = String(item.locdate);
        holidays.push({
          date: locdate.substring(0,4)+'-'+locdate.substring(4,6)+'-'+locdate.substring(6,8),
          name: item.dateName
        });
      }
    });
    return holidays;
  } catch (err) {
    Logger.log('[' + year + '] API 실패: ' + err);
    return null;
  }
}

/** 공휴일 시트의 기존 행 → [{date, name, updated}] (updated: 갱신시각, 비어있으면 '') */
function readHolidayRows_(sheet) {
  const last = sheet.getLastRow();
  if (last < 3) return [];
  return sheet.getRange(3, 2, last - 2, 3).getValues().map(function(r) {
    const d = (r[0] instanceof Date)
      ? Utilities.formatDate(r[0], CONFIG.TIMEZONE, 'yyyy-MM-dd')
      : String(r[0] === null || r[0] === undefined ? '' : r[0]).trim();
    return { date: d, name: r[1], updated: r[2] };
  }).filter(function(r) { return r.date; });
}

/**
 * 공휴일 시트 갱신 (병합 방식)
 *  - API 조회에 성공한 연도: 그 연도의 기존 API 행을 새 결과로 교체
 *  - API 조회에 실패한 연도: 기존 행 유지
 *  - 수동 행(갱신시각 D열이 빈 행): 보존. 같은 날짜가 API에 있으면 API 행만 남김(중복 제거)
 */
function refreshHolidays() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.HOLIDAY_SHEET_NAME);
  if (!sheet) throw new Error('공휴일 시트 없음');

  const y = new Date().getFullYear();
  const existing = readHolidayRows_(sheet);
  const merged = {};            // date -> {date, name, updated}
  let anySuccess = false;

  [y, y + 1].forEach(function(yr) {
    const fetched = getHolidayFromAPI(yr);
    const prefix = yr + '-';
    if (fetched === null) {
      existing.forEach(function(r) {
        if (r.date.indexOf(prefix) === 0) merged[r.date] = r;
      });
      return;
    }
    anySuccess = true;
    const now = new Date();
    fetched.forEach(function(h) {
      merged[h.date] = { date: h.date, name: h.name, updated: now };
    });
  });
  if (!anySuccess) { Logger.log('공휴일 갱신 중단 — 모든 연도 API 실패'); return; }

  existing.forEach(function(r) {
    const isManual = (r.updated === '' || r.updated === null || r.updated === undefined);
    if (isManual && !merged[r.date]) merged[r.date] = r;
  });

  const rows = Object.keys(merged).sort().map(function(k) {
    const h = merged[k];
    return [h.date, h.name, h.updated];
  });

  const lastRow = sheet.getLastRow();
  if (lastRow > 2) sheet.getRange(3, 2, lastRow - 2, 3).clearContent();
  if (rows.length > 0) {
    sheet.getRange(3, 2, rows.length, 3).setValues(rows);
    sheet.getRange(3, 4, rows.length, 1).setNumberFormat('yyyy-MM-dd HH:mm:ss');
  }
  _holidayCache = null;
}

function checkApiKeyExpiry() {
  const s = CONFIG.HOLIDAY_API.KEY_EXPIRY;
  if (!s) return;
  const expiryDate = new Date(s + 'T00:00:00+09:00');
  const daysLeft = Math.ceil((expiryDate - new Date()) / 86400000);
  if (daysLeft > 60) return;
  let subject, body;
  if (daysLeft < 0) {
    subject = '🚨 공공데이터 인증키 만료됨';
    body = Math.abs(daysLeft) + '일 전 만료';
  } else {
    subject = '⏰ 공공데이터 인증키 만료 ' + daysLeft + '일 전';
    body = '만료 예정일: ' + s;
  }
  MailApp.sendEmail(Session.getActiveUser().getEmail(), subject, body);
}

// ===========================================
// 반기 파일 자동 생성
// ===========================================
function createNextPeriodSpreadsheet() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const force = arguments[0] === true;
  let targetYear, targetPeriod;
  if (month === 12) { targetYear = now.getFullYear()+1; targetPeriod = 'H1'; }
  else if (month === 6) { targetYear = now.getFullYear(); targetPeriod = 'H2'; }
  else if (force) {
    if (month <= 5) { targetYear = now.getFullYear(); targetPeriod = 'H2'; }
    else { targetYear = now.getFullYear()+1; targetPeriod = 'H1'; }
  } else return;

  const newFileName = getFileNameForPeriod(targetYear, targetPeriod);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    const parentFolder = DriveApp.getFolderById(CONFIG.PARENT_FOLDER_ID);
    const existing = parentFolder.getFilesByName(newFileName);
    if (existing.hasNext()) return;
    const currentFile = DriveApp.getFileById(ss.getId());
    const newFile = currentFile.makeCopy(newFileName, parentFolder);
    const newSs = SpreadsheetApp.openById(newFile.getId());
    cleanupCopiedSpreadsheet(newSs);
    sendCreationNotification(newFileName, newFile.getUrl(), targetPeriod);
  } catch (err) {
    Logger.log('실패: ' + err);
    sendFailureNotification(newFileName, err);
  }
}
function createNextYearSpreadsheet() { return createNextPeriodSpreadsheet.apply(this, arguments); }

function cleanupCopiedSpreadsheet(targetSs) {
  const sheets = targetSs.getSheets();
  const keepNames = [CONFIG.TEMPLATE_SHEET_NAME, CONFIG.HOLIDAY_SHEET_NAME,
                     CUT_SHEET_NAME, REGION_SHEET_NAME];
  sheets.forEach(function(sheet) {
    if (keepNames.indexOf(sheet.getName()) === -1) targetSs.deleteSheet(sheet);
  });
  const holidaySheet = targetSs.getSheetByName(CONFIG.HOLIDAY_SHEET_NAME);
  if (holidaySheet) {
    const lastRow = holidaySheet.getLastRow();
    if (lastRow > 2) holidaySheet.getRange(3, 2, lastRow - 2, 3).clearContent();
  }
  const cutSheet = targetSs.getSheetByName(CUT_SHEET_NAME);
  if (cutSheet) {
    cutSheet.getRange('J1').clearContent();
    cutSheet.getRange('L1').clearContent();
    const cutLastRow = Math.max(cutSheet.getLastRow(), 300);
    if (cutLastRow >= 4) {
      cutSheet.getRange(4, 1, cutLastRow - 3, 8).clearContent().setBackground('#FFFFFF');
    }
    cutSheet.getRange('B2').clearContent();
  }
}

function sendCreationNotification(fileName, fileUrl, period) {
  const myEmail = Session.getActiveUser().getEmail();
  const periodLabel = period === 'H1' ? '상반기' : '하반기';
  MailApp.sendEmail(myEmail, '✅ ' + fileName + ' 생성 완료',
    '파일: ' + fileName + '\n링크: ' + fileUrl + '\n\n'
    + '[주문관리] → [트리거 등록] 꼭 실행하세요.');
}
function sendFailureNotification(fileName, err) {
  MailApp.sendEmail(Session.getActiveUser().getEmail(),
    '🚨 ' + fileName + ' 자동 생성 실패', err.message);
}

// ===========================================
// Webhook
// ===========================================
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.action === 'holidays') {
      return _jsonOk({ holidays: _getHolidayListForApi_() });
    }

    var writeResult = writeOrderToSheet(data);
    return _jsonOk({
      rows: (data.items || []).length,
      deliveryDate: writeResult && writeResult.deliveryDate ? writeResult.deliveryDate : null
    });
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ERROR', message: err.message, stack: err.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function _jsonOk(extra) {
  var o = { status: 'OK' };
  if (extra) for (var k in extra) o[k] = extra[k];
  return ContentService.createTextOutput(JSON.stringify(o))
                       .setMimeType(ContentService.MimeType.JSON);
}

function _getHolidayListForApi_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.HOLIDAY_SHEET_NAME);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow < 3) return [];
  const vals = sheet.getRange(3, 2, lastRow - 2, 1).getValues();
  const out = [];
  vals.forEach(function(row) {
    const v = row[0];
    if (v instanceof Date) out.push(Utilities.formatDate(v, CONFIG.TIMEZONE, 'yyyy-MM-dd'));
    else if (typeof v === 'string' && v) out.push(v.trim());
  });
  return out;
}

// ===========================================
// 쓰기 (오늘_ 시트)
// ===========================================
function writeOrderToSheet(payload) {
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(15000)) throw new Error('Sheet lock 실패');
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var today = new Date();
    var expectedName = _formatSheetName(today, true);
    var sheet = ss.getSheetByName(expectedName);
    if (!sheet) sheet = createTodayTab();
    if (!sheet) throw new Error('오늘 시트 없음 (비영업일 또는 담당 기간 아님)');

    var items = payload.items || [];
    var orderId = payload.orderId || '';
    var orderDateStr = payload.orderDate ||
        Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
    var orderDateObj = new Date(orderDateStr.replace(' ', 'T') + '+09:00');
    if (isNaN(orderDateObj.getTime())) orderDateObj = new Date();
    var deliveryDate = calculateDeliveryDate(orderDateObj);
    var clientName = payload.clientName || '';

    var existingItemNums = collectItemNumsInTab(sheet);
    var filteredItems = items.filter(function(it) {
      return !(it.itemNum && existingItemNums[String(it.itemNum)]);
    });
    if (filteredItems.length === 0) {
      Logger.log('writeOrderToSheet: 모든 item 중복 — skip');
      return { written: 0, deliveryDate: deliveryDate };
    }

    // 그룹핑: orderId + productCode
    var groups = [];
    var groupMap = {};
    filteredItems.forEach(function(it) {
      var key = String(it.product || '') + '||' + String(it.productLabel || '');
      if (groupMap[key] === undefined) {
        groupMap[key] = groups.length;
        groups.push({
          product: it.product || '',
          productLabel: it.productLabel || it.product || '',
          rows: []
        });
      }
      groups[groupMap[key]].rows.push(it);
    });

    var nextNo = computeNextNo_(sheet);
    var baseRow = getLastDataRow(sheet);
    var writeRow = baseRow + 1;
    var totalRows = filteredItems.length;
    var allRowValues = [];

    groups.forEach(function(g) {
      g.startRow = writeRow;
      g.no = nextNo;
      for (var i = 0; i < g.rows.length; i++) {
        var it = g.rows[i];
        allRowValues.push([
          nextNo, orderId, orderDateStr, g.product, g.productLabel,
          WORK_STATUS_TEXT,
          it.width  || 0, it.length || 0, it.rolls  || 0,
          clientName, it.destination || '',
          '', it.note || '', deliveryDate,
          false, false, false,
          it.itemNum || ''
        ]);
        writeRow++;
      }
      nextNo++;
    });

    // 1) 값 쓰기
    var fullRange = sheet.getRange(baseRow + 1, 1, totalRows, 18);
    fullRange.setValues(allRowValues);

    // 2) 배경색 (14~18시만 연한 파랑)
    var bg = getRowColorByHour(orderDateObj);
    if (bg) {
      var bgArr = [];
      for (var r = 0; r < totalRows; r++) {
        var line = [];
        for (var c = 0; c < 18; c++) line.push(bg);
        bgArr.push(line);
      }
      fullRange.setBackgrounds(bgArr);
    } else {
      fullRange.setBackground(null);
    }

    // 3) 폰트 / 세로정렬
    fullRange
      .setFontSize(DATA_FONT_SIZE)
      .setVerticalAlignment('middle');

    // 4) M열(비고) 자동 줄바꿈
    sheet.getRange(baseRow + 1, 13, totalRows, 1).setWrap(true);

    // 5) 세로 병합: A/B/C/D/E/J 고정, K는 조건부
    var MERGE_COLS_FIXED = [1, 2, 3, 4, 5, 10];
    var MERGE_COL_DEST = 11;
    groups.forEach(function(g) {
      if (g.rows.length <= 1) return;
      MERGE_COLS_FIXED.forEach(function(col) {
        sheet.getRange(g.startRow, col, g.rows.length, 1).merge();
      });
      var dests = g.rows.map(function(r) { return String(r.destination || ''); });
      var allSame = dests.every(function(d) { return d === dests[0]; });
      if (allSame) {
        sheet.getRange(g.startRow, MERGE_COL_DEST, g.rows.length, 1).merge();
      }
    });

    // 6) 체크박스 삽입 (병합 완료 후)
    sheet.getRange(baseRow + 1, 15, totalRows, 3).insertCheckboxes();

    // 7) 테두리 (범위를 한 행 위로 확장해서 첫 데이터 top 보강)
    var borderStartRow = Math.max(baseRow, 1);
    var borderRows = (baseRow + totalRows) - borderStartRow + 1;
    sheet.getRange(borderStartRow, 1, borderRows, 18)
      .setBorder(true, true, true, true, true, true,
                 '#000000', SpreadsheetApp.BorderStyle.SOLID);

    SpreadsheetApp.flush();
    return { written: totalRows, deliveryDate: deliveryDate };
  } finally { lock.releaseLock(); }
}

function computeNextNo_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 4) return 1;
  var vals = sheet.getRange(4, 1, lastRow - 3, 1).getValues();
  var maxNo = 0;
  for (var i = 0; i < vals.length; i++) {
    var v = Number(vals[i][0]);
    if (!isNaN(v) && v !== 0 && v !== 999 && v > maxNo) maxNo = v;
  }
  return maxNo + 1;
}

// ===========================================
// onEdit
// ===========================================
function onEdit(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  var name = sheet.getName();
  if (name === CONFIG.TEMPLATE_SHEET_NAME) return;
  if (name === CONFIG.HOLIDAY_SHEET_NAME) { _holidayCache = null; return; }
  if (name === CUT_SHEET_NAME) { handleCutSheetEdit_(e); return; }
  if (name === REGION_SHEET_NAME) return;
  handleDailyTabEdit_(e);
}

function handleDailyTabEdit_(e) {
  var sheet = e.range.getSheet();
  var startCol = e.range.getColumn();
  var endCol   = startCol + e.range.getNumColumns() - 1;
  var startRow = e.range.getRow();
  var endRow   = startRow + e.range.getNumRows() - 1;
  if (endRow < 2) return;

  function isEmpty(v) { return v === '' || v === null || v === undefined; }

  // C 발주일 → 배경색 재적용
  if (startCol <= 3 && endCol >= 3) {
    for (var r = Math.max(2, startRow); r <= endRow; r++) {
      var v = sheet.getRange(r, 3).getValue();
      var bgRange = sheet.getRange(r, 2, 1, 16);
      if (isEmpty(v)) { bgRange.setBackground(null); continue; }
      var d = (v instanceof Date) ? v : new Date(String(v).replace(' ', 'T') + '+09:00');
      if (!isNaN(d.getTime())) {
        var bg = getRowColorByHour(d);
        if (bg) bgRange.setBackground(bg); else bgRange.setBackground(null);
      }
    }
  }
}

function collectItemNumsInTab(sheet) {
  var set = {};
  if (!sheet) return set;
  var last = sheet.getLastRow();
  if (last < 2) return set;
  var vals = sheet.getRange(2, 18, last - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    var v = vals[i][0];
    if (v !== '' && v != null) set[String(v)] = true;
  }
  return set;
}

function getLastDataRow(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1;
  var values = sheet.getRange(2, 1, lastRow - 1, 18).getValues();
  for (var i = values.length - 1; i >= 0; i--) {
    var row = values[i];
    if (row[5]  !== '' || row[6]  !== '' ||
        row[8]  !== '' || row[17] !== '') {
      return i + 2;
    }
  }
  return 1;
}

// ===========================================
// 수동 실행
// ===========================================
function manualCreateTodayTab() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var today = new Date();
  if (isHoliday(today)) {
    ss.toast('오늘은 비영업일(주말/공휴일/임시공휴일)이라 생성하지 않습니다.', '안내', 5);
    return;
  }
  const sheet = createTodayTab();
  if (sheet) ss.toast('"' + sheet.getName() + '" 준비 완료', '완료', 3);
  else ss.toast('담당 기간 아님', '안내', 5);
}
function manualRefreshHolidays() {
  try { refreshHolidays(); SpreadsheetApp.getActiveSpreadsheet().toast('공휴일 갱신 완료','✅',5); }
  catch (err) { SpreadsheetApp.getActiveSpreadsheet().toast('실패: '+err.message,'❌',10); }
}

// ===========================================
// 전날 미완료 자동 이월 (01시)
// ===========================================
function copyUnfinishedFromYesterday() {
  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(30000)) { Logger.log('copyUnfinished lock 실패'); return; }
  try { _copyUnfinishedImpl(); } finally { lock.releaseLock(); }
}

/** 긴급 수동 실행용 (메뉴에선 뺐지만 Apps Script 에디터에서 직접 실행 가능) */
function manualCopyUnfinished() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    _copyUnfinishedImpl();
    ss.toast('이월 완료 (로그 확인)', '완료', 3);
  } catch (err) {
    ss.toast('실패: ' + err.message, '❌', 10);
  }
}

function _copyUnfinishedImpl() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var today = new Date();

  if (isHoliday(today)) { Logger.log('이월 skip — 오늘 비영업일'); return; }
  if (!isMonthInCurrentPeriod(today.getMonth() + 1)) {
    Logger.log('이월 skip — 담당 기간 아님'); return;
  }

  var todayName = _formatSheetName(today, true);
  var todaySheet = ss.getSheetByName(todayName) || createTodayTab();
  if (!todaySheet) { Logger.log('이월 skip — 오늘 시트 없음'); return; }

  var yesterdaySheet = _findMostRecentPastSheet_(ss, today);
  if (!yesterdaySheet) { Logger.log('이월 skip — 과거 시트 없음'); return; }

  var unfinished = _readUnfinishedRows_(yesterdaySheet);
  if (unfinished.length === 0) { Logger.log('이월 skip — 미완료 없음'); return; }

  // 중복 체크: itemNum 있는 행만. 분할 자식(itemNum 빈값)은 자동 통과
  var existing = collectItemNumsInTab(todaySheet);
  var toCopy = unfinished.filter(function(r) {
    if (!r.itemNum) return true;
    return !existing[String(r.itemNum)];
  });
  if (toCopy.length === 0) { Logger.log('이월 skip — 모두 중복'); return; }

  // 그룹핑: orderId + productCode
  var groups = [];
  var groupMap = {};
  toCopy.forEach(function(r) {
    var key = String(r.orderId || '') + '||' + String(r.productCode || '');
    if (groupMap[key] === undefined) {
      groupMap[key] = groups.length;
      groups.push({ rows: [] });
    }
    groups[groupMap[key]].rows.push(r);
  });

  var nextNo = computeNextNo_(todaySheet);
  var baseRow = getLastDataRow(todaySheet);
  var writeRow = baseRow + 1;
  var totalRows = toCopy.length;
  var allRowValues = [];

  groups.forEach(function(g) {
    g.startRow = writeRow;
    g.rows.forEach(function(r) {
      allRowValues.push([
        nextNo, r.orderId, r.orderDate, r.productCode, r.productName,
        r.work,
        r.width, r.length, r.rolls,
        r.company, r.destination,
        r.shippedOut, r.note, r.deliveryDate,
        r.chk1, r.chk2, r.chk3,
        r.itemNum
      ]);
      writeRow++;
    });
    nextNo++;
  });

  // 1) 값 쓰기
  var fullRange = todaySheet.getRange(baseRow + 1, 1, totalRows, 18);
  fullRange.setValues(allRowValues);

  // 2) 배경 없음 (이월은 어제 데이터이므로 배경색 리셋)
  fullRange.setBackground(null);

  // 3) 폰트 / 세로정렬
  fullRange
    .setFontSize(DATA_FONT_SIZE)
    .setVerticalAlignment('middle');

  // 4) M열(비고) 자동 줄바꿈
  todaySheet.getRange(baseRow + 1, 13, totalRows, 1).setWrap(true);

  // 5) 세로 병합: A/B/C/D/E/J 고정, K는 조건부
  var MERGE_COLS_FIXED = [1, 2, 3, 4, 5, 10];
  var MERGE_COL_DEST = 11;
  groups.forEach(function(g) {
    if (g.rows.length <= 1) return;
    MERGE_COLS_FIXED.forEach(function(col) {
      todaySheet.getRange(g.startRow, col, g.rows.length, 1).merge();
    });
    var dests = g.rows.map(function(r) { return String(r.destination || ''); });
    var allSame = dests.every(function(d) { return d === dests[0]; });
    if (allSame) {
      todaySheet.getRange(g.startRow, MERGE_COL_DEST, g.rows.length, 1).merge();
    }
  });

  // 6) 체크박스 (어제의 TRUE 상태 보존)
  _applyCheckboxesPreservingTrue_(todaySheet.getRange(baseRow + 1, 15, totalRows, 3));

  // 7) 테두리
  var borderStartRow = Math.max(baseRow, 1);
  var borderRows = (baseRow + totalRows) - borderStartRow + 1;
  todaySheet.getRange(borderStartRow, 1, borderRows, 18)
    .setBorder(true, true, true, true, true, true,
               '#000000', SpreadsheetApp.BorderStyle.SOLID);

  // 8) 어제 시트 R열에 "이월됨" 마커 (행 번호 기준 — 원본/자식 모두)
  var sourceRows = toCopy.map(function(r) { return r.sourceRow; });
  _markAsCopiedInYesterday_(yesterdaySheet, sourceRows);

  SpreadsheetApp.flush();
  Logger.log('이월 완료 — ' + totalRows + '건 (' + groups.length + '그룹)');
}

function _findMostRecentPastSheet_(ss, today) {
  var todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  var pattern = /^(\d{2})-(\d{2})\([월화수목금토일]\)$/;
  var best = null, bestTs = -Infinity;
  ss.getSheets().forEach(function(sh) {
    var m = sh.getName().match(pattern);
    if (!m) return;
    var d = new Date(today.getFullYear(), parseInt(m[1], 10) - 1, parseInt(m[2], 10));
    if (d.getTime() >= todayDate.getTime()) return;
    if (d.getTime() > bestTs) { bestTs = d.getTime(); best = sh; }
  });
  return best;
}

/**
 * 어제 시트에서 F가 '짜는중'/'짜는 중'/'' 인 행 수집.
 * R열(itemNum) 신경 안 씀 — 분할 자식 포함.
 * forward-fill로 병합셀 상속.
 * sourceRow (어제 시트 행 번호) 저장.
 */
function _readUnfinishedRows_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 4) return [];
  var displays = sheet.getRange(4, 1, lastRow - 3, 18).getDisplayValues();
  var rows = [];
  var ffOrderId = '', ffOrderDate = '',
      ffProductCode = '', ffProductName = '',
      ffCompany = '', ffDest = '';

  for (var i = 0; i < displays.length; i++) {
    var v = displays[i];
    var work = _txt(v[5]);
    var width = _txt(v[6]);
    var length = _txt(v[7]);
    var qty = _txt(v[8]);
    var itemNum = _txt(v[17]);

    // forward-fill
    if (_txt(v[1])) ffOrderId     = _txt(v[1]);
    if (_txt(v[2])) ffOrderDate   = _txt(v[2]);
    if (_txt(v[3])) ffProductCode = _txt(v[3]);
    if (_txt(v[4])) ffProductName = _txt(v[4]);
    if (_txt(v[9])) ffCompany     = _txt(v[9]);
    if (_txt(v[10])) ffDest       = _txt(v[10]);

    // 완전 빈 행 skip
    if (!work && !width && !length && !qty && !itemNum) continue;

    // F열(작업내용)로만 이월 대상 판단
    var ws = work.replace(/\s+/g, '');
    var isUnfinished = (ws === '' || ws.indexOf('짜는중') !== -1);
    if (!isUnfinished) continue;

    rows.push({
      sourceRow: 4 + i,
      orderId: ffOrderId,
      orderDate: ffOrderDate,
      productCode: ffProductCode,
      productName: ffProductName,
      work: work,
      width:  Number(width)  || 0,
      length: Number(length) || 0,
      rolls:  Number(qty)    || 0,
      company: ffCompany,
      destination: ffDest,
      shippedOut:   _txt(v[11]),
      note:         _txt(v[12]),
      deliveryDate: _txt(v[13]),
      chk1: (String(v[14]).toUpperCase() === 'TRUE' || v[14] === true),
      chk2: (String(v[15]).toUpperCase() === 'TRUE' || v[15] === true),
      chk3: (String(v[16]).toUpperCase() === 'TRUE' || v[16] === true),
      itemNum: itemNum
    });
  }
  return rows;
}

/**
 * 어제 시트의 지정 행 번호들에 "이월됨" 마커 (R열).
 * 원본이든 분할 자식이든 이월된 모든 행에 적용.
 */
function _markAsCopiedInYesterday_(sheet, sourceRows) {
  sourceRows.forEach(function(row) {
    sheet.getRange(row, 18).setValue('이월됨');
  });
}

// ===========================================
// ★ 체크박스 복구 (TRUE 값 보존)
// ===========================================
function fixTodayCheckboxes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = findTodaySheet_();
  if (!sheet) { ss.toast('"오늘_" 시트가 없습니다', '❌', 5); return; }
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) { ss.toast('데이터가 없습니다', '안내', 3); return; }

  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(15000)) { ss.toast('다른 작업이 진행 중입니다', '❌', 5); return; }
  try {
    _applyCheckboxesPreservingTrue_(sheet.getRange(2, 15, lastRow - 1, 3));
    SpreadsheetApp.flush();
    ss.toast('"' + sheet.getName() + '" 체크박스 복구 완료', '✅', 3);
  } finally { lock.releaseLock(); }
}

function fixAllDailyCheckboxes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var skipNames = [CONFIG.TEMPLATE_SHEET_NAME, CONFIG.HOLIDAY_SHEET_NAME,
                   CUT_SHEET_NAME, REGION_SHEET_NAME];
  var sheets = ss.getSheets().filter(function(sh) {
    return skipNames.indexOf(sh.getName()) === -1;
  });

  var result = ui.alert('체크박스 복구',
    sheets.length + '개 시트의 O/P/Q열 체크박스를 복구합니다.\n' +
    '기존 TRUE 체크 상태는 유지됩니다.\n\n진행할까요?',
    ui.ButtonSet.YES_NO);
  if (result !== ui.Button.YES) return;

  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(30000)) { ss.toast('다른 작업이 진행 중입니다', '❌', 5); return; }
  try {
    var fixed = 0;
    sheets.forEach(function(sh) {
      var lastRow = sh.getLastRow();
      if (lastRow < 2) return;
      _applyCheckboxesPreservingTrue_(sh.getRange(2, 15, lastRow - 1, 3));
      fixed++;
    });
    SpreadsheetApp.flush();
    ss.toast(fixed + '개 시트 복구 완료', '✅', 5);
  } finally { lock.releaseLock(); }
}
