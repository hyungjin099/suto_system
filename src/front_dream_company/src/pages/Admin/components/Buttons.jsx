/* 관리자 페이지 공통 버튼: Primary / Ghost / Icon */

import { useState } from "react";
import { cx } from "../utils";
import styles from "./Buttons.module.css";

export function PrimaryButton({ children, onClick, type = "button" }) {
  return (
    <button type={type} onClick={onClick} className={styles.primary}>
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, danger, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cx(styles.ghost, danger && styles.ghostDanger)}
    >
      {children}
    </button>
  );
}

export function IconBtn({ children, onClick, title, danger }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cx(
        styles.iconBtn,
        danger && styles.iconBtnDanger,
        hover && (danger ? styles.iconBtnDangerHover : styles.iconBtnHover)
      )}
    >
      {children}
    </button>
  );
}
