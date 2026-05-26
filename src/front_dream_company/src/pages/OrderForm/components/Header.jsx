/* 페이지 상단 헤더 */

import { IconLeaf } from "./Icons";
import styles from "./Header.module.css";

export default function Header({ clientCompany = "고객사" }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <IconLeaf size={20} />
          </div>
          <div>
            <div className={styles.title}>드림컴퍼니 주문 시스템</div>
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
