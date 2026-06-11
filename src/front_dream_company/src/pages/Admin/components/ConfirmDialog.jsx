/* 확인 다이얼로그 */

import { useEffect } from "react";
import ModalShell from "./ModalShell";
import { GhostButton } from "./Buttons";
import { cx } from "../utils";
import styles from "./ConfirmDialog.module.css";

export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  danger,
  disabled,
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <ModalShell onClose={onCancel} maxWidth={400}>
      <div className={styles.head}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.body}>{body}</div>
      </div>
      <div className={styles.actions}>
        <GhostButton onClick={onCancel}>취소</GhostButton>
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled}
          className={cx(styles.confirmBtn, danger && styles.confirmBtnDanger)}
        >
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}
