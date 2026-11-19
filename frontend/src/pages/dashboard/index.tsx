import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  BoltIcon,
  CalenderIcon,
  FlaskIcon
} from "@/public/icons";
import { useAuth } from "@/context/AuthContext";
import { getImageUrl } from "@/services/utils.service";
import { PageUrl } from "@/types/utils.types";
import { formatToday, pickGreeting } from "@/utils/greeting";

const lineIcon =
  (...paths: string[]) =>
  (props: SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );

const QmsIcon = lineIcon(
  "M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1Z",
  "M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2",
  "m9 14 2 2 4-4"
);
const ErpIcon = lineIcon(
  "M3 7l9-4 9 4-9 4-9-4Z",
  "M3 12l9 4 9-4",
  "M3 17l9 4 9-4"
);
const MesIcon = lineIcon(
  "M3 21V10l5 3V10l5 3V10l5 3V5h3v16H3Z",
  "M7 17h2m4 0h2"
);
const CsvIcon = lineIcon("M4 5h16v10H4z", "M9 19h6m-3-4v4", "m9 10 2 2 4-4");

interface DashboardModule {
  id: string;
  title: string;
  description: string;
  route?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  accent: { tile: string; link: string; border: string };
}

const modules: DashboardModule[] = [
  {
    id: "gxp",
    title: "GxP Services",
    description: "Manage GxP compliance activities.",
    route: PageUrl.GXPDashboard.path,
    icon: BoltIcon,
    accent: {
      tile: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
      link: "text-blue-600 dark:text-blue-400",
      border: "hover:border-blue-400 dark:hover:border-blue-500"
    }
  },
  {
    id: "lims",
    title: "LIMS",
    description: "Manage lab setup, stock, instruments, and specifications.",
    route: PageUrl.LIMSDashboard.path,
    icon: FlaskIcon,
    accent: {
      tile: "bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400",
      link: "text-teal-700 dark:text-teal-400",
      border: "hover:border-teal-400 dark:hover:border-teal-500"
    }
  },
  {
    id: "qms",
    title: "QMS",
    description:
      "Quality management: deviations, CAPA, change control, and audits.",
    icon: QmsIcon,
    accent: {
      tile: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
      link: "text-violet-700 dark:text-violet-400",
      border: "hover:border-violet-400 dark:hover:border-violet-500"
    }
  },
  {
    id: "erp",
    title: "ERP",
    description: "Plan resources, procurement, inventory, and finance.",
    icon: ErpIcon,
    accent: {
      tile: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
      link: "text-amber-700 dark:text-amber-400",
      border: "hover:border-amber-400 dark:hover:border-amber-500"
    }
  },
  {
    id: "mes",
    title: "MES",
    description:
      "Manufacturing execution: batch records and shop-floor production.",
    icon: MesIcon,
    accent: {
      tile: "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400",
      link: "text-rose-700 dark:text-rose-400",
      border: "hover:border-rose-400 dark:hover:border-rose-500"
    }
  },
  {
    id: "csv",
    title: "CSV",
    description: "Computer system validation for GxP-compliant software.",
    icon: CsvIcon,
    accent: {
      tile: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
      link: "text-sky-700 dark:text-sky-400",
      border: "hover:border-sky-400 dark:hover:border-sky-500"
    }
  }
];

const SearchIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    {...props}
  >
    <circle cx="9" cy="9" r="6" />
    <path d="m17 17-3.5-3.5" strokeLinecap="round" />
  </svg>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, currentCompany } = useAuth();
  const [query, setQuery] = useState("");
  const [logoFailed, setLogoFailed] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const userName = user?.fullName || user?.name || "there";
  const companyName = currentCompany?.name || "Your company";
  const companyLogoUrl = currentCompany?.logo
    ? getImageUrl(currentCompany.logo)
    : "";
  const showLogo = Boolean(companyLogoUrl) && !logoFailed;

  const greeting = useMemo(() => pickGreeting(userName), [userName]);
  const today = formatToday();

  const filtered = modules.filter((m) =>
    `${m.title} ${m.description}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <section className="grid overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:grid-cols-[1fr_minmax(240px,32%)]">
        <div className="p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {greeting}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <CalenderIcon className="h-4 w-4" />
            <span>{today}</span>
            <span aria-hidden>·</span>
            <span>{companyName}</span>
          </div>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {currentCompany?.description ||
              "Manage your company's pharmaceutical compliance and laboratory operations from one workspace."}
          </p>
        </div>

        {showLogo ? (
          <div className="group/img relative min-h-48 overflow-hidden border-t border-gray-200 dark:border-gray-700 md:border-l md:border-t-0">
            <img
              src={companyLogoUrl}
              alt={companyName}
              onError={() => setLogoFailed(true)}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover/img:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
            <span className="absolute bottom-4 left-5 right-5 truncate text-base font-semibold text-white drop-shadow">
              {companyName}
            </span>
          </div>
        ) : (
          <div className="flex min-h-48 items-center justify-center border-t border-gray-200 bg-linear-to-br from-blue-50/60 to-blue-100/60 p-6 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900 md:border-l md:border-t-0">
            <span className="text-center text-xl font-semibold text-gray-800 dark:text-gray-100">
              {companyName}
            </span>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
            Available services
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
              {filtered.length}
            </span>
          </h2>
          <label className="relative w-full sm:w-72">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setQuery("");
                const only = filtered.length === 1 ? filtered[0] : null;
                if (e.key === "Enter" && only?.route) navigate(only.route);
              }}
              placeholder="Search services"
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-9 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-500/20"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-gray-200 px-1.5 text-xs text-gray-400 dark:border-gray-600">
              /
            </kbd>
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
            No services match "{query}".
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((mod) => (
              <button
                key={mod.id}
                type="button"
                disabled={!mod.route}
                onClick={() => mod.route && navigate(mod.route)}
                className={`group relative flex flex-col items-start rounded-2xl border border-gray-200 bg-white p-6 text-left transition-all dark:border-gray-700 dark:bg-gray-800 ${
                  mod.route
                    ? `hover:-translate-y-0.5 hover:shadow-lg ${mod.accent.border}`
                    : "cursor-default"
                }`}
              >
                {!mod.route && (
                  <span className="absolute right-4 top-4 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                    Coming soon
                  </span>
                )}
                <span
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${mod.accent.tile} ${mod.route ? "" : "opacity-70"}`}
                >
                  <mod.icon className="h-5 w-5" />
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {mod.title}
                </span>
                <span className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {mod.description}
                </span>
                {mod.route ? (
                  <span
                    className={`mt-6 inline-flex items-center gap-1.5 text-sm font-semibold ${mod.accent.link}`}
                  >
                    Open {mod.title}
                    <ArrowRightIcon className="h-4 w-4 fill-current transition-transform group-hover:translate-x-1" />
                  </span>
                ) : (
                  <span className="mt-6 text-sm font-medium text-gray-400 dark:text-gray-500">
                    Available soon
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
