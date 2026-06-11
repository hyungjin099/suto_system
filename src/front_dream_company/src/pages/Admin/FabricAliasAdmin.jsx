/* 관리자 - 원단 별칭 관리
 * 좌: 고객사 목록(검색) / 우: 공식원단 ↔ 별칭 2패널
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { AdminShell } from "./components/Layout";
import PageHeader from "./components/PageHeader";
import { IconX, IconEdit, IconSearch } from "./components/Icons";
import { cx } from "./utils";
import { seedProducts, seedAliases, CATEGORIES } from "./constants";
import { seedClients } from "./clientData";
import styles from "./FabricAliasAdmin.module.css";

const CAT_COLORS = {
  "아트지":    { bg: "#dbeafe", color: "#1d4ed8" },
  "모조지":    { bg: "#f1f5f9", color: "#475569" },
  "크라프트":  { bg: "#fef3c7", color: "#92400e" },
  "투명 PET": { bg: "#ecfeff", color: "#0e7490" },
  "유포지":   { bg: "#d1fae5", color: "#065f46" },
  "은박":     { bg: "#e2e8f0", color: "#334155" },
  "금박":     { bg: "#fef9c3", color: "#78350f" },
  "형광지":   { bg: "#dcfce7", color: "#15803d" },
};

export default function FabricAliasAdmin() {
  const clients = useMemo(() => seedClients().filter((c) => c.active === 1), []);
  const allFabrics = useMemo(() => seedProducts(), []);

  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? null);
  const [aliases, setAliases] = useState(() => seedAliases());
  const [clientSearch, setClientSearch] = useState("");

  const [leftSearch, setLeftSearch] = useState("");
  const [leftCategory, setLeftCategory] = useState("");
  const [rightSearch, setRightSearch] = useState("");

  const [pendingDrop, setPendingDrop] = useState(null);
  const [pendingAlias, setPendingAlias] = useState("");
  const [pendingError, setPendingError] = useState("");

  const [dragOver, setDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingError, setEditingError] = useState("");

  const pendingInputRef = useRef(null);
  const editingInputRef = useRef(null);

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const clientAliases = aliases[selectedClientId] || {};

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, clientSearch]);

  const { mappedFabrics, unmappedFabrics } = useMemo(() => {
    const mapped = [];
    const unmapped = [];
    allFabrics.forEach((f) => {
      if (clientAliases[f.id] !== undefined) mapped.push(f);
      else unmapped.push(f);
    });
    return { mappedFabrics: mapped, unmappedFabrics: unmapped };
  }, [allFabrics, clientAliases]);

  const filteredLeft = useMemo(() => {
    const q = leftSearch.trim().toLowerCase();
    return unmappedFabrics.filter((f) => {
      if (leftCategory && f.category !== leftCategory) return false;
      if (q && !(f.name.toLowerCase().includes(q) || f.code.toLowerCase().includes(q)))
        return false;
      return true;
    });
  }, [unmappedFabrics, leftSearch, leftCategory]);

  const filteredRight = useMemo(() => {
    const q = rightSearch.trim().toLowerCase();
    return mappedFabrics.filter((f) => {
      if (!q) return true;
      const alias = clientAliases[f.id] || "";
      return f.name.toLowerCase().includes(q) || alias.toLowerCase().includes(q);
    });
  }, [mappedFabrics, rightSearch, clientAliases]);

  useEffect(() => {
    if (pendingDrop) pendingInputRef.current?.focus();
  }, [pendingDrop]);

  useEffect(() => {
    if (editingId) editingInputRef.current?.focus();
  }, [editingId]);

  const handleSelectClient = (id) => {
    if (id === selectedClientId) return;
    setSelectedClientId(id);
    setLeftSearch("");
    setRightSearch("");
    setLeftCategory("");
    setPendingDrop(null);
    setPendingAlias("");
    setPendingError("");
    setEditingId(null);
    setEditingError("");
  };

  // ── Drag handlers ──────────────────────────────────────────────

  const handleDragStart = (e, fabric) => {
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
    const fabricId = e.dataTransfer.getData("fabricId");
    const fabric = allFabrics.find((f) => f.id === fabricId);
    if (!fabric || clientAliases[fabric.id] !== undefined) return;
    setPendingDrop(fabric);
    setPendingAlias("");
    setPendingError("");
  };

  // ── Alias CRUD ─────────────────────────────────────────────────

  const confirmPending = () => {
    const alias = pendingAlias.trim();
    if (!alias) { setPendingError("별칭을 입력해 주세요."); return; }
    if (Object.values(clientAliases).includes(alias)) {
      setPendingError("이미 사용 중인 별칭입니다."); return;
    }
    setAliases((prev) => ({
      ...prev,
      [selectedClientId]: { ...(prev[selectedClientId] || {}), [pendingDrop.id]: alias },
    }));
    setPendingDrop(null); setPendingAlias(""); setPendingError("");
  };
  const cancelPending = () => { setPendingDrop(null); setPendingAlias(""); setPendingError(""); };

  const removeAlias = (productId) => {
    setAliases((prev) => {
      const map = { ...(prev[selectedClientId] || {}) };
      delete map[productId];
      return { ...prev, [selectedClientId]: map };
    });
    if (editingId === productId) setEditingId(null);
  };

  const startEdit = (productId) => {
    setEditingId(productId);
    setEditingValue(clientAliases[productId] || "");
    setEditingError("");
  };
  const confirmEdit = () => {
    const alias = editingValue.trim();
    if (!alias) { setEditingError("별칭을 입력해 주세요."); return; }
    const others = Object.entries(clientAliases).filter(([k]) => k !== editingId).map(([, v]) => v);
    if (others.includes(alias)) { setEditingError("이미 사용 중인 별칭입니다."); return; }
    setAliases((prev) => ({
      ...prev,
      [selectedClientId]: { ...prev[selectedClientId], [editingId]: alias },
    }));
    setEditingId(null); setEditingValue(""); setEditingError("");
  };
  const cancelEdit = () => { setEditingId(null); setEditingValue(""); setEditingError(""); };

  const mappedCount = mappedFabrics.length;
  const totalCount = allFabrics.length;
  const progressPct = totalCount > 0 ? (mappedCount / totalCount) * 100 : 0;

  return (
    <AdminShell>
      <PageHeader
        title="원단 별칭 관리"
        subtitle="고객사마다 다르게 부르는 원단 이름을 연결합니다. 왼쪽 원단 카드를 오른쪽으로 드래그해 별칭을 등록하세요."
      />

      <div className={styles.layout}>

        {/* ── 좌: 고객사 목록 패널 ── */}
        <div className={styles.clientPanel}>
          <div className={styles.clientPanelHead}>
            <span className={styles.clientPanelTitle}>고객사</span>
            <span className={styles.clientPanelCount}>{clients.length}</span>
          </div>
          <div className={styles.clientSearch}>
            <IconSearch size={13} />
            <input
              className={styles.clientSearchInput}
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="고객사 검색"
            />
            {clientSearch && (
              <button type="button" className={styles.clearBtn} onClick={() => setClientSearch("")}>
                <IconX size={11} />
              </button>
            )}
          </div>
          <div className={styles.clientList}>
            {filteredClients.length === 0 ? (
              <div className={styles.clientEmpty}>검색 결과 없음</div>
            ) : (
              filteredClients.map((c) => {
                const cnt = Object.keys(aliases[c.id] || {}).length;
                const isActive = c.id === selectedClientId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectClient(c.id)}
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

          {/* 진행률 */}
          {selectedClient && (
            <div className={styles.statsRow}>
              <span className={styles.statsText}>
                <b>{selectedClient.name}</b>&nbsp;매칭 완료&nbsp;
                <b>{mappedCount}</b>&nbsp;/&nbsp;{totalCount}개
              </span>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
              </div>
              <span className={styles.statsPercent}>{Math.round(progressPct)}%</span>
            </div>
          )}

          <div className={styles.panels}>

            {/* 왼쪽: 미매칭 원단 목록 */}
            <div className={styles.panel}>
              <div className={styles.panelHead}>
                <span className={styles.panelTitle}>공식 원단 목록</span>
                <span className={styles.panelCount}>{filteredLeft.length}</span>
              </div>
              <div className={styles.filterRow}>
                <label className={styles.searchBox}>
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
                <select
                  className={styles.catSelect}
                  value={leftCategory}
                  onChange={(e) => setLeftCategory(e.target.value)}
                >
                  <option value="">전체</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className={styles.panelScroll}>
                {filteredLeft.length === 0 ? (
                  <div className={styles.emptyLeft}>
                    {unmappedFabrics.length === 0 ? "✓ 모든 원단이 매칭되었습니다" : "검색 결과가 없습니다"}
                  </div>
                ) : (
                  filteredLeft.map((fabric) => {
                    const catColor = CAT_COLORS[fabric.category] || {};
                    return (
                      <div
                        key={fabric.id}
                        className={cx(styles.fabricCard, draggingId === fabric.id && styles.fabricCardDragging)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, fabric)}
                        onDragEnd={handleDragEnd}
                      >
                        <span className={styles.grip}>⣿</span>
                        <div className={styles.fabricMeta}>
                          <span className={styles.fabricCode}>{fabric.code}</span>
                          <span className={styles.fabricName}>{fabric.name}</span>
                        </div>
                        <span className={styles.catBadge} style={{ background: catColor.bg, color: catColor.color }}>
                          {fabric.category}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 중앙 구분선 */}
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
                <span className={styles.panelTitle}>{selectedClient?.name} 별칭</span>
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
                        placeholder="고객사 별칭 입력"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmPending();
                          if (e.key === "Escape") cancelPending();
                        }}
                      />
                      <button type="button" className={styles.okBtn} onClick={confirmPending} disabled={!pendingAlias.trim()}>✓</button>
                      <button type="button" className={styles.cancelAliasBtn} onClick={cancelPending}><IconX size={14} /></button>
                    </div>
                    {pendingError && <div className={styles.aliasError}>{pendingError}</div>}
                  </div>
                )}

                {filteredRight.length === 0 && !pendingDrop && (
                  mappedFabrics.length === 0 ? (
                    <div className={cx(styles.emptyRight, dragOver && styles.emptyRightActive)}>
                      <div className={styles.emptyRightIcon}>↙</div>
                      <div>왼쪽 원단을 드래그해 여기에 놓으세요</div>
                      <div className={styles.emptyRightSub}>놓으면 별칭 이름을 입력할 수 있습니다</div>
                    </div>
                  ) : (
                    <div className={styles.emptySearch}>검색 결과가 없습니다</div>
                  )
                )}

                {filteredRight.map((fabric) => (
                  <div key={fabric.id} className={styles.aliasCard}>
                    <div className={styles.aliasFabricName}>{fabric.name}</div>
                    {editingId === fabric.id ? (
                      <>
                        <div className={styles.aliasInputRow}>
                          <span className={styles.arrow}>→</span>
                          <input
                            ref={editingInputRef}
                            className={cx(styles.aliasInput, editingError && styles.aliasInputError)}
                            value={editingValue}
                            onChange={(e) => { setEditingValue(e.target.value); setEditingError(""); }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") confirmEdit();
                              if (e.key === "Escape") cancelEdit();
                            }}
                          />
                          <button type="button" className={styles.okBtn} onClick={confirmEdit} disabled={!editingValue.trim()}>✓</button>
                          <button type="button" className={styles.cancelAliasBtn} onClick={cancelEdit}><IconX size={14} /></button>
                        </div>
                        {editingError && <div className={styles.aliasError}>{editingError}</div>}
                      </>
                    ) : (
                      <div className={styles.aliasViewRow}>
                        <span className={styles.arrow}>→</span>
                        <span className={styles.aliasValue}>{clientAliases[fabric.id]}</span>
                        <div className={styles.aliasActions}>
                          <button type="button" className={styles.editAliasBtn} onClick={() => startEdit(fabric.id)} title="별칭 수정"><IconEdit size={13} /></button>
                          <button type="button" className={styles.removeAliasBtn} onClick={() => removeAlias(fabric.id)} title="매칭 해제"><IconX size={14} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </AdminShell>
  );
}
