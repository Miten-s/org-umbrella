import { useState, useRef, useEffect } from "react";
import { Dropdown } from "./Dropdown";
import { DropdownItem } from "./DropdownItem";
import { ChevronDownIcon } from "@/public/icons";

interface SelectDropdownProps {
    options: { label: string; value: string }[];
    value?: string;
    onChange: (val: string) => void;
    placeholder: string;
}

export const SelectDropdown: React.FC<SelectDropdownProps> = ({
    options,
    value,
    onChange,
    placeholder,
}) => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-left dark:text-gray-100 flex justify-between items-center"
                onClick={() => setOpen((prev) => !prev)}
            >
                <span>{options.find((opt) => opt.value === value)?.label || placeholder}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            <Dropdown isOpen={open} onClose={() => setOpen(false)}>
                {options.map((opt) => (
                    <DropdownItem
                        key={opt.value}
                        onClick={() => {
                            onChange(opt.value);
                            setOpen(false);
                        }}
                        className={value === opt.value ? "bg-gray-100 dark:bg-gray-700 font-medium" : ""}
                    >
                        {opt.label}
                    </DropdownItem>
                ))}
            </Dropdown>
        </div>
    );
};
