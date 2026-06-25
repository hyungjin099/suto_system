/* 관리자 - 거래처 관리 페이지 (삭제 기능 없음 — 사용구분으로 비활성 관리) */

import { useState, useMemo, useEffect } from "react";
import { AdminShell } from "./components/Layout";
import PageHeader from "./components/PageHeader";
import { PrimaryButton } from "./components/Buttons";
import { IconPlus } from "./components/Icons";
import ClientFilterBar from "./components/ClientFilterBar";
import ClientTable from "./components/ClientTable";
import Pagination from "./components/Pagination";
import ClientFormModal from "./components/ClientFormModal";
import { fetchClients, createClient, updateClient, resetClientPassword } from "./api";
import styles from "./ProductAdmin.module.css";

const PAGE_SIZE = 15;

export default function ClientAdmin() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [filters, setFilters] = useState({ q: "", useType: "" }); // useType: ""(전체) | "YES" | "NO"
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

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
    } catch (err) {
      const data = err?.response?.data;
      let msg = "저장 중 오류가 발생했습니다. 다시 시도해 주세요.";
      if (data?.errors) {
        msg =
          (data.message || "입력값이 올바르지 않습니다") +
          ": " +
          Object.values(data.errors).join(", ");
      } else if (data?.message) {
        msg = data.message;
      }
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  };

  const resetFilters = () => setFilters({ q: "", useType: "" });
  const hasFilters = filters.q || filters.useType !== "";

  return (
    <AdminShell>
      <PageHeader
        title="거래처 관리"
        subtitle={
          <>
            거래처 정보를 등록하고 주문 페이지 URL을 발급합니다. 거래처코드가 주문 페이지 식별자로 사용됩니다.
            <br />
            거래처정보, 담당자 정보를 클릭하면 상세 정보를 확인 할 수 있습니다.
          </>
        }
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
        onResetPassword={async (item) => {
          if (!window.confirm(`${item.name}의 비밀번호를 '1234'로 초기화합니다.\n계속하시겠어요?`)) return;
          try {
            await resetClientPassword(item.cliNum);
            alert("비밀번호가 '1234'로 초기화되었습니다.");
          } catch (err) {
            alert(err?.response?.data?.message || "초기화 중 오류가 발생했습니다.");
          }
        }}
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
    </AdminShell>
  );
}
