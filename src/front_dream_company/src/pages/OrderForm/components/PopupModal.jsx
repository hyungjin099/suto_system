/* 관리자가 등록한 공지 팝업 (모달)
 * - 주문하기 화면에서만 노출, 동시에 1개
 * - '확인'은 이번 방문 동안만 닫기, '다시 보지 않기'는 그 팝업을 이 브라우저에서 숨김
 *   (제목/내용이 수정되면 contentVer 가 올라가 다시 노출된다)
 * - 내용은 텍스트로만 렌더링하고 http(s):// 주소만 새 탭 링크로 바꾼다 (HTML 주입 없음)
 */

import { useEffect, useState } from "react";
import { fetchActivePopup } from "../api";
import styles from "./PopupModal.module.css";

const HIDE_KEY = (cliCode) => `popupHidden:${cliCode}`;

const readHidden = (cliCode) => {
  try {
    return JSON.parse(localStorage.getItem(HIDE_KEY(cliCode)) || "{}");
  } catch {
    return {};
  }
};
const writeHidden = (cliCode, popup) => {
  try {
    const cur = readHidden(cliCode);
    cur[popup.popupNum] = popup.contentVer;
    localStorage.setItem(HIDE_KEY(cliCode), JSON.stringify(cur));
  } catch {
    /* 저장소를 못 쓰는 환경(사생활 보호 모드 등)이면 이번 방문에만 숨긴다 */
  }
};

const URL_RE = /(https?:\/\/[^\s<>"']+)/g;

function renderContent(text) {
  return text.split(URL_RE).map((part, i) => {
    if (i % 2 === 1) {
      // 문장 끝 구두점은 링크에서 제외
      const m = part.match(/^(.*?)([.,)\]]*)$/);
      return (
        <span key={i}>
          <a href={m[1]} target="_blank" rel="noopener noreferrer">{m[1]}</a>
          {m[2]}
        </span>
      );
    }
    return part;
  });
}

export default function PopupModal({ cliCode, active }) {
  const [popup, setPopup] = useState(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!cliCode) return undefined;
    let alive = true;
    fetchActivePopup(cliCode)
      .then((p) => {
        if (!alive || !p) return;
        if (readHidden(cliCode)[p.popupNum] === p.contentVer) return;
        setPopup(p);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [cliCode]);

  const open = !!popup && !closed && active;

  useEffect(() => {
    if (!open) return undefined;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") setClosed(true); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = orig;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;

  const hideForever = () => {
    writeHidden(cliCode, popup);
    setClosed(true);
  };

  return (
    <div className={styles.overlay} onClick={() => setClosed(true)}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={popup.title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.handle} aria-hidden="true" />
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => setClosed(true)}
          aria-label="닫기"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className={styles.header}>
          <span className={styles.iconBadge} aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              <path d="M18.5 5.5a9 9 0 0 1 0 13" />
            </svg>
          </span>
          <div className={styles.headText}>
            <div className={styles.eyebrow}>공지사항</div>
            <h2 className={styles.title}>{popup.title}</h2>
          </div>
        </div>
        <div className={styles.content}>{renderContent(popup.content)}</div>
        <div className={styles.footer}>
          <button type="button" className={styles.hideBtn} onClick={hideForever}>
            다시 보지 않기
          </button>
          <button type="button" className={styles.okBtn} onClick={() => setClosed(true)}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
