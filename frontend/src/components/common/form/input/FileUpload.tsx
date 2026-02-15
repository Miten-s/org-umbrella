import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";

type FileUploadValue = File[];

type FileUploadProps = {
  value: FileUploadValue;
  onChange: (files: FileUploadValue) => void;

  title?: string;
  description?: string;

  multiple?: boolean;
  maxFiles?: number; // only used if multiple=true
  maxSizeMB?: number;

  // If true: reject audio/* and video/*
  blockAudioVideo?: boolean;

  // Optional accept rules (ex: images only). If not provided => accept all types.
  accept?: Record<string, string[]>;

  disabled?: boolean;

  // Optional UI: show simple progress bar (indeterminate)
  uploading?: boolean;

  // If you want: show only images preview (default false => show list for any file)
  showPreview?: boolean;
};

const formatBytes = (bytes: number) => {
  if (!bytes && bytes !== 0) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

const isImageFile = (file: File) => file.type?.startsWith("image/");

const getExt = (name: string) => {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toUpperCase() : "FILE";
};

const FileUpload: React.FC<FileUploadProps> = ({
  value,
  onChange,
  title = "Upload Files",
  description = "Drag & drop files here, or click to browse",
  multiple = false,
  maxFiles = 10,
  maxSizeMB = 5,
  blockAudioVideo = true,
  accept,
  disabled = false,
  uploading = false,
  showPreview = true,
}) => {
  const [error, setError] = useState<string>("");

  const maxSizeBytes = useMemo(() => maxSizeMB * 1024 * 1024, [maxSizeMB]);

  // Previews for image files
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!showPreview) return;

    const next: Record<string, string> = {};
    for (const file of value || []) {
      if (isImageFile(file)) next[file.name + file.size] = URL.createObjectURL(file);
    }

    // cleanup old
    Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
    setPreviews(next);

    // cleanup on unmount
    return () => {
      Object.values(next).forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify((value || []).map((f) => `${f.name}-${f.size}-${f.type}`)), showPreview]);

  const validateCustom = (files: File[]) => {
    // Multiple not allowed
    if (!multiple && files.length > 1) {
      return {
        error: "Multiple files are not allowed. Please upload only one file.",
        files: files.slice(0, 1), // keep first
      };
    }

    // Block audio/video
    if (blockAudioVideo) {
      const blocked = files.find(
        (f) => f.type?.startsWith("audio/") || f.type?.startsWith("video/")
      );
      if (blocked) {
        return {
          error: "Audio and video files are not allowed.",
          files: files.filter(
            (f) => !(f.type?.startsWith("audio/") || f.type?.startsWith("video/"))
          ),
        };
      }
    }

    // Size check (extra guard, dropzone also checks maxSize)
    const tooBig = files.find((f) => f.size > maxSizeBytes);
    if (tooBig) {
      return {
        error: `File too large. Max size is ${maxSizeMB}MB.`,
        files: files.filter((f) => f.size <= maxSizeBytes),
      };
    }

    return { error: "", files };
  };

  const onDropAccepted = useCallback(
    (files: File[]) => {
      setError("");

      const { error: customError, files: validFiles } = validateCustom(files);

      // If single => replace
      if (!multiple) {
        onChange(validFiles.length ? [validFiles[0]] : []);
      } else {
        // merge & limit maxFiles
        const merged = [...(value || []), ...validFiles];
        const limited = merged.slice(0, maxFiles);
        if (merged.length > maxFiles) {
          setError(`You can upload up to ${maxFiles} files.`);
        }
        onChange(limited);
      }

      if (customError) setError(customError);
    },
    [multiple, maxFiles, maxSizeBytes, maxSizeMB, blockAudioVideo, onChange, value]
  );

  const onDropRejected = useCallback(
    (rejections: FileRejection[]) => {
      // show first error message (simple)
      const first = rejections?.[0];
      const message =
        first?.errors?.[0]?.message ||
        `Upload failed. Max size is ${maxSizeMB}MB.`;
      setError(message);
    },
    [maxSizeMB]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropAccepted,
    onDropRejected,
    accept,
    multiple,
    disabled,
    maxSize: maxSizeBytes,
    maxFiles: multiple ? maxFiles : 1,
  });

  const removeFile = (idx: number) => {
    const next = [...(value || [])];
    next.splice(idx, 1);
    onChange(next);
  };

  const clearAll = () => onChange([]);

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={[
          "group relative rounded-2xl border border-dashed p-6 md:p-8 cursor-pointer transition",
          "bg-white dark:bg-gray-900",
          isDragActive
            ? "border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/40"
            : "border-gray-300 dark:border-gray-700",
          disabled ? "opacity-60 cursor-not-allowed" : "",
        ].join(" ")}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <svg
              className="text-gray-700 dark:text-gray-300"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 3v10m0-10 4 4m-4-4-4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xl">
            {description}
          </p>

          <span className="text-sm font-medium underline text-blue-600">
            Browse File
          </span>

          {uploading ? (
            <div className="w-full max-w-md mt-3">
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-500" />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Uploading...
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Error */}
      {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}

      {/* Preview list */}
      {showPreview && value?.length ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Selected files ({value.length})
            </p>

            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Clear all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {value.map((file, idx) => {
              const key = file.name + file.size;
              const previewUrl = previews[key];
              const ext = getExt(file.name);

              return (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3"
                >
                  {/* Thumbnail / Badge */}
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={file.name}
                      className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-800"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-200">
                      {ext}
                    </div>
                  )}

                  {/* File info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {formatBytes(file.size)}
                    </p>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default FileUpload;
