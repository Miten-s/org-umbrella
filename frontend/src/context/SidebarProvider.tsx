import { ReactNode, useEffect, useMemo, useState } from "react";
import { SidebarContext, SidebarContextType } from "./SidebarContext";

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const value = useMemo<SidebarContextType>(
    () => ({
      activeItem,
      isExpanded: isMobile ? false : isExpanded,
      isHovered,
      isMobileOpen,
      openSubmenu,
      setActiveItem,
      setIsHovered,
      toggleMobileSidebar: () => setIsMobileOpen((current) => !current),
      toggleSidebar: () => setIsExpanded((current) => !current),
      toggleSubmenu: (item: string) =>
        setOpenSubmenu((current) => (current === item ? null : item))
    }),
    [activeItem, isExpanded, isHovered, isMobile, isMobileOpen, openSubmenu]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};
