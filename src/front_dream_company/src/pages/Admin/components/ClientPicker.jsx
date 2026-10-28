/* 거래처 다중 선택 (200곳 이상 대응)
 * - 검색(거래처명/코드) + 체크 목록 + 선택된 거래처 칩
 * - '검색된 항목 전체 선택'으로 이름이 비슷한 업체를 한 번에 고를 수 있다
 */

import { useMemo, useState } from "react";
import styles from "./ClientPicker.module.css";

export default function ClientPicker({ clients, selected, onChange, loading, error }) {
  const [q, setQ] = useState("");

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const byCode = useMemo(() => new Map(clients.map((c) => [c.cliCode, c])), [clients]);

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return clients;
    return clients.filter(
      (c) => c.name.toLowerCase().includes(k) || c.cliCode.toLowerCase().includes(k)
    );
  }, [clients, q]);

  const toggle = (code) => {
    onChange(selectedSet.has(code) ? selected.filter((c) => c !== code) : [...selected, code]);
  };
  const selectAllFiltered = () => {
    const next = new Set(selected);
    filtered.forEach((c) => next.add(c.cliCode));
    onChange([...next]);
  };
  const clearFiltered = () => {
    const drop = new Set(filtered.map((c) => c.cliCode));
    onChange(selected.filter((c) => !drop.has(c)));
  };

  return (
    <div className={styles.picker}>
      <div className={styles.chips}>
        {selected.length === 0 ? (
          <span className={styles.chipsEmpty}>선택된 거래처가 없습니다</span>
        ) : (
          selected.map((code) => (
            <span key={code} className={styles.chip}>
              {byCode.get(code)?.name || code}
              <button type="button" className={styles.chipX} onClick={() => toggle(code)} aria-label="선택 해제">
                ×
              </button>
            </span>
          ))
        )}
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="거래처명 또는 코드로 검색"
        />
        <button type="button" className={styles.tbBtn} onClick={selectAllFiltered} disabled={!filtered.length}>
          {q.trim() ? `검색된 ${filtered.length}곳 선택` : `전체 ${filtered.length}곳 선택`}
        </button>
        <button type="button" className={styles.tbBtn} onClick={clearFiltered} disabled={!filtered.length}>
          {q.trim() ? "검색된 항목 해제" : "전체 해제"}
        </button>
      </div>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.state}>불러오는 중…</div>
        ) : error ? (
          <div className={styles.state}>{error}</div>
        ) : filtered.length === 0 ? (
          <div className={styles.state}>검색 결과가 없습니다</div>
        ) : (
          filtered.map((c) => (
            <label key={c.cliCode} className={styles.item}>
              <input
                type="checkbox"
                checked={selectedSet.has(c.cliCode)}
                onChange={() => toggle(c.cliCode)}
              />
              <span className={styles.itemName}>{c.name}</span>
              <span className={styles.itemCode}>{c.cliCode}</span>
            </label>
          ))
        )}
      </div>
      <div className={styles.count}>선택 {selected.length}곳</div>
    </div>
  );
}
