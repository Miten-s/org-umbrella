import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";

interface LimsAddressFieldsProps {
  /** `register` bound to the form; fields nest under `address.*`. */
  register: (name: string) => Record<string, unknown>;
  disabled?: boolean;
}

/** The six-line address block shared by Supplier and Customer (spec §B.3/B.4). */
const LimsAddressFields = ({ register, disabled = false }: LimsAddressFieldsProps) => {
  const { t } = useTranslation();

  const field = (name: string, label: string) => (
    <div className="min-w-0">
      <Label>{label}</Label>
      <Input
        {...register(`address.${name}`)}
        disabled={disabled}
        className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />
    </div>
  );

  return (
    <>
      <h3 className="col-span-full mt-2 border-b border-gray-200 pb-1 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:border-gray-700 dark:text-gray-300">
        {t("limsAddress")}
      </h3>
      {field("line1", t("limsAddressLine1"))}
      {field("line2", t("limsAddressLine2"))}
      {field("town", t("limsTownCity"))}
      {field("state", t("limsStateCounty"))}
      {field("zipcode", t("limsZipcode"))}
      {field("country", t("limsCountry"))}
    </>
  );
};

export default LimsAddressFields;
