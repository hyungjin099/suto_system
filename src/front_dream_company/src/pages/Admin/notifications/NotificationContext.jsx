/* 알림 전역 상태 — 사이드바 뱃지, 토스트, 복귀 배너, document.title 동기화용 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { fetchUnseen, patchLastSeen, sseStreamUrl } from "../adminAuth";
import { formatOrderSummary, formatOrderTime } from "./notificationUtils";

const NotificationContext = createContext(null);

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
  return ctx;
}

const TOAST_MAX = 5;
const TOAST_TTL_MS = 5000;

export function NotificationProvider({ children, enabled }) {
  // 미확인 수 + 최신 N건 미리보기 (서버 기준)
  const [unseenCount, setUnseenCount] = useState(0);
  const [preview, setPreview] = useState([]);              // 복귀 배너 preview
  const [lastSeenOrderNum, setLastSeenOrderNum] = useState(0);
  const [latestOrderNum, setLatestOrderNum] = useState(0);

  // 실시간 수신 토스트 스택 (최대 5개)
  const [toasts, setToasts] = useState([]);                // {id, event, createdAt}

  // 복귀 배너 노출 여부 (사용자가 X 또는 "나중에" 누르면 false)
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const esRef = useRef(null);

  /* ---------- 서버 동기화 ---------- */
  const refreshUnseen = useCallback(async () => {
    try {
      const data = await fetchUnseen();
      setUnseenCount(data.unseenCount || 0);
      setPreview(data.preview || []);
      setLastSeenOrderNum(data.lastSeenOrderNum || 0);
      setLatestOrderNum(data.latestOrderNum || 0);
    } catch (_) {
      // 401이면 adminAuth interceptor가 리다이렉트 처리
    }
  }, []);

  /* ---------- 토스트 ---------- */
  const pushToast = useCallback((event) => {
    setToasts((prev) => {
      const next = [...prev, { id: `${event.orderNum}-${Date.now()}`, event, createdAt: Date.now() }];
      // 오래된 것부터 밀어내기
      return next.length > TOAST_MAX ? next.slice(next.length - TOAST_MAX) : next;
    });
  }, []);
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ---------- "본 걸로 처리" ---------- */
  const markAsSeen = useCallback(async (orderNum) => {
    if (!orderNum) return;
    try {
      const data = await patchLastSeen(orderNum);
      const next = data?.lastSeenOrderNum ?? orderNum;
      setLastSeenOrderNum(next);
      // 서버 기준으로 unseen 재계산 (낙관적 감소는 N건 중 1만 깎여 플리커 발생 가능 → 생략)
      refreshUnseen();
    } catch (_) {}
  }, [refreshUnseen]);

  const dismissBanner = useCallback(() => setBannerDismissed(true), []);

  /* ---------- OS 알림 ---------- */
  const maybeNotify = useCallback((event) => {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const focused = document.hasFocus() && document.visibilityState === "visible";
    if (focused) return;  // 포커스 중엔 OS 알림 생략 (토스트와 중복 방지)

    try {
      const n = new Notification(`📦 새 발주 — ${event.cliCompName || "거래처"}`, {
        body: `${formatOrderSummary(event)}\n${formatOrderTime(event.orderDate)}`,
        tag: `order-${event.orderNum}`,
      });
      n.onclick = () => {
        window.focus();
        window.location.href = `/admin/orders?highlightSince=${lastSeenOrderNum}`;
      };
    } catch (_) {}
  }, [lastSeenOrderNum]);

  /* ---------- SSE 연결 ---------- */
  useEffect(() => {
    if (!enabled) return undefined;

    // 초기 unseen 동기화
    refreshUnseen();

    const es = new EventSource(sseStreamUrl(), { withCredentials: true });
    esRef.current = es;
    let reconnectTimer = null;

    es.addEventListener("new-order", (e) => {
      try {
        const event = JSON.parse(e.data);
        setLatestOrderNum((v) => Math.max(v, event.orderNum || 0));
        setUnseenCount((c) => c + 1);
        setPreview((prev) => {
          const next = [event, ...prev.filter((p) => p.orderNum !== event.orderNum)];
          return next.slice(0, 5);
        });
        pushToast(event);
        maybeNotify(event);
      } catch (_) {}
    });

    // 재연결/장애 시 unseen 재동기화 — 타이머 핸들 보관 후 cleanup에서 해제
    es.onerror = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(refreshUnseen, 3000);
    };

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es.close();
      esRef.current = null;
    };
  }, [enabled, refreshUnseen, pushToast, maybeNotify]);

  /* ---------- document.title 뱃지 (최소화·백그라운드 상태면 깜빡임) ---------- */
  useEffect(() => {
    const base = "드림컴퍼니 관리자";
    if (unseenCount <= 0) {
      document.title = base;
      return undefined;
    }
    const normal = `(${unseenCount}) ${base}`;
    const alert  = `📦 신규 발주 ${unseenCount}건`;

    // 포커스 중이면 그냥 뱃지만, 아니면 번갈아가며 깜빡
    const isFocused = () => document.hasFocus() && document.visibilityState === "visible";
    let toggle = false;
    const tick = () => {
      if (isFocused()) {
        document.title = normal;
      } else {
        toggle = !toggle;
        document.title = toggle ? alert : normal;
      }
    };
    tick();
    const timer = setInterval(tick, 1000);

    // 포커스/가시성 바뀔 때 즉시 반영
    const onVis = () => { if (isFocused()) document.title = normal; };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
      document.title = base;
    };
  }, [unseenCount]);

  /* ---------- 토스트 자동 만료 ---------- */
  useEffect(() => {
    if (toasts.length === 0) return undefined;
    const timers = toasts.map((t) =>
      setTimeout(() => dismissToast(t.id), TOAST_TTL_MS)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismissToast]);

  const value = useMemo(() => ({
    unseenCount,
    preview,
    lastSeenOrderNum,
    latestOrderNum,
    toasts,
    bannerDismissed,
    markAsSeen,
    dismissToast,
    dismissBanner,
    refreshUnseen,
  }), [unseenCount, preview, lastSeenOrderNum, latestOrderNum, toasts, bannerDismissed,
      markAsSeen, dismissToast, dismissBanner, refreshUnseen]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
