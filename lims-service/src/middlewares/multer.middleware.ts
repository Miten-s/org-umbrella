import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

/**
 * Upload handling for `lims_attachments`.
 *
 * Files land on local disk under `uploads/`, which `app.ts` serves statically.
 * That is deliberate for now and matches gxp-service; when this moves to more
 * than one instance the storage engine here is the single thing that changes
 * (S3 or a shared volume) — nothing else in the service touches the filesystem.
 */

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/** 25 MB. Instrument raw-data files are the large case the spec implies. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/**
 * Blocks the one class of file that turns "an attachment" into "code that
 * runs on this origin": HTML/SVG/JS served back with its own content-type
 * renders or executes in-browser. Everything else instrument/lab data comes
 * in — including formats with no useful MIME type — is left alone; this is a
 * denylist, not a format allowlist, on purpose (see LIMS_AUDIT finding C1).
 */
const DANGEROUS_MIME_TYPES = new Set([
  "text/html",
  "application/xhtml+xml",
  "image/svg+xml",
  "application/javascript",
  "text/javascript",
  "application/x-javascript"
]);
const DANGEROUS_EXTENSION = /\.(html?|xhtml|svg|m?js)$/i;

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (
    DANGEROUS_MIME_TYPES.has(file.mimetype) ||
    DANGEROUS_EXTENSION.test(file.originalname)
  ) {
    return cb(
      Object.assign(
        new Error("This file type can't be uploaded as an attachment."),
        { statusCode: 400 }
      )
    );
  }
  cb(null, true);
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Never build a path from the client's filename: it can contain "../" or
    // a null byte. A random name is stored; the original is kept in the DB
    // column and only ever used as a display label / download filename.
    const ext = path
      .extname(file.originalname)
      .slice(0, 20)
      .replace(/[^A-Za-z0-9.]/g, "");
    cb(null, `${Date.now()}-${crypto.randomBytes(12).toString("hex")}${ext}`);
  }
});

export const uploadAttachment = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter
});

/**
 * Multi-file variant for the generic entity engine's own create/update
 * routes (crud-factory.ts) — a Test/Sample/Study/etc. save can carry several
 * new attachments at once via `LimsAttachmentsField`, unlike the standalone
 * `/lims-attachments` endpoint's one-at-a-time upload.
 */
export const uploadAttachments = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 10 },
  fileFilter
});

export const attachmentPath = (storedName: string) =>
  path.join(UPLOAD_DIR, storedName);

/** Best-effort unlink — a missing file must not fail the request. */
export const removeStoredFile = (storedName: string) => {
  fs.promises.unlink(attachmentPath(storedName)).catch(() => undefined);
};
