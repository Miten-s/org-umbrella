import Button from "@/components/ui/button/Button";
import { t } from "i18next";
import React, { useState, useEffect } from "react";

interface Option {
  value: string;
  text: string;
}

interface MultiSelectProps {
  label?: string;
  options: Option[];
  defaultSelected?: string[];
  onChange?: (selected: string[]) => void;
  disabled?: boolean;
  showAddButton?: boolean;
  onAdd?: (newOption: Option) => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  defaultSelected = [],
  onChange,
  disabled = false,
  showAddButton = false,
  onAdd,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(defaultSelected);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newOptionText, setNewOptionText] = useState("");
  const [internalOptions, setInternalOptions] = useState<Option[]>(options);

  useEffect(() => {
    setInternalOptions(options);
  }, [options]);

  const toggleDropdown = () => {
    if (!disabled) setIsOpen((prev) => !prev);
  };

  const handleSelect = (value: string) => {
    const newSelected = selectedOptions.includes(value)
      ? selectedOptions.filter((v) => v !== value)
      : [...selectedOptions, value];

    setSelectedOptions(newSelected);
    onChange?.(newSelected);
  };

  const removeOption = (value: string) => {
    const filtered = selectedOptions.filter((v) => v !== value);
    setSelectedOptions(filtered);
    onChange?.(filtered);
  };

  const handleAddNewOption = () => {
    if (!newOptionText.trim()) return;

    const newOption: Option = {
      value: newOptionText.toLowerCase().replace(/\s+/g, "-"),
      text: newOptionText,
    };

    const updated = [...internalOptions, newOption];
    setInternalOptions(updated);
    handleSelect(newOption.value);
    onAdd?.(newOption);
    setNewOptionText("");
  };

  const filteredOptions = internalOptions.filter((opt) =>
    opt.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="relative inline-block w-full">
        <div className="relative flex flex-col items-center">
          <div
            onClick={(e) => {
              e.stopPropagation();
              toggleDropdown();
            }}
            className="w-full"
          >
            <div className="mb-2 flex h-11 rounded-lg border border-gray-300 py-1.5 pl-3 pr-3 shadow-theme-xs outline-hidden transition focus:border-brand-300 focus:shadow-focus-ring dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-300">
              <div className="flex flex-wrap flex-auto gap-2">
                {selectedOptions.length > 0 ? (
                  selectedOptions.map((val, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded px-2 py-1"
                    >
                      <span>{internalOptions.find((o) => o.value === val)?.text}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeOption(val);
                        }}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500">Select option</span>
                )}
              </div>
              <div className="flex items-center py-1 pl-1 pr-1 w-7">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown();
                  }}
                  className="w-5 h-5 text-gray-700 dark:text-gray-400"
                >
                  <svg
                    className={`stroke-current transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                      }`}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M4.79175 7.39551L10.0001 12.6038L15.2084 7.39551"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {isOpen && (
            <div
              className="absolute left-0 z-10 w-full overflow-y-auto bg-white rounded-lg shadow-lg top-full max-h-[250px] dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search bar */}
            {/* this limit is increase in future based on requirement  */}
              {filteredOptions.length >= 1 && (
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full p-2 text-sm border rounded-md outline-hidden dark:bg-gray-800 dark:text-white/90"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>)}


              <div className="flex flex-col max-h-[160px] overflow-auto no-scrollbar">
                {filteredOptions.length === 0 ? (
                  <div className="p-2 text-center text-gray-500 dark:text-white/70">
                    No data found
                  </div>
                ) : (
                  filteredOptions.map((option, index) => (
                    <div
                      key={index}
                      className={`hover:bg-gray-100 dark:hover:bg-gray-800  w-full cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0`}
                      onClick={() => handleSelect(option.value)}
                    >
                      <div
                        className={`flex items-center p-2 pl-2 ${selectedOptions.includes(option.value)
                          ? "bg-primary/10"
                          : ""
                          }`}
                      >
                        <div className="mx-2 leading-6 text-gray-800 dark:text-white/90 ">
                          {option.text}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add section */}
              {showAddButton && (
                <div className="flex items-center gap-2 p-2 border-t border-gray-200 dark:border-gray-700">
                  <input
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    placeholder="Add new..."
                    className="flex-1 p-3 text-sm border rounded-md dark:bg-gray-800 dark:text-white/90 outline-hidden"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      handleAddNewOption();
                    }}
                  // className="px-3 py-3 text-sm font-medium border bg-brand-500 text-white rounded-md hover:bg-blue-700"
                  >
                    {t("add")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiSelect;
