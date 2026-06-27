/* 관리자 - 새 주문 추가 모달
 * 발주일은 백엔드가 SYSDATE()로 자동 부여 (전송 안 함)
 * 저장 시 기존 신규 주문 흐름(/api/orders)을 그대로 타서 DB + 시트 동시 반영
 */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ModalShell from "./ModalShell";
import { IconX } from "./Icons";
import styles from "./OrderCreateModal.module.css";

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
  const [error, setError] = useState("");

  const selectedClient = useMemo(
    () => clients.find((c) => c.cliCode === cliCode),
    [clients, cliCode]
  );

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
            <p className={styles.subtitle}>
              발주일은 등록 시각으로 자동 부여되고, 저장과 동시에 스프레드시트에도 반영됩니다.
            </p>
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
              <select
                className={styles.select}
                value={cliCode}
                onChange={(e) => setCliCode(e.target.value)}
              >
                <option value="">선택하세요</option>
                {clients.map((c) => (
                  <option key={c.cliCode} value={c.cliCode}>
                    {c.name} ({c.cliCode})
                  </option>
                ))}
              </select>
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
                    <select
                      className={styles.select}
                      value={it.product}
                      onChange={(e) => onPickFabric(it._id, e.target.value)}
                      disabled={!cliCode || fabricsLoading}
                    >
                      <option value="">
                        {!cliCode
                          ? "거래처를 먼저 선택"
                          : fabricsLoading
                          ? "불러오는 중…"
                          : "제품 선택"}
                      </option>
                      {fabricOptions.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label} ({f.prodName})
                        </option>
                      ))}
                    </select>
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
