import { FC, ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import HelpTooltip from "@/components/common/HelpTooltip";

interface LabelProps {
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
  /** Shows a "?" after the label that reveals this text on hover. */
  tooltip?: ReactNode;
}

const Label: FC<LabelProps> = ({
  htmlFor,
  children,
  className,
  required,
  tooltip
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={twMerge(
        "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400",
        className
      )}
    >
      {children}
      {required && <span className="text-error-500 ml-0.5">*</span>}
      {tooltip && <HelpTooltip content={tooltip} />}
    </label>
  );
};

export default Label;
