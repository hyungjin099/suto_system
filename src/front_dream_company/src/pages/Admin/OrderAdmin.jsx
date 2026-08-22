/* 관리자 - 주문 내역
 * 스프레드시트와 동일한 컬럼 구성 (작업내용/확인1/2/3 제외)
 * STATUS 컬럼으로 시트 전송 결과 확인 가능
 */

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "./components/Layout";
import PageHeader from "./components/PageHeader";
import Pagination from "./components/Pagination";
import {
  fetchAdminOrders,
  updateAdminOrderItem,
  deleteAdminOrderItem,
  fetchClients,
} from "./api";
import OrderEditModal from "./components/OrderEditModal";
import OrderCreateModal from "./components/OrderCreateModal";
import ConfirmDialog from "./components/ConfirmDialog";
import { downloadXlsx, todayYmd } from "./excelExport";
import styles from "./OrderAdmin.module.css";

const PAGE_SIZE = 20;

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
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
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

  useEffect(() => { setPage(1); }, [q, statusFilter, dateFrom, dateTo]);

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

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
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
      if (!kw) return true;
      return (
        (r.orderId || "").toLowerCase().includes(kw) ||
        (r.cliCompName || "").toLowerCase().includes(kw) ||
        (r.product || "").toLowerCase().includes(kw) ||
        (r.productLabel || "").toLowerCase().includes(kw) ||
        (r.destination || "").toLowerCase().includes(kw)
      );
    });
  }, [rows, q, statusFilter, dateFrom, dateTo]);

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
    const excelRows = filtered.map((r, i) => ({
      "번호":       filtered.length - i,
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
          placeholder="주문번호 / 발주처 / 제품코드 / 제품명 / 납품처"
          value={q}
          onChange={(e) => setQ(e.target.value)}
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
            <col width="50px" />
            <col width="120px" />
            <col width="140px" />
            <col width="156px" />
            <col width="*" />
            <col width="70px" />
            <col width="70px" />
            <col width="60px" />
            <col width="140px" />
            <col width="140px" />
            <col width="160px" />
            <col width="120px" />
            <col width="80px" />
            <col width="100px" />
          </colgroup>
          <thead>
            <tr className={styles.headRow}>
              <th>번호</th>
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
              pageItems.map((r, i) => (
                <tr
                  key={`${r.orderNum}-${r.itemNum}`}
                  className={styles.row}
                  onClick={() => setEditingRow(r)}
                  style={{ cursor: "pointer" }}
                  title="클릭해서 수정"
                >
                  <td className={styles.cellNum}>{filtered.length - ((page - 1) * PAGE_SIZE + i)}</td>
                  <td className={styles.cellMono}>{r.orderId}</td>
                  <td className={styles.cellNum}>{fmtDateTime(r.orderDate)}</td>
                  <td className={styles.cellMono}>{r.product || "-"}</td>
                  <td className={styles.cellName}>{r.productLabel || "-"}</td>
                  <td className={styles.cellNum}>{r.width ?? "-"}</td>
                  <td className={styles.cellNum}>{r.length ?? "-"}</td>
                  <td className={styles.cellNum}>{r.rolls ?? "-"}</td>
                  <td>{r.cliCompName || r.cliCode || "-"}</td>
                  <td>{r.destination || "-"}</td>
                  <td className={styles.cellNote}>{r.note || "-"}</td>
                  <td className={styles.cellNum}>{r.deliveryDate || calcDelivery(r.orderDate)}</td>
                  <td className={styles.cellNum}>
                    {r.unitPrice != null ? r.unitPrice.toLocaleString("ko-KR") : "-"}
                  </td>
                  <td className={styles.cellNum}><StatusChip status={r.status} /></td>
                </tr>
              ))
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
                스프레드시트의 해당 행도 함께 비워집니다. 되돌릴 수 없습니다.
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
