/* 알림 UI 센터
 * - 우상단 토스트 스택
 * - 상단 복귀 배너 ("안 본 발주 N건")
 * - 상단 OS 알림 권한 요청 배너
 */

import { useLocation, useNavigate } from "react-router-dom";
import { useNotification } from "./NotificationContext";
import { useNotificationPermission } from "./useNotificationPermission";
import { formatOrderSummary, formatOrderTime, statusBadge } from "./notificationUtils";

export default function NotificationCenter() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const {
    unseenCount, lastSeenOrderNum, toasts,
    bannerDismissed, dismissBanner, dismissToast,
  } = useNotification();
  const perm = useNotificationPermission();

  const inOrderAdmin = pathname.startsWith("/admin/orders");
  const showReturnBanner = unseenCount > 0 && !bannerDismissed && !inOrderAdmin;
  const showPermissionBanner = perm.state === "default" && perm.canAsk;

  const goOrderAdmin = () => {
    nav(`/admin/orders?highlightSince=${lastSeenOrderNum}`);
    dismissBanner();
  };

  const onToastClick = (ev) => {
    nav(`/admin/orders?highlightSince=${lastSeenOrderNum}`);
  };

  return (
    <>
      {/* 배너들 */}
      {(showReturnBanner || showPermissionBanner) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 20px 0" }}>
          {showReturnBanner && (
            <div style={bannerStyle("#fff8e1", "#b4881a")}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <span style={{ flex: 1 }}>
                마지막 접속 이후 <b>{unseenCount}건</b>의 새 발주가 있습니다
              </span>
              <button type="button" style={btnPrimary} onClick={goOrderAdmin}>확인하기</button>
              <button type="button" style={btnGhost} onClick={dismissBanner}>나중에</button>
            </div>
          )}
          {showPermissionBanner && (
            <div style={bannerStyle("#eef5ef", "#1b3a2a")}>
              <span style={{ fontSize: 18 }}>🔔</span>
              <span style={{ flex: 1 }}>
                새 발주 알림을 데스크톱 알림으로 받으시겠어요?
              </span>
              <button type="button" style={btnPrimary} onClick={perm.request}>허용</button>
              <button type="button" style={btnGhost} onClick={perm.dismiss}>나중에</button>
            </div>
          )}
        </div>
      )}

      {/* 토스트 스택 (우상단 fixed) */}
      <div
        style={{
          position: "fixed", top: 16, right: 16, zIndex: 1000,
          display: "flex", flexDirection: "column", gap: 10,
          maxWidth: 360,
        }}
      >
        {toasts.map((t) => {
          const ev = t.event;
          const sb = statusBadge(ev.status);
          return (
            <div
              key={t.id}
              onClick={() => onToastClick(ev)}
              style={{
                background: "#fff",
                borderRadius: 10,
                boxShadow: "0 10px 30px -8px rgba(0,0,0,.18)",
                border: "1px solid #e3e7dc",
                borderLeft: "4px solid #1b3a2a",
                padding: "12px 14px",
                cursor: "pointer",
                position: "relative",
                animation: "ntc-slidein .18s ease-out",
              }}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); dismissToast(t.id); }}
                aria-label="닫기"
                style={{
                  position: "absolute", top: 6, right: 6,
                  width: 22, height: 22, border: "none",
                  background: "transparent", cursor: "pointer",
                  color: "#999", fontSize: 16, lineHeight: 1,
                }}
              >×</button>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1b3a2a", display: "flex", alignItems: "center", gap: 6 }}>
                📦 {ev.cliCompName || "거래처"}
                {sb && (
                  <span style={{
                    fontSize: 10.5, padding: "1px 7px", borderRadius: 4,
                    background: sb.bg, color: sb.color, fontWeight: 700,
                  }}>{sb.label}</span>
                )}
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: "#333" }}>
                {formatOrderSummary(ev)}
              </div>
              <div style={{ marginTop: 2, fontSize: 11.5, color: "#888" }}>
                {formatOrderTime(ev.orderDate)}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes ntc-slidein {
          from { transform: translateX(20px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

function bannerStyle(bg, color) {
  return {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 14px", borderRadius: 8,
    background: bg, color,
    border: `1px solid ${color}22`,
    fontSize: 13.5, fontWeight: 500,
  };
}
const btnPrimary = {
  height: 30, padding: "0 14px", border: "none",
  background: "#1b3a2a", color: "#fff", borderRadius: 6,
  fontSize: 12.5, fontWeight: 700, cursor: "pointer",
};
const btnGhost = {
  height: 30, padding: "0 12px", border: "1px solid #ccc",
  background: "transparent", color: "#555", borderRadius: 6,
  fontSize: 12.5, fontWeight: 600, cursor: "pointer",
};
