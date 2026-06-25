/* 관리자 - 거래처 별칭 관리
 * 좌: 거래처 목록(검색) / 우: 공식원단 ↔ 거래처별 별칭 + 단가 2패널
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { AdminShell } from "./components/Layout";
import PageHeader from "./components/PageHeader";
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
} from "./api";
import styles from "./FabricAliasAdmin.module.css";

export default function FabricAliasAdmin() {
  // ── 데이터 ───────────────────────────────────────────────
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState("");

  const [allFabrics, setAllFabrics] = useState([]);
  const [fabricsLoading, setFabricsLoading] = useState(true);

  // aliases: { [prodNum]: { aliasNum, aliasName, price } }
  const [aliasMap, setAliasMap] = useState({});
  const [aliasLoading, setAliasLoading] = useState(false);
  // 거래처별 별칭 갯수: { [cliNum]: count }
  const [aliasCounts, setAliasCounts] = useState({});
  const [apiError, setApiError] = useState("");

  const [selectedClientId, setSelectedClientId] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [leftSearch, setLeftSearch] = useState("");
  const [rightSearch, setRightSearch] = useState("");

  const [pendingDrop, setPendingDrop] = useState(null); // {prodNum, prodCode, prodName}
  const [pendingAlias, setPendingAlias] = useState("");
  const [pendingPrice, setPendingPrice] = useState("");
  const [pendingError, setPendingError] = useState("");

  const [dragOver, setDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState(null);

  const [editingProdNum, setEditingProdNum] = useState(null);
  const [editingAlias, setEditingAlias] = useState("");
  const [editingPrice, setEditingPrice] = useState("");
  const [editingError, setEditingError] = useState("");

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
      setAliasMap({});
      return;
    }
    setAliasLoading(true);
    fetchAliases(selectedClientId)
      .then((list) => {
        const m = {};
        list.forEach((a) => {
          m[a.prodNum] = { aliasNum: a.aliasNum, aliasName: a.aliasName, price: a.price };
        });
        setAliasMap(m);
      })
      .catch(() => setApiError("별칭 목록을 불러오지 못했습니다."))
      .finally(() => setAliasLoading(false));
  }, [selectedClientId]);

  // ── 선택 거래처 / 패널 분할 ─────────────────────────────
  const selectedClient = clients.find((c) => c.cliNum === selectedClientId);

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, clientSearch]);

  const { mappedFabrics, unmappedFabrics } = useMemo(() => {
    const mapped = [];
    const unmapped = [];
    allFabrics.forEach((f) => {
      if (aliasMap[f.prodNum]) mapped.push(f);
      else unmapped.push(f);
    });
    return { mappedFabrics: mapped, unmappedFabrics: unmapped };
  }, [allFabrics, aliasMap]);

  const filteredLeft = useMemo(() => {
    const q = leftSearch.trim().toLowerCase();
    return unmappedFabrics.filter((f) => {
      if (!q) return true;
      return f.name.toLowerCase().includes(q) || f.code.toLowerCase().includes(q);
    });
  }, [unmappedFabrics, leftSearch]);

  const filteredRight = useMemo(() => {
    const q = rightSearch.trim().toLowerCase();
    return mappedFabrics.filter((f) => {
      if (!q) return true;
      const alias = aliasMap[f.prodNum]?.aliasName || "";
      return f.name.toLowerCase().includes(q) || alias.toLowerCase().includes(q);
    });
  }, [mappedFabrics, rightSearch, aliasMap]);

  useEffect(() => { if (pendingDrop) pendingInputRef.current?.focus(); }, [pendingDrop]);
  useEffect(() => { if (editingProdNum) editingInputRef.current?.focus(); }, [editingProdNum]);

  const resetUiState = () => {
    setLeftSearch(""); setRightSearch("");
    setPendingDrop(null); setPendingAlias(""); setPendingPrice(""); setPendingError("");
    setEditingProdNum(null); setEditingError("");
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

  // ── 드래그 ─────────────────────────────────────────────
  const handleDragStart = (e, fabric) => {
    if (fabric.status === "미사용") {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("fabricId", fabric.id);
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(fabric.id);
  };
  const handleDragEnd = () => setDraggingId(null);
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };
  const handleDragLeave = (e) => {
    if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget)) return;
    setDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (!selectedClient) return;
    const fabricId = e.dataTransfer.getData("fabricId");
    const fabric = allFabrics.find((f) => f.id === fabricId);
    if (!fabric || aliasMap[fabric.prodNum] || fabric.status === "미사용") return;
    setPendingDrop(fabric);
    setPendingAlias(fabric.name || "");
    setPendingPrice(fabric.price != null ? String(fabric.price) : "");
    setPendingError("");
  };

  // ── 별칭 등록 ──────────────────────────────────────────
  const confirmPending = async () => {
    const alias = pendingAlias.trim();
    if (!alias) { setPendingError("별칭을 입력해 주세요."); return; }
    const priceN = pendingPrice === "" ? null : parseInt(pendingPrice, 10);
    if (priceN !== null && (!Number.isFinite(priceN) || priceN < 0)) {
      setPendingError("단가는 0 이상 숫자여야 합니다."); return;
    }
    try {
      const created = await createAlias({
        cliNum: selectedClientId,
        prodNum: pendingDrop.prodNum,
        aliasName: alias,
        price: priceN,
      });
      setAliasMap((m) => ({
        ...m,
        [created.prodNum]: { aliasNum: created.aliasNum, aliasName: created.aliasName, price: created.price },
      }));
      setAliasCounts((c) => ({ ...c, [selectedClientId]: (c[selectedClientId] || 0) + 1 }));
      setPendingDrop(null); setPendingAlias(""); setPendingPrice(""); setPendingError("");
    } catch (err) {
      setPendingError(handleApiError(err, "등록 중 오류가 발생했습니다."));
    }
  };
  const cancelPending = () => {
    setPendingDrop(null); setPendingAlias(""); setPendingPrice(""); setPendingError("");
  };

  // ── 별칭 수정/삭제 ─────────────────────────────────────
  const startEdit = (prodNum) => {
    const a = aliasMap[prodNum];
    setEditingProdNum(prodNum);
    setEditingAlias(a?.aliasName || "");
    setEditingPrice(a?.price != null ? String(a.price) : "");
    setEditingError("");
  };
  const cancelEdit = () => {
    setEditingProdNum(null); setEditingAlias(""); setEditingPrice(""); setEditingError("");
  };
  const confirmEdit = async () => {
    const alias = editingAlias.trim();
    if (!alias) { setEditingError("별칭을 입력해 주세요."); return; }
    const priceN = editingPrice === "" ? null : parseInt(editingPrice, 10);
    if (priceN !== null && (!Number.isFinite(priceN) || priceN < 0)) {
      setEditingError("단가는 0 이상 숫자여야 합니다."); return;
    }
    const target = aliasMap[editingProdNum];
    if (!target) return;
    try {
      const updated = await updateAlias(target.aliasNum, { aliasName: alias, price: priceN });
      setAliasMap((m) => ({
        ...m,
        [editingProdNum]: { aliasNum: updated.aliasNum, aliasName: updated.aliasName, price: updated.price },
      }));
      cancelEdit();
    } catch (err) {
      setEditingError(handleApiError(err, "수정 중 오류가 발생했습니다."));
    }
  };

  const removeAlias = async (prodNum) => {
    const target = aliasMap[prodNum];
    if (!target) return;
    try {
      await deleteAlias(target.aliasNum);
      setAliasMap((m) => {
        const copy = { ...m }; delete copy[prodNum]; return copy;
      });
      setAliasCounts((c) => ({ ...c, [selectedClientId]: Math.max(0, (c[selectedClientId] || 0) - 1) }));
      if (editingProdNum === prodNum) cancelEdit();
    } catch (err) {
      setApiError(handleApiError(err, "삭제 중 오류가 발생했습니다."));
    }
  };

  const mappedCount = mappedFabrics.length;

  return (
    <AdminShell>
      <PageHeader
        title="원단 별칭 관리"
        subtitle="거래처마다 다르게 부르는 원단 이름과 단가를 연결합니다. 왼쪽 원단 카드를 오른쪽으로 드래그해 별칭을 등록하세요."
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
                const cnt = isActive
                  ? Object.keys(aliasMap).length
                  : (aliasCounts[c.cliNum] || 0);
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

            {/* 왼쪽: 미매칭 원단 목록 */}
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <span className={styles.panelTitle}>공식 원단 목록</span>
                <span className={styles.panelCount}>{filteredLeft.length}</span>
              </div>
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
              <div className={styles.panelScroll}>
                {fabricsLoading ? (
                  <div className={styles.emptyLeft}>원단 목록 불러오는 중…</div>
                ) : filteredLeft.length === 0 ? (
                  <div className={styles.emptyLeft}>
                    {unmappedFabrics.length === 0 ? "✓ 모든 원단이 매칭되었습니다" : "검색 결과가 없습니다"}
                  </div>
                ) : (
                  filteredLeft.map((fabric) => {
                    const unused = fabric.status === "미사용";
                    return (
                      <div
                        key={fabric.id}
                        className={cx(
                          styles.fabricCard,
                          draggingId === fabric.id && styles.fabricCardDragging,
                          unused && styles.fabricCardDisabled
                        )}
                        draggable={!unused}
                        onDragStart={(e) => handleDragStart(e, fabric)}
                        onDragEnd={handleDragEnd}
                        title={unused ? "미사용 원단은 별칭을 등록할 수 없습니다" : undefined}
                      >
                        <span className={styles.grip}>⣿</span>
                        <div className={styles.fabricMeta}>
                          <span className={styles.fabricCode}>{fabric.code}</span>
                          <span className={styles.fabricName}>{fabric.name}</span>
                        </div>
                        {fabric.manufacturer && (
                          <span className={styles.catBadge}
                                style={{ background: "var(--brand-soft)", color: "var(--brand-ink)" }}>
                            {fabric.manufacturer}
                          </span>
                        )}
                        <span className={cx(styles.statusChip, unused ? styles.statusChipOff : styles.statusChipOn)}>
                          {fabric.status || "사용"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className={styles.centerDivider}>
              <span className={styles.dividerArrow}>→</span>
            </div>

            {/* 오른쪽: 별칭 매칭 드롭존 */}
            <div
              className={cx(styles.panel, dragOver && styles.panelDragOver)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className={styles.panelHead}>
                <span className={styles.panelTitle}>{selectedClient?.name || "거래처"} 별칭</span>
                <span className={styles.panelCount}>{mappedCount}</span>
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

                {pendingDrop && (
                  <div className={styles.aliasCardPending}>
                    <div className={styles.aliasFabricName}>{pendingDrop.name}</div>
                    <div className={styles.aliasInputRow}>
                      <span className={styles.arrow}>→</span>
                      <input
                        ref={pendingInputRef}
                        className={cx(styles.aliasInput, pendingError && styles.aliasInputError)}
                        value={pendingAlias}
                        onChange={(e) => { setPendingAlias(e.target.value); setPendingError(""); }}
                        placeholder="거래처 별칭"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmPending();
                          if (e.key === "Escape") cancelPending();
                        }}
                      />
                      <input
                        className={cx(styles.aliasInput, pendingError && styles.aliasInputError)}
                        style={{ width: 90 }}
                        value={pendingPrice}
                        onChange={(e) => { setPendingPrice(e.target.value.replace(/[^\d]/g,"")); setPendingError(""); }}
                        placeholder="단가"
                        inputMode="numeric"
                      />
                      <button type="button" className={styles.okBtn} onClick={confirmPending} disabled={!pendingAlias.trim()}>✓</button>
                      <button type="button" className={styles.cancelAliasBtn} onClick={cancelPending}><IconX size={14} /></button>
                    </div>
                    {pendingError && <div className={styles.aliasError}>{pendingError}</div>}
                  </div>
                )}

                {!aliasLoading && filteredRight.length === 0 && !pendingDrop && (
                  mappedFabrics.length === 0 ? (
                    <div className={cx(styles.emptyRight, dragOver && styles.emptyRightActive)}>
                      <div className={styles.emptyRightIcon}>↙</div>
                      <div>왼쪽 원단을 드래그해 여기에 놓으세요</div>
                      <div className={styles.emptyRightSub}>별칭과 단가를 입력하면 저장됩니다</div>
                    </div>
                  ) : (
                    <div className={styles.emptySearch}>검색 결과가 없습니다</div>
                  )
                )}

                {filteredRight.map((fabric) => {
                  const a = aliasMap[fabric.prodNum];
                  const isEditing = editingProdNum === fabric.prodNum;
                  return (
                    <div key={fabric.id} className={styles.aliasCard}>
                      <div className={styles.aliasFabricName}>{fabric.name}</div>
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
                              onChange={(e) => { setEditingPrice(e.target.value.replace(/[^\d]/g,"")); setEditingError(""); }}
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
                          <span className={styles.aliasValue}>{a?.aliasName}</span>
                          {a?.price != null && (
                            <span className={styles.aliasPrice}>
                              {a.price.toLocaleString("ko-KR")}원
                            </span>
                          )}
                          <div className={styles.aliasActions}>
                            <button type="button" className={styles.editAliasBtn} onClick={() => startEdit(fabric.prodNum)} title="별칭 수정">
                              <IconEdit size={13} />
                            </button>
                            <button type="button" className={styles.removeAliasBtn} onClick={() => removeAlias(fabric.prodNum)} title="매칭 해제">
                              <IconX size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </AdminShell>
  );
}
