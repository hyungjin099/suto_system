/* 관리자 페이지 레이아웃: AdminShell + Sidebar + Topbar
 * - 사이드바: react-router-dom Link 사용. 활성 상태는 useLocation 으로 자동 판별.
 */

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { adminLogout, adminMe } from "../adminAuth";
import {
  IconLeaf,
  IconBox,
  IconCart,
  IconUsers,
  IconLink,
  IconTruck,
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
  { key: "orders", label: "주문 내역", path: "/admin/orders", Icon: IconCart },
  {
    key: "clients",
    label: "고객사 관리",
    path: "/admin/clients",
    Icon: IconUsers,
  },
  {
    key: "suppliers",
    label: "매입처 관리",
    path: "/admin/suppliers",
    Icon: IconTruck,
  },
  {
    key: "fabric-alias",
    label: "원단 별칭 관리",
    path: "/admin/fabric-alias",
    Icon: IconLink,
  },
];

// 현재 경로 → (현재 메뉴 key, 페이지 이름)
function resolveActive(pathname) {
  if (pathname.startsWith("/admin/clients"))
    return { key: "clients", category: "고객사 관리", page: "등록 고객사 목록" };
  if (pathname.startsWith("/admin/suppliers"))
    return { key: "suppliers", category: "매입처 관리", page: "매입처 목록" };
  if (pathname.startsWith("/admin/orders"))
    return { key: "orders", category: "주문 내역", page: "전체 주문" };
  if (pathname.startsWith("/admin/fabric-alias"))
    return { key: "fabric-alias", category: "원단 관리", page: "원단 별칭 매칭" };
  if (pathname.startsWith("/admin/users"))
    return { key: "users", category: "시스템", page: "관리자 계정" };
  // 기본값(제품 관리)
  return { key: "products", category: "제품 관리", page: "원단 카탈로그" };
}

export function AdminShell({ children }) {
  const { pathname } = useLocation();
  const active = resolveActive(pathname);
  const [me, setMe] = useState({ isSuperAdmin: false });

  useEffect(() => {
    adminMe().then((r) => {
      if (r.authenticated) setMe(r);
    });
  }, []);

  return (
    <div className={styles.shell}>
      <Sidebar activeKey={active.key} isSuperAdmin={!!me.isSuperAdmin} />
      <div className={styles.content}>
        <Topbar category={active.category} page={active.page} me={me} setMe={setMe} />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}

function Sidebar({ activeKey, isSuperAdmin }) {
  const menu = isSuperAdmin
    ? [...MENU_ITEMS, { key: "users", label: "관리자 계정", path: "/admin/users", Icon: IconUsers }]
    : MENU_ITEMS;
  return _SidebarRender({ activeKey, menu });
}

function _SidebarRender({ activeKey, menu }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          <img src="/logo.png" alt="드림컴퍼니" style={{ width: 24, height: 24, objectFit: "contain" }} />
        </div>
        <div>
          <div className={styles.brandName}>드림컴퍼니</div>
          <div className={styles.brandTag}>Admin</div>
        </div>
      </div>

      <div className={styles.menuLabel}>MENU</div>

      {menu.map((it) => {
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

function Topbar({ category, page, me }) {
  const navigate = useNavigate();

  const onLogout = async () => {
    await adminLogout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.crumbs}>
        {category}
        <span className={styles.crumbSep}>/</span>
        <span className={styles.crumbCurrent}>{page}</span>
      </div>
      <div className={styles.userArea}>
        <div className={styles.userName}>{me.username || "—"}</div>
        <button
          type="button"
          onClick={onLogout}
          style={{
            marginLeft: 12, height: 32, padding: "0 12px",
            background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: 8, color: "var(--ink-2)", fontSize: 12.5,
            fontWeight: 600, cursor: "pointer",
          }}
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
