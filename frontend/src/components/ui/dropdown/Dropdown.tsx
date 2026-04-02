// Dropdown.tsx
import { CSSProperties, MouseEventHandler, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  position?: "absolute" | "fixed";
  portal?: boolean;
  style?: CSSProperties;
  onMouseDown?: MouseEventHandler<HTMLDivElement>;
}

export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  position = "absolute",
  portal = false,
  style,
  onMouseDown
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".dropdown-toggle")
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!isOpen) return null;

  const content = (
    <div
      ref={dropdownRef}
      className={`${position} z-[1200] mt-2 rounded-xl border border-gray-200 bg-white shadow-lg animate-fadeIn dark:border-gray-700 dark:bg-gray-800 ${className}`}
      style={style}
      onMouseDown={onMouseDown}
    >
      <ul className="py-2">{children}</ul>
    </div>
  );

  if (portal && typeof document !== "undefined") {
    return createPortal(content, document.body);
  }

  return content;
};
