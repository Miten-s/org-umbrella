import { useState } from "react";
import {
  toExistingAttachments,
  type ExistingAttachment
} from "@/lib/attachments";

/**
 * Attachment state for create/edit forms: the already-saved attachments the user
 * can remove, plus the new files to upload.
 *
 * On update the backend KEEPS `keptIds`, deletes the rest, and adds `newFiles`
 * (see the gxp-service attachment reconcile). Call `reset` to re-seed when the
 * edited record changes (keyed by record identity so it doesn't wipe in-progress
 * picks on unrelated re-renders).
 */
export const useAttachments = (initialRaw?: unknown) => {
  const [existing, setExisting] = useState<ExistingAttachment[]>(() =>
    toExistingAttachments(initialRaw)
  );
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const removeExisting = (id: string) =>
    setExisting((prev) => prev.filter((a) => a.id !== id));

  const reset = (raw?: unknown) => {
    setExisting(toExistingAttachments(raw));
    setNewFiles([]);
  };

  /** Existing attachment ids to KEEP on submit (backend deletes the rest). */
  const keptIds = existing.map((a) => a.id).filter(Boolean);

  return {
    existing,
    setExisting,
    newFiles,
    setNewFiles,
    removeExisting,
    reset,
    keptIds
  };
};

export type UseAttachmentsReturn = ReturnType<typeof useAttachments>;
