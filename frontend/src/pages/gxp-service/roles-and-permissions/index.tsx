import { useState } from "react";
import Permissions from "./Permissions";
import Roles from "./Roles";

type ActiveTab = "roles" | "permissions";

const RolesAndPermissions = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("roles");

  const tabs: Array<{ key: ActiveTab; label: string }> = [
    { key: "roles", label: "Roles" },
    { key: "permissions", label: "Permissions" }
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div
        className="inline-flex w-fit rounded-lg border border-gray-200 bg-white p-1 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900"
        role="tablist"
        aria-label="Roles and permissions"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={[
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-500 text-white"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              ].join(" ")}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "roles" ? <Roles /> : <Permissions />}
    </div>
  );
};

export default RolesAndPermissions;
