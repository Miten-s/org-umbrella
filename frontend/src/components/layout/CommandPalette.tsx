import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useNavItems } from "./navConfig";
import { flattenNav, type PageEntry, searchPages } from "./pageSearch";

const RECENT_KEY = "commandPalette.recent";
const MAX_RECENT = 5;

const readRecent = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

const pushRecent = (path: string) => {
  try {
    const next = [path, ...readRecent().filter((p) => p !== path)].slice(
      0,
      MAX_RECENT
    );
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
};

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.platform);

const SearchIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    className={className}
    aria-hidden
  >
    <circle cx="9" cy="9" r="6" />
    <path d="m14 14 4 4" />
  </svg>
);

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-sans text-[11px] font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
    {children}
  </kbd>
);

/** Header button + Ctrl/⌘K popup that searches every page the user may open. */
const CommandPalette: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const navItems = useNavItems();
  const pages = useMemo(() => flattenNav(navItems), [navItems]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const showingRecent = !query.trim();
  const { results, recentCount } = useMemo(() => {
    if (!showingRecent)
      return { results: searchPages(pages, query), recentCount: 0 };
    const byPath = new Map(pages.map((p) => [p.path, p]));
    const recent = readRecent()
      .map((path) => byPath.get(path))
      .filter((p): p is PageEntry => !!p);
    const recentPaths = new Set(recent.map((p) => p.path));
    return {
      results: [...recent, ...pages.filter((p) => !recentPaths.has(p.path))],
      recentCount: recent.length
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, query, showingRecent, open]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (page: PageEntry | undefined) => {
    if (!page) return;
    pushRecent(page.path);
    setOpen(false);
    if (page.path !== pathname) navigate(page.path);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const sectionHeading = (label: string) => (
    <li
      role="presentation"
      className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-gray-400"
    >
      {label}
    </li>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("cmdSearchPages")}
        className="flex h-11 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm text-gray-500 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5"
      >
        <SearchIcon />
        <span className="hidden xl:inline">{t("cmdSearchPages")}</span>
        <span className="hidden items-center gap-0.5 xl:flex">
          <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      {open
        ? createPortal(
            <div
              className="fixed inset-0 z-[100000] flex items-start justify-center px-4 pt-[12vh]"
              role="dialog"
              aria-modal="true"
              aria-label={t("cmdSearchPages")}
            >
              <div
                className="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px]"
                onClick={() => setOpen(false)}
              />
              <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-800">
                  <SearchIcon className="h-5 w-5 shrink-0 text-gray-400" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onInputKey}
                    placeholder={t("cmdPlaceholder")}
                    className="h-14 w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                    role="combobox"
                    aria-expanded
                    aria-controls="command-palette-list"
                    aria-activedescendant={`cmd-item-${active}`}
                  />
                  <Kbd>Esc</Kbd>
                </div>

                {results.length ? (
                  <ul
                    ref={listRef}
                    id="command-palette-list"
                    role="listbox"
                    className="max-h-[50vh] overflow-y-auto p-2"
                  >
                    {results.map((page, i) => (
                      <Fragment key={page.path}>
                        {recentCount > 0 && i === 0
                          ? sectionHeading(t("cmdRecent"))
                          : null}
                        {recentCount > 0 && i === recentCount
                          ? sectionHeading(t("cmdAllPages"))
                          : null}
                        <li
                          id={`cmd-item-${i}`}
                          data-index={i}
                          role="option"
                          aria-selected={i === active}
                          onMouseMove={() => setActive(i)}
                          onClick={() => go(page)}
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm ${
                            i === active
                              ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <span className="truncate font-medium">
                            {page.name}
                          </span>
                          <span className="shrink-0 text-xs text-gray-400">
                            {page.context}
                          </span>
                        </li>
                      </Fragment>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-10 text-center text-sm text-gray-500">
                    {t("cmdNoResults")}
                  </p>
                )}

                <div className="flex items-center gap-4 border-t border-gray-200 px-4 py-2 text-xs text-gray-400 dark:border-gray-800">
                  <span className="flex items-center gap-1">
                    <Kbd>↑</Kbd>
                    <Kbd>↓</Kbd> {t("cmdNavigate")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Kbd>Enter</Kbd> {t("cmdOpen")}
                  </span>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
};

export default CommandPalette;
