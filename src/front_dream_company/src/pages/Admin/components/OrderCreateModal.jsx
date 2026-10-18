/* 관리자 - 새 주문 추가 모달
 * 발주일은 백엔드가 SYSDATE()로 자동 부여 (전송 안 함)
 * 저장 시 기존 신규 주문 흐름(/api/orders)을 그대로 타서 DB + 시트 동시 반영
 */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Select, { components as rsComponents } from "react-select";
import ModalShell from "./ModalShell";
import { IconX } from "./Icons";
import { fetchClientDestinations } from "../api";
import styles from "./OrderCreateModal.module.css";

/* react-select 공통 스타일 — 모달 내 인풋 높이·테마와 통일 */
const rsStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 36,
    height: 36,
    borderColor: state.isFocused
      ? "var(--brand, #1b3a2a)"
      : "var(--line, #d7ddda)",
    boxShadow: "none",
    "&:hover": { borderColor: "var(--brand, #1b3a2a)" },
    borderRadius: 8,
    fontSize: 13.5,
  }),
  valueContainer: (base) => ({ ...base, padding: "0 10px" }),
  input: (base) => ({ ...base, margin: 0, padding: 0 }),
  indicatorsContainer: (base) => ({ ...base, height: 34 }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "var(--brand, #1b3a2a)"
      : state.isFocused
      ? "var(--brand-soft, #f3f7f4)"
      : "white",
    color: state.isSelected ? "white" : "var(--ink, #1a1a1a)",
    cursor: "pointer",
    fontSize: 13,
  }),
  menu: (base) => ({ ...base, zIndex: 30 }),
  menuPortal: (base) => ({ ...base, zIndex: 60 }),
};

const filterByFields = (fields) => (candidate, rawInput) => {
  if (!rawInput) return true;
  const q = rawInput.toLowerCase().trim();
  return fields.some((k) =>
    String(candidate.data[k] || "").toLowerCase().includes(q)
  );
};

/* 제품 옵션 커스텀 렌더 — [원단코드] 뱃지 + 원단명 */
const FabricOption = (p) => (
  <rsComponents.Option {...p}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <span
        style={{
          fontSize: 11,
          padding: "1px 7px",
          borderRadius: 4,
          background: "var(--brand-soft, #e8f0ec)",
          color: "var(--brand-ink, #1b3a2a)",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {p.data.prodCode}
      </span>
      <span>{p.data.label}</span>
    </div>
  </rsComponents.Option>
);
const FabricSingleValue = (p) => (
  <rsComponents.SingleValue {...p}>
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          fontSize: 10.5,
          padding: "1px 6px",
          borderRadius: 4,
          background: "var(--brand-soft, #e8f0ec)",
          color: "var(--brand-ink, #1b3a2a)",
          fontWeight: 700,
        }}
      >
        {p.data.prodCode}
      </span>
      <span>{p.data.label}</span>
    </span>
  </rsComponents.SingleValue>
);

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function newItem() {
  return {
    _id: Math.random().toString(36).slice(2),
    product: "",
    productLabel: "",
    width: "",
    length: "",
    rolls: 1,
    destination: "",
    note: "",
  };
}

