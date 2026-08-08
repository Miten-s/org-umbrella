import { useTranslation } from "react-i18next";

import Label from "@/components/common/form/Label";
import FileUpload from "@/components/common/form/input/FileUpload";
import { isImageName } from "@/lib/attachments";
import { getGxpImageUrl } from "@/services/utils.service";
import type { UseAttachmentsReturn } from "@/hooks/useAttachments";

interface LimsAttachmentsFieldProps {
  attachments: UseAttachmentsReturn;
  disabled?: boolean;
}

/**
 * "Attachment (any kind of attachment with comments)" — the block the spec
 * repeats across Projects, Study, Supplier, Customer, Location, Stock, Stock
 * Batch, Instrument, Instrument Parts and Specifications.
 *
 * Existing files can be pruned (the kept ids go up on submit); new files upload
 * alongside the record.
 */
const LimsAttachmentsField = ({ attachments, disabled = false }: LimsAttachmentsFieldProps) => {
  const { t } = useTranslation();

  return (
    <div className="col-span-full min-w-0">
      <Label>{t("limsAttachments")}</Label>

      {attachments.existing.length ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.existing.map((file) => (
            <div
              key={file.id}
              title={file.name}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            >
              {isImageName(file.path) ? (
                <img
                  src={getGxpImageUrl(file.path)}
                  alt={file.name}
                  className="h-10 w-10 rounded border border-gray-200 object-cover dark:border-gray-700"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-200 text-[10px] font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                  {(file.path.split(".").pop() || "file").toUpperCase().slice(0, 4)}
                </div>
              )}
              <span className="max-w-[220px] truncate text-xs text-gray-800 dark:text-gray-100">
                {file.name}
              </span>
              {!disabled ? (
                <button
                  type="button"
                  onClick={() => attachments.removeExisting(file.id)}
                  className="text-[11px] font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  {t("delete")}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {!disabled ? (
        <FileUpload
          value={attachments.newFiles}
          onChange={attachments.setNewFiles}
          multiple
          maxFiles={10}
          maxSizeMB={10}
          blockAudioVideo
          title={t("limsAttachments")}
        />
      ) : null}
    </div>
  );
};

export default LimsAttachmentsField;
