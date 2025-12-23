import fs from "fs";
import multer from "multer";
import type { Request } from "express";
// ---------------- Storage ----------------
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads", { recursive: true });
    }
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `/${Date.now()}-${file.originalname}`);
  }
});

// ---------------- File Validation ----------------
const allowedMimeTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/jpg"
];

const fileFilter = (_req: Request, file: Express.Multer.File, cb: any) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only PDF, Word, Excel, Text, and JPEG images are allowed."
      ),
      false
    );
  }
};

// ---------------- Multer Instance ----------------
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB max per file
  }
});

export default upload;
