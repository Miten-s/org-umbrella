import type React from "react";
import { useState } from "react";

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
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  defaultSelected = [],
  onChange,
  disabled = false,
}) => {
  const [selectedOptions, setSelectedOptions] =
    useState<string[]>(defaultSelected);
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    if (!disabled) setIsOpen((prev) => !prev);
  };

  const handleSelect = (optionValue: string) => {
    const newSelectedOptions = selectedOptions.includes(optionValue)
      ? selectedOptions.filter((value) => value !== optionValue)
      : [...selectedOptions, optionValue];

    setSelectedOptions(newSelectedOptions);
    onChange?.(newSelectedOptions);
  };

  const removeOption = (value: string) => {
    const newSelectedOptions = selectedOptions.filter((opt) => opt !== value);
    setSelectedOptions(newSelectedOptions);
    onChange?.(newSelectedOptions);
  };

  const selectedValuesText = selectedOptions.map(
    (value) => options.find((option) => option.value.toString() === value)?.text || ""
  );

  return (
    <div className="w-full">
      <div className="relative  inline-block w-full">
        <div className="relative flex flex-col items-center">
          <div onClick={toggleDropdown} className="w-full">
            <div className="mb-2 flex h-11 rounded-lg border border-gray-300 py-1.5 pl-3 pr-3 shadow-theme-xs outline-hidden transition focus:border-brand-300 focus:shadow-focus-ring dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-300">
              <div className="flex flex-wrap flex-auto gap-2">
                {selectedValuesText.length > 0 ? (
                  selectedValuesText.map((text, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded px-2 py-1"
                    >
                      <span className="flex-initial max-w-full">{text}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeOption(selectedOptions[index]);
                        }}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <svg
                          className="fill-current"
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M3.40717 4.46881C3.11428 4.17591 3.11428 3.70104 3.40717 3.40815C3.70006 3.11525 4.17494 3.11525 4.46783 3.40815L6.99943 5.93975L9.53095 3.40822C9.82385 3.11533 10.2987 3.11533 10.5916 3.40822C10.8845 3.70112 10.8845 4.17599 10.5916 4.46888L8.06009 7.00041L10.5916 9.53193C10.8845 9.82482 10.8845 10.2997 10.5916 10.5926C10.2987 10.8855 9.82385 10.8855 9.53095 10.5926L6.99943 8.06107L4.46783 10.5927C4.17494 10.8856 3.70006 10.8856 3.40717 10.5927C3.11428 10.2998 3.11428 9.8249 3.40717 9.53201L5.93877 7.00041L3.40717 4.46881Z"
                          />
                        </svg>
                      </button>
                    </div>
                  ))
                ) : (
                  <input
                    placeholder="Select option"
                    className="w-full h-full p-1 pr-2 text-sm bg-transparent border-0 outline-hidden appearance-none placeholder:text-gray-800 focus:border-0 focus:outline-hidden focus:ring-0 dark:placeholder:text-white/90"
                    readOnly
                    value="Select option"
                  />
                )}
              </div>
              <div className="flex items-center py-1 pl-1 pr-1 w-7">
                <button
                  type="button"
                  onClick={toggleDropdown}
                  className="w-5 h-5 text-gray-700 outline-hidden cursor-pointer focus:outline-hidden dark:text-gray-400"
                >
                  <svg
                    className={`stroke-current ${isOpen ? "rotate-180" : ""}`}
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
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
              className="absolute left-0 z-10 w-full overflow-y-auto bg-white rounded-lg shadow-lg top-full max-h-[200px] dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col">
                {options.length === 0 ? (
                  <div className="p-2 text-center text-gray-500 dark:text-white/70">
                    No data found
                  </div>
                ) : (
                  options.map((option, index) => (
                    <div
                      key={index}
                      className={`hover:bg-gray-100 dark:hover:bg-gray-800 w-full cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0`}
                      onClick={() => handleSelect(option.value)}
                    >
                      <div
                        className={`relative flex w-full items-center p-2 pl-2 ${selectedOptions.includes(option.value) ? "bg-primary/10" : ""
                          }`}
                      >
                        <div className="mx-2 leading-6 text-gray-800 dark:text-white/90">
                          {option.text}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiSelect;
