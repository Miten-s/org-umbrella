import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { PageUrl } from "@/types/utils.types";

const Home = () => {
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin } = usePermissions();
  const userName = user?.name || "User";
  const canOpenServicePage = isAdmin || isSuperAdmin;
  const cta = canOpenServicePage
    ? {
        label: "Explore all services",
        description: "Open the service page to manage services.",
        to: PageUrl.Dashboard.path
      }
    : {
        label: "Visit profile",
        description: "Open your profile page.",
        to: PageUrl.ProfileInfo.path
      };

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50 px-6 py-10 text-center shadow-[0_20px_70px_-30px_rgba(15,23,42,0.35)] sm:px-10 sm:py-14 lg:px-16 lg:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-sky-700 sm:text-base">
          Welcome
        </p>
        <h1 className="mt-4 text-4xl font-black leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
          Hello, {userName}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 sm:text-base lg:text-lg">
          {canOpenServicePage
            ? "Manage your workspace from one simple starting point."
            : "Your account is ready. Start from your profile page."}
        </p>
        <div className="mt-8 sm:mt-10">
          <Link
            to={cta.to}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 sm:px-8 sm:text-base"
          >
            {cta.label}
          </Link>
          <p className="mt-3 text-sm text-slate-500">{cta.description}</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
