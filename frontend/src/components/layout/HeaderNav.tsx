import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon } from "@/public/icons";
import type { NavItem, SubItem } from "./navConfig";

const isUnder = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(`${path}/`);

interface MenuGroup {
  key: string;
  name: string;
  icon?: ReactNode;
  items: SubItem[];
}

/** A service's entries as header menus: one per group (Access, Setup…), or one for a flat list. */
const menuGroupsOf = (item: NavItem): MenuGroup[] =>
  item.groups?.length
    ? item.groups
        .filter((group) => group.subItems.length)
        .map((group) => ({
          key: group.name,
          name: group.name,
          icon: group.icon,
          items: group.subItems
        }))
    : item.subItems?.length
      ? [
          {
            key: item.name,
            name: item.name,
            icon: item.icon,
            items: item.subItems
          }
        ]
      : [];

/** Long menus (Lab Setup has 20 entries) split into columns rather than scroll. */
const columnsFor = (count: number) =>
  count > 14 ? "grid-cols-3" : count > 7 ? "grid-cols-2" : "grid-cols-1";

const Menu = ({ group }: { group: MenuGroup }) => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = group.items.some((item) => isUnder(pathname, item.path));

  // Closes on navigation, Escape, or a click elsewhere.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${
          active
            ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
        }`}
      >
        {group.icon ? (
          <span className="flex h-5 w-5 items-center [&>svg]:h-5 [&>svg]:w-5">
            {group.icon}
          </span>
        ) : null}
        {group.name}
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-[60] pt-1">
          <div
            role="menu"
            className={`grid ${columnsFor(group.items.length)} w-max min-w-56 gap-x-2 rounded-xl border border-gray-200 bg-white p-2 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900`}
          >
            {group.items.map((item) => {
              const current = isUnder(pathname, item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  role="menuitem"
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                    current
                      ? "bg-brand-50 font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

/** The current service's menus, inline on wide screens. */
export const HeaderNav = ({ item }: { item: NavItem | undefined }) => {
  const groups = item ? menuGroupsOf(item) : [];
  if (!groups.length) return null;
  return (
    <nav aria-label={item?.name} className="hidden items-center gap-1 lg:flex">
      {groups.map((group) => (
        <Menu key={group.key} group={group} />
      ))}
    </nav>
  );
};

/** The same menus stacked, for narrow screens; toggled from the header. */
export const MobileNav = ({
  item,
  onNavigate
}: {
  item: NavItem | undefined;
  onNavigate: () => void;
}) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const groups = item ? menuGroupsOf(item) : [];
  if (!groups.length)
    return (
      <p className="px-4 py-3 text-sm text-gray-500">{t("navPickService")}</p>
    );
  return (
    <nav
      aria-label={item?.name}
      className="max-h-[70vh] space-y-3 overflow-y-auto px-4 py-3 lg:hidden"
    >
      {groups.map((group) => (
        <div key={group.key}>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            {group.name}
          </p>
          <div className="grid grid-cols-2 gap-1">
            {group.items.map((entry) => (
              <Link
                key={entry.path}
                to={entry.path}
                onClick={onNavigate}
                className={`rounded-lg px-3 py-2 text-sm ${
                  isUnder(pathname, entry.path)
                    ? "bg-brand-50 font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                }`}
              >
                {entry.name}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
};
