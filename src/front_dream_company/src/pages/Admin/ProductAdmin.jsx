/* 관리자 - 제품(원단) 카탈로그 관리 */

import { useState, useMemo, useEffect } from "react";
import { AdminShell } from "./components/Layout";
import PageHeader from "./components/PageHeader";
import { PrimaryButton } from "./components/Buttons";
import { IconPlus } from "./components/Icons";
import FilterBar from "./components/FilterBar";
import ProductTable from "./components/ProductTable";
import Pagination from "./components/Pagination";
import ProductFormModal from "./components/ProductFormModal";
import ConfirmDialog from "./components/ConfirmDialog";
import { seedProducts, PAGE_SIZE } from "./constants";
import styles from "./ProductAdmin.module.css";

export default function ProductAdmin() {
  const [products, setProducts] = useState(() => seedProducts());
  const [filters, setFilters] = useState({
    category: "",
    q: "",
    priceMin: "",
    priceMax: "",
  });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { mode: "create" | "edit", item? }
  const [confirmDel, setConfirmDel] = useState(null);

  // 필터 변경 시 1페이지로 리셋
  useEffect(() => {
    setPage(1);
  }, [filters.category, filters.q, filters.priceMin, filters.priceMax]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const min = filters.priceMin ? parseInt(filters.priceMin, 10) : null;
    const max = filters.priceMax ? parseInt(filters.priceMax, 10) : null;
    return products.filter((p) => {
      if (filters.category && p.category !== filters.category) return false;
      if (
        q &&
        !(
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q)
        )
      )
        return false;
      if (min != null && p.price < min) return false;
      if (max != null && p.price > max) return false;
      return true;
    });
  }, [products, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const onSave = (form) => {
    // modal 값을 로컬에 캡처: setModal(null) 이후 비동기 updater 안에서
    // modal.item 을 다시 읽어 null 참조가 되는 경우를 방지.
    const snapshot = modal;
    if (!snapshot) return;
    if (snapshot.mode === "create") {
      setProducts((arr) => [
        { id: "p" + Date.now(), ...form, updatedAt: new Date() },
        ...arr,
      ]);
    } else {
      const editingId = snapshot.item?.id;
      setProducts((arr) =>
        arr.map((p) =>
          p.id === editingId ? { ...p, ...form, updatedAt: new Date() } : p
        )
      );
    }
    setModal(null);
  };

  const onDelete = (item) => {
    setProducts((arr) => arr.filter((p) => p.id !== item.id));
    setConfirmDel(null);
  };

  const resetFilters = () =>
    setFilters({ category: "", q: "", priceMin: "", priceMax: "" });
  const hasFilters =
    filters.category || filters.q || filters.priceMin || filters.priceMax;

  return (
    <AdminShell>
      <PageHeader
        title="제품 관리"
        subtitle="본사로부터 입고된 스티커 원단 카탈로그입니다. 인쇄소 주문 시 이 목록에서 제품을 선택합니다."
        actions={
          <PrimaryButton onClick={() => setModal({ mode: "create" })}>
            <IconPlus /> 새 원단 등록
          </PrimaryButton>
        }
      />

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        onReset={resetFilters}
        hasFilters={hasFilters}
        totalShown={filtered.length}
        totalAll={products.length}
      />

      <ProductTable
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
        <ProductFormModal
          mode={modal.mode}
          initial={modal.item}
          existingCodes={products
            .filter((p) => !modal?.item || p.id !== modal.item.id)
            .map((p) => p.code)}
          onClose={() => setModal(null)}
          onSave={onSave}
        />
      )}

      {confirmDel && (
        <ConfirmDialog
          title="원단을 삭제하시겠어요?"
          body={
            <>
              <div className={styles.confirmName}>{confirmDel.name}</div>
              <div className={styles.confirmCode}>{confirmDel.code}</div>
            </>
          }
          confirmLabel="삭제"
          danger
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => onDelete(confirmDel)}
        />
      )}
    </AdminShell>
  );
}
