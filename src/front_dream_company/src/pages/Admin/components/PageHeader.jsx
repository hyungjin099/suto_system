/* 페이지 상단 타이틀/액션 영역 */

import styles from "./PageHeader.module.css";

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className={styles.wrap}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      <div className={styles.actions}>{actions}</div>
    </div>
  );
}
