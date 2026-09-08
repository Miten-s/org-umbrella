import { useEffect, useState } from "react";
import limsApi from "@/utils/lims.axios.interceptor";

/**
 * LIMS attachments are no longer served from an unauthenticated static path
 * (LIMS_AUDIT finding C1/M8) — the only way to read one back is the
 * authenticated, permission- and group-checked `GET /lims-attachments/:id/download`
 * route, which a plain `<img src>`/`<a href>` can't hit: the auth token
 * travels as an `Authorization` header the axios interceptor attaches, not a
 * cookie the browser would send on its own (see lims.axios.interceptor.ts).
 * Every LIMS attachment read goes through one of these two instead.
 */
const downloadUrl = (attachmentId: string) =>
  `/lims-attachments/${attachmentId}/download`;

const fetchAttachmentBlob = async (attachmentId: string): Promise<Blob> => {
  const response = await limsApi.get(downloadUrl(attachmentId), {
    responseType: "blob"
  });
  return response.data as Blob;
};

/**
 * A local, revocable object URL for one attachment — for an `<img src>`
 * thumbnail. Re-fetches when `attachmentId` changes; the previous object URL
 * is always revoked, on change and on unmount, so a form left open doesn't
 * leak blob URLs.
 */
export const useLimsAttachmentPreview = (attachmentId?: string) => {
  const [url, setUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!attachmentId) {
      setUrl(undefined);
      return;
    }

    let cancelled = false;
    let objectUrl: string | undefined;
    setLoading(true);

    fetchAttachmentBlob(attachmentId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(undefined);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachmentId]);

  return { url, loading };
};

/** Fetches one attachment and hands it to the browser's normal save flow. */
export const downloadLimsAttachment = async (
  attachmentId: string,
  fileName: string
) => {
  const blob = await fetchAttachmentBlob(attachmentId);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};
