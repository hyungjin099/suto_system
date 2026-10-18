/* OS 알림 권한 상태 + 요청 훅 */

import { useCallback, useEffect, useState } from "react";

const DECLINED_KEY = "notif-permission-declined-at";
const DECLINE_TTL_MS = 24 * 60 * 60 * 1000; // 하루 동안 다시 묻지 않음

function getInitialState() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export function useNotificationPermission() {
  const [state, setState] = useState(getInitialState);

  const canAsk = state === "default" && !_isRecentlyDeclined();

  const request = useCallback(async () => {
    if (!("Notification" in window)) return "unsupported";
    try {
      const res = await Notification.requestPermission();
      setState(res);
      if (res !== "granted") _markDeclined();
      return res;
    } catch (_) {
      return state;
    }
  }, [state]);

  const dismiss = useCallback(() => {
    _markDeclined();
    // state는 default 그대로지만 canAsk가 false가 됨
    setState((s) => s);
  }, []);

  useEffect(() => {
    // 다른 탭에서 권한이 바뀌는 경우까지는 신경쓰지 않음
  }, []);

  return { state, canAsk, request, dismiss };
}

function _isRecentlyDeclined() {
  try {
    const v = sessionStorage.getItem(DECLINED_KEY);
    if (!v) return false;
    return Date.now() - Number(v) < DECLINE_TTL_MS;
  } catch { return false; }
}
function _markDeclined() {
  try { sessionStorage.setItem(DECLINED_KEY, String(Date.now())); } catch {}
}
