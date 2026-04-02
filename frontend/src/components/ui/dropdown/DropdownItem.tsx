// DropdownItem.tsx
import { MouseEventHandler } from "react";
import { Link } from "react-router-dom";

interface DropdownItemProps {
  tag?: "a" | "button";
  to?: string;
  title?: string;
  onClick?: () => void;
  onItemClick?: () => void;
  onMouseDown?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  className?: string;
  children: React.ReactNode;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  tag = "button",
  to,
  title,
  onClick,
  onItemClick,
  onMouseDown,
  className = "",
  children
}) => {
  const baseClassName =
    "flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer w-full text-left";

  const handleClick = (event: React.MouseEvent) => {
    if (tag === "button") event.preventDefault();
    onClick?.();
    onItemClick?.();
  };

  if (tag === "a" && to) {
    return (
      <Link
        to={to}
        title={title}
        className={`${baseClassName} ${className}`}
        onClick={handleClick}
        onMouseDown={onMouseDown}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      title={title}
      onClick={handleClick}
      onMouseDown={onMouseDown}
      className={`${baseClassName} ${className}`}
    >
      {children}
    </button>
  );
};
