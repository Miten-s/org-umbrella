type ErrorLike = {
  error?: unknown;
  message?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getStringValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

export const getErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string => {
  if (typeof error === "string") {
    return error.trim() || fallback;
  }

  if (isRecord(error)) {
    const data = isRecord(error.response) ? error.response.data : undefined;

    const candidates: unknown[] = [
      (data as ErrorLike | undefined)?.message,
      (data as ErrorLike | undefined)?.error,
      (error as ErrorLike).message,
      (error as ErrorLike).error
    ];

    for (const candidate of candidates) {
      const message = getStringValue(candidate);
      if (message) {
        return message;
      }
    }
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};