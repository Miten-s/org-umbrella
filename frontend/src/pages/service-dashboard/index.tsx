import { useMemo } from "react";
import type { ComponentType, SVGProps } from "react";
import { BoltIcon, CalenderIcon, FlaskIcon } from "@/public/icons";
import { useAuth } from "@/context/AuthContext";
import { formatToday, pickGreeting } from "@/utils/greeting";

interface ServiceConfig {
  title: string;
  tagline: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tile: string;
}

export const SERVICE_DASHBOARDS = {
  gxp: {
    title: "GxP Services",
    tagline: "Your GxP compliance workspace.",
    icon: BoltIcon,
    tile: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
  },
  lims: {
    title: "LIMS",
    tagline: "Your laboratory workspace.",
    icon: FlaskIcon,
    tile: "bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400"
  }
} satisfies Record<string, ServiceConfig>;

const ServiceDashboard = ({
  service
}: {
  service: keyof typeof SERVICE_DASHBOARDS;
}) => {
  const { user, currentCompany } = useAuth();
  const config: ServiceConfig = SERVICE_DASHBOARDS[service];
  const userName = user?.fullName || user?.name || "there";
  const greeting = useMemo(() => pickGreeting(userName), [userName]);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 sm:p-8">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {greeting}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <CalenderIcon className="h-4 w-4" />
            <span>{formatToday()}</span>
            {currentCompany?.name && (
              <>
                <span aria-hidden>·</span>
                <span>{currentCompany.name}</span>
              </>
            )}
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            {config.tagline}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.tile}`}
          >
            <config.icon className="h-6 w-6" />
          </span>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {config.title}
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Overview
        </h2>
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center dark:border-gray-600 dark:bg-gray-800">
          <span
            className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${config.tile}`}
          >
            <config.icon className="h-6 w-6" />
          </span>
          <p className="font-medium text-gray-900 dark:text-white">
            Nothing to show yet
          </p>
          <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            Your {config.title} summary will appear here. Use the menus above to
            get started.
          </p>
        </div>
      </section>
    </div>
  );
};

export default ServiceDashboard;
