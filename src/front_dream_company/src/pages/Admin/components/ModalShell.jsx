/* 공통 모달 셸 (오버레이 + 컨테이너) */

import styles from "./ModalShell.module.css";

export default function ModalShell({ children, onClose, maxWidth = 520 }) {
  return (
    <div onClick={onClose} className={styles.overlay}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={styles.modal}
        style={{ maxWidth }}
      >
        {children}
      </div>
    </div>
  );
}
