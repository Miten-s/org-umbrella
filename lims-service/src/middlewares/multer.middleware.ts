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

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Never build a path from the client's filename: it can contain "../" or
    // a null byte. A random name is stored; the original is kept in the DB
    // column and only ever used as a display label / download filename.
    const ext = path.extname(file.originalname).slice(0, 20).replace(/[^A-Za-z0-9.]/g, "");
    cb(null, `${Date.now()}-${crypto.randomBytes(12).toString("hex")}${ext}`);
  }
});

export const uploadAttachment = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 }
});

export const attachmentPath = (storedName: string) => path.join(UPLOAD_DIR, storedName);

/** Best-effort unlink — a missing file must not fail the request. */
export const removeStoredFile = (storedName: string) => {
  fs.promises.unlink(attachmentPath(storedName)).catch(() => undefined);
};
