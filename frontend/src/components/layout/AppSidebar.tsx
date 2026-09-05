import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import appLogo from "../../public/images/logo-transparant.png";
import appSmLogo from "../../public/images/umbrella-clipart-cover.jpg";
import {
  ChevronDownIcon,
  UserManagement,
  GridIcon,
  HorizontaLDots,
  UserIcon,
  CompanyIcon,
  BoltIcon,
  FlaskIcon,
  LabAccessIcon,
  BoxIconLine,
  TaskIcon
} from "../../public/icons";
import { useSidebar } from "../../context/SidebarContext";
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
import { useTranslation } from "react-i18next";

type SubItem = { name: string; path: string; pro?: boolean; new?: boolean };

/** A second-level group (Access / Setup / Execution) nested under a service's parent route. */
type NavGroup = {
  name: string;
  icon: React.ReactNode;
  permissions?: string[];
  subItems: SubItem[];
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  permissions?: string[];
  subItems?: SubItem[];
  groups?: NavGroup[];
};

/**
 * Sliding hover highlight. One shared `layoutId`, so only ever one exists and
 * it glides between rows; the outer span is its own stacking context because
 * Framer sets an inline z-index while animating.
 */
const HoverHighlight = () => (
  <span className="pointer-events-none absolute inset-0 isolate z-0">
    <motion.span
      layoutId="sidebar-hover"
      aria-hidden="true"
      className="absolute inset-0 rounded-lg bg-gray-100 dark:bg-white/[0.06]"
      transition={{ type: "spring", stiffness: 550, damping: 45, mass: 0.5 }}
    />
  </span>
);

const COLLAPSIBLE_EASE = "ease-[cubic-bezier(0.4,0,0.2,1)]";

/**
 * Collapsible wrapper using the grid 0fr/1fr trick, so a parent's height
 * tracks a still-animating nested one instead of jumping. Declared at module
 * scope on purpose — one redeclared inside AppSidebar's body gets a new
 * identity every render, so React remounts it instead of transitioning it.
 */
