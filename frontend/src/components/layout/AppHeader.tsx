import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import NotificationDropdown from "../../components/header/NotificationDropdown";
import { ThemeToggleButton } from "../common/ThemeToggleButton";
import UserDropdown from "../header/UserDropdown";
import LanguageDropdown from "../header/LanguageDropdown";
import { PageUrl } from "@/types/utils.types";
import { GridIcon } from "@/public/icons";
import { useAuth } from "@/context/AuthContext";
import { ADMIN_PERMISSIONS, hasPermission } from "@/utils/permissions";
import { HeaderNav, MobileNav } from "./HeaderNav";
import { serviceOf, useNavItems } from "./navConfig";

/** The app bar: logo and the current service's name, that service's menus, and a Dashboard
 * switch for choosing another service. Other services' menus stay out of the way. */
const AppHeader: React.FC = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const navItems = useNavItems();
  const service = serviceOf(pathname);
  const current = service
    ? navItems.find((item) => item.service === service)
    : undefined;
  const canSeeDashboard = hasPermission(user, ADMIN_PERMISSIONS.VIEW_DASHBOARD);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => setMobileOpen(false), [pathname]);

  const headerRef = useRef<HTMLElement>(null);
  // Workspace pages pin their own header just below this bar, whatever height it has.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const publish = () =>
      document.documentElement.style.setProperty(
        "--app-header-h",
        `${el.offsetHeight}px`
      );
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-[9] w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="flex items-center gap-3 px-4 py-3 md:px-6">
        <Link
          to={canSeeDashboard ? PageUrl.Dashboard.path : "/"}
          className="flex shrink-0 items-center gap-2.5"
          aria-label={t("dashboard")}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden
            >
              <path d="M3 13a9 9 0 0 1 18 0H3Zm9 0v5a2.5 2.5 0 1 1-5 0M12 3v1" />
            </svg>
          </span>
          <span className="hidden text-sm font-bold tracking-[0.12em] text-gray-900 dark:text-white sm:inline">
            UMBRELLA
          </span>
        </Link>

        {current ? (
          <span className="shrink-0 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            {current.name}
          </span>
        ) : null}

        <div className="min-w-0 flex-1">
          <HeaderNav item={current} />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {canSeeDashboard ? (
            <Link
              to={PageUrl.Dashboard.path}
              title={t("navAllServices")}
              aria-label={t("navAllServices")}
              className={`flex h-11 items-center gap-2 rounded-lg border px-3 text-sm font-medium ${
                pathname === PageUrl.Dashboard.path
                  ? "border-brand-300 bg-brand-50 text-brand-600 dark:border-brand-500/40 dark:bg-brand-500/15 dark:text-brand-400"
                  : "border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-white/5"
              }`}
            >
              <GridIcon className="h-5 w-5" />
              <span className="hidden xl:inline">{t("navAllServices")}</span>
            </Link>
          ) : null}
          <div className="hidden items-center gap-2 sm:flex">
            <ThemeToggleButton />
            <NotificationDropdown />
            <LanguageDropdown />
          </div>
          <UserDropdown />
          {current ? (
            <button
              type="button"
              aria-label={t("navOpenMenu")}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((prev) => !prev)}
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-600 dark:border-gray-800 dark:text-gray-300 lg:hidden"
            >
              <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden>
                <path
                  d="M1 1h16M1 7h16M1 13h16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
      {mobileOpen ? (
        <div className="border-t border-gray-200 dark:border-gray-800 lg:hidden">
          <MobileNav item={current} onNavigate={() => setMobileOpen(false)} />
        </div>
      ) : null}
    </header>
  );
};

export default AppHeader;
