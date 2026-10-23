/* 관리자 - 주문 내역
 * 스프레드시트와 동일한 컬럼 구성 (작업내용/확인1/2/3 제외)
 * STATUS 컬럼으로 시트 전송 결과 확인 가능
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AdminShell } from "./components/Layout";
import { useNotification } from "./notifications/NotificationContext";
import PageHeader from "./components/PageHeader";
import Pagination from "./components/Pagination";
import {
  fetchAdminOrders,
  updateAdminOrderItem,
  deleteAdminOrderItem,
  setOrderItemCutDone,
  fetchClients,
} from "./api";
import OrderEditModal from "./components/OrderEditModal";
import OrderCreateModal from "./components/OrderCreateModal";
import ConfirmDialog from "./components/ConfirmDialog";
import { downloadXlsx, todayYmd } from "./excelExport";
import styles from "./OrderAdmin.module.css";

const PAGE_SIZE = 20;

const isSameDay = (a, b) =>
  !!a && !!b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const fmtDateTime = (d) =>
  d
    ? new Intl.DateTimeFormat("ko-KR", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: false,
      }).format(d)
    : "-";

const KOR_DOW = ["일", "월", "화", "수", "목", "금", "토"];

/** 영업일 +N (주말만 건너뜀, 공휴일은 Apps Script가 관리하므로 여기선 근사치) */
function calcDelivery(date) {
  if (!date) return "-";
  const h = date.getHours();
  let steps = h < 13 ? 1 : 2;
  const d = new Date(date);
  while (steps > 0) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    steps--;
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}(${KOR_DOW[d.getDay()]})`;
}

function StatusChip({ status }) {
  const map = {
    OK:      { label: "전송완료", cls: styles.chipOk },
    FAILED:  { label: "전송실패", cls: styles.chipFail },
    PENDING: { label: "미전송",   cls: styles.chipPending },
  };
  const v = map[status] || { label: status || "-", cls: styles.chipPending };
  return <span className={`${styles.chip} ${v.cls}`}>{v.label}</span>;
}

export default function OrderAdmin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { markAsSeen, latestOrderNum, lastSeenOrderNum, unseenLoaded } = useNotification();

  // URL ?highlightSince=N 우선, 없으면 Context lastSeenOrderNum 사용
  const urlHighlightSince = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const v = parseInt(sp.get("highlightSince") || "0", 10);
    return Number.isFinite(v) ? v : 0;
  }, [location.search]);

  // 페이지 진입 시점의 cutoff를 ref로 고정 (이후 markAsSeen 돌아도 안 바뀜)
  const highlightCutoffRef = useRef(null);
  const [cutoffReady, setCutoffReady] = useState(false);

  // 페이지에 머무는 중 들어온 신규 orderNum 집합 (각각 3분간 하이라이트)
  const [freshOrderNums, setFreshOrderNums] = useState(new Set());

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // 세분화된 검색 조건
  const [qOrderId, setQOrderId]   = useState("");  // 주문번호
  const [qProduct, setQProduct]   = useState("");  // 제품코드/제품명
  const [qWidth,   setQWidth]     = useState("");  // 폭
  const [qClient,  setQClient]    = useState("");  // 발주처
  const [qDest,    setQDest]      = useState("");  // 납품처
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState(""); // 'YYYY-MM-DD'
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [editingRow, setEditingRow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null); // 삭제 확인 모달용

  // 새 주문 추가 모달용 거래처 목록 로드 (사용구분 YES만)
  useEffect(() => {
    fetchClients()
      .then((arr) => setClients(arr.filter((c) => c.useType === "YES" || c.useType === "등록")))
      .catch(() => {});
  }, []);

  useEffect(() => { setPage(1); }, [qOrderId, qProduct, qWidth, qClient, qDest, statusFilter, dateFrom, dateTo]);

  const onSaveEdit = async (body) => {
    if (!editingRow) return;
    setSaving(true);
    try {
      const updated = await updateAdminOrderItem(editingRow.itemNum, body);
      setRows((arr) =>
        arr.map((r) =>
          r.itemNum === updated.itemNum
            ? {
                ...r,
                product: updated.product,
                productLabel: updated.productLabel,
                width: updated.width,
                length: updated.length,
                rolls: updated.rolls,
                destination: updated.destination,
                note: updated.note,
                orderDate: updated.orderDate ? new Date(updated.orderDate) : r.orderDate,
              }
            : r
        )
      );
      setEditingRow(null);
    } catch (err) {
      alert(err?.response?.data?.message || "수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 재단 작업 완료 체크박스: 화면을 먼저 바꾸고 저장하며, 실패하면 되돌린다
  const toggleCutDone = async (row, done) => {
    const apply = (v) =>
      setRows((arr) => arr.map((x) => (x.itemNum === row.itemNum ? { ...x, cutDone: v } : x)));
    apply(done);
    try {
      await setOrderItemCutDone(row.itemNum, done);
    } catch (err) {
      apply(!done);
      alert(err?.response?.data?.message || "재단 작업 완료 상태를 저장하지 못했습니다.");
    }
  };

  const onDeleteEdit = (target) => {
    if (!target) return;
    setDeleteTarget(target); // 확인 모달 오픈
  };

  const confirmDeleteOrder = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAdminOrderItem(deleteTarget.itemNum);
      setRows((arr) => arr.filter((r) => r.itemNum !== deleteTarget.itemNum));
      setEditingRow(null);
      setDeleteTarget(null);
    } catch (err) {
      alert(err?.response?.data?.message || "삭제 중 오류가 발생했습니다.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchAdminOrders()
      .then(setRows)
      .catch(() => setError("주문 내역을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  // 페이지 진입 시 cutoff 세팅 — URL param 우선, 없으면 Context lastSeenOrderNum.
  // markAsSeen이 돌기 전의 값을 포착해야 하므로 ref에 1회만 기록.
  useEffect(() => {
    if (highlightCutoffRef.current !== null) return;
    if (urlHighlightSince > 0) {
      highlightCutoffRef.current = urlHighlightSince;
      setCutoffReady(true);
      // 새로고침해도 같은 하이라이트가 다시 켜지지 않도록 주소에서 파라미터를 지운다
      navigate(location.pathname, { replace: true });
    } else if (unseenLoaded) {
      // 서버에서 실제 값을 받은 뒤에만 기준선으로 쓴다(새로고침 직후 초기값 0을 쓰면 전체가 새 주문으로 칠해짐)
      highlightCutoffRef.current = lastSeenOrderNum;
      setCutoffReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlHighlightSince, lastSeenOrderNum, unseenLoaded]);

  // 페이지 진입 시: 지금까지의 최대 ORDER_NUM을 "본 걸로" 처리
  //   (cutoff 세팅 후에 돌리기 위해 cutoffReady 의존)
  useEffect(() => {
    if (!cutoffReady) return;
    if (latestOrderNum > 0) markAsSeen(latestOrderNum);
  }, [cutoffReady, latestOrderNum, markAsSeen]);

  // cutoff 기반 하이라이트: 3분 후 fade (freshOrderNums 하이라이트와 통일)
  const [cutoffFading, setCutoffFading] = useState(false);
  useEffect(() => {
    if (!cutoffReady) return undefined;
    const t = setTimeout(() => setCutoffFading(true), 3 * 60 * 1000);
    return () => clearTimeout(t);
  }, [cutoffReady]);

  // ★ 머무는 중 새 주문 들어오면 자동 리프레시 + 신규 orderNum 하이라이트 (3분)
  //   해제 조건: 3분 경과 OR 그 행 클릭(수정 모달 열기) OR 페이지 이탈
  const seenLatestRef = useRef(0);
  const FRESH_HIGHLIGHT_MS = 3 * 60 * 1000;
  useEffect(() => {
    if (!latestOrderNum) return;
    // 처음 관측한 최신 번호는 "지금까지 있던 주문"의 기준선일 뿐 새 주문이 아니다(새로고침/페이지 진입 때 오인 방지)
    if (seenLatestRef.current === 0) { seenLatestRef.current = latestOrderNum; return; }
    if (latestOrderNum <= seenLatestRef.current) return;
    const newOrderNum = latestOrderNum;
    seenLatestRef.current = newOrderNum;
    if (!loading) {
      fetchAdminOrders().then(setRows).catch(() => {});
      setFreshOrderNums((prev) => {
        const next = new Set(prev);
        next.add(newOrderNum);
        return next;
      });
      setTimeout(() => {
        setFreshOrderNums((prev) => {
          if (!prev.has(newOrderNum)) return prev;
          const next = new Set(prev);
          next.delete(newOrderNum);
          return next;
        });
      }, FRESH_HIGHLIGHT_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestOrderNum]);

  // 오늘 주문 표시용 기준일. 자정을 넘겨 화면을 열어 둔 경우에도 맞도록 렌더마다 계산한다(값싼 연산).
  const today = new Date();

  const filtered = useMemo(() => {
    const kOrder   = qOrderId.trim().toLowerCase();
    const kProduct = qProduct.trim().toLowerCase();
    const kWidth   = qWidth.trim();
    const kClient  = qClient.trim().toLowerCase();
    const kDest    = qDest.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom + "T00:00:00").getTime() : null;
    // dateTo는 그 날 23:59:59까지 포함
    const toTs = dateTo ? new Date(dateTo + "T23:59:59").getTime() : null;
    return rows.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (fromTs != null) {
        if (!r.orderDate || r.orderDate.getTime() < fromTs) return false;
      }
      if (toTs != null) {
        if (!r.orderDate || r.orderDate.getTime() > toTs) return false;
      }
      if (kOrder && !(r.orderId || "").toLowerCase().includes(kOrder)) return false;
      if (kProduct) {
        const hit = (r.product || "").toLowerCase().includes(kProduct)
                 || (r.productLabel || "").toLowerCase().includes(kProduct);
        if (!hit) return false;
      }
      if (kWidth && String(r.width ?? "") !== kWidth) return false;
      if (kClient && !(r.cliCompName || "").toLowerCase().includes(kClient)) return false;
      if (kDest && !(r.destination || "").toLowerCase().includes(kDest)) return false;
      return true;
    });
  }, [rows, qOrderId, qProduct, qWidth, qClient, qDest, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const okCount = rows.filter((r) => r.status === "OK").length;
  const failCount = rows.filter((r) => r.status === "FAILED").length;
  const pendingCount = rows.filter((r) => r.status === "PENDING").length;

  // 엑셀 다운로드 — 화면에 보이는 필터·검색 결과(filtered)를 화면 컬럼 순서 그대로
  const onDownloadExcel = () => {
    if (filtered.length === 0) {
      alert("다운로드할 주문이 없습니다.");
      return;
    }
    const excelRows = filtered.map((r) => ({
      "재단완료":   r.cutDone ? "완료" : "미완료",
      "주문번호":   r.orderId || "",
      "발주일":     r.orderDate ? fmtDateTime(r.orderDate) : "",
      "제품코드":   r.product || "",
      "제품명":     r.productLabel || "",
      "폭":         r.width ?? "",
      "길이":       r.length ?? "",
      "롤수":       r.rolls ?? "",
      "발주처":     r.cliCompName || r.cliCode || "",
      "납품처":     r.destination || "",
      "비고":       r.note || "",
      "납품예정일": r.deliveryDate || calcDelivery(r.orderDate),
      "단가":       r.unitPrice ?? "",
    }));
    downloadXlsx(excelRows, `주문내역_${todayYmd()}`, "주문내역");
  };

  return (
    <AdminShell>
      <PageHeader
        title="주문 내역"
        subtitle={
          <>
            DB에 등록된 모든 주문을 품목 단위로 표시합니다. 스프레드시트와 동일한 컬럼 구성이라 한 줄씩 대조해 확인할 수 있어요.
            <br />
            시트 전송 상태(전송완료/실패/대기)로 누락 여부를 빠르게 점검하세요.
          </>
        }
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={onDownloadExcel}
              style={{
                height: 36, padding: "0 14px", borderRadius: 8,
                border: "1px solid var(--line)", background: "var(--surface, #fff)",
                color: "var(--ink, #222)", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
              title="화면에 표시된 주문(검색·필터 결과)을 엑셀로 다운로드"
            >
              📥 엑셀 다운로드
            </button>
            <button
              type="button"
              onClick={() => setCreating(true)}
              style={{
                height: 36, padding: "0 16px", borderRadius: 8, border: "none",
                background: "var(--brand)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              + 새 주문 추가
            </button>
          </div>
        }
      />

      {error && <p className={styles.apiError}>{error}</p>}

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="주문번호"
          value={qOrderId}
          onChange={(e) => setQOrderId(e.target.value)}
        />
        <input
          className={styles.search}
          placeholder="제품코드 / 제품명"
          value={qProduct}
          onChange={(e) => setQProduct(e.target.value)}
        />
        <input
          className={`${styles.search} ${styles.searchWidth}`}
          placeholder="폭"
          value={qWidth}
          onChange={(e) => setQWidth(e.target.value.replace(/[^\d]/g, ""))}
          inputMode="numeric"
        />
        <input
          className={styles.search}
          placeholder="발주처"
          value={qClient}
          onChange={(e) => setQClient(e.target.value)}
        />
        <input
          className={styles.search}
          placeholder="납품처"
          value={qDest}
          onChange={(e) => setQDest(e.target.value)}
        />
        <div className={styles.dateRange}>
          <input
            type="date"
            className={styles.dateInput}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            max={dateTo || undefined}
            title="시작일"
          />
          <span className={styles.dateSep}>~</span>
          <input
            type="date"
            className={styles.dateInput}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            min={dateFrom || undefined}
            title="종료일"
          />
          {(dateFrom || dateTo) && (
            <button
              type="button"
              className={styles.clearDateBtn}
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              title="날짜 초기화"
            >
              ✕
            </button>
          )}
        </div>
        <select
          className={styles.select}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">전체 시트상태</option>
          <option value="OK">전송완료</option>
          <option value="FAILED">전송실패</option>
          <option value="PENDING">미전송</option>
        </select>
        <div className={styles.counts}>
          전체 <b>{rows.length}</b> · 전송완료 <b className={styles.numOk}>{okCount}</b> · 실패 <b className={styles.numFail}>{failCount}</b> · 미전송 <b>{pendingCount}</b>
        </div>
      </div>

      <div className={styles.wrap}>
        <table className={styles.table}>
          <colgroup>
            <col width="55px" />
            <col width="175px" />
            <col width="125px" />
            <col width="130px" />
            <col width="180px" />
            <col width="65px" />
            <col width="65px" />
            <col width="65px" />
            <col width="93px" />
            <col width="93px" />
            <col width="244px" />
            <col width="110px" />
            <col width="90px" />
            <col width="95px" />
          </colgroup>
          <thead>
            <tr className={styles.headRow}>
              <th>완료</th>
              <th>주문번호</th>
              <th>발주일</th>
              <th>제품코드</th>
              <th>제품명</th>
              <th>폭</th>
              <th>길이</th>
              <th>롤수</th>
              <th>발주처</th>
              <th>납품처</th>
              <th>비고</th>
              <th>납품예정일</th>
              <th>단가</th>
              <th>시트상태</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={14} className={styles.stateCell}>불러오는 중…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={14} className={styles.stateCell}>조건에 맞는 주문이 없습니다.</td></tr>
            ) : (
              pageItems.map((r, i) => {
                const cutoff = highlightCutoffRef.current;
                const isNewByCutoff = cutoff != null && !cutoffFading && r.orderNum > cutoff;
                const isNewByFresh  = freshOrderNums.has(r.orderNum);
                const isNew = isNewByCutoff || isNewByFresh;
                return (
                <tr
                  key={`${r.orderNum}-${r.itemNum}`}
                  className={styles.row}
                  onClick={() => setEditingRow(r)}
                  style={{
                    cursor: "pointer",
                    backgroundColor: isNew ? "#d4edda" : undefined,
                    borderLeft: isNew ? "4px solid #28a745" : undefined,
                    transition: "background-color 1.5s ease-out, border-left-color 1.5s ease-out",
                  }}
                  title="클릭해서 수정"
                >
                  <td className={styles.cellCheck} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className={styles.cutCheck}
                      checked={!!r.cutDone}
                      onChange={(e) => toggleCutDone(r, e.target.checked)}
                      title={r.cutDone ? "재단 작업 완료 (클릭하면 미완료로 변경)" : "재단 작업 미완료 (클릭하면 완료로 변경)"}
                    />
                  </td>
                  <td className={styles.cellMono}>
                    <span className={isSameDay(r.orderDate, today) ? styles.orderIdToday : undefined}>
                      {r.orderId}
                    </span>
                    {r.createdBy && r.createdBy !== "CUSTOMER" && (
                      <span className={styles.selfBadge} title={`관리자가 직접 입력한 주문 (${r.createdBy})`}>
                        self
                      </span>
                    )}
                  </td>
                  <td className={styles.cellNum}>{fmtDateTime(r.orderDate)}</td>
                  <td className={styles.cellMono}>{r.product || "-"}</td>
                  <td className={styles.cellName}>{r.productLabel || "-"}</td>
                  <td className={styles.cellNum}>{r.width ?? "-"}</td>
                  <td className={styles.cellNum}>{r.length ?? "-"}</td>
                  <td className={styles.cellNum}>{r.rolls ?? "-"}</td>
                  <td className={styles.cellCenter}>{r.cliCompName || r.cliCode || "-"}</td>
                  <td className={styles.cellCenter}>{r.destination || "-"}</td>
                  <td className={styles.cellNote}>{r.note || "-"}</td>
                  <td className={styles.cellNum}>{r.deliveryDate || calcDelivery(r.orderDate)}</td>
                  <td className={styles.cellNum}>
                    {r.unitPrice != null ? r.unitPrice.toLocaleString("ko-KR") : "-"}
                  </td>
                  <td className={styles.cellNum}><StatusChip status={r.status} /></td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={filtered.length}
        onChange={setPage}
      />

      {editingRow && (
        <OrderEditModal
          row={editingRow}
          saving={saving}
          deleting={deleting}
          onClose={() => setEditingRow(null)}
          onSave={onSaveEdit}
          onDelete={onDeleteEdit}
        />
      )}

      {creating && (
        <OrderCreateModal
          clients={clients}
          saving={createSaving}
          setSaving={setCreateSaving}
          onClose={() => setCreating(false)}
          onCreated={async () => {
            setCreating(false);
            // 목록 새로고침
            try {
              const fresh = await fetchAdminOrders();
              setRows(fresh);
            } catch {}
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="주문 품목을 삭제하시겠어요?"
          body={
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
                주문번호 {deleteTarget.orderId}
              </div>
              <div style={{ color: "var(--ink-2)" }}>
                {deleteTarget.productLabel || deleteTarget.product}
                {deleteTarget.width ? ` · ${deleteTarget.width}mm` : ""}
                {deleteTarget.length ? ` × ${deleteTarget.length}m` : ""}
                {deleteTarget.rolls ? ` · ${deleteTarget.rolls}롤` : ""}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
                시스템에서만 삭제되며 스프레드시트에는 반영되지 않습니다.<br />
                삭제 후 시트도 지워야 한다면 <b>작업자에게 공유</b>해주세요. 되돌릴 수 없습니다.
              </div>
            </div>
          }
          confirmLabel={deleting ? "삭제 중…" : "삭제"}
          danger
          disabled={deleting}
          onCancel={() => !deleting && setDeleteTarget(null)}
          onConfirm={confirmDeleteOrder}
        />
      )}
    </AdminShell>
  );
}
