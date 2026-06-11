/* 관리자 - 입고처 관리 */

import { useState, useMemo, useEffect } from "react";
import { AdminShell } from "./components/Layout";
import PageHeader from "./components/PageHeader";
import { PrimaryButton } from "./components/Buttons";
import { IconPlus } from "./components/Icons";
import SupplierTable from "./components/SupplierTable";
import SupplierFormModal from "./components/SupplierFormModal";
import ConfirmDialog from "./components/ConfirmDialog";
import Pagination from "./components/Pagination";
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from "./api";
import styles from "./SupplierAdmin.module.css";

const PAGE_SIZE = 10;

export default function SupplierAdmin() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [apiError, setApiError]   = useState("");
  const [q, setQ]                 = useState("");
  const [page, setPage]           = useState(1);
  const [modal, setModal]         = useState(null); // { mode: "create" | "edit", item? }
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);

  useEffect(() => {
    fetchSuppliers()
      .then(setSuppliers)
      .catch(() => setApiError("입고처 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); }, [q]);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(kw) ||
        (s.managerName && s.managerName.toLowerCase().includes(kw))
    );
  }, [suppliers, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const onSave = async (form) => {
    const snapshot = modal;
    if (!snapshot) return;
    setSaving(true);
    setApiError("");
    try {
      if (snapshot.mode === "create") {
        const created = await createSupplier(form);
        setSuppliers((arr) => [created, ...arr]);
      } else {
        const updated = await updateSupplier(snapshot.item.supNum, form);
        setSuppliers((arr) => arr.map((s) => (s.id === updated.id ? updated : s)));
      }
      setModal(null);
    } catch {
      setApiError("저장 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (item) => {
    setDeleting(true);
    setApiError("");
    try {
      await deleteSupplier(item.supNum);
      setSuppliers((arr) => arr.filter((s) => s.id !== item.id));
      setConfirmDel(null);
    } catch {
      setApiError("삭제 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminShell>
      <PageHeader
        title="입고처 관리"
        subtitle="원단을 공급받는 입고처 정보를 등록하고 관리합니다."
        actions={
          <PrimaryButton onClick={() => setModal({ mode: "create" })}>
            <IconPlus /> 입고처 등록
          </PrimaryButton>
        }
      />

      {apiError && <p className={styles.apiError}>{apiError}</p>}

      {/* 검색 */}
      <div className={styles.searchBar}>
        <input
          className={styles.searchInput}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="입고처명 또는 담당자명으로 검색"
        />
        <span className={styles.countLabel}>
          {filtered.length}개 / 전체 {suppliers.length}개
        </span>
      </div>

      <SupplierTable
        items={pageItems}
        loading={loading}
        empty={!loading && filtered.length === 0}
        onEdit={(item) => setModal({ mode: "edit", item })}
        onDelete={(item) => setConfirmDel(item)}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        total={filtered.length}
        onChange={setPage}
      />

      {modal && (
        <SupplierFormModal
          mode={modal.mode}
          initial={modal.item}
          saving={saving}
          onClose={() => setModal(null)}
          onSave={onSave}
        />
      )}

      {confirmDel && (
        <ConfirmDialog
          title="입고처를 삭제하시겠어요?"
          body={<div className={styles.confirmName}>{confirmDel.name}</div>}
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
