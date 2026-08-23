import { useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import SubFormGrid from "@/components/data/SubFormGrid";

import { refId } from "@/lib/query/normalizeId";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { useLimsUserOptions } from "@/pages/lims/users/LimsUser.options";
import { useLimsRoleOptions } from "@/pages/lims/roles/LimsRole.queries";
import { limsInspectionPlanSchema, type LimsInspectionPlanFormValues } from "./LimsInspectionPlan.schema";
import type { LimsInspectionPlan, LimsInspectionPlanPayload, LimsRef, LimsPersonnelRow } from "./LimsInspectionPlan.types";

export type LimsInspectionPlanFormMode = "create" | "edit" | "view";

interface LimsInspectionPlanFormProps {
  mode?: LimsInspectionPlanFormMode;
  initialData?: LimsInspectionPlan | null;
  onClose: () => void;
  onSubmit: (payload: LimsInspectionPlanPayload) => Promise<void> | void;
  submitting?: boolean;
}

/** Seeds a dropdown label from the record's nested ref — no extra fetch. */
const seedOne = (ref: LimsRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const LimsInspectionPlanForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false
}: LimsInspectionPlanFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  /**
   * The server returns each personnel row's person and role as nested
   * `{ id, name }` refs, but a select cell needs the bare id to match one of
   * its options. Without this the saved values silently render as the
   * "Select Person" placeholder — the record looks empty even though it isn't.
   */
  const initialPersonnelRef = useRef(
    (initialData?.personnel ?? []).map((row) => ({
      ...row,
      person: refId(row.person),
      role: refId(row.role)
    }))
  );
  const [personnel, setPersonnel] = useState<LimsPersonnelRow[]>(initialPersonnelRef.current);

  /**
   * Person and Role are references, not free text — the server stores them as
   * foreign keys to Lab Users and Lab Roles. The grid previously rendered them
   * as text inputs, so anything typed failed validation with "person must be a
   * UUID". These feed `type: "select"` columns instead.
   */
  const personOptions = useLimsUserOptions({ search: "" });
  const roleOptions = useLimsRoleOptions({ search: "" });

  // Captured once per record — also the no-change baseline `submit` diffs
  // against, so Save is a no-op when nothing actually differs from it.
  const initialValues = useMemo<LimsInspectionPlanFormValues>(
    () => ({
      inspectionId: initialData?.inspectionId ?? "",
      name: initialData?.name ?? "",
      inspectionType: initialData?.inspectionType ?? "",
      group: initialData?.group?.id ?? "",
      description: initialData?.description ?? "",
      details: initialData?.details ?? "",
    }),
    [initialData]
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsInspectionPlanFormValues>({
    resolver: zodResolver(limsInspectionPlanSchema),
    defaultValues: initialValues
  });

  const description = useWatch({ control, name: "description" });
  const details = useWatch({ control, name: "details" });
  const busy = submitting || isSubmitting;

  const text = (
    name: keyof LimsInspectionPlanFormValues,
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
    <div className="modal-scrollbar max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form
        onSubmit={handleSubmit((values) => {
          // Edit + nothing actually changed: skip the reason modal, update
          // call, and audit entry entirely — a no-op Save just closes.
          if (
            mode === "edit" &&
            isPayloadEqual(values, initialValues) &&
            isPayloadEqual(personnel, initialPersonnelRef.current)
          ) {
            onClose();
            return;
          }
          onSubmit({ ...values, personnel });
        })}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsInspectionPlan") })
            : initialData
              ? t("update", { entity: t("limsInspectionPlan") })
              : t("create", { entity: t("limsInspectionPlan") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {text("inspectionId", t("limsInspectionId"), true, "text")}
          {text("name", t("name"), true, "text")}
          <div className="min-w-0">
            <Label>{t("limsInspectionType")}</Label>
            <Controller
              name="inspectionType"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={[{ label: "Round robin", value: "Round robin" }, { label: "Linear", value: "Linear" }]}
                  placeholder={t("select", { entity: t("limsInspectionType") })}
                />
              )}
            />
          </div>
          <div className="min-w-0">
            <Label required={false}>{t("limsGroup")}</Label>
            <Controller
              name="group"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsGroupOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsGroup") })}
                  initialSelectedOptions={seedOne(initialData?.group)}
                />
              )}
            />
          </div>
          <div className="col-span-full min-w-0">
            <Label>{t("description")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={description || ""}
              onChange={(val) => setValue("description", val, { shouldValidate: true })}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="col-span-full min-w-0">
            <Label>{t("limsDetails")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={details || ""}
              onChange={(val) => setValue("details", val, { shouldValidate: true })}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="col-span-full min-w-0">
            <SubFormGrid<LimsPersonnelRow>
              label={t("limsPersonnel")}
              rows={personnel}
              onChange={setPersonnel}
              disabled={isReadOnly}
              columns={[
                {
                  key: "inspectionType",
                  header: t("limsInspectionEntryType"),
                  type: "select",
                  // Spec §B.13.h: the entry type decides whether the row names
                  // a person or a role.
                  options: [
                    { label: t("limsPerson"), value: "User" },
                    { label: t("limsRole"), value: "Role" }
                  ]
                },
                {
                  key: "person",
                  header: t("limsPerson"),
                  type: "select",
                  options: personOptions.options
                },
                {
                  key: "role",
                  header: t("limsRole"),
                  type: "select",
                  options: roleOptions.options
                }
              ]}
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

export default LimsInspectionPlanForm;
