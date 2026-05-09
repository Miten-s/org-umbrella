import { toast as hotToast, ToastPosition } from "react-hot-toast";

type ToastType = "success" | "error" | "loading";

interface ToastOptions {
  position?: ToastPosition;
  id?: string;
  duration?: number;
}

export const toast = (
  message: string,
  type: ToastType = "success",
  options?: ToastOptions
) => {
  const { position = "top-center", id, duration } = options || {};

  return hotToast[type](message, {
    duration,
    id,
    position
  });
};
