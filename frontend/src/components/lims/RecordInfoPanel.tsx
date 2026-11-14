import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import limsApi from "@/utils/lims.axios.interceptor";

interface RecordInfo {
  createdBy: string | null;
  createdById: string | null;
  createdOn: string | null;
  modifiedBy: string | null;
  modifiedOn: string | null;
}

const when = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "—";

const Item = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="min-w-0">
    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
      {value || "—"}
    </p>
  </div>
);

/** Group, who created and last changed a record, and when — for the first page of a record.
 * `route` is the module's API route, e.g. "/lims-samples". */
const RecordInfoPanel = ({
  route,
  recordId,
  group
}: {
  route: string;
  recordId?: string | null;
  group?: string | null;
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["limsRecordInfo", route, recordId],
    queryFn: async ({ signal }) =>
      (await limsApi.get(`${route}/${recordId}/record-info`, { signal }))
        .data as RecordInfo,
    enabled: Boolean(recordId),
    staleTime: 0
  });

  // Only the signed-in user's own department is known here, so it shows when they made it.
  const department =
    data?.createdById && data.createdById === (user?.id ?? user?._id)
      ? user?.department?.departmentName
      : null;

  return (
    <div className="mt-6 border-t border-gray-100 pt-5 dark:border-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
        {t("recordInfoTitle")}
      </h3>
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <Item label={t("limsGroup")} value={group} />
        <Item label={t("recordInfoDepartment")} value={department} />
        <Item label={t("recordInfoCreatedBy")} value={data?.createdBy} />
        <Item label={t("recordInfoCreatedOn")} value={when(data?.createdOn)} />
        <Item label={t("recordInfoModifiedBy")} value={data?.modifiedBy} />
        <Item
          label={t("recordInfoModifiedOn")}
          value={when(data?.modifiedOn)}
        />
      </div>
    </div>
  );
};

export default RecordInfoPanel;
