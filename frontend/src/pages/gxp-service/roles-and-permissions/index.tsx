import { useState } from "react";
import { useTranslation } from "react-i18next";
import Roles from "./Roles";
import Permissions from "./Permissions";

const RolesAndPermissions = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("roles");

  return (
    <div>
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "roles"
              ? "border-b-2 border-brand-500 text-brand-600 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
          onClick={() => setActiveTab("roles")}
        >
          {t("gxpRoles")}
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "permissions"
              ? "border-b-2 border-brand-500 text-brand-600 dark:text-brand-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
          onClick={() => setActiveTab("permissions")}
        >
          {t("gxpPermissions")}
        </button>
      </div>
      <div className="py-6">
        {activeTab === "roles" && <Roles />}
        {activeTab === "permissions" && <Permissions />}
      </div>
    </div>
  );
};

export default RolesAndPermissions;