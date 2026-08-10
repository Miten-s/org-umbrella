import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import SubFormGrid from "@/components/data/SubFormGrid";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { limsTestGroupSchema, type LimsTestGroupFormValues } from "./LimsTestGroup.schema";
import type {
  LimsTestGroup,
  LimsTestRow,
  LimsTestGroupPayload,
  LimsRef
} from "./LimsTestGroup.types";

export type LimsTestGroupFormMode = "create" | "edit" | "view";

interface LimsTestGroupFormProps {
  mode?: LimsTestGroupFormMode;
  initialData?: LimsTestGroup | null;
  onClose: () => void;
  onSubmit: (payload: LimsTestGroupPayload) => Promise<void> | void;
  submitting?: boolean;
}

const seedOne = (ref: LimsRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const LimsTestGroupForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false
}: LimsTestGroupFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const identityLocked = isReadOnly;

  const [tests, setTests] = useState<LimsTestRow[]>(initialData?.tests ?? []);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsTestGroupFormValues>({
    resolver: zodResolver(limsTestGroupSchema),
    defaultValues: {
      testGroupId: initialData?.testGroupId ?? "",
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      group: initialData?.group?.id ?? ""
    }
  });

  const description = useWatch({ control, name: "description" });
  const busy = submitting || isSubmitting;

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form
        onSubmit={handleSubmit((values) => onSubmit({ ...values, tests }))}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsTestGroup") })
            : initialData
              ? t("update", { entity: t("limsTestGroup") })
              : t("create", { entity: t("limsTestGroup") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0">
            <Label required>{t("limsTestGroupId")}</Label>
            <Input
              {...register("testGroupId")}
              disabled={identityLocked}
              error={!!errors.testGroupId}
              hint={errors.testGroupId?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="min-w-0">
            <Label required>{t("name")}</Label>
            <Input
              {...register("name")}
              disabled={identityLocked}
              error={!!errors.name}
              hint={errors.name?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="min-w-0">
            <Label>{t("limsGroup")}</Label>
            <Controller
              name="group"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsGroupOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  error={!!errors.group}
                  placeholder={t("select", { entity: t("limsGroup") })}
                  initialSelectedOptions={seedOne(initialData?.group)}
                />
              )}
            />
            {errors.group ? (
              <p className="mt-1 text-xs text-red-500">{errors.group.message}</p>
            ) : null}
          </div>

          <div className="min-w-0 md:col-span-2">
            <Label>{t("description")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={description || ""}
              onChange={(val) => setValue("description", val, { shouldValidate: true })}
              error={!!errors.description}
              hint={errors.description?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* The selectable values — added even on system pick lists. */}
          <div className="min-w-0 md:col-span-2">
            <SubFormGrid<LimsTestRow>
              label={t("limsTestList")}
              rows={tests}
              onChange={setTests}
              disabled={isReadOnly}
              addLabel={t("limsAddTest")}
              emptyLabel={t("limsNoTests")}
              columns={[
                { key: "testName", header: t("limsTestName") },
                { key: "instrumentCategory", header: t("limsInstrumentCategory") },
                { key: "instrumentType", header: t("limsInstrumentType") },
                { key: "instrument", header: t("limsInstrument") },
                { key: "replicateCount", header: t("limsReplicateCount"), type: "number" }
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

export default LimsTestGroupForm;
