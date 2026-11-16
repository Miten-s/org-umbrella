import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  UserManagement,
  GridIcon,
  UserIcon,
  CompanyIcon,
  BoltIcon,
  FlaskIcon,
  LabAccessIcon,
  BoxIconLine,
  TaskIcon
} from "../../public/icons";
import { PageUrl } from "@/types/utils.types";
import { useAuth } from "@/context/AuthContext";
import {
  hasPermission,
  ADMIN_PERMISSIONS,
  GXP_PERMISSIONS,
  GXP_ACCESS_PERMISSIONS,
  GXP_SETUP_PERMISSIONS,
  GXP_EXECUTION_PERMISSIONS,
  LIMS_PERMISSIONS,
  LIMS_ACCESS_PERMISSIONS,
  LIMS_SETUP_PERMISSIONS,
  LIMS_EXECUTION_PERMISSIONS
} from "@/utils/permissions";

/** `permissions` is optional and defaults to "always visible once its parent group/item
 * unlocks" — most groups are still one indivisible feature. Set it on entries whose group
 * is a broad OR-check (e.g. Lab Executions covers six different entities) so a user with
 * only one of those entity's permissions doesn't see links to the other five. */
export type SubItem = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
  permissions?: string[];
};

/** A second-level group (Access / Setup / Execution) nested under a service's parent route. */
export type NavGroup = {
  name: string;
  icon: React.ReactNode;
  permissions?: string[];
  subItems: SubItem[];
};

export type ServiceKey =
  "dashboard" | "admin" | "gxp" | "lims" | "company" | "account";

export type NavItem = {
  name: string;
  /** Which service the entry belongs to — the header shows only the current one's. */
  service: ServiceKey;
  icon: React.ReactNode;
  path?: string;
  permissions?: string[];
  subItems?: SubItem[];
  groups?: NavGroup[];
};

/** Which service a page belongs to, from its path; null on the Dashboard and other shared pages. */
export const serviceOf = (pathname: string): ServiceKey | null => {
  if (pathname.startsWith("/lims")) return "lims";
  if (pathname.startsWith("/gxp-service")) return "gxp";
  if (pathname.startsWith("/client/system")) return "admin";
  if (pathname.startsWith("/client/company")) return "company";
  if (pathname.startsWith("/client/my-space")) return "account";
  return null;
};

