/* 관리자 - 매입처 관리 (매입처명만 관리, 보통 5개 수준) */

import { useState, useEffect } from "react";
import { AdminShell } from "./components/Layout";
import PageHeader from "./components/PageHeader";
import { PrimaryButton } from "./components/Buttons";
import { IconPlus } from "./components/Icons";
import SupplierTable from "./components/SupplierTable";
import SupplierFormModal from "./components/SupplierFormModal";
import ConfirmDialog from "./components/ConfirmDialog";
import { fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } from "./api";
import styles from "./SupplierAdmin.module.css";

export default function SupplierAdmin() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [apiError, setApiError]   = useState("");
  const [modal, setModal]         = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);

  useEffect(() => {
    fetchSuppliers()
      .then(setSuppliers)
      .catch(() => setApiError("매입처 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  const handleApiError = (err, fallback) => {
    const data = err?.response?.data;
    if (data?.errors) {
      setApiError(
        (data.message || "입력값이 올바르지 않습니다") + ": " +
        Object.values(data.errors).join(", ")
      );
    } else if (data?.message) {
      setApiError(data.message);
    } else {
      setApiError(fallback);
    }
  };

  const onSave = async (form) => {
    const snapshot = modal;
    if (!snapshot) return;
    setSaving(true);
    setApiError("");
    try {
      if (snapshot.mode === "create") {
        const created = await createSupplier(form);
        setSuppliers((arr) => [...arr, created]);
      } else {
        const updated = await updateSupplier(snapshot.item.supNum, form);
        setSuppliers((arr) =>
          arr.map((s) => (s.supNum === updated.supNum ? updated : s))
        );
      }
      setModal(null);
    } catch (err) {
      handleApiError(err, "저장 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (item) => {
    setDeleting(true);
    setApiError("");
    try {
      await deleteSupplier(item.supNum);
      setSuppliers((arr) => arr.filter((s) => s.supNum !== item.supNum));
      setConfirmDel(null);
    } catch (err) {
      handleApiError(err, "삭제 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setConfirmDel(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminShell>
      <PageHeader
        title="매입처 관리"
        subtitle="원단을 매입하는 회사 목록입니다. 보통 변동이 적은 항목이며, 원단 등록 시 매입처 드롭다운에 사용됩니다."
        actions={
          <PrimaryButton onClick={() => setModal({ mode: "create" })}>
            <IconPlus /> 매입처 등록
          </PrimaryButton>
        }
      />

      {apiError && <p className={styles.apiError}>{apiError}</p>}

      <SupplierTable
        items={suppliers}
        loading={loading}
        empty={!loading && suppliers.length === 0}
        onEdit={(item) => setModal({ mode: "edit", item })}
        onDelete={(item) => setConfirmDel(item)}
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
          title="매입처를 삭제하시겠어요?"
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
