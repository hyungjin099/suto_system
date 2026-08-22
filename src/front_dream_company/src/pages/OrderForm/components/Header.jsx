/* 페이지 상단 헤더 */

import styles from "./Header.module.css";

export default function Header({ clientCompany = "고객사" }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <img src="/logo.png" alt="드림컴퍼니" style={{ width: 24, height: 24, objectFit: "contain" }} />
          </div>
          <div>
            <div className={styles.title}>드림컴퍼니 발주 시스템</div>
            <div className={styles.subtitle}>Order Entry · v1.0</div>
          </div>
        </div>
        <span className={styles.chip} title={clientCompany}>
          <span className={styles.dot} />
          {clientCompany}
        </span>
      </div>
    </header>
  );
}
