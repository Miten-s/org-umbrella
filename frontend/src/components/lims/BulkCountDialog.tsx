import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import { MAX_BULK_CREATE } from "@/lib/limsBulk";

interface BulkCountDialogProps {
  title: string;
  hint: string;
  countLabel: string;
  onCancel: () => void;
  onConfirm: (count: number) => void | Promise<void>;
  /** Extra inputs under the count, e.g. the Sample Template picker. */
  children?: ReactNode;
  busy?: boolean;
}

/** "How many?" step before Create/Copy opens its forms — 1 to MAX_BULK_CREATE. */
const BulkCountDialog = ({
  title,
  hint,
  countLabel,
  onCancel,
  onConfirm,
  children,
  busy = false
}: BulkCountDialogProps) => {
  const { t } = useTranslation();
  const [raw, setRaw] = useState("1");
  const count = Number(raw);
  const valid =
    Number.isInteger(count) && count >= 1 && count <= MAX_BULK_CREATE;

  return (
    <form
      className="space-y-4 p-6 sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid && !busy) void onConfirm(count);
      }}
    >
      <h2 className="pr-10 text-xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      <div>
        <Label htmlFor="bulk-count">{countLabel}</Label>
        <Input
          id="bulk-count"
          type="number"
          min={1}
          max={MAX_BULK_CREATE}
          step={1}
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          error={!valid}
          hint={
            valid ? hint : t("limsHowManyInvalid", { max: MAX_BULK_CREATE })
          }
          className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>
      {children}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          disabled={busy}
        >
          {t("cancel")}
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!valid || busy}
          loading={busy}
        >
          {t("limsContinue")}
        </Button>
      </div>
    </form>
  );
};

export default BulkCountDialog;
