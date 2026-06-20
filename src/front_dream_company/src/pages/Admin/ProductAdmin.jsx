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
import { PAGE_SIZE } from "./constants";
import { fetchProducts, createProduct, updateProduct, deleteProduct } from "./api";
import styles from "./ProductAdmin.module.css";

export default function ProductAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [filters, setFilters] = useState({
    q: "",
    priceMin: "",
    priceMax: "",
  });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { mode: "create" | "edit", item? }
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setApiError("제품 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  // 필터 변경 시 1페이지로 리셋
  useEffect(() => {
    setPage(1);
  }, [filters.q, filters.priceMin, filters.priceMax]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const min = filters.priceMin ? parseInt(filters.priceMin, 10) : null;
    const max = filters.priceMax ? parseInt(filters.priceMax, 10) : null;
    return products.filter((p) => {
      if (q && !(p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)))
        return false;
      if (min != null && p.price != null && p.price < min) return false;
      if (max != null && p.price != null && p.price > max) return false;
      return true;
    });
  }, [products, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const onSave = async (form) => {
    const snapshot = modal;
    if (!snapshot) return;
    setSaving(true);
    setApiError("");
    try {
      if (snapshot.mode === "create") {
        const created = await createProduct(form);
        setProducts((arr) => [created, ...arr]);
      } else {
        const updated = await updateProduct(snapshot.item.prodNum, form);
        setProducts((arr) => arr.map((p) => (p.id === updated.id ? updated : p)));
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
      await deleteProduct(item.prodNum);
      setProducts((arr) => arr.filter((p) => p.id !== item.id));
      setConfirmDel(null);
    } catch {
      setApiError("삭제 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setDeleting(false);
    }
  };

  const resetFilters = () =>
    setFilters({ q: "", priceMin: "", priceMax: "" });
  const hasFilters =
    filters.q || filters.priceMin || filters.priceMax;

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

      {apiError && <p className={styles.apiError}>{apiError}</p>}

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
        <ProductFormModal
          mode={modal.mode}
          initial={modal.item}
          existingCodes={products
            .filter((p) => !modal?.item || p.id !== modal.item.id)
            .map((p) => p.code)}
          saving={saving}
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
