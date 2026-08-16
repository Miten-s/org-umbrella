import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  TaskIcon
} from "../../public/icons";
import { useSidebar } from "../../context/SidebarContext";
import { PageUrl } from "@/types/utils.types";
import { useAuth } from "@/context/AuthContext";
import {
  hasPermission,
  ADMIN_PERMISSIONS,
  GXP_PERMISSIONS,
  LIMS_ACCESS_PERMISSIONS,
  LIMS_SETUP_PERMISSIONS,
  LIMS_EXECUTION_PERMISSIONS
} from "@/utils/permissions";
import { useTranslation } from "react-i18next";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  permissions?: string[];
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
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
        permissions: [
          GXP_PERMISSIONS.CREATE_PERMISSION,
          GXP_PERMISSIONS.VIEW_PERMISSION,
          GXP_PERMISSIONS.UPDATE_PERMISSION,
          GXP_PERMISSIONS.DELETE_PERMISSION,
          GXP_PERMISSIONS.CREATE_ROLE,
          GXP_PERMISSIONS.VIEW_ROLE,
          GXP_PERMISSIONS.UPDATE_ROLE,
          GXP_PERMISSIONS.DELETE_ROLE,
          GXP_PERMISSIONS.CREATE_USER,
          GXP_PERMISSIONS.VIEW_USER,
          GXP_PERMISSIONS.UPDATE_USER,
          GXP_PERMISSIONS.DELETE_USER,
          GXP_PERMISSIONS.CREATE_ASSIGNMENT_GROUP,
          GXP_PERMISSIONS.VIEW_ASSIGNMENT_GROUP,
          GXP_PERMISSIONS.UPDATE_ASSIGNMENT_GROUP,
          GXP_PERMISSIONS.DELETE_ASSIGNMENT_GROUP,
          GXP_PERMISSIONS.CREATE_WORKFLOW,
          GXP_PERMISSIONS.VIEW_WORKFLOW,
          GXP_PERMISSIONS.UPDATE_WORKFLOW,
          GXP_PERMISSIONS.DELETE_WORKFLOW,
          GXP_PERMISSIONS.CREATE_ENVIRONMENT,
          GXP_PERMISSIONS.VIEW_ENVIRONMENT,
          GXP_PERMISSIONS.UPDATE_ENVIRONMENT,
          GXP_PERMISSIONS.DELETE_ENVIRONMENT,
          GXP_PERMISSIONS.CREATE_SUPPLIERS,
          GXP_PERMISSIONS.VIEW_SUPPLIERS,
          GXP_PERMISSIONS.UPDATE_SUPPLIERS,
          GXP_PERMISSIONS.DELETE_SUPPLIERS,
          GXP_PERMISSIONS.CREATE_SOFTWARE_MODULES,
          GXP_PERMISSIONS.VIEW_SOFTWARE_MODULES,
          GXP_PERMISSIONS.UPDATE_SOFTWARE_MODULES,
          GXP_PERMISSIONS.DELETE_SOFTWARE_MODULES,
          GXP_PERMISSIONS.CREATE_SOFTWARE,
          GXP_PERMISSIONS.VIEW_SOFTWARE,
          GXP_PERMISSIONS.UPDATE_SOFTWARE,
          GXP_PERMISSIONS.DELETE_SOFTWARE,
          GXP_PERMISSIONS.CREATE_SERVICE_REQUEST,
          GXP_PERMISSIONS.VIEW_SERVICE_REQUEST,
          GXP_PERMISSIONS.UPDATE_SERVICE_REQUEST,
          GXP_PERMISSIONS.DELETE_SERVICE_REQUEST
        ],
        subItems: [
          {
            name: t("gxpAddNewApplication"),
            path: PageUrl.GXPAddNewApplication.path
          },
          {
            name: t("gxpApplicationSoftwareModule"),
            path: PageUrl.GXPApplicationSoftwareModule.path
          },
          {
            name: t("gxpAssignmentGroups"),
            path: PageUrl.GXPAssignmentGroups.path
          },
          { name: t("gxpSuppliers"), path: PageUrl.GXPSuppliers.path },
          { name: t("gxpEnvironments"), path: PageUrl.GXPEnvironments.path },
          { name: t("gxpWorkflows"), path: PageUrl.GXPWorkflows.path },
          { name: t("users"), path: PageUrl.GXPUsers.path },
          {
            name: t("gxpRolesAndPermissions"),
            path: PageUrl.GXPRolesAndPermissions.path
          },
          {
            name: t("gxpCreateNewServiceRequest"),
            path: PageUrl.GXPCreateNewServiceRequest.path
          }
        ]
      },
      {
        icon: <LabAccessIcon />,
        name: t("limsLabAccess"),
        permissions: LIMS_ACCESS_PERMISSIONS,
        // Setup order: a group exists first, then a role, then the user that
        // is assigned both.
        subItems: [
          { name: t("limsGroups"), path: PageUrl.LIMSGroups.path },
          { name: t("limsRoles"), path: PageUrl.LIMSRoles.path },
          { name: t("limsUsers"), path: PageUrl.LIMSUsers.path }
        ]
      },
      {
        icon: <FlaskIcon />,
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

          // Materials: where things live, then the stock, its batches, and the
          // aliquots split off them.
          { name: t("limsLocations"), path: PageUrl.LIMSLocations.path },
          { name: t("limsParameters"), path: PageUrl.LIMSParameters.path },
          { name: t("limsStocks"), path: PageUrl.LIMSStocks.path },
          { name: t("limsStockBatches"), path: PageUrl.LIMSStockBatches.path },
          { name: t("limsAliquots"), path: PageUrl.LIMSAliquots.path },

          // Equipment: an instrument, its parts, and its calibration schedule.
          { name: t("limsInstruments"), path: PageUrl.LIMSInstruments.path },
          {
            name: t("limsInstrumentParts"),
            path: PageUrl.LIMSInstrumentParts.path
          },
          { name: t("limsCalibrations"), path: PageUrl.LIMSCalibrations.path },

          // Methods: who reviews, what is measured, what is run together, and
          // the limits results are judged against.
          {
            name: t("limsInspectionPlans"),
            path: PageUrl.LIMSInspectionPlans.path
          },
          { name: t("limsAnalyses"), path: PageUrl.LIMSAnalyses.path },
          { name: t("limsTestGroups"), path: PageUrl.LIMSTestGroups.path },
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
          { name: t("limsSchedulers"), path: PageUrl.LIMSSchedulers.path }
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
    if (user) {
      const filtered = navItems.filter((item) => {
        const hasAccess = item.permissions?.some((permission) =>
          hasPermission(user, permission)
        );
        return hasAccess;
      });
      return filtered;
    }
    return [];
  }, [user, navItems]);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  /** The row the pointer is on — parents and sub-items share one key space. */
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  const findOpenSubmenuForPath = useCallback(
    (items: NavItem[], menuType: "main" | "others") => {
      const matchingIndex = items.findIndex((item) =>
        item.subItems?.some((subItem) => isActive(subItem.path))
      );

      if (matchingIndex === -1) {
        return null;
      }

      return { type: menuType, index: matchingIndex } as const;
    },
    [isActive]
  );

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0
        }));
      }
    }
  }, [openSubmenu]);

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
  }, [findOpenSubmenuForPath, restrictedFilteredNavItems, location.pathname]);

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
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => {
        const key = `${menuType}-${index}`;
        return (
        <li key={nav.name}>
          {/* Wrapper keeps the highlight on the row, not the submenu below it. */}
          <div className="relative">
          {hoveredKey === key && <HoverHighlight />}
          {nav.subItems ? (
            <button
              onMouseEnter={() => setHoveredKey(key)}
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group relative z-10 ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={`menu-item-icon-size  ${openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text text-start">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                onMouseEnter={() => setHoveredKey(key)}
                to={nav.path}
                className={`menu-item group relative z-10 ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`menu-item-icon-size ${isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text text-start">{nav.name}</span>
                )}
              </Link>
            )
          )}
          </div>
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px"
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem, subIndex) => (
                  <li key={subItem.name} className="relative">
                    {hoveredKey === `${key}-${subIndex}` && <HoverHighlight />}
                    <Link
                      onMouseEnter={() => setHoveredKey(`${key}-${subIndex}`)}
                      to={subItem.path}
                      className={`menu-dropdown-item relative z-10 ${isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
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
                ))}
              </ul>
            </div>
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
