import { useAuth } from "@/context/AuthContext";

export default function UserMetaCard() {
  const { user } = useAuth();
  const isSuperAdmin = user.roles?.some((role) =>
    role.permissions?.some((permission) => permission.name === "OPERATE:ALL")
  );

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 flex items-center justify-center  border-gray-30 bg-brand-300/10 rounded-full dark:border-gray-800">
              <span className="text-3xl font-normal text-gray-800 dark:text-white/90">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {user?.name}{" "}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isSuperAdmin ? "Super Admin" : (user?.userType ?? "-")}{" "}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.email}{" "}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
