/* 관리자 - 거래처 관리 페이지 */

import { useState, useMemo, useEffect } from "react";
import { AdminShell } from "./components/Layout";
import PageHeader from "./components/PageHeader";
import { PrimaryButton } from "./components/Buttons";
import { IconPlus } from "./components/Icons";
import ClientFilterBar from "./components/ClientFilterBar";
import ClientTable from "./components/ClientTable";
import Pagination from "./components/Pagination";
import ClientFormModal from "./components/ClientFormModal";
import ConfirmDialog from "./components/ConfirmDialog";
import { fetchClients, createClient, updateClient, deleteClient } from "./api";
import { PAGE_SIZE } from "./constants";
import styles from "./ProductAdmin.module.css";

export default function ClientAdmin() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [filters, setFilters] = useState({ q: "", useType: "" });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchClients()
      .then(setClients)
      .catch(() => setApiError("거래처 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filters.q, filters.useType]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return clients.filter((c) => {
      if (filters.useType && c.useType !== filters.useType) return false;
      if (
        q &&
        !(
          c.name.toLowerCase().includes(q) ||
          (c.cliCode || "").toLowerCase().includes(q) ||
          (c.managerName || "").toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });
  }, [clients, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const onSave = async (form) => {
    const snapshot = modal;
    if (!snapshot) return;
    setSaving(true);
    setApiError("");
    try {
      if (snapshot.mode === "create") {
        const created = await createClient(form);
        setClients((arr) => [created, ...arr]);
      } else {
        const updated = await updateClient(snapshot.item.cliNum, form);
        setClients((arr) =>
          arr.map((c) => (c.cliNum === updated.cliNum ? updated : c))
        );
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
      await deleteClient(item.cliNum);
      setClients((arr) => arr.filter((c) => c.cliNum !== item.cliNum));
      setConfirmDel(null);
    } catch {
      setApiError("삭제 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setDeleting(false);
    }
  };

  const resetFilters = () => setFilters({ q: "", useType: "" });
  const hasFilters = filters.q || filters.useType !== "";

  return (
    <AdminShell>
      <PageHeader
        title="거래처 관리"
        subtitle="거래처 정보를 등록하고 주문 페이지 URL을 발급합니다. 거래처코드가 주문 페이지 식별자로 사용됩니다."
        actions={
          <PrimaryButton onClick={() => setModal({ mode: "create" })}>
            <IconPlus /> 새 거래처 등록
          </PrimaryButton>
        }
      />

      {apiError && <p className={styles.apiError}>{apiError}</p>}

      <ClientFilterBar
        filters={filters}
        setFilters={setFilters}
        onReset={resetFilters}
        hasFilters={hasFilters}
        totalShown={filtered.length}
        totalAll={clients.length}
      />

      <ClientTable
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
        <ClientFormModal
          mode={modal.mode}
          initial={modal.item}
          saving={saving}
          onClose={() => setModal(null)}
          onSave={onSave}
        />
      )}

      {confirmDel && (
        <ConfirmDialog
          title="거래처를 삭제하시겠어요?"
          body={
            <>
              <div className={styles.confirmName}>{confirmDel.name}</div>
              <div className={styles.confirmCode}>
                거래처코드: {confirmDel.cliCode || "-"}
              </div>
            </>
          }
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
