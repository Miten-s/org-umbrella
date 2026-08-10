import { toast as hotToast, type Toast } from "react-hot-toast";

export type ToastType = "success" | "error" | "loading" | "info";

interface ToastCardProps {
  t: Toast;
  message: string;
  type: ToastType;
}

const ICONS: Record<Exclude<ToastType, "loading">, JSX.Element> = {
  success: (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <path
        d="M4.5 10.5l3.2 3.2 7.8-7.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <path
        d="M6 6l8 8M14 6l-8 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="none" className="h-[18px] w-[18px]">
      <path
        d="M10 9v5M10 6.2v.05"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
};

// Per-type accent for the leading icon chip (works in light + dark).
const TONES: Record<ToastType, string> = {
  success: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  error: "bg-red-500/12 text-red-600 dark:text-red-400",
  info: "bg-brand-500/12 text-brand-600 dark:text-brand-400",
  loading: "bg-brand-500/12 text-brand-600 dark:text-brand-400"
};

/**
 * Premium toast card rendered via `toast.custom`. Motion is driven by
 * `t.visible`: enters bottom→top with a fade + slight scale, leaves upward
 * with a soft fade (keyframes in index.css). Self-styled for light/dark, so it
 * ignores react-hot-toast's default ToastBar styling.
 */
const ToastCard = ({ t, message, type }: ToastCardProps) => (
  <div
    role="status"
    aria-live="polite"
    className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-lg shadow-gray-900/10 ring-1 ring-black/5 backdrop-blur-md dark:border-white/10 dark:bg-gray-900/95 dark:shadow-black/40 dark:ring-white/5 ${
      t.visible ? "animate-toast-in" : "animate-toast-out"
    }`}
  >
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${TONES[type]}`}
    >
      {type === "loading" ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        ICONS[type]
      )}
    </span>

    <p className="flex-1 text-sm font-medium leading-snug text-gray-800 dark:text-gray-100">
      {message}
    </p>

    <button
      type="button"
      aria-label="Dismiss"
      onClick={() => hotToast.dismiss(t.id)}
      className="-mr-1 shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200"
    >
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
        <path
          d="M6 6l8 8M14 6l-8 8"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    </button>
  </div>
);

export default ToastCard;
