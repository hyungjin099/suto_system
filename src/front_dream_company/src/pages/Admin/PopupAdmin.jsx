/* 관리자 - 고객 주문 페이지 팝업 관리
 * - 고객에게는 동시에 1개만 노출된다 (대상에 해당하는 팝업 중 가장 최근 등록 건)
 */

import { useState, useEffect, useMemo } from "react";
import { AdminShell } from "./components/Layout";
import PageHeader from "./components/PageHeader";
import { PrimaryButton } from "./components/Buttons";
import { IconPlus, IconEdit, IconTrash } from "./components/Icons";
import PopupFormModal from "./components/PopupFormModal";
import ConfirmDialog from "./components/ConfirmDialog";
import { fetchPopups, createPopup, updatePopup, setPopupUse, deletePopup } from "./api";
import styles from "./PopupAdmin.module.css";

const pad = (n) => String(n).padStart(2, "0");
const fmt = (d) =>
  d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}` : "-";

function statusOf(p, now) {
  if (!p.use) return { key: "off", label: "사용 안 함" };
  if (now < p.startAt) return { key: "wait", label: "예정" };
  if (now > p.endAt) return { key: "end", label: "종료" };
  return { key: "on", label: "노출 중" };
}

// 사용 중이고 기간·대상이 겹치는 다른 팝업이 있는가 (고객에게는 그중 최신 1건만 보인다)
function overlaps(a, b) {
  if (!a.use || !b.use) return false;
  if (a.startAt > b.endAt || b.startAt > a.endAt) return false;
  if (a.targetAll || b.targetAll) return true;
  return a.cliCodes.some((c) => b.cliCodes.includes(c));
}

export default function PopupAdmin() {
  const [popups, setPopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [modal, setModal] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [conflict, setConflict] = useState(null); // { list, retry }
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const now = new Date();

  useEffect(() => {
    fetchPopups()
      .then(setPopups)
      .catch(() => setApiError("팝업 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  const overlapSet = useMemo(() => {
    const s = new Set();
    popups.forEach((a) => {
      if (popups.some((b) => b.popupNum !== a.popupNum && overlaps(a, b))) s.add(a.popupNum);
    });
    return s;
  }, [popups]);

  const handleApiError = (err, fallback) => {
    const data = err?.response?.data;
    if (data?.errors) {
      setApiError((data.message || "입력값이 올바르지 않습니다") + ": " + Object.values(data.errors).join(", "));
    } else if (data?.message) {
      setApiError(data.message);
    } else {
      setApiError(fallback);
    }
  };

  // 409(POPUP_CONFLICT)면 충돌 안내 모달을 띄우고, 확인 시 retry 를 replace=true 로 다시 실행한다
  const askConflict = (err, retry) => {
    const data = err?.response?.data;
    if (err?.response?.status === 409 && data?.code === "POPUP_CONFLICT") {
      setConflict({ list: data.conflicts || [], retry });
      return true;
    }
    return false;
  };

  const onSave = async (form, replace = false) => {
    const snapshot = modal;
    if (!snapshot) return;
    setSaving(true);
    setApiError("");
    try {
      if (snapshot.mode === "create") {
        const created = await createPopup({ ...form, replaceConflicts: replace });
        setPopups((arr) => [created, ...arr]);
      } else {
        const updated = await updatePopup(snapshot.item.popupNum, { ...form, replaceConflicts: replace });
        setPopups((arr) => arr.map((p) => (p.popupNum === updated.popupNum ? updated : p)));
      }
      if (replace) setPopups(await fetchPopups());   // 교체된 팝업의 사용 상태 반영
      setModal(null);
    } catch (err) {
      if (!askConflict(err, () => onSave(form, true))) {
        handleApiError(err, "저장 중 오류가 발생했습니다. 다시 시도해 주세요.");
      }
    } finally {
      setSaving(false);
    }
  };

  const onToggleUse = async (p, replace = false) => {
    setApiError("");
    try {
      const updated = await setPopupUse(p.popupNum, !p.use, replace);
      setPopups((arr) => arr.map((x) => (x.popupNum === updated.popupNum ? updated : x)));
      if (replace) setPopups(await fetchPopups());
    } catch (err) {
      if (!askConflict(err, () => onToggleUse(p, true))) {
        handleApiError(err, "변경 중 오류가 발생했습니다.");
      }
    }
  };

  const onDelete = async (item) => {
    setDeleting(true);
    setApiError("");
    try {
      await deletePopup(item.popupNum);
      setPopups((arr) => arr.filter((p) => p.popupNum !== item.popupNum));
    } catch (err) {
      handleApiError(err, "삭제 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setConfirmDel(null);
      setDeleting(false);
    }
  };

  const targetText = (p) => (p.targetAll ? "전체 거래처" : `선택 ${p.cliCodes.length}곳`);

  return (
    <AdminShell>
      <PageHeader
        title="팝업 관리"
        subtitle="고객 주문 페이지(주문하기 화면)에 띄우는 공지입니다. 고객에게는 동시에 1개만 보이며, 해당되는 팝업이 여러 개면 가장 최근에 등록한 것이 보입니다."
        actions={
          <PrimaryButton onClick={() => setModal({ mode: "create" })}>
            <IconPlus /> 팝업 등록
          </PrimaryButton>
        }
      />

      {apiError && <p className={styles.apiError}>{apiError}</p>}

      <div className={styles.wrap}>
        <table className={styles.table}>
          <colgroup>
            <col width="100px" />
            <col width="*" />
            <col width="290px" />
            <col width="120px" />
            <col width="250px" />
          </colgroup>
          <thead>
            <tr className={styles.headRow}>
              <th className={styles.th}>상태</th>
              <th className={styles.th}>제목</th>
              <th className={styles.th}>노출 기간</th>
              <th className={styles.th}>대상</th>
              <th className={styles.th} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className={styles.stateCell}>불러오는 중…</td></tr>
            ) : popups.length === 0 ? (
              <tr><td colSpan={5} className={styles.stateCell}>등록된 팝업이 없습니다. 우측 상단 버튼으로 등록해 주세요.</td></tr>
            ) : (
              popups.map((p) => {
                const st = statusOf(p, now);
                return (
                  <tr key={p.popupNum} className={styles.row}>
                    <td className={styles.cellCenter}>
                      <span className={`${styles.badge} ${styles["badge_" + st.key]}`}>{st.label}</span>
                    </td>
                    <td className={styles.cellTitle}>
                      <div className={styles.titleInner}>
                      <span className={styles.titleText}>{p.title}</span>
                      {overlapSet.has(p.popupNum) && (
                        <span
                          className={styles.warn}
                          title="사용 중인 다른 팝업과 기간·대상이 겹칩니다. 겹치는 거래처에는 가장 최근에 등록한 팝업 1개만 보입니다."
                        >
                          ⚠ 겹침
                        </span>
                      )}
                      </div>
                    </td>
                    <td className={styles.cellDate}>{fmt(p.startAt)} ~ {fmt(p.endAt)}</td>
                    <td className={styles.cellCenter}>{targetText(p)}</td>
                    <td className={styles.cellActions}>
                      <div className={styles.actions}>
                        <button type="button" className={styles.actionBtn} onClick={() => onToggleUse(p)}>
                          {p.use ? "사용 중지" : "사용"}
                        </button>
                        <button type="button" className={styles.actionBtn} onClick={() => setModal({ mode: "edit", item: p })}>
                          <IconEdit /><span>수정</span>
                        </button>
                        <button type="button" className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => setConfirmDel(p)}>
                          <IconTrash /><span>삭제</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <PopupFormModal
          mode={modal.mode}
          initial={modal.item}
          saving={saving}
          escDisabled={!!conflict}
          onClose={() => setModal(null)}
          onSave={onSave}
        />
      )}

      {conflict && (
        <ConfirmDialog
          title="사용 중인 다른 팝업과 겹칩니다"
          body={
            <div>
              <p className={styles.conflictLead}>
                아래 팝업이 같은 기간·대상으로 사용 중입니다. 고객에게는 팝업이 1개만 보이므로 함께 사용할 수 없습니다.
              </p>
              <ul className={styles.conflictList}>
                {conflict.list.map((c) => (
                  <li key={c.popupNum}>
                    <strong>{c.title}</strong>
                    <span>{fmt(new Date(c.startAt))} ~ {fmt(new Date(c.endAt))}</span>
                  </li>
                ))}
              </ul>
              <p className={styles.conflictLead}>기존 팝업을 사용 중지하고 이 팝업을 사용할까요?</p>
            </div>
          }
          confirmLabel="기존 팝업 중지하고 사용"
          onCancel={() => setConflict(null)}
          onConfirm={() => {
            const retry = conflict.retry;
            setConflict(null);
            retry();
          }}
        />
      )}

      {confirmDel && (
        <ConfirmDialog
          title="팝업을 삭제하시겠어요?"
          body={<div className={styles.confirmName}>{confirmDel.title}</div>}
          confirmLabel={deleting ? "삭제 중…" : "삭제"}
          danger
          disabled={deleting}
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => onDelete(confirmDel)}
        />
      )}
    </AdminShell>
  );
}
