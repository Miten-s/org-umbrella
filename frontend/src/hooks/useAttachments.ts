import { useRef, useState } from "react";
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

  // Baseline attachment count, captured once (and on `reset`), so `isDirty`
  // is an O(1) length check — never a re-fetch or a deep compare.
  const initialCountRef = useRef(existing.length);

  const removeExisting = (id: string) =>
    setExisting((prev) => prev.filter((a) => a.id !== id));

  const reset = (raw?: unknown) => {
    const next = toExistingAttachments(raw);
    setExisting(next);
    setNewFiles([]);
    initialCountRef.current = next.length;
  };

  /** Existing attachment ids to KEEP on submit (backend deletes the rest). */
  const keptIds = existing.map((a) => a.id).filter(Boolean);

  /** True once a file is added or an existing one removed. */
  const isDirty = newFiles.length > 0 || existing.length !== initialCountRef.current;

  return {
    existing,
    setExisting,
    newFiles,
    setNewFiles,
    removeExisting,
    reset,
    keptIds,
    isDirty
  };
};

export type UseAttachmentsReturn = ReturnType<typeof useAttachments>;
