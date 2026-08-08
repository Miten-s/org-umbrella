import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Switch from "@/components/common/form/switch/Switch";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";

import { useLimsInstrumentOptions } from "@/pages/lims/instruments/LimsInstrument.queries";
import { useCalibrationStatusOptions, useCalibrationTypeOptions } from "@/pages/lims/phrases/LimsPhrase.queries";
import { useLimsUserOptions } from "@/pages/lims/users/LimsUser.options";
import { limsCalibrationSchema, type LimsCalibrationFormValues } from "./LimsCalibration.schema";
import type { LimsCalibration, LimsCalibrationPayload, LimsRef } from "./LimsCalibration.types";

export type LimsCalibrationFormMode = "create" | "edit" | "view";

interface LimsCalibrationFormProps {
  mode?: LimsCalibrationFormMode;
  initialData?: LimsCalibration | null;
  onClose: () => void;
  onSubmit: (payload: LimsCalibrationPayload) => Promise<void> | void;
  submitting?: boolean;
}

/** Seeds a dropdown label from the record's nested ref — no extra fetch. */
const seedOne = (ref: LimsRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const LimsCalibrationForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false
}: LimsCalibrationFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LimsCalibrationFormValues>({
    resolver: zodResolver(limsCalibrationSchema),
    defaultValues: {
      calibrationId: initialData?.calibrationId ?? "",
      calibrationName: initialData?.calibrationName ?? "",
      instrument: initialData?.instrument?.id ?? "",
      calibrationType: initialData?.calibrationType?.id ?? "",
      status: initialData?.status?.id ?? "",
      plan: initialData?.plan ?? "",
      planTime: initialData?.planTime ?? "",
      leadTimeValue: initialData?.leadTimeValue ?? "",
      leadTimeUnit: initialData?.leadTimeUnit ?? "",
      owner: initialData?.owner?.id ?? "",
      contractor: initialData?.contractor ?? "",
      lastMaintenanceDate: initialData?.lastMaintenanceDate ?? "",
      nextMaintenanceDate: initialData?.nextMaintenanceDate ?? "",
      autoLogin: initialData?.autoLogin ?? false,
    }
  });

  const busy = submitting || isSubmitting;

  const text = (
    name: keyof LimsCalibrationFormValues,
    label: string,
    required = false,
    type = "text"
  ) => (
    <div className="min-w-0">
      <Label required={required}>{label}</Label>
      <Input
        {...register(name)}
        type={type}
        disabled={isReadOnly}
        error={!!errors[name]}
        hint={errors[name]?.message as string}
        className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />
    </div>
  );

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form
        onSubmit={handleSubmit((values) => onSubmit({ ...values }))}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsCalibration") })
            : initialData
              ? t("update", { entity: t("limsCalibration") })
              : t("create", { entity: t("limsCalibration") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {text("calibrationId", t("limsCalibrationId"), true, "text")}
          {text("calibrationName", t("limsCalibrationName"), true, "text")}
          <div className="min-w-0">
            <Label required={false}>{t("limsInstrument")}</Label>
            <Controller
              name="instrument"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsInstrumentOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsInstrument") })}
                  initialSelectedOptions={seedOne(initialData?.instrument)}
                />
              )}
            />
          </div>
          <div className="min-w-0">
            <Label required={false}>{t("limsCalibrationType")}</Label>
            <Controller
              name="calibrationType"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useCalibrationTypeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsCalibrationType") })}
                  initialSelectedOptions={seedOne(initialData?.calibrationType)}
                />
              )}
            />
          </div>
          <div className="min-w-0">
            <Label required={false}>{t("status")}</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useCalibrationStatusOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("status") })}
                  initialSelectedOptions={seedOne(initialData?.status)}
                />
              )}
            />
          </div>
          <div className="min-w-0">
            <Label>{t("limsPlan")}</Label>
            <Controller
              name="plan"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={[{ label: "Daily", value: "Daily" }, { label: "Monthly", value: "Monthly" }, { label: "Yearly", value: "Yearly" }]}
                  placeholder={t("select", { entity: t("limsPlan") })}
                />
              )}
            />
          </div>
          {text("planTime", t("limsPlanTime"), false, "time")}
          {text("leadTimeValue", t("limsLeadTime"), false, "number")}
          <div className="min-w-0">
            <Label>{t("limsLeadTimeUnit")}</Label>
            <Controller
              name="leadTimeUnit"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={[{ label: "Day", value: "Day" }, { label: "Hours", value: "Hours" }, { label: "Min", value: "Min" }, { label: "Second", value: "Second" }]}
                  placeholder={t("select", { entity: t("limsLeadTimeUnit") })}
                />
              )}
            />
          </div>
          <div className="min-w-0">
            <Label required={false}>{t("limsOwner")}</Label>
            <Controller
              name="owner"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsUserOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsOwner") })}
                  initialSelectedOptions={seedOne(initialData?.owner)}
                />
              )}
            />
          </div>
          {text("contractor", t("limsContractor"), false, "text")}
          {text("lastMaintenanceDate", t("limsLastMaintenanceDate"), false, "date")}
          {text("nextMaintenanceDate", t("limsNextMaintenanceDate"), false, "date")}
          <div className="min-w-0">
            <Label>{t("limsAutoLogin")}</Label>
            <Controller
              name="autoLogin"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-3 py-2">
                  <Switch
                    checked={Boolean(field.value)}
                    onChange={field.onChange}
                    label={field.value ? t("yes") : t("no")}
                  />
                </div>
              )}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={busy}>
            {t("cancel")}
          </Button>
          {!isReadOnly ? (
            <Button type="submit" variant="primary" loading={busy}>
              {t("save")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default LimsCalibrationForm;
