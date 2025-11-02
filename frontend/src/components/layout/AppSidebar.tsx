import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import appLogo from "../../public/images/logo-transparant.png";
import appSmLogo from "../../public/images/umbrella-clipart-cover.jpg";
import { ChevronDownIcon, UserManagement, GridIcon, HorizontaLDots, UserIcon, CompanyIcon, BoltIcon } from "../../public/icons";
import { useSidebar } from "../../context/SidebarContext";
import { AccessIcon } from "../../public/icons";
import { PageUrl } from "@/types/utils.types";
import { useAuth } from "@/context/AuthContext";
import { hasPermission, PERMISSIONS } from "@/utils/permissions";
import { useTranslation } from "react-i18next";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  permissions?: string[];
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const navItems: NavItem[] = useMemo(() => [
    {
      icon: <GridIcon />,
      name: t('dashboard'),
      permissions: [PERMISSIONS.VIEW_DASHBOARD],
      subItems: [
        { name: t('allServices'), path: PageUrl.Dashboard.path, pro: false }
      ]
    },
    {
      icon: <AccessIcon />,
      name: t('accessManagement'),
      permissions: [PERMISSIONS.CREATE_PERMISSION, PERMISSIONS.VIEW_PERMISSION, PERMISSIONS.UPDATE_PERMISSION, PERMISSIONS.DELETE_PERMISSION],
      subItems: [
        { name: t('rolesAndPermissions'), path: PageUrl.Roles.path },
      ]
    },
    {
      icon: <UserManagement />,
      name: t('systemITAdministration'),
      permissions: [ PERMISSIONS.CREATE_USER, PERMISSIONS.VIEW_USER, PERMISSIONS.UPDATE_USER, PERMISSIONS.DELETE_USER],
      subItems: [
        { name: t('users'), path: PageUrl.Users.path },
        { name: t('designations'), path: PageUrl.Designations.path },
        { name: t('locationsGroups'), path: PageUrl.LocationsGroups.path },
        { name: t('departments'), path: PageUrl.Departments.path },
      ]
    },
    {
      icon: <CompanyIcon />,
      name: t('companySetup'),
      permissions: [PERMISSIONS.OPERATE_ALL],
      subItems: [
        { name: t('companyInfo'), path: PageUrl.CompanySettings.path }
      ]
    },
    {
      icon: <UserIcon />,
      name: t('mySpace'),
      permissions: [PERMISSIONS.VIEW_DASHBOARD],
      subItems: [
        { name: t('profileInfo'), path: PageUrl.ProfileInfo.path }
      ]
    },
    {
      icon: <BoltIcon />,
      name: t('gxpService'),
      permissions: [PERMISSIONS.VIEW_DASHBOARD],
      subItems: [
        { name: t('users'), path: PageUrl.GXPUsers.path },
        { name: t('gxpRolesAndPermissions'), path: PageUrl.GXPRolesAndPermissions.path },
        { name: t('gxpWorkflows'), path: PageUrl.GXPWorkflows.path },
        { name: t('gxpAssignmentGroups'), path: PageUrl.GXPAssignmentGroups.path },
        { name: t('gxpEnvironments'), path: PageUrl.GXPEnvironments.path },
        { name: t('gxpSuppliers'), path: PageUrl.GXPSuppliers.path },
        { name: t('gxpApplicationSoftwareModule'), path: PageUrl.GXPApplicationSoftwareModule.path },
        { name: t('gxpAddNewApplication'), path: PageUrl.GXPAddNewApplication.path },
        { name: t('gxpCreateNewServiceRequest'), path: PageUrl.GXPCreateNewServiceRequest.path },
      ]
    },
  ], [t, i18n.language]);

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

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
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
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
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
                to={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
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
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path)
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
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-4 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link to="/">
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
