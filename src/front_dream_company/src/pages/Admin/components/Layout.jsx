/* 관리자 페이지 레이아웃: AdminShell + Sidebar + Topbar
 * - 사이드바: react-router-dom Link 사용. 활성 상태는 useLocation 으로 자동 판별.
 * - 일부 메뉴(주문 관리/매출 리포트)는 페이지 미구현으로 disabled 처리.
 */

import { Link, useLocation } from "react-router-dom";
import {
  IconLeaf,
  IconBox,
  IconCart,
  IconUsers,
  IconChart,
} from "./Icons";
import { cx } from "../utils";
import styles from "./Layout.module.css";

const MENU_ITEMS = [
  {
    key: "products",
    label: "제품 관리",
    path: "/admin/products",
    Icon: IconBox,
  },
  { key: "orders", label: "주문 관리", path: null, Icon: IconCart },
  {
    key: "clients",
    label: "고객사 관리",
    path: "/admin/clients",
    Icon: IconUsers,
  },
  { key: "reports", label: "매출 리포트", path: null, Icon: IconChart },
];

// 현재 경로 → (현재 메뉴 key, 페이지 이름)
function resolveActive(pathname) {
  if (pathname.startsWith("/admin/clients"))
    return { key: "clients", category: "고객사 관리", page: "등록 고객사 목록" };
  // 기본값(제품 관리)
  return { key: "products", category: "제품 관리", page: "원단 카탈로그" };
}

export function AdminShell({ children }) {
  const { pathname } = useLocation();
  const active = resolveActive(pathname);

  return (
    <div className={styles.shell}>
      <Sidebar activeKey={active.key} />
      <div className={styles.content}>
        <Topbar category={active.category} page={active.page} />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}

function Sidebar({ activeKey }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          <IconLeaf size={20} />
        </div>
        <div>
          <div className={styles.brandName}>드림컴퍼니</div>
          <div className={styles.brandTag}>Admin</div>
        </div>
      </div>

      <div className={styles.menuLabel}>MENU</div>

      {MENU_ITEMS.map((it) => {
        const Icon = it.Icon;
        const isActive = it.key === activeKey;
        const disabled = !it.path;

        if (disabled) {
          return (
            <button
              key={it.key}
              type="button"
              disabled
              className={cx(styles.menuItem, styles.menuItemDisabled)}
              title="준비 중인 메뉴입니다"
            >
              <span className={styles.menuIcon}>
                <Icon />
              </span>
              {it.label}
              <span className={styles.menuBadge}>준비중</span>
            </button>
          );
        }

        return (
          <Link
            key={it.key}
            to={it.path}
            className={cx(styles.menuItem, isActive && styles.menuItemActive)}
          >
            <span className={styles.menuIcon}>
              <Icon />
            </span>
            {it.label}
          </Link>
        );
      })}
    </aside>
  );
}

function Topbar({ category, page }) {
  return (
    <header className={styles.topbar}>
      <div className={styles.crumbs}>
        {category}
        <span className={styles.crumbSep}>/</span>
        <span className={styles.crumbCurrent}>{page}</span>
      </div>
      <div className={styles.userArea}>
        <div className={styles.avatar}>관</div>
        <div>
          <div className={styles.userName}>관리자</div>
          <div className={styles.userEmail}>admin@dreamcompany.kr</div>
        </div>
      </div>
    </header>
  );
}
