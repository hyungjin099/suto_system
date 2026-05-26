/* 관리자 - 고객사 관리 페이지
 * - 등록(Modal) / 수정(Modal, 활동여부 라디오 포함) / 소프트 삭제(active=0) 기능
 * - 5자리 accessCode 는 후속 작업에서 생성 로직 구현 예정
 */

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
import { seedClients } from "./clientData";
import { PAGE_SIZE } from "./constants";
import styles from "./ProductAdmin.module.css";

export default function ClientAdmin() {
  const [clients, setClients] = useState(() => seedClients());
  const [filters, setFilters] = useState({ q: "", active: "" });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { mode: "create" | "edit", item? }
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [filters.q, filters.active]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return clients.filter((c) => {
      if (filters.active !== "" && String(c.active) !== filters.active)
        return false;
      if (
        q &&
        !(
          c.name.toLowerCase().includes(q) ||
          c.managerName.toLowerCase().includes(q) ||
          c.accessCode.includes(q)
        )
      )
        return false;
      return true;
    });
  }, [clients, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const onSave = (form) => {
    const snapshot = modal;
    if (!snapshot) return;
    if (snapshot.mode === "create") {
      setClients((arr) => {
        const nextId = arr.length ? Math.max(...arr.map((c) => c.id)) + 1 : 1;
        const now = new Date();
        return [
          {
            id: nextId,
            name: form.name,
            managerName: form.managerName,
            companyPhone: form.companyPhone,
            managerPhone: form.managerPhone,
            // accessCode 생성 로직은 추후 등록 기능 구현 시 작성 예정
            accessCode: "",
            active: 1,
            createdAt: now,
            updatedAt: now,
          },
          ...arr,
        ];
      });
    } else {
      const editingId = snapshot.item?.id;
      setClients((arr) =>
        arr.map((c) =>
          c.id === editingId
            ? {
                ...c,
                name: form.name,
                managerName: form.managerName,
                companyPhone: form.companyPhone,
                managerPhone: form.managerPhone,
                active: form.active,
                updatedAt: new Date(),
              }
            : c
        )
      );
    }
    setModal(null);
  };

  // 소프트 삭제: DB delete 가 아닌 active=0 으로 상태 컬럼 변경
  const onDelete = (item) => {
    setClients((arr) =>
      arr.map((c) =>
        c.id === item.id ? { ...c, active: 0, updatedAt: new Date() } : c
      )
    );
    setConfirmDel(null);
  };

  const resetFilters = () => setFilters({ q: "", active: "" });
  const hasFilters = filters.q || filters.active !== "";

  return (
    <AdminShell>
      <PageHeader
        title="고객사 관리"
        subtitle="주문 페이지 접속 URL 을 발급받은 고객사 목록입니다. 등록/수정 후 URL 을 복사하여 담당자에게 전달하세요."
        actions={
          <PrimaryButton onClick={() => setModal({ mode: "create" })}>
            <IconPlus /> 새 고객사 등록
          </PrimaryButton>
        }
      />

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
        empty={filtered.length === 0}
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
          onClose={() => setModal(null)}
          onSave={onSave}
        />
      )}

      {confirmDel && (
        <ConfirmDialog
          title="고객사를 삭제하시겠어요?"
          body={
            <>
              <div className={styles.confirmName}>{confirmDel.name}</div>
              <div className={styles.confirmCode}>
                담당자: {confirmDel.managerName} · 접속코드:{" "}
                {confirmDel.accessCode || "-"}
              </div>
              <div className={styles.confirmCode} style={{ marginTop: 6 }}>
                * 데이터는 보존되며 비활성 상태로 전환됩니다.
              </div>
            </>
          }
          confirmLabel="비활성 처리"
          danger
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => onDelete(confirmDel)}
        />
      )}
    </AdminShell>
  );
}
