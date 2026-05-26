/* 섹션 헤더 (STEP 표시) */

import styles from "./SectionHeader.module.css";

export default function SectionHeader({ n, title, right }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.left}>
        <span className={styles.step}>STEP {n}</span>
        <span className={styles.divider} />
        <h2 className={styles.title}>{title}</h2>
      </div>
      {right}
    </div>
  );
}