/** The navigation this user may see — every service's entries, filtered by permission. */
export const useNavItems = (): NavItem[] => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const navItems: NavItem[] = useMemo(
    () => [
      {
        icon: <GridIcon />,
        name: t("dashboard"),
        service: "dashboard",
        permissions: [ADMIN_PERMISSIONS.VIEW_DASHBOARD],
        subItems: [
          { name: t("allServices"), path: PageUrl.Dashboard.path, pro: false }
        ]
      },
      //hide this menu as  requirement added - 15th march 2026
      // {
      //   icon: <AccessIcon />,
      //   name: t('accessManagement'),
      //   permissions: [ADMIN_PERMISSIONS.CREATE_PERMISSION, ADMIN_PERMISSIONS.VIEW_PERMISSION, ADMIN_PERMISSIONS.UPDATE_PERMISSION, ADMIN_PERMISSIONS.DELETE_PERMISSION],
      //   subItems: [
      //     { name: t('rolesAndPermissions'), path: PageUrl.Roles.path },
      //   ]
      // },
      {
        icon: <UserManagement />,
        name: t("systemITAdministration"),
        service: "admin",
        permissions: [
          ADMIN_PERMISSIONS.VIEW_USER,
          ADMIN_PERMISSIONS.VIEW_DESIGNATION,
          ADMIN_PERMISSIONS.VIEW_LOCATION,
          ADMIN_PERMISSIONS.VIEW_DEPARTMENT
        ],
        subItems: [
          {
            name: t("users"),
            path: PageUrl.Users.path,
            permissions: [ADMIN_PERMISSIONS.VIEW_USER]
          },
          {
            name: t("designations"),
            path: PageUrl.Designations.path,
            permissions: [ADMIN_PERMISSIONS.VIEW_DESIGNATION]
          },
          {
            name: t("locationsGroups"),
            path: PageUrl.LocationsGroups.path,
            permissions: [ADMIN_PERMISSIONS.VIEW_LOCATION]
          },
          {
            name: t("departments"),
            path: PageUrl.Departments.path,
            permissions: [ADMIN_PERMISSIONS.VIEW_DEPARTMENT]
          }
        ]
      },
      {
        icon: <BoltIcon />,
        name: t("gxpService"),
        service: "gxp",
        permissions: Object.values(GXP_PERMISSIONS),
        groups: [
          {
            icon: <LabAccessIcon />,
            name: t("gxpAccess"),
            permissions: GXP_ACCESS_PERMISSIONS,
            subItems: [
              {
                name: t("users"),
                path: PageUrl.GXPUsers.path,
                permissions: [GXP_PERMISSIONS.VIEW_USER]
              },
              {
                name: t("gxpRolesAndPermissions"),
                path: PageUrl.GXPRolesAndPermissions.path,
                permissions: [GXP_PERMISSIONS.VIEW_ROLE]
              },
              {
                name: t("gxpAssignmentGroups"),
                path: PageUrl.GXPAssignmentGroups.path,
                permissions: [GXP_PERMISSIONS.VIEW_ASSIGNMENT_GROUP]
              }
            ]
          },
          {
            icon: <BoxIconLine />,
            name: t("gxpSetup"),
            permissions: GXP_SETUP_PERMISSIONS,
            subItems: [
              {
                name: t("gxpAddNewApplication"),
                path: PageUrl.GXPAddNewApplication.path,
                permissions: [GXP_PERMISSIONS.VIEW_SOFTWARE]
              },
              {
                name: t("gxpApplicationSoftwareModule"),
                path: PageUrl.GXPApplicationSoftwareModule.path,
                permissions: [GXP_PERMISSIONS.VIEW_SOFTWARE_MODULES]
              },
              {
                name: t("gxpSuppliers"),
                path: PageUrl.GXPSuppliers.path,
                permissions: [GXP_PERMISSIONS.VIEW_SUPPLIERS]
              },
              {
                name: t("gxpEnvironments"),
                path: PageUrl.GXPEnvironments.path,
                permissions: [GXP_PERMISSIONS.VIEW_ENVIRONMENT]
              },
              {
                name: t("gxpWorkflows"),
                path: PageUrl.GXPWorkflows.path,
                permissions: [GXP_PERMISSIONS.VIEW_WORKFLOW]
              }
            ]
          },
          {
            icon: <TaskIcon />,
            name: t("gxpExecution"),
            permissions: GXP_EXECUTION_PERMISSIONS,
            subItems: [
              {
                name: t("gxpCreateNewServiceRequest"),
                path: PageUrl.GXPCreateNewServiceRequest.path,
                permissions: [GXP_PERMISSIONS.VIEW_SERVICE_REQUEST]
              }
            ]
          }
        ]
      },
      {
        icon: <FlaskIcon />,
        name: t("limsService"),
        service: "lims",
        permissions: Object.values(LIMS_PERMISSIONS),
        groups: [
          {
            icon: <LabAccessIcon />,
            name: t("limsLabAccess"),
            permissions: LIMS_ACCESS_PERMISSIONS,
            // Setup order: a group exists first, then a role, then the user
            // that is assigned both.
            subItems: [
              {
                name: t("limsGroups"),
                path: PageUrl.LIMSGroups.path,
                permissions: [LIMS_PERMISSIONS.VIEW_GROUP]
              },
              {
                name: t("limsRoles"),
                path: PageUrl.LIMSRoles.path,
                permissions: [LIMS_PERMISSIONS.VIEW_ROLE]
              },
              {
                name: t("limsUsers"),
                path: PageUrl.LIMSUsers.path,
                permissions: [LIMS_PERMISSIONS.VIEW_USER]
              }
            ]
          },
          {
            icon: <BoxIconLine />,
            name: t("limsLabSetup"),
            permissions: LIMS_SETUP_PERMISSIONS,
            // Ordered the way a lab is actually configured: each entry only
            // depends on ones above it.
            subItems: [
              // Reference data — every dropdown in LIMS reads from it.
              {
                name: t("limsPhrases"),
                path: PageUrl.LIMSPhrases.path,
                permissions: [LIMS_PERMISSIONS.VIEW_PHRASE]
              },

              // Commercial: a project belongs to a customer, a study to a project.
              {
                name: t("limsCustomers"),
                path: PageUrl.LIMSCustomers.path,
                permissions: [LIMS_PERMISSIONS.VIEW_CUSTOMER]
              },
              {
                name: t("limsSuppliers"),
                path: PageUrl.LIMSSuppliers.path,
                permissions: [LIMS_PERMISSIONS.VIEW_SUPPLIER]
              },
              {
                name: t("limsProjects"),
                path: PageUrl.LIMSProjects.path,
                permissions: [LIMS_PERMISSIONS.VIEW_PROJECT]
              },
              {
                name: t("limsStudies"),
                path: PageUrl.LIMSStudies.path,
                permissions: [LIMS_PERMISSIONS.VIEW_STUDY]
              },

              // Materials: where things live, then the stock, its batches, and
              // the aliquots split off them.
              {
                name: t("limsLocations"),
                path: PageUrl.LIMSLocations.path,
                permissions: [LIMS_PERMISSIONS.VIEW_LOCATION]
              },
              {
                name: t("limsParameters"),
                path: PageUrl.LIMSParameters.path,
                permissions: [LIMS_PERMISSIONS.VIEW_PARAMETER]
              },
              {
                name: t("limsStocks"),
                path: PageUrl.LIMSStocks.path,
                permissions: [LIMS_PERMISSIONS.VIEW_STOCK]
              },
              {
                name: t("limsStockBatches"),
                path: PageUrl.LIMSStockBatches.path,
                permissions: [LIMS_PERMISSIONS.VIEW_STOCK_BATCH]
              },
              {
                name: t("limsAliquots"),
                path: PageUrl.LIMSAliquots.path,
                permissions: [LIMS_PERMISSIONS.VIEW_ALIQUOT]
              },

              // Equipment: an instrument, its parts, and its calibration
              // schedule.
              {
                name: t("limsInstruments"),
                path: PageUrl.LIMSInstruments.path,
                permissions: [LIMS_PERMISSIONS.VIEW_INSTRUMENT]
              },
              {
                name: t("limsInstrumentParts"),
                path: PageUrl.LIMSInstrumentParts.path,
                permissions: [LIMS_PERMISSIONS.VIEW_INSTRUMENT_PART]
              },
              {
                name: t("limsCalibrations"),
                path: PageUrl.LIMSCalibrations.path,
                permissions: [LIMS_PERMISSIONS.VIEW_CALIBRATION]
              },

              // Methods: who reviews, what is measured, what is run together,
              // and the limits results are judged against.
              {
                name: t("limsInspectionPlans"),
                path: PageUrl.LIMSInspectionPlans.path,
                permissions: [LIMS_PERMISSIONS.VIEW_INSPECTION_PLAN]
              },
              {
                name: t("limsAnalyses"),
                path: PageUrl.LIMSAnalyses.path,
                permissions: [LIMS_PERMISSIONS.VIEW_ANALYSIS]
              },
              {
                name: t("limsTestGroups"),
                path: PageUrl.LIMSTestGroups.path,
                permissions: [LIMS_PERMISSIONS.VIEW_TEST_GROUP]
              },
              {
                name: t("limsSpecifications"),
                permissions: [LIMS_PERMISSIONS.VIEW_SPECIFICATION],
                path: PageUrl.LIMSSpecifications.path
              },
              {
                name: t("limsSampleTemplates"),
                path: PageUrl.LIMSSampleTemplates.path,
                permissions: [LIMS_PERMISSIONS.VIEW_SAMPLE_TEMPLATE]
              },
              {
                name: t("limsEntityTemplates"),
                path: PageUrl.LIMSEntityTemplates.path,
                permissions: [LIMS_PERMISSIONS.VIEW_ENTITY_TEMPLATE]
              }
            ]
          },
          {
            icon: <TaskIcon />,
            name: t("limsLabExecutions"),
            permissions: LIMS_EXECUTION_PERMISSIONS,
            // The material's own journey: batch → lot → sample → test → result.
            // Schedulers last: a tool that raises this work, not a step in it.
            subItems: [
              {
                name: t("limsBatches"),
                path: PageUrl.LIMSBatches.path,
                permissions: [LIMS_PERMISSIONS.VIEW_BATCH]
              },
              {
                name: t("limsLots"),
                path: PageUrl.LIMSLots.path,
                permissions: [LIMS_PERMISSIONS.VIEW_LOT]
              },
              {
                name: t("limsSamples"),
                path: PageUrl.LIMSSamples.path,
                permissions: [LIMS_PERMISSIONS.VIEW_SAMPLE]
              },
              {
                name: t("limsTests"),
                path: PageUrl.LIMSTests.path,
                permissions: [LIMS_PERMISSIONS.VIEW_TEST]
              },
              {
                name: t("limsResults"),
                path: PageUrl.LIMSResults.path,
                permissions: [LIMS_PERMISSIONS.VIEW_RESULT]
              },
              {
                name: t("limsSchedulers"),
                path: PageUrl.LIMSSchedulers.path,
                permissions: [LIMS_PERMISSIONS.VIEW_SCHEDULER]
              }
            ]
          }
        ]
      },
      {
        icon: <CompanyIcon />,
        name: t("companySetup"),
        service: "company",
        permissions: [ADMIN_PERMISSIONS.OPERATE_ALL],
        subItems: [
          { name: t("companyInfo"), path: PageUrl.CompanySettings.path }
        ]
      },
      {
        icon: <UserIcon />,
        name: t("mySpace"),
        service: "account",
        permissions: [ADMIN_PERMISSIONS.VIEW_DASHBOARD],
        subItems: [{ name: t("profileInfo"), path: PageUrl.ProfileInfo.path }]
      }
    ],
    [t]
  );

  const filterSubItems = useCallback(
    (subItems: SubItem[]) =>
      subItems.filter(
        (subItem) =>
          !subItem.permissions ||
          subItem.permissions.some((permission) =>
            hasPermission(user, permission)
          )
      ),
    [user]
  );

  const restrictedFilteredNavItems = useMemo(() => {
    if (!user) return [];

    return navItems.reduce<NavItem[]>((acc, item) => {
      const hasAccess = item.permissions?.some((permission) =>
        hasPermission(user, permission)
      );
      if (!hasAccess) return acc;

      // A parent with groups only shows the groups this user actually holds
      // permissions for (e.g. Access but not Setup), and within each surviving
      // group, only the specific entities this user actually holds permissions for.
      if (!item.groups) {
        acc.push(
          item.subItems
            ? { ...item, subItems: filterSubItems(item.subItems) }
            : item
        );
        return acc;
      }

      acc.push({
        ...item,
        groups: item.groups
          .filter((group) =>
            group.permissions?.some((permission) =>
              hasPermission(user, permission)
            )
          )
          .map((group) => ({
            ...group,
            subItems: filterSubItems(group.subItems)
          }))
      });
      return acc;
    }, []);
  }, [user, navItems, filterSubItems]);

  return restrictedFilteredNavItems;
};