export default function OrderCreateModal({ clients, onClose, onCreated, saving, setSaving }) {
  const [cliCode, setCliCode] = useState("");
  const [items, setItems] = useState([newItem()]);
  const [fabricOptions, setFabricOptions] = useState([]);
  const [fabricsLoading, setFabricsLoading] = useState(false);
  const [destinations, setDestinations] = useState([]);
  const [error, setError] = useState("");

  const selectedClient = useMemo(
    () => clients.find((c) => c.cliCode === cliCode),
    [clients, cliCode]
  );

  const clientOptions = useMemo(
    () =>
      clients.map((c) => ({
        value: c.cliCode,
        label: `${c.name} (${c.cliCode})`,
        name: c.name,
        cliCode: c.cliCode,
      })),
    [clients]
  );
  const selectedClientOption =
    clientOptions.find((o) => o.value === cliCode) || null;

  useEffect(() => {
    if (!cliCode) { setDestinations([]); return; }
    fetchClientDestinations(cliCode).then(setDestinations).catch(() => setDestinations([]));
  }, [cliCode]);

  useEffect(() => {
    if (!cliCode) { setFabricOptions([]); return; }
    setFabricsLoading(true);
    axios
      .get(`${BASE_URL}/api/clients/${cliCode}/fabrics`)
      .then((res) =>
        setFabricOptions(
          res.data.map((f) => ({
            value: f.prodCode,
            label: f.aliasName,
            prodCode: f.prodCode,
            prodName: f.prodName,
            price: f.clientFabPrice,
          }))
        )
      )
      .catch(() => setFabricOptions([]))
      .finally(() => setFabricsLoading(false));
  }, [cliCode]);

  const setItem = (id, patch) =>
    setItems((arr) => arr.map((it) => (it._id === id ? { ...it, ...patch } : it)));

  const onPickFabric = (id, prodCode) => {
    const fab = fabricOptions.find((f) => f.value === prodCode);
    setItem(id, { product: prodCode, productLabel: fab?.prodName || prodCode });
  };

  const addItem = () => setItems((arr) => [...arr, newItem()]);
  const removeItem = (id) =>
    setItems((arr) => (arr.length <= 1 ? arr : arr.filter((it) => it._id !== id)));

  const submit = async (e) => {
    e?.preventDefault();
    setError("");
    if (!cliCode) { setError("거래처를 선택해 주세요."); return; }
    if (items.length === 0) { setError("품목을 1개 이상 추가해 주세요."); return; }
    for (const it of items) {
      if (!it.product?.trim()) { setError("모든 품목의 제품을 선택해 주세요."); return; }
      if (!Number.isFinite(+it.rolls) || +it.rolls < 1) {
        setError("롤수는 1 이상이어야 합니다."); return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        cliCode,
        clientName: selectedClient?.name || "",
        managerPhone: selectedClient?.managerPhone || "",
        items: items.map((it) => ({
          product: it.product,
          productLabel: it.productLabel || it.product,
          width: parseInt(it.width, 10) || 0,
          length: parseInt(it.length, 10) || 0,
          rolls: parseInt(it.rolls, 10) || 1,
          destination: (it.destination || "").trim() || selectedClient?.name || "",
          note: (it.note || "").trim(),
        })),
      };
      const res = await axios.post(`${BASE_URL}/api/orders`, payload);
      onCreated?.(res.data?.orderId);
    } catch (err) {
      setError(err?.response?.data?.message || "주문 추가 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell onClose={onClose} maxWidth={720}>
      <form onSubmit={submit} className={styles.form}>
        {/* 헤더 */}
        <div className={styles.header}>
          <div className={styles.headerText}>
            <span className={styles.eyebrow}>NEW ORDER</span>
            <h3 className={styles.title}>새 주문 추가</h3>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn} aria-label="닫기">
            <IconX />
          </button>
        </div>

        {/* 본문 */}
        <div className={styles.body}>
          {/* 거래처 섹션 */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleWrap}>
                <span className={styles.sectionEyebrow}>SECTION 01</span>
                <h4 className={styles.sectionTitle}>거래처 선택</h4>
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>거래처</label>
              <Select
                value={selectedClientOption}
                onChange={(opt) => setCliCode(opt ? opt.value : "")}
                options={clientOptions}
                placeholder="거래처명 또는 코드로 검색"
                isClearable
                isSearchable
                filterOption={filterByFields(["name", "cliCode", "label"])}
                styles={rsStyles}
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                noOptionsMessage={() => "일치하는 거래처가 없습니다"}
              />
            </div>
          </section>

          {/* 품목 섹션 */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleWrap}>
                <span className={styles.sectionEyebrow}>SECTION 02</span>
                <h4 className={styles.sectionTitle}>품목 ({items.length}개)</h4>
              </div>
              <button type="button" onClick={addItem} className={styles.addItemBtn}>
                + 품목 추가
              </button>
            </div>

            <div className={styles.itemsList}>
              {items.map((it, idx) => (
                <div key={it._id} className={styles.itemCard}>
                  <div className={styles.itemHead}>
                    <span className={styles.itemBadge}>{String(idx + 1).padStart(2, "0")}</span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(it._id)}
                        className={styles.itemRemove}
                      >
                        품목 삭제
                      </button>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>제품</label>
                    <Select
                      value={fabricOptions.find((f) => f.value === it.product) || null}
                      onChange={(opt) => onPickFabric(it._id, opt ? opt.value : "")}
                      options={fabricOptions}
                      placeholder={
                        !cliCode
                          ? "거래처를 먼저 선택"
                          : fabricsLoading
                          ? "불러오는 중…"
                          : "원단코드 또는 이름으로 검색"
                      }
                      isDisabled={!cliCode || fabricsLoading}
                      isClearable
                      isSearchable
                      filterOption={filterByFields(["label", "prodCode", "prodName"])}
                      components={{ Option: FabricOption, SingleValue: FabricSingleValue }}
                      styles={rsStyles}
                      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                      noOptionsMessage={() => "일치하는 제품이 없습니다"}
                    />
                  </div>

                  <div className={styles.row3}>
                    <div className={styles.field}>
                      <label className={styles.label}>폭 (mm)</label>
                      <input
                        className={styles.input}
                        inputMode="numeric"
                        value={it.width}
                        onChange={(e) =>
                          setItem(it._id, { width: e.target.value.replace(/[^\d]/g, "") })
                        }
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>길이 (m)</label>
                      <input
                        className={styles.input}
                        inputMode="numeric"
                        value={it.length}
                        onChange={(e) =>
                          setItem(it._id, { length: e.target.value.replace(/[^\d]/g, "") })
                        }
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>롤수</label>
                      <input
                        className={styles.input}
                        inputMode="numeric"
                        value={it.rolls}
                        onChange={(e) =>
                          setItem(it._id, { rolls: e.target.value.replace(/[^\d]/g, "") })
                        }
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>
                      납품처 <span className={styles.hint}>비우면 거래처명으로 입력</span>
                    </label>
                    <input
                      className={styles.input}
                      value={it.destination}
                      onChange={(e) => setItem(it._id, { destination: e.target.value })}
                      list="admin-create-destinations"
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>비고</label>
                    <input
                      className={styles.input}
                      value={it.note}
                      onChange={(e) => setItem(it._id, { note: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {error && <div className={styles.errorBox}>{error}</div>}
        </div>

        <datalist id="admin-create-destinations">
          {destinations.map((d) => <option key={d} value={d} />)}
        </datalist>

        {/* 푸터 */}
        <div className={styles.footer}>
          <button type="button" onClick={onClose} disabled={saving} className={styles.btnCancel}>
            취소
          </button>
          <button type="submit" disabled={saving} className={styles.btnSubmit}>
            {saving ? "저장 중…" : "주문 추가"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
