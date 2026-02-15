import { ReactNode, useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { hasPermission } from "@/utils/permissions";
import { useTranslation } from "react-i18next";

interface ButtonProps {
  children: ReactNode;
  size?: "sm" | "md";
  variant?: "primary" | "outline" | "secondary" | "destructive";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  permission?: string | string[];
  permissionLogic?: 'all' | 'any';
  tooltipMessage?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className = "",
  disabled = false,
  type = "button",
  // Permission-related props
  permission,
  permissionLogic = 'all',
  tooltipMessage,
  tooltipPosition = 'bottom'
}) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: "px-4 py-3 text-sm",
    md: "px-5 py-3.5 text-sm"
  };

  const variantClasses = {
    primary:
      "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
    outline:
      "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300",
    secondary:
      "bg-gray-400 text-gray-800 ring-1 ring-inset ring-gray-30 hover:bg-gray-500 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-all duration-200",
    destructive:
      "bg-white text-red-600 ring-1 ring-inset ring-red-500 hover:bg-red-50 dark:bg-transparent dark:text-red-400 dark:ring-red-600 dark:hover:bg-red-900/10",
  };

  // Permission checking
  const checkPermissions = (user: any, permission: string | string[] | undefined, logic: 'all' | 'any') => {
    if (!permission) return true;
    if (Array.isArray(permission)) {
      const results = permission.map(p => hasPermission(user, p));
      return logic === 'all' ? results.every(Boolean) : results.some(Boolean);
    }
    return hasPermission(user, permission);
  };

  const getMissingPermissions = (user: any, permission: string | string[] | undefined) => {
    if (!permission) return [];
    if (Array.isArray(permission)) {
      return permission.filter(p => !hasPermission(user, p));
    }
    return hasPermission(user, permission) ? [] : [permission];
  };

  const userHasPermission = checkPermissions(user, permission, permissionLogic);
  const missingPermissions = getMissingPermissions(user, permission);
  const isDisabled = disabled || (permission && !userHasPermission);

  const handleClick = () => {
    if (isDisabled) {
      return;
    }
    onClick?.();
  };

  const handleMouseEnter = () => {
    if (permission && !userHasPermission) {
      setShowTooltip(true);
    }
    onMouseEnter?.();
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
    onMouseLeave?.();
  };

  // Hide tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTooltip]);

  // Tooltip message logic
  let defaultTooltipMessage = '';
  if (permission && !userHasPermission) {
    if (Array.isArray(permission)) {
      defaultTooltipMessage =
        t('noPermissionMessage', { action: t('create', { entity: '' }) }) +
        ': ' +
        missingPermissions.map(p => t('permission.' + p, p)).join(', ');
    } else {
      defaultTooltipMessage = t('noPermissionMessage', {
        action: t('create', { entity: permission?.split(':')[1]?.toLowerCase() || 'this item' }),
      });
    }
  }

  const getTooltipPositionClasses = () => {
    switch (tooltipPosition) {
      case 'top':
        return ' bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default: //  bottom
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
    }
  };

  const getTooltipArrowClasses = () => {
    switch (tooltipPosition) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900';
      default: //  bottom
        return 'bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900';;
    }
  };

  return (
    <div className="relative inline-block" ref={buttonRef}>
      <button
        type={type}
        className={`inline-flex items-center justify-center gap-2 rounded-lg transition ${className} ${sizeClasses[size]
          } ${variantClasses[variant]} ${isDisabled ? "cursor-not-allowed opacity-50" : ""
          }`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-disabled={isDisabled || false}
      >
        {startIcon && <span className="flex items-center">{startIcon}</span>}
        {children}
        {endIcon && <span className="flex items-center">{endIcon}</span>}
      </button>

      {/* Tooltip */}
      {showTooltip && permission && !userHasPermission && (
        <div
          className={`absolute z-50 px-3 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 shadow-xl rounded-lg whitespace-nowrap transition-opacity duration-200 ${getTooltipPositionClasses()}`}
        >
          {tooltipMessage || defaultTooltipMessage}
          {/* Tooltip arrow */}
          <div
            className={`absolute ${getTooltipArrowClasses()} bg-white border border-gray-200`}
          ></div>
        </div>
      )}
    </div>
  );
};

export default Button;
