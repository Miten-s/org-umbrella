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

interface DashboardModule {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  accent: { tile: string; link: string; border: string };
}

const modules: DashboardModule[] = [
  {
    id: "gxp",
    title: "GxP Services",
    description: "Manage GxP compliance activities.",
    route: "/gxp-service/create-new-service-request",
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
    route: PageUrl.LIMSTests.path,
    icon: FlaskIcon,
    accent: {
      tile: "bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400",
      link: "text-teal-700 dark:text-teal-400",
      border: "hover:border-teal-400 dark:hover:border-teal-500"
    }
  }
];

type DayPart = "morning" | "afternoon" | "evening" | "night";

const greetings: Record<DayPart | "any", string[]> = {
  morning: [
    "Good morning, {name}",
    "Rise and shine, {name}",
    "Morning, {name}. Fresh start today",
    "Coffee and compliance, {name}?"
  ],
  afternoon: [
    "Good afternoon, {name}",
    "Afternoon, {name}. Let's keep it moving",
    "Hope your day's going well, {name}"
  ],
  evening: [
    "Good evening, {name}",
    "Evening, {name}. Wrapping things up?",
    "Nice to see you this evening, {name}"
  ],
  night: [
    "Working late, {name}?",
    "Hello, night owl",
    "Burning the midnight oil, {name}?"
  ],
  any: ["Welcome back, {name}", "Hey there, {name}", "Good to see you, {name}"]
};

const getDayPart = (hour: number): DayPart => {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
};

const pickGreeting = (name: string) => {
  const pool = [
    ...greetings[getDayPart(new Date().getHours())],
    ...greetings.any
  ];
  return pool[Math.floor(Math.random() * pool.length)].replace("{name}", name);
};

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
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short"
  });

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
                if (e.key === "Enter" && filtered.length === 1)
                  navigate(filtered[0].route);
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filtered.map((mod) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => navigate(mod.route)}
                className={`group flex flex-col items-start rounded-2xl border border-gray-200 bg-white p-6 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 ${mod.accent.border}`}
              >
                <span
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${mod.accent.tile}`}
                >
                  <mod.icon className="h-5 w-5" />
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {mod.title}
                </span>
                <span className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {mod.description}
                </span>
                <span
                  className={`mt-6 inline-flex items-center gap-1.5 text-sm font-semibold ${mod.accent.link}`}
                >
                  Open {mod.title}
                  <ArrowRightIcon className="h-4 w-4 fill-current transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
