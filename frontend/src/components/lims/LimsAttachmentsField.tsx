import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import Label from "@/components/common/form/Label";
import FileUpload from "@/components/common/form/input/FileUpload";
import { isImageName, type ExistingAttachment } from "@/lib/attachments";
import {
  downloadLimsAttachment,
  useLimsAttachmentPreview
} from "@/hooks/useLimsAttachmentPreview";
import { DownloadIcon } from "@/public/icons";
import type { UseAttachmentsReturn } from "@/hooks/useAttachments";

interface LimsAttachmentsFieldProps {
  attachments: UseAttachmentsReturn;
  disabled?: boolean;
}

/**
 * One saved attachment. Its own component (not inlined in the `.map()` below)
 * because reading it back needs a hook: LIMS attachments only exist behind
 * the authenticated `/download` route now (see useLimsAttachmentPreview), so
 * an image thumbnail has to be fetched, not just linked to with `<img src>`.
 */
const AttachmentChip = ({
  file,
  onRemove
}: {
  file: ExistingAttachment;
  onRemove?: () => void;
}) => {
  const { t } = useTranslation();
  const isImage = isImageName(file.path);

  // A record with a long edit history can carry far more attachments than a
  // save ever adds at once (multer caps ONE save at 10 files — nothing caps
  // the total across many edits). Fetching every image's thumbnail the
  // instant the field mounts means a 100-attachment record fires 100
  // concurrent download requests, most for chips scrolled off-screen and
  // never looked at. `rootMargin` starts the fetch a little before a chip
  // actually enters view, so scrolling to it doesn't show a visible pop-in.
  const chipRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  useEffect(() => {
    if (!isImage || isNearViewport) return;
    const el = chipRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isImage, isNearViewport]);

  const { url, loading } = useLimsAttachmentPreview(
    isImage && isNearViewport ? file.id : undefined
  );

  return (
    <div
      ref={chipRef}
      title={file.name}
      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
    >
      {isImage ? (
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900">
          {url ? (
            <img
              src={url}
              alt={file.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className={`h-full w-full ${loading ? "animate-pulse bg-gray-200 dark:bg-gray-700" : ""}`}
              aria-hidden="true"
            />
          )}
        </div>
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gray-200 text-[10px] font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-100">
          {(file.path.split(".").pop() || "file").toUpperCase().slice(0, 4)}
        </div>
      )}
      <span className="max-w-[220px] truncate text-xs text-gray-800 dark:text-gray-100">
        {file.name}
      </span>
      <button
        type="button"
        aria-label={t("limsAttachmentDownload", { name: file.name })}
        onClick={() => downloadLimsAttachment(file.id, file.name)}
        className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
      >
        <DownloadIcon className="h-4 w-4" />
      </button>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="text-[11px] font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
        >
          {t("delete")}
        </button>
      ) : null}
    </div>
  );
};

/**
 * "Attachment (any kind of attachment with comments)" — the block the spec
 * repeats across Projects, Study, Supplier, Customer, Location, Stock, Stock
 * Batch, Instrument, Instrument Parts and Specifications.
 *
 * Existing files can be pruned (the kept ids go up on submit); new files upload
 * alongside the record. Every existing file — image or not — can also be
 * opened/downloaded from here (previously only images had any way back out,
 * and even that went through an unauthenticated URL — see LIMS_AUDIT C1/M6/M8).
 */
const LimsAttachmentsField = ({
  attachments,
  disabled = false
}: LimsAttachmentsFieldProps) => {
  const { t } = useTranslation();

  return (
    <div className="col-span-full min-w-0">
      <Label>{t("limsAttachments")}</Label>

      {attachments.existing.length ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.existing.map((file) => (
            <AttachmentChip
              key={file.id}
              file={file}
              onRemove={
                disabled ? undefined : () => attachments.removeExisting(file.id)
              }
            />
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