const Collapsible: React.FC<{ open: boolean; children: React.ReactNode }> = ({
  open,
  children
}) => (
  <div
    className={`grid transition-[grid-template-rows] duration-300 ${COLLAPSIBLE_EASE} ${
      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
    }`}
  >
    <div
      className={`overflow-hidden transition-[opacity,transform] duration-300 ${COLLAPSIBLE_EASE} ${
        open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
      }`}
    >
      {children}
    </div>
  </div>
);

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navItems: NavItem[] = useMemo(
    () => [
      {
        icon: <GridIcon />,
        name: t("dashboard"),
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
        permissions: [
          ADMIN_PERMISSIONS.CREATE_USER,
          ADMIN_PERMISSIONS.VIEW_USER,
          ADMIN_PERMISSIONS.UPDATE_USER,
          ADMIN_PERMISSIONS.DELETE_USER
        ],
        subItems: [
          { name: t("users"), path: PageUrl.Users.path },
          { name: t("designations"), path: PageUrl.Designations.path },
          { name: t("locationsGroups"), path: PageUrl.LocationsGroups.path },
          { name: t("departments"), path: PageUrl.Departments.path }
        ]
      },
      {
        icon: <BoltIcon />,
        name: t("gxpService"),
        permissions: Object.values(GXP_PERMISSIONS),
        groups: [
          {
            icon: <LabAccessIcon />,
            name: t("gxpAccess"),
            permissions: GXP_ACCESS_PERMISSIONS,
            subItems: [
              { name: t("users"), path: PageUrl.GXPUsers.path },
              {
                name: t("gxpRolesAndPermissions"),
                path: PageUrl.GXPRolesAndPermissions.path
              },
              {
                name: t("gxpAssignmentGroups"),
                path: PageUrl.GXPAssignmentGroups.path
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
                path: PageUrl.GXPAddNewApplication.path
              },
              {
                name: t("gxpApplicationSoftwareModule"),
                path: PageUrl.GXPApplicationSoftwareModule.path
              },
              { name: t("gxpSuppliers"), path: PageUrl.GXPSuppliers.path },
              {
                name: t("gxpEnvironments"),
                path: PageUrl.GXPEnvironments.path
              },
              { name: t("gxpWorkflows"), path: PageUrl.GXPWorkflows.path }
            ]
          },
          {
            icon: <TaskIcon />,
            name: t("gxpExecution"),
            permissions: GXP_EXECUTION_PERMISSIONS,
            subItems: [
              {
                name: t("gxpCreateNewServiceRequest"),
                path: PageUrl.GXPCreateNewServiceRequest.path
              }
            ]
          }
        ]
      },
      {
        icon: <FlaskIcon />,
        name: t("limsService"),
        permissions: Object.values(LIMS_PERMISSIONS),
        groups: [
          {
            icon: <LabAccessIcon />,
            name: t("limsLabAccess"),
            permissions: LIMS_ACCESS_PERMISSIONS,
            // Setup order: a group exists first, then a role, then the user
            // that is assigned both.
            subItems: [
              { name: t("limsGroups"), path: PageUrl.LIMSGroups.path },
              { name: t("limsRoles"), path: PageUrl.LIMSRoles.path },
              { name: t("limsUsers"), path: PageUrl.LIMSUsers.path }
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
              { name: t("limsPhrases"), path: PageUrl.LIMSPhrases.path },

              // Commercial: a project belongs to a customer, a study to a project.
              { name: t("limsCustomers"), path: PageUrl.LIMSCustomers.path },
              { name: t("limsSuppliers"), path: PageUrl.LIMSSuppliers.path },
              { name: t("limsProjects"), path: PageUrl.LIMSProjects.path },
              { name: t("limsStudies"), path: PageUrl.LIMSStudies.path },

              // Materials: where things live, then the stock, its batches, and
              // the aliquots split off them.
              { name: t("limsLocations"), path: PageUrl.LIMSLocations.path },
              {
                name: t("limsParameters"),
                path: PageUrl.LIMSParameters.path
              },
              { name: t("limsStocks"), path: PageUrl.LIMSStocks.path },
              {
                name: t("limsStockBatches"),
                path: PageUrl.LIMSStockBatches.path
              },
              { name: t("limsAliquots"), path: PageUrl.LIMSAliquots.path },

              // Equipment: an instrument, its parts, and its calibration
              // schedule.
              {
                name: t("limsInstruments"),
                path: PageUrl.LIMSInstruments.path
              },
              {
                name: t("limsInstrumentParts"),
                path: PageUrl.LIMSInstrumentParts.path
              },
              {
                name: t("limsCalibrations"),
                path: PageUrl.LIMSCalibrations.path
              },

              // Methods: who reviews, what is measured, what is run together,
              // and the limits results are judged against.
              {
                name: t("limsInspectionPlans"),
                path: PageUrl.LIMSInspectionPlans.path
              },
              { name: t("limsAnalyses"), path: PageUrl.LIMSAnalyses.path },
              {
                name: t("limsTestGroups"),
                path: PageUrl.LIMSTestGroups.path
              },
              {
                name: t("limsSpecifications"),
                path: PageUrl.LIMSSpecifications.path
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
              { name: t("limsBatches"), path: PageUrl.LIMSBatches.path },
              { name: t("limsLots"), path: PageUrl.LIMSLots.path },
              { name: t("limsSamples"), path: PageUrl.LIMSSamples.path },
              { name: t("limsTests"), path: PageUrl.LIMSTests.path },
              { name: t("limsResults"), path: PageUrl.LIMSResults.path },
              {
                name: t("limsSchedulers"),
                path: PageUrl.LIMSSchedulers.path
              }
            ]
          }
        ]
      },
      {
        icon: <CompanyIcon />,
        name: t("companySetup"),
        permissions: [ADMIN_PERMISSIONS.OPERATE_ALL],
        subItems: [
          { name: t("companyInfo"), path: PageUrl.CompanySettings.path }
        ]
      },
      {
        icon: <UserIcon />,
        name: t("mySpace"),
        permissions: [ADMIN_PERMISSIONS.VIEW_DASHBOARD],
        subItems: [{ name: t("profileInfo"), path: PageUrl.ProfileInfo.path }]
      }
    ],
    [t]
  );

  const restrictedFilteredNavItems = useMemo(() => {
    if (!user) return [];

    return navItems.reduce<NavItem[]>((acc, item) => {
      const hasAccess = item.permissions?.some((permission) =>
        hasPermission(user, permission)
      );
      if (!hasAccess) return acc;

      // A parent with groups only shows the groups this user actually holds
      // permissions for (e.g. Access but not Setup).
      if (!item.groups) {
        acc.push(item);
        return acc;
      }

      acc.push({
        ...item,
        groups: item.groups.filter((group) =>
          group.permissions?.some((permission) =>
            hasPermission(user, permission)
          )
        )
      });
      return acc;
    }, []);
  }, [user, navItems]);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  /** Index of the open Access/Setup/Execution group within the open parent. */
  const [openGroupIndex, setOpenGroupIndex] = useState<number | null>(null);
  /** The row the pointer is on — parents, groups and sub-items share one key space. */
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  const findOpenSubmenuForPath = useCallback(
    (items: NavItem[], menuType: "main" | "others") => {
      const matchingIndex = items.findIndex(
        (item) =>
          item.subItems?.some((subItem) => isActive(subItem.path)) ||
          item.groups?.some((group) =>
            group.subItems.some((subItem) => isActive(subItem.path))
          )
      );

      if (matchingIndex === -1) {
        return null;
      }

      return { type: menuType, index: matchingIndex } as const;
    },
    [isActive]
  );

  const findOpenGroupForPath = useCallback(
    (item: NavItem | undefined) => {
      const matchingIndex = item?.groups?.findIndex((group) =>
        group.subItems.some((subItem) => isActive(subItem.path))
      );
      return matchingIndex === undefined || matchingIndex === -1
        ? null
        : matchingIndex;
    },
    [isActive]
  );

  useEffect(() => {
    const nextOpenSubmenu = findOpenSubmenuForPath(
      restrictedFilteredNavItems,
      "main"
    );

    setOpenSubmenu((currentOpenSubmenu) => {
      if (
        currentOpenSubmenu?.type === nextOpenSubmenu?.type &&
        currentOpenSubmenu?.index === nextOpenSubmenu?.index
      ) {
        return currentOpenSubmenu;
      }

      return nextOpenSubmenu;
    });

    const activeItem =
      nextOpenSubmenu !== null
        ? restrictedFilteredNavItems[nextOpenSubmenu.index]
        : undefined;
    setOpenGroupIndex(findOpenGroupForPath(activeItem));
  }, [
    findOpenSubmenuForPath,
    findOpenGroupForPath,
    restrictedFilteredNavItems,
    location.pathname
  ]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
    setOpenGroupIndex(null);
  };

  const handleGroupToggle = (groupIndex: number) => {
    setOpenGroupIndex((prevIndex) =>
      prevIndex === groupIndex ? null : groupIndex
    );
  };

  const renderSubItems = (subItems: SubItem[], keyPrefix: string) => (
    <ul className="mt-2 space-y-1 ml-9">
      {subItems.map((subItem, subIndex) => {
        const itemKey = `${keyPrefix}-${subIndex}`;
        return (
          <li key={subItem.name} className="relative">
            {hoveredKey === itemKey && <HoverHighlight />}
            <Link
              onMouseEnter={() => setHoveredKey(itemKey)}
              to={subItem.path}
              className={`menu-dropdown-item relative z-10 ${
                isActive(subItem.path)
                  ? "menu-dropdown-item-active"
                  : "menu-dropdown-item-inactive"
              }`}
            >
              {subItem.name}
              <span className="flex items-center gap-1 ml-auto">
                {subItem.new && (
                  <span
                    className={`ml-auto ${
                      isActive(subItem.path)
                        ? "menu-dropdown-badge-active"
                        : "menu-dropdown-badge-inactive"
                    } menu-dropdown-badge`}
                  >
                    new
                  </span>
                )}
                {subItem.pro && (
                  <span
                    className={`ml-auto ${
                      isActive(subItem.path)
                        ? "menu-dropdown-badge-active"
                        : "menu-dropdown-badge-inactive"
                    } menu-dropdown-badge`}
                  >
                    pro
                  </span>
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const renderGroups = (groups: NavGroup[], parentKey: string) => (
    <ul className="mt-2 space-y-1 ml-4">
      {groups.map((group, groupIndex) => {
        const key = `${parentKey}-group-${groupIndex}`;
        const isGroupOpen = openGroupIndex === groupIndex;
        return (
          <li key={group.name}>
            <div className="relative">
              {hoveredKey === key && <HoverHighlight />}
              <button
                onMouseEnter={() => setHoveredKey(key)}
                onClick={() => handleGroupToggle(groupIndex)}
                className={`menu-item group relative z-10 cursor-pointer ${
                  isGroupOpen ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isGroupOpen
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {group.icon}
                </span>
                <span className="menu-item-text text-start">
                  {group.name}
                </span>
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-300 ${COLLAPSIBLE_EASE} ${
                    isGroupOpen ? "rotate-180 text-brand-500" : ""
                  }`}
                />
              </button>
            </div>
            <Collapsible open={isGroupOpen}>
              {renderSubItems(group.subItems, key)}
            </Collapsible>
          </li>
        );
      })}
    </ul>
  );

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => {
        const key = `${menuType}-${index}`;
        const isOpen =
          openSubmenu?.type === menuType && openSubmenu?.index === index;
        const hasChildren = Boolean(nav.subItems || nav.groups);
        return (
          <li key={nav.name}>
            {/* Wrapper keeps the highlight on the row, not the submenu below it. */}
            <div className="relative">
              {hoveredKey === key && <HoverHighlight />}
              {hasChildren ? (
                <button
                  onMouseEnter={() => setHoveredKey(key)}
                  onClick={() => handleSubmenuToggle(index, menuType)}
                  className={`menu-item group relative z-10 ${
                    isOpen ? "menu-item-active" : "menu-item-inactive"
                  } cursor-pointer ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "lg:justify-start"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size  ${
                      isOpen
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text text-start">
                      {nav.name}
                    </span>
                  )}
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <ChevronDownIcon
                      className={`ml-auto w-5 h-5 transition-transform duration-300 ${COLLAPSIBLE_EASE} ${
                        isOpen ? "rotate-180 text-brand-500" : ""
                      }`}
                    />
                  )}
                </button>
              ) : (
                nav.path && (
                  <Link
                    onMouseEnter={() => setHoveredKey(key)}
                    to={nav.path}
                    className={`menu-item group relative z-10 ${
                      isActive(nav.path)
                        ? "menu-item-active"
                        : "menu-item-inactive"
                    }`}
                  >
                    <span
                      className={`menu-item-icon-size ${
                        isActive(nav.path)
                          ? "menu-item-icon-active"
                          : "menu-item-icon-inactive"
                      }`}
                    >
                      {nav.icon}
                    </span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text text-start">
                        {nav.name}
                      </span>
                    )}
                  </Link>
                )
              )}
            </div>
            {hasChildren && (isExpanded || isHovered || isMobileOpen) && (
              <Collapsible open={isOpen}>
                {nav.groups
                  ? renderGroups(nav.groups, key)
                  : renderSubItems(nav.subItems!, key)}
              </Collapsible>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 lg:left-[max(0px,calc((100vw-2400px)/2))] bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setHoveredKey(null);
      }}
    >
      <div
        className={`py-4 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link to={PageUrl.Dashboard.path} className="flex items-center gap-2">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img src={appLogo} alt="Logo" width={150} height={30} />
            </>
          ) : (
            <img src={appSmLogo} alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(restrictedFilteredNavItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
