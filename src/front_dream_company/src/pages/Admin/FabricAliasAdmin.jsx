/* 관리자 - 거래처 별칭 관리
 * 좌: 거래처 목록(검색) / 우: 공식원단 트리(체크박스로 일괄등록) + 매칭된 원단 카드
 * 하나의 원단에 별칭 여러 개 등록 가능 (2026-07 정책)
 * 좌측 패널: 드래그앤드롭 → 체크박스 트리 방식으로 변경 (2026-08)
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { AdminShell } from "./components/Layout";
import PageHeader from "./components/PageHeader";
import ConfirmDialog from "./components/ConfirmDialog";
import { IconX, IconEdit, IconSearch } from "./components/Icons";
import { cx } from "./utils";
import {
  fetchClients,
  fetchProducts,
  fetchAliases,
  fetchAliasCounts,
  createAlias,
  updateAlias,
  deleteAlias,
  createAliasesBulk,
} from "./api";
import styles from "./FabricAliasAdmin.module.css";

const UNGROUPED_LABEL = "매입처 미지정";

export default function FabricAliasAdmin() {
  // ── 데이터 ───────────────────────────────────────────────
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState("");

  const [allFabrics, setAllFabrics] = useState([]);
  const [fabricsLoading, setFabricsLoading] = useState(true);

  // aliasesByProdNum: { [prodNum]: [{ aliasNum, aliasName, price }, ...] }
  const [aliasesByProdNum, setAliasesByProdNum] = useState({});
  const [aliasLoading, setAliasLoading] = useState(false);
  const [aliasCounts, setAliasCounts] = useState({});
  const [apiError, setApiError] = useState("");

  const [selectedClientId, setSelectedClientId] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [leftSearch, setLeftSearch] = useState("");
  const [rightSearch, setRightSearch] = useState("");

  // 좌측 체크박스로 선택된 원단 prodNum 집합
  const [selectedProdNums, setSelectedProdNums] = useState(new Set());
  // 매입처 그룹 접기/펴기 상태 (default: 모두 펼침)
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkResult, setBulkResult] = useState(null); // { created, skipped }

  // 개별 별칭 추가 (우측 카드의 "+ 별칭 추가" 버튼용)
  const [pending, setPending] = useState(null);

  // 별칭 수정
  const [editingAliasNum, setEditingAliasNum] = useState(null);
  const [editingAlias, setEditingAlias] = useState("");
  const [editingPrice, setEditingPrice] = useState("");
  const [editingError, setEditingError] = useState("");

  // 별칭 삭제 확인
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const pendingInputRef = useRef(null);
  const editingInputRef = useRef(null);

  // ── 초기 로드 ───────────────────────────────────────────
  useEffect(() => {
    fetchClients()
      .then((arr) => {
        const active = arr.filter((c) => c.useType === "YES" || c.useType === "등록");
        setClients(active);
        if (active.length > 0) setSelectedClientId(active[0].cliNum);
      })
      .catch(() => setClientsError("거래처 목록을 불러오지 못했습니다."))
      .finally(() => setClientsLoading(false));

    fetchAliasCounts().then(setAliasCounts).catch(() => {});

    fetchProducts()
      .then((arr) =>
        setAllFabrics(
          arr.map((p) => ({
            id: String(p.prodNum),
            prodNum: p.prodNum,
            code: p.code,
            name: p.name,
            manufacturer: p.manufacturer,
            price: p.price,
            status: p.status || "사용",
          }))
        )
      )
      .catch(() => setApiError("원단 목록을 불러오지 못했습니다."))
      .finally(() => setFabricsLoading(false));
  }, []);

  // ── 거래처 선택 시 별칭 로드 ────────────────────────────
  useEffect(() => {
    if (!selectedClientId) {
      setAliasesByProdNum({});
      return;
    }
    setAliasLoading(true);
    fetchAliases(selectedClientId)
      .then((list) => {
        const grouped = {};
        list.forEach((a) => {
          if (!grouped[a.prodNum]) grouped[a.prodNum] = [];
          grouped[a.prodNum].push({
            aliasNum: a.aliasNum,
            aliasName: a.aliasName,
            price: a.price,
          });
        });
        setAliasesByProdNum(grouped);
      })
      .catch(() => setApiError("별칭 목록을 불러오지 못했습니다."))
      .finally(() => setAliasLoading(false));
  }, [selectedClientId]);

  const selectedClient = clients.find((c) => c.cliNum === selectedClientId);

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, clientSearch]);

  // 별칭 0개 = 미매칭(좌), 1개 이상 = 매칭됨(우)
  const { mappedFabrics, unmappedFabrics } = useMemo(() => {
    const mapped = [];
    const unmapped = [];
    allFabrics.forEach((f) => {
      const list = aliasesByProdNum[f.prodNum] || [];
      if (list.length > 0) mapped.push(f);
      else unmapped.push(f);
    });
    return { mappedFabrics: mapped, unmappedFabrics: unmapped };
  }, [allFabrics, aliasesByProdNum]);

  // 좌측 트리: 매입처별 그룹핑 + 검색 필터
  const groupedTree = useMemo(() => {
    const q = leftSearch.trim().toLowerCase();
    const groups = new Map(); // manufacturer -> fabric[]
    unmappedFabrics.forEach((f) => {
      if (f.status === "미사용") return; // 미사용 원단은 표시 안 함
      if (q) {
        const hit = (f.code || "").toLowerCase().includes(q) || (f.name || "").toLowerCase().includes(q);
        if (!hit) return;
      }
      const key = f.manufacturer || UNGROUPED_LABEL;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(f);
    });
    // 매입처 이름 정렬 (미지정은 맨 뒤)
    const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
      if (a === UNGROUPED_LABEL) return 1;
      if (b === UNGROUPED_LABEL) return -1;
      return a.localeCompare(b, "ko");
    });
    return sortedKeys.map((key) => ({
      manufacturer: key,
      fabrics: groups.get(key).sort((a, b) => (a.code || "").localeCompare(b.code || "", "ko")),
    }));
  }, [unmappedFabrics, leftSearch]);

  // 전체 선택 가능한 prodNums (검색 필터 반영)
  const visibleProdNums = useMemo(
    () => groupedTree.flatMap((g) => g.fabrics.map((f) => f.prodNum)),
    [groupedTree]
  );

  const allChecked = visibleProdNums.length > 0
    && visibleProdNums.every((n) => selectedProdNums.has(n));
  const anyChecked = selectedProdNums.size > 0;

  const filteredRight = useMemo(() => {
    const q = rightSearch.trim().toLowerCase();
    const filtered = mappedFabrics.filter((f) => {
      if (!q) return true;
      const aliases = aliasesByProdNum[f.prodNum] || [];
      return (
        f.name.toLowerCase().includes(q) ||
        aliases.some((a) => (a.aliasName || "").toLowerCase().includes(q))
      );
    });
    // 제조사 → 원단명 순 정렬 (매입처 미지정은 뒤로)
    return filtered.sort((a, b) => {
      const ma = a.manufacturer || "";
      const mb = b.manufacturer || "";
      if (ma && !mb) return -1;
      if (!ma && mb) return 1;
      const mCmp = ma.localeCompare(mb, "ko");
      if (mCmp !== 0) return mCmp;
      return (a.name || "").localeCompare(b.name || "", "ko");
    });
  }, [mappedFabrics, rightSearch, aliasesByProdNum]);

  useEffect(() => { if (pending?.prodNum) pendingInputRef.current?.focus(); }, [pending?.prodNum]);
  useEffect(() => { if (editingAliasNum) editingInputRef.current?.focus(); }, [editingAliasNum]);

  const resetUiState = () => {
    setLeftSearch(""); setRightSearch("");
    setSelectedProdNums(new Set());
    setBulkResult(null);
    setPending(null);
    setEditingAliasNum(null); setEditingError("");
    setApiError("");
  };
  const handleSelectClient = (cliNum) => {
    if (cliNum === selectedClientId) return;
    setSelectedClientId(cliNum);
    resetUiState();
  };

  const handleApiError = (err, fallback) => {
    const data = err?.response?.data;
    if (data?.errors) {
      return (data.message || "입력값이 올바르지 않습니다") + ": " +
             Object.values(data.errors).join(", ");
    }
    if (data?.message) return data.message;
    return fallback;
  };

  // ── 체크박스 토글 ──────────────────────────────────────
  const toggleFabric = (prodNum) => {
    setSelectedProdNums((prev) => {
      const next = new Set(prev);
      if (next.has(prodNum)) next.delete(prodNum);
      else next.add(prodNum);
      return next;
    });
  };
  const toggleGroup = (manufacturer, fabrics) => {
    const nums = fabrics.map((f) => f.prodNum);
    const allSelected = nums.every((n) => selectedProdNums.has(n));
    setSelectedProdNums((prev) => {
      const next = new Set(prev);
      if (allSelected) nums.forEach((n) => next.delete(n));
      else nums.forEach((n) => next.add(n));
      return next;
    });
  };
  const toggleAll = () => {
    if (allChecked) setSelectedProdNums(new Set());
    else setSelectedProdNums(new Set(visibleProdNums));
  };
  const toggleGroupCollapse = (manufacturer) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(manufacturer)) next.delete(manufacturer);
      else next.add(manufacturer);
      return next;
    });
  };

  // ── 일괄 등록 ──────────────────────────────────────────
  const doBulkRegister = async () => {
    if (!selectedClientId || selectedProdNums.size === 0) return;
    setBulkSaving(true);
    setBulkResult(null);
    try {
      const res = await createAliasesBulk(selectedClientId, Array.from(selectedProdNums));
      // 성공 항목을 aliasesByProdNum에 반영
      setAliasesByProdNum((m) => {
        const next = { ...m };
        (res.created || []).forEach((a) => {
          const list = next[a.prodNum] || [];
          next[a.prodNum] = [...list, { aliasNum: a.aliasNum, aliasName: a.clientFabName, price: a.clientFabPrice }];
        });
        return next;
      });
      const addedCount = (res.created || []).length;
      setAliasCounts((c) => ({
        ...c,
        [selectedClientId]: (c[selectedClientId] || 0) + addedCount,
      }));
      setSelectedProdNums(new Set());
      setBulkResult(res);
    } catch (err) {
      setApiError(handleApiError(err, "일괄 등록 중 오류가 발생했습니다."));
    } finally {
      setBulkSaving(false);
    }
  };

  // ── 개별 별칭 추가 (우측 카드의 "+ 별칭 추가") ─────────
  const startAddAlias = (fabric) => {
    setPending({
      prodNum: fabric.prodNum,
      prodName: fabric.name,
      aliasName: "",
      price: "",
      error: "",
    });
  };
  const cancelPending = () => setPending(null);
  const confirmPending = async () => {
    const alias = (pending.aliasName || "").trim();
    if (!alias) { setPending((p) => ({ ...p, error: "별칭을 입력해 주세요." })); return; }
    const priceN = pending.price === "" ? null : parseInt(pending.price, 10);
    if (priceN !== null && (!Number.isFinite(priceN) || priceN < 0)) {
      setPending((p) => ({ ...p, error: "단가는 0 이상 숫자여야 합니다." })); return;
    }
    try {
      const created = await createAlias({
        cliNum: selectedClientId,
        prodNum: pending.prodNum,
        aliasName: alias,
        price: priceN,
      });
      setAliasesByProdNum((m) => {
        const list = m[created.prodNum] || [];
        return {
          ...m,
          [created.prodNum]: [
            ...list,
            { aliasNum: created.aliasNum, aliasName: created.aliasName, price: created.price },
          ],
        };
      });
      setAliasCounts((c) => ({ ...c, [selectedClientId]: (c[selectedClientId] || 0) + 1 }));
      setPending(null);
    } catch (err) {
      setPending((p) => ({ ...p, error: handleApiError(err, "등록 중 오류가 발생했습니다.") }));
    }
  };

  // ── 별칭 수정 ──────────────────────────────────────────
  const startEdit = (aliasNum) => {
    for (const prodNumKey of Object.keys(aliasesByProdNum)) {
      const found = aliasesByProdNum[prodNumKey].find((a) => a.aliasNum === aliasNum);
      if (found) {
        setEditingAliasNum(aliasNum);
        setEditingAlias(found.aliasName || "");
        setEditingPrice(found.price != null ? String(found.price) : "");
        setEditingError("");
        return;
      }
    }
  };
  const cancelEdit = () => {
    setEditingAliasNum(null); setEditingAlias(""); setEditingPrice(""); setEditingError("");
  };
  const confirmEdit = async () => {
    const alias = editingAlias.trim();
    if (!alias) { setEditingError("별칭을 입력해 주세요."); return; }
    const priceN = editingPrice === "" ? null : parseInt(editingPrice, 10);
    if (priceN !== null && (!Number.isFinite(priceN) || priceN < 0)) {
      setEditingError("단가는 0 이상 숫자여야 합니다."); return;
    }
    try {
      const updated = await updateAlias(editingAliasNum, { aliasName: alias, price: priceN });
      setAliasesByProdNum((m) => {
        const next = { ...m };
        for (const p of Object.keys(next)) {
          next[p] = next[p].map((a) =>
            a.aliasNum === editingAliasNum
              ? { aliasNum: updated.aliasNum, aliasName: updated.aliasName, price: updated.price }
              : a
          );
        }
        return next;
      });
      cancelEdit();
    } catch (err) {
      setEditingError(handleApiError(err, "수정 중 오류가 발생했습니다."));
    }
  };

  // ── 별칭 삭제 ──────────────────────────────────────────
  const askRemoveAlias = (aliasNum, prodNum, aliasName, prodName) => {
    setDeleteConfirm({ aliasNum, prodNum, aliasName, prodName });
  };
  const confirmRemoveAlias = async () => {
    if (!deleteConfirm) return;
    const { aliasNum, prodNum } = deleteConfirm;
    setDeleting(true);
    try {
      await deleteAlias(aliasNum);
      setAliasesByProdNum((m) => {
        const list = m[prodNum] || [];
        const newList = list.filter((a) => a.aliasNum !== aliasNum);
        if (newList.length === 0) {
          const copy = { ...m }; delete copy[prodNum]; return copy;
        }
        return { ...m, [prodNum]: newList };
      });
      setAliasCounts((c) => ({ ...c, [selectedClientId]: Math.max(0, (c[selectedClientId] || 0) - 1) }));
      if (editingAliasNum === aliasNum) cancelEdit();
      setDeleteConfirm(null);
    } catch (err) {
      setApiError(handleApiError(err, "삭제 중 오류가 발생했습니다."));
      setDeleteConfirm(null);
    } finally {
      setDeleting(false);
    }
  };

  const totalAliases = useMemo(
    () => Object.values(aliasesByProdNum).reduce((sum, arr) => sum + arr.length, 0),
    [aliasesByProdNum]
  );

  return (
    <AdminShell>
      <PageHeader
        title="원단 별칭 관리"
        subtitle="공식 원단 목록에서 매입처별로 원단을 선택하고 '등록'을 클릭하면 거래처에 일괄로 별칭이 등록됩니다. 별칭명과 단가는 원단의 공식값으로 저장되며, 필요 시 우측에서 수정하거나 별칭을 추가할 수 있습니다."
      />

      {apiError && <p className={styles.apiError}>{apiError}</p>}

      <div className={styles.layout}>

        {/* ── 좌: 거래처 목록 패널 ── */}
        <div className={styles.clientPanel}>
          <div className={styles.clientPanelHead}>
            <span className={styles.clientPanelTitle}>거래처</span>
            <span className={styles.clientPanelCount}>{clients.length}</span>
          </div>
          <div className={styles.clientSearch}>
            <IconSearch size={13} />
            <input
              className={styles.clientSearchInput}
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="거래처 검색"
            />
            {clientSearch && (
              <button type="button" className={styles.clearBtn} onClick={() => setClientSearch("")}>
                <IconX size={11} />
              </button>
            )}
          </div>
          <div className={styles.clientList}>
            {clientsLoading ? (
              <div className={styles.clientEmpty}>불러오는 중…</div>
            ) : clientsError ? (
              <div className={styles.clientEmpty}>{clientsError}</div>
            ) : filteredClients.length === 0 ? (
              <div className={styles.clientEmpty}>검색 결과 없음</div>
            ) : (
              filteredClients.map((c) => {
                const isActive = c.cliNum === selectedClientId;
                const cnt = isActive ? totalAliases : (aliasCounts[c.cliNum] || 0);
                return (
                  <button
                    key={c.cliNum}
                    type="button"
                    onClick={() => handleSelectClient(c.cliNum)}
                    className={cx(styles.clientRow, isActive && styles.clientRowActive)}
                  >
                    <span className={styles.clientRowName}>{c.name}</span>
                    {cnt > 0 && (
                      <span className={cx(styles.clientBadge, isActive && styles.clientBadgeActive)}>
                        {cnt}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── 우: 작업 영역 ── */}
        <div className={styles.workArea}>

          <div className={styles.panels}>

            {/* 왼쪽: 공식 원단 목록 (매입처별 트리 + 체크박스) */}
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <span className={styles.panelTitle}>공식 원단 목록</span>
                <span className={styles.panelCount}>{visibleProdNums.length}</span>
              </div>

              {/* 검색창 */}
              <div className={styles.filterRow}>
                <label className={styles.searchBox} style={{ flex: 1 }}>
                  <IconSearch size={14} />
                  <input
                    className={styles.searchInput}
                    value={leftSearch}
                    onChange={(e) => setLeftSearch(e.target.value)}
                    placeholder="원단명 · 코드"
                  />
                  {leftSearch && (
                    <button type="button" className={styles.clearBtn} onClick={() => setLeftSearch("")}>
                      <IconX size={12} />
                    </button>
                  )}
                </label>
              </div>

              {/* 모두 선택 + 등록 (검색창 아래) */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 4px", borderBottom: "1px solid var(--line)",
              }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => { if (el) el.indeterminate = !allChecked && anyChecked; }}
                    onChange={toggleAll}
                    disabled={visibleProdNums.length === 0 || bulkSaving}
                  />
                  <span>모두 선택 {anyChecked && <span style={{ color: "var(--ink-2)" }}>({selectedProdNums.size})</span>}</span>
                </label>
                <button
                  type="button"
                  onClick={doBulkRegister}
                  disabled={!anyChecked || !selectedClient || bulkSaving}
                  style={{
                    height: 32, padding: "0 16px", borderRadius: 8, border: "none",
                    background: anyChecked ? "var(--brand)" : "var(--line)",
                    color: "#fff", fontSize: 12.5, fontWeight: 700,
                    cursor: (!anyChecked || bulkSaving) ? "not-allowed" : "pointer",
                    opacity: bulkSaving ? 0.6 : 1,
                  }}
                >
                  {bulkSaving ? "등록 중…" : "등록"}
                </button>
              </div>

              {/* 일괄 등록 결과 요약 */}
              {bulkResult && (
                <div style={{
                  margin: "8px 4px 0", padding: "8px 10px", borderRadius: 6,
                  background: "var(--brand-soft)", color: "var(--brand-ink)", fontSize: 12,
                }}>
                  ✅ {(bulkResult.created || []).length}건 등록 완료
                  {(bulkResult.skipped || []).length > 0 && (
                    <>
                      {" · "}
                      <span style={{ color: "var(--danger)" }}>
                        {(bulkResult.skipped || []).length}건 스킵
                      </span>
                      <div style={{ fontSize: 11.5, color: "var(--ink-2)", marginTop: 4 }}>
                        {bulkResult.skipped.slice(0, 3).map((s, i) => (
                          <div key={i}>
                            · {s.prodName || `#${s.prodNum}`}: {s.reason}
                          </div>
                        ))}
                        {bulkResult.skipped.length > 3 && (
                          <div>… 외 {bulkResult.skipped.length - 3}건</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 트리 */}
              <div className={styles.panelScroll}>
                {fabricsLoading ? (
                  <div className={styles.emptyLeft}>원단 목록 불러오는 중…</div>
                ) : groupedTree.length === 0 ? (
                  <div className={styles.emptyLeft}>
                    {unmappedFabrics.length === 0
                      ? "✓ 모든 원단이 매칭되었습니다"
                      : "검색 결과가 없습니다"}
                  </div>
                ) : (
                  groupedTree.map((g) => {
                    const collapsed = collapsedGroups.has(g.manufacturer);
                    const nums = g.fabrics.map((f) => f.prodNum);
                    const groupAllChecked = nums.every((n) => selectedProdNums.has(n));
                    const groupAnyChecked = nums.some((n) => selectedProdNums.has(n));
                    return (
                      <div key={g.manufacturer} style={{ marginBottom: 4 }}>
                        {/* 매입처 헤더 */}
                        <div style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "6px 8px", background: "var(--bg)",
                          borderRadius: 6, cursor: "pointer",
                        }}>
                          <input
                            type="checkbox"
                            checked={groupAllChecked}
                            ref={(el) => { if (el) el.indeterminate = !groupAllChecked && groupAnyChecked; }}
                            onChange={() => toggleGroup(g.manufacturer, g.fabrics)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span
                            onClick={() => toggleGroupCollapse(g.manufacturer)}
                            style={{ flex: 1, fontWeight: 700, fontSize: 12.5, color: "var(--ink)", userSelect: "none" }}
                          >
                            <span style={{ display: "inline-block", width: 12, transform: collapsed ? "rotate(-90deg)" : "none", transition: "transform 0.15s" }}>▾</span>
                            {" "}{g.manufacturer}
                            <span style={{ marginLeft: 6, fontWeight: 400, fontSize: 11.5, color: "var(--ink-2)" }}>
                              ({g.fabrics.length})
                            </span>
                          </span>
                        </div>

                        {/* 원단 리스트 */}
                        {!collapsed && (
                          <div style={{ paddingLeft: 8 }}>
                            {g.fabrics.map((f) => {
                              const checked = selectedProdNums.has(f.prodNum);
                              return (
                                <label
                                  key={f.id}
                                  style={{
                                    display: "flex", alignItems: "center", gap: 6,
                                    padding: "5px 8px", cursor: "pointer",
                                    background: checked ? "var(--brand-soft)" : "transparent",
                                    borderRadius: 4,
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleFabric(f.prodNum)}
                                  />
                                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--brand-ink)", background: "var(--brand-soft)", border: "1px solid var(--brand-line)", borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap" }}>
                                    {f.code}
                                  </span>
                                  <span style={{ fontSize: 12.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {f.name}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className={styles.centerDivider}>
              <span className={styles.dividerArrow}>→</span>
            </div>

            {/* 오른쪽: 매칭된 별칭 목록 */}
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <span className={styles.panelTitle}>{selectedClient?.name || "거래처"} 별칭</span>
                <span className={styles.panelCount}>{totalAliases}</span>
              </div>
              <div className={styles.filterRow}>
                <label className={styles.searchBox} style={{ flex: 1 }}>
                  <IconSearch size={14} />
                  <input
                    className={styles.searchInput}
                    value={rightSearch}
                    onChange={(e) => setRightSearch(e.target.value)}
                    placeholder="원단명 · 별칭 검색"
                  />
                  {rightSearch && (
                    <button type="button" className={styles.clearBtn} onClick={() => setRightSearch("")}>
                      <IconX size={12} />
                    </button>
                  )}
                </label>
              </div>
              <div className={styles.panelScroll}>
                {aliasLoading && <div className={styles.emptyLeft}>별칭 불러오는 중…</div>}

                {!aliasLoading && filteredRight.length === 0 && (
                  mappedFabrics.length === 0 ? (
                    <div className={styles.emptyRight}>
                      <div className={styles.emptyRightIcon}>←</div>
                      <div>왼쪽 목록에서 원단을 선택해 등록해 보세요</div>
                    </div>
                  ) : (
                    <div className={styles.emptySearch}>검색 결과가 없습니다</div>
                  )
                )}

                {filteredRight.map((fabric) => {
                  const aliases = aliasesByProdNum[fabric.prodNum] || [];
                  const isAddingHere = pending && pending.prodNum === fabric.prodNum;
                  return (
                    <div key={fabric.id} className={styles.aliasCard}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600, color: "var(--ink-2)",
                            background: "var(--bg)", border: "1px solid var(--line)",
                            borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap", flexShrink: 0,
                          }}>
                            {fabric.manufacturer || "매입처 미지정"}
                          </span>
                          <div className={styles.aliasFabricName}>{fabric.name}</div>
                        </div>
                        {!isAddingHere && (
                          <button
                            type="button"
                            onClick={() => startAddAlias(fabric)}
                            style={{
                              padding: "4px 10px",
                              background: "transparent",
                              border: "1px dashed var(--line)",
                              borderRadius: 6,
                              color: "var(--ink-2)",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                          >
                            + 별칭 추가
                          </button>
                        )}
                      </div>

                      {aliases.map((a) => {
                        const isEditing = editingAliasNum === a.aliasNum;
                        return (
                          <div key={a.aliasNum}>
                            {isEditing ? (
                              <>
                                <div className={styles.aliasInputRow}>
                                  <span className={styles.arrow}>→</span>
                                  <input
                                    ref={editingInputRef}
                                    className={cx(styles.aliasInput, editingError && styles.aliasInputError)}
                                    value={editingAlias}
                                    onChange={(e) => { setEditingAlias(e.target.value); setEditingError(""); }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") confirmEdit();
                                      if (e.key === "Escape") cancelEdit();
                                    }}
                                  />
                                  <input
                                    className={cx(styles.aliasInput, editingError && styles.aliasInputError)}
                                    style={{ width: 90 }}
                                    value={editingPrice}
                                    onChange={(e) => { setEditingPrice(e.target.value.replace(/[^\d]/g, "")); setEditingError(""); }}
                                    placeholder="단가"
                                    inputMode="numeric"
                                  />
                                  <button type="button" className={styles.okBtn} onClick={confirmEdit} disabled={!editingAlias.trim()}>✓</button>
                                  <button type="button" className={styles.cancelAliasBtn} onClick={cancelEdit}><IconX size={14} /></button>
                                </div>
                                {editingError && <div className={styles.aliasError}>{editingError}</div>}
                              </>
                            ) : (
                              <div className={styles.aliasViewRow}>
                                <span className={styles.arrow}>→</span>
                                <span className={styles.aliasValue}>{a.aliasName}</span>
                                {a.price != null && (
                                  <span className={styles.aliasPrice}>
                                    {a.price.toLocaleString("ko-KR")}원
                                  </span>
                                )}
                                <div className={styles.aliasActions}>
                                  <button type="button" className={styles.editAliasBtn} onClick={() => startEdit(a.aliasNum)} title="별칭 수정">
                                    <IconEdit size={13} />
                                  </button>
                                  <button type="button" className={styles.removeAliasBtn} onClick={() => askRemoveAlias(a.aliasNum, fabric.prodNum, a.aliasName, fabric.name)} title="별칭 삭제">
                                    <IconX size={14} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {isAddingHere && (
                        <>
                          <div className={styles.aliasInputRow}>
                            <span className={styles.arrow}>+</span>
                            <input
                              ref={pendingInputRef}
                              className={cx(styles.aliasInput, pending.error && styles.aliasInputError)}
                              value={pending.aliasName}
                              onChange={(e) => setPending((p) => ({ ...p, aliasName: e.target.value, error: "" }))}
                              placeholder="새 별칭"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") confirmPending();
                                if (e.key === "Escape") cancelPending();
                              }}
                            />
                            <input
                              className={cx(styles.aliasInput, pending.error && styles.aliasInputError)}
                              style={{ width: 90 }}
                              value={pending.price}
                              onChange={(e) => setPending((p) => ({ ...p, price: e.target.value.replace(/[^\d]/g, ""), error: "" }))}
                              placeholder="단가"
                              inputMode="numeric"
                            />
                            <button type="button" className={styles.okBtn} onClick={confirmPending} disabled={!pending.aliasName.trim()}>✓</button>
                            <button type="button" className={styles.cancelAliasBtn} onClick={cancelPending}><IconX size={14} /></button>
                          </div>
                          {pending.error && <div className={styles.aliasError}>{pending.error}</div>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 별칭 삭제 확인 모달 */}
      {deleteConfirm && (
        <ConfirmDialog
          title="별칭을 삭제하시겠어요?"
          body={
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
                {deleteConfirm.prodName}
              </div>
              <div style={{ color: "var(--ink-2)" }}>
                별칭 "<b>{deleteConfirm.aliasName}</b>"
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
                이 별칭에 저장된 단가 정보도 함께 사라지며 되돌릴 수 없습니다.
              </div>
            </div>
          }
          confirmLabel={deleting ? "삭제 중…" : "삭제"}
          danger
          disabled={deleting}
          onCancel={() => !deleting && setDeleteConfirm(null)}
          onConfirm={confirmRemoveAlias}
        />
      )}
    </AdminShell>
  );
}
