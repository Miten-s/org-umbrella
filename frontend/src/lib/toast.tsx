import { toast as hotToast, type ToastPosition } from "react-hot-toast";
import ToastCard, { type ToastType } from "./ToastCard";

interface ToastOptions {
  position?: ToastPosition;
  id?: string;
  duration?: number;
}

// Sensible defaults so notifications linger long enough to read but don't nag.
// Errors stay a touch longer; loading persists until explicitly resolved.
const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 3500,
  info: 3500,
  error: 4500,
  loading: Infinity
};

export const toast = (
  message: string,
  type: ToastType = "success",
  options?: ToastOptions
) => {
  const { position = "top-right", id, duration } = options || {};

  return hotToast.custom((t) => <ToastCard t={t} message={message} type={type} />, {
    id,
    position,
    duration: duration ?? DEFAULT_DURATION[type]
  });
};
