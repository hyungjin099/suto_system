/* 고객 제품 목록 정렬
 * - 좌측: 거래처 목록 + 검색
 * - 우측: 선택한 거래처의 별칭 목록, 드래그 & 드롭으로 순서 변경
 * - 저장 시 넘긴 순서대로 SORT_ORDER = 1,2,3... (미지정은 NULL = 기본 이름순)
 */

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "./components/Layout";
import { fetchClients, fetchAliases, saveAliasSortOrder } from "./api";

export default function FabricSortAdmin() {
  const [clients, setClients] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedCli, setSelectedCli] = useState(null);  // {cliNum, cliName, cliCode}
  const [aliases, setAliases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [toast, setToast] = useState(null);

  // 초기 거래처 목록
  useEffect(() => {
    fetchClients()
      .then((list) => setClients(list || []))
      .catch(() => setClients([]));
  }, []);

  // 선택된 거래처의 별칭 불러오기
  useEffect(() => {
    if (!selectedCli) { setAliases([]); return; }
    setLoading(true);
    setDirty(false);
    fetchAliases(selectedCli.cliNum)
      .then((list) => setAliases(list || []))
      .catch(() => setAliases([]))
      .finally(() => setLoading(false));
  }, [selectedCli?.cliNum]);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.cliCode || "").toLowerCase().includes(q)
    );
  }, [clients, query]);

  const showToast = (text, tone = "ok") => {
    setToast({ text, tone });
    setTimeout(() => setToast(null), 3200);
  };

  const onDragStart = (idx) => (e) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", String(idx)); } catch (_) {}
  };
  const onDragOver = (idx) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  };
  const onDragLeave = () => setDragOverIdx(null);
  const onDrop = (idx) => (e) => {
    e.preventDefault();
    const from = dragIdx;
    const to = idx;
    setDragIdx(null);
    setDragOverIdx(null);
    if (from == null || from === to) return;
    setAliases((arr) => {
      const next = arr.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDirty(true);
  };
  const onDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const moveItem = (from, delta) => {
    const to = from + delta;
    if (to < 0 || to >= aliases.length) return;
    setAliases((arr) => {
      const next = arr.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDirty(true);
  };

  const resetToNameOrder = () => {
    if (!window.confirm("정렬을 초기화하면 제품명 기준 오름차순으로 되돌아갑니다. 저장 시 적용됩니다.")) return;
    setAliases((arr) => arr.slice().sort((a, b) =>
      (a.prodName || "").localeCompare(b.prodName || "", "ko") ||
      (a.aliasName || "").localeCompare(b.aliasName || "", "ko")
    ));
    setDirty(true);
  };

  const onSave = async () => {
    if (!selectedCli) return;
    setSaving(true);
    try {
      const aliasNums = aliases.map((a) => a.aliasNum);
      await saveAliasSortOrder(selectedCli.cliNum, aliasNums);
      setDirty(false);
      showToast("✓ 정렬 순서 저장 완료", "ok");
    } catch (e) {
      showToast("저장 실패: " + (e?.response?.data?.message || e.message), "err");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      <div style={{ display: "flex", gap: 16, height: "calc(100dvh - 140px)" }}>
        {/* 좌측: 거래처 목록 */}
        <div style={leftCol}>
          <div style={leftHeader}>
            <div style={leftTitleRow}>
              <div style={leftTitle}>거래처</div>
              <span style={countChip}>{filteredClients.length}</span>
            </div>
            <div style={searchWrap}>
              <svg
                style={searchIcon}
                width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="이름 · 코드 검색"
                style={searchInput}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  style={clearBtn}
                  title="지우기"
                  aria-label="검색어 지우기"
                >
                  ×
                </button>
              )}
            </div>
          </div>
          <div style={clientListScroll}>
            {filteredClients.length === 0 ? (
              <div style={leftEmpty}>
                <div style={leftEmptyIcon}>🔍</div>
                <div>조건에 맞는 거래처가 없습니다</div>
              </div>
            ) : (
              filteredClients.map((c) => {
                const active = selectedCli?.cliNum === c.cliNum;
                const initial = (c.name || c.cliCode || "?").trim().charAt(0).toUpperCase();
                return (
                  <button
                    key={c.cliNum}
                    type="button"
                    onClick={() => {
                      if (dirty && !window.confirm("저장하지 않은 변경사항이 있습니다. 이동하시겠습니까?")) return;
                      setSelectedCli({ cliNum: c.cliNum, cliName: c.name, cliCode: c.cliCode });
                    }}
                    style={active ? clientRowActive : clientRow}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#f4f7f3"; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={active ? avatarActive : avatar}>{initial}</span>
                    <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <span style={clientName}>{c.name || "-"}</span>
                      <span style={active ? clientCodeActive : clientCode}>
                        {c.cliCode || "코드없음"}
                      </span>
                    </span>
                    {active && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* 우측: 선택 거래처의 별칭 목록 */}
        <div style={rightCol}>
          {!selectedCli ? (
            <div style={emptyBox}>왼쪽에서 거래처를 선택해 주세요</div>
          ) : loading ? (
            <div style={emptyBox}>불러오는 중…</div>
          ) : (
            <>
              <div style={rightHeader}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedCli.cliName}</div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 2 }}>
                    고객 주문 페이지의 제품 셀렉트에 보일 순서를 지정합니다.
                    드래그 또는 ↑↓ 버튼으로 이동하세요. (총 {aliases.length}건)
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={resetToNameOrder}
                    disabled={saving || aliases.length === 0}
                    style={secondaryBtn}
                    title="제품명 기준 오름차순으로 재정렬 (저장 시 적용)"
                  >
                    이름순 초기화
                  </button>
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={!dirty || saving}
                    style={{
                      ...primaryBtn,
                      opacity: !dirty || saving ? 0.5 : 1,
                      cursor: !dirty || saving ? "not-allowed" : "pointer",
                    }}
                  >
                    {saving ? "저장 중…" : dirty ? "변경사항 저장" : "저장됨"}
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
                {aliases.length === 0 ? (
                  <div style={emptyBox}>등록된 별칭이 없습니다. 원단 별칭 관리에서 먼저 등록해 주세요.</div>
                ) : (
                  <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {aliases.map((a, idx) => {
                      const isDragging = dragIdx === idx;
                      const isOver = dragOverIdx === idx && dragIdx !== idx;
                      return (
                        <li
                          key={a.aliasNum}
                          draggable
                          onDragStart={onDragStart(idx)}
                          onDragOver={onDragOver(idx)}
                          onDragLeave={onDragLeave}
                          onDrop={onDrop(idx)}
                          onDragEnd={onDragEnd}
                          style={{
                            ...aliasRow,
                            opacity: isDragging ? 0.4 : 1,
                            borderTop: isOver ? "2px solid var(--brand)" : "1px solid transparent",
                            background: isDragging ? "#eef5ef" : "#fff",
                          }}
                        >
                          <span style={dragHandle} title="드래그로 이동">⋮⋮</span>
                          <span style={orderNum}>{idx + 1}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                              {a.aliasName || "(이름없음)"}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 2 }}>
                              원단명: {a.prodName || "-"} · 코드: {a.prodCode || "-"}
                              {a.price != null && (
                                <> · 단가: {Number(a.price).toLocaleString("ko-KR")}원</>
                              )}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              type="button"
                              onClick={() => moveItem(idx, -1)}
                              disabled={idx === 0}
                              style={moveBtn}
                              title="위로"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveItem(idx, 1)}
                              disabled={idx === aliases.length - 1}
                              style={moveBtn}
                              title="아래로"
                            >
                              ↓
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {toast && (
        <div
          role="status"
          style={{
            position: "fixed", top: 24, right: 24, zIndex: 9999,
            minWidth: 240, padding: "12px 16px", borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            background: toast.tone === "err" ? "#fef3f2" : "#ecfdf3",
            color:      toast.tone === "err" ? "#b42318" : "#067647",
            border:     toast.tone === "err" ? "1px solid #fecdca" : "1px solid #abefc6",
            fontSize: 13.5, fontWeight: 600,
          }}
        >
          {toast.text}
        </div>
      )}
    </AdminShell>
  );
}

const leftCol = {
  width: 320, display: "flex", flexDirection: "column",
  background: "#fff", border: "1px solid var(--line)", borderRadius: 12,
  overflow: "hidden",
  boxShadow: "0 2px 10px -6px rgba(20, 30, 22, 0.12)",
};
const leftHeader = {
  padding: "16px 16px 12px",
  borderBottom: "1px solid var(--line)",
  background: "linear-gradient(180deg, #fafbf6 0%, #fff 100%)",
};
const leftTitleRow = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  marginBottom: 10,
};
const leftTitle = {
  fontSize: 14, fontWeight: 800, color: "var(--ink)",
  letterSpacing: "-0.01em",
};
const countChip = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  minWidth: 24, height: 20, padding: "0 8px",
  background: "var(--brand)", color: "#fff",
  borderRadius: 999, fontSize: 11, fontWeight: 700,
};
const searchWrap = {
  position: "relative", display: "flex", alignItems: "center",
};
const searchIcon = {
  position: "absolute", left: 10, color: "var(--ink-3)", pointerEvents: "none",
};
const searchInput = {
  width: "100%", height: 36, padding: "0 32px 0 32px",
  border: "1px solid var(--line)", borderRadius: 8, fontSize: 13,
  boxSizing: "border-box", outline: "none",
  background: "#fff",
  transition: "border-color 0.15s, box-shadow 0.15s",
};
const clearBtn = {
  position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
  width: 22, height: 22, border: "none", background: "transparent",
  borderRadius: 11, cursor: "pointer",
  color: "var(--ink-3)", fontSize: 18, lineHeight: 1,
  display: "inline-flex", alignItems: "center", justifyContent: "center",
};
const clientListScroll = {
  flex: 1, overflowY: "auto", padding: 6,
};
const leftEmpty = {
  padding: "40px 20px", textAlign: "center",
  color: "var(--ink-3)", fontSize: 13,
};
const leftEmptyIcon = {
  fontSize: 24, marginBottom: 8, opacity: 0.6,
};
const clientRowBase = {
  display: "flex", alignItems: "center", gap: 10,
  width: "100%", padding: "9px 10px",
  border: "none", borderRadius: 8,
  cursor: "pointer",
  marginBottom: 2,
  transition: "background 0.12s",
};
const clientRow = {
  ...clientRowBase,
  background: "transparent",
  color: "var(--ink)",
};
const clientRowActive = {
  ...clientRowBase,
  background: "var(--brand)",
  color: "#fff",
  boxShadow: "0 2px 8px -2px color-mix(in oklab, var(--brand) 40%, transparent)",
};
const avatar = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 30, height: 30, flexShrink: 0,
  background: "#e9efe8", color: "#3f6b4f",
  borderRadius: 8, fontSize: 13, fontWeight: 700,
};
const avatarActive = {
  ...avatar,
  background: "rgba(255,255,255,0.22)", color: "#fff",
};
const clientName = {
  display: "block", fontSize: 13.5, fontWeight: 600,
  lineHeight: 1.3,
  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
};
const clientCode = {
  display: "block", fontSize: 11, color: "var(--ink-3)",
  marginTop: 2, letterSpacing: "0.02em",
};
const clientCodeActive = {
  ...clientCode,
  color: "rgba(255,255,255,0.78)",
};
const rightCol = {
  flex: 1, display: "flex", flexDirection: "column",
  background: "#fff", border: "1px solid var(--line)", borderRadius: 12,
  overflow: "hidden",
  boxShadow: "0 2px 10px -6px rgba(20, 30, 22, 0.12)",
};
const rightHeader = {
  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
  padding: "16px 20px", borderBottom: "1px solid var(--line)",
  background: "#fafbf6", gap: 12,
};
const emptyBox = {
  padding: 40, textAlign: "center", color: "var(--ink-3)", fontSize: 14,
};
const aliasRow = {
  display: "flex", alignItems: "center", gap: 12,
  padding: "12px 20px",
  borderBottom: "1px solid var(--line)",
  cursor: "grab",
};
const dragHandle = {
  display: "inline-block", width: 20, textAlign: "center",
  color: "var(--ink-3)", fontSize: 16, cursor: "grab", userSelect: "none",
};
const orderNum = {
  display: "inline-block", width: 32, textAlign: "center",
  padding: "2px 6px", background: "var(--brand)", color: "#fff",
  borderRadius: 6, fontSize: 12, fontWeight: 700,
};
const moveBtn = {
  width: 28, height: 28, border: "1px solid var(--line)",
  background: "#fff", borderRadius: 6, cursor: "pointer",
  fontSize: 14, fontWeight: 700, color: "var(--ink-2)",
};
const primaryBtn = {
  height: 36, padding: "0 16px", background: "var(--brand)", color: "#fff",
  border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13,
};
const secondaryBtn = {
  height: 36, padding: "0 14px", background: "#fff", color: "var(--ink)",
  border: "1px solid var(--line)", borderRadius: 8, fontWeight: 600,
  fontSize: 13, cursor: "pointer",
};
