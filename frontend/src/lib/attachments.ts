/**
 * Shared attachment helpers used by every create/edit form with file upload
 * (Service Request, Application, …). Keeps the display + normalization logic in
 * one place instead of duplicated per form.
 */

export type ExistingAttachment = { id: string; path: string; name: string };

/** True when the path looks like an image (drives thumbnail vs file-type chip). */
export const isImageName = (name: string): boolean =>
  /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(name || "");

/** Strip a leading slash and the `<timestamp>-` upload prefix for a clean label. */
export const prettifyAttachmentName = (path: string): string => {
  const withoutSlash = (path || "").replace(/^[/\\]+/, "");
  const parts = withoutSlash.split("-");
  return parts.length > 1 && /^\d+$/.test(parts[0])
    ? parts.slice(1).join("-")
    : withoutSlash;
};

/**
 * Normalize a raw attachments array (from the backend, where the file path lives
 * under `attachment`) into display entries carrying the row `id` (the update
 * keep-list identifier) and the `path` (for the preview URL).
 */
export const toExistingAttachments = (raw: unknown): ExistingAttachment[] =>
  (Array.isArray(raw) ? raw : [])
    .map((a: any) => {
      const path =
        typeof a === "string"
          ? a
          : (a?.attachment ?? a?.filename ?? a?.path ?? a?.name ?? a?.url ?? "");
      if (!path) return null;
      return {
        id: String(a?._id ?? a?.id ?? path),
        path,
        name: prettifyAttachmentName(path)
      };
    })
    .filter(Boolean) as ExistingAttachment[];
