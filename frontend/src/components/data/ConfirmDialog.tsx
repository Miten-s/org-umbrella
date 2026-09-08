import Button from "@/components/ui/button/Button";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import { Modal } from "@/components/ui/modal";
import { CheckLineIcon } from "@/public/icons";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState, type ReactNode } from "react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Receives the typed change reason when `requireReason` is on. */
  onConfirm: (reason?: string) => void | Promise<void>;
  title?: ReactNode;
  description?: ReactNode;
  /** Optional preview of affected items (e.g. row names). First 5 shown. */
  items?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  loading?: boolean;
  /** Require a free-text "why" before confirming, and pass it to `onConfirm` — GxP-regulated
   * modules must record a reason for every change/removal/restore. */
  requireReason?: boolean;
  reasonLabel?: string;
}

/** One destructive-action dialog for delete/bulk delete, replacing the inline
 * delete Modal duplicated across every module. */
export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  items,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  loading = false,
  requireReason = false,
  reasonLabel
}: ConfirmDialogProps) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState(false);

  // Immediate double-submit guard (S2): ignore repeat confirm clicks in the
  // window before `loading` reflects the mutation's pending state.
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setSubmitting(false);
      submittingRef.current = false;
      setReason("");
      setReasonError(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (submittingRef.current || loading) return;

    const trimmedReason = reason.trim();
    if (requireReason && !trimmedReason) {
      setReasonError(true);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      await onConfirm(requireReason ? trimmedReason : undefined);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const busy = loading || submitting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="m-4 min-h-[150px] max-w-[600px] dark:bg-gray-900"
      showCloseButton={false}
    >
      <div className="flex h-full flex-col justify-between p-5 dark:text-white">
        {title ? (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        ) : null}

        {description ? <div className="py-2">{description}</div> : null}

        {items && items.length ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
            {items.slice(0, 5).map((item, index) => (
              <div key={`${item}-${index}`} className="truncate py-0.5">
                {item}
              </div>
            ))}
            {items.length > 5 ? (
              <div className="pt-1 text-xs text-gray-500 dark:text-gray-400">
                + {items.length - 5} more
              </div>
            ) : null}
          </div>
        ) : null}

        {requireReason ? (
          <div className="pt-3">
            <Label required>{reasonLabel ?? t("limsChangeReason")}</Label>
            <TextArea
              value={reason}
              onChange={(value) => {
                setReason(value);
                if (value.trim()) setReasonError(false);
              }}
              error={reasonError}
              hint={reasonError ? t("limsChangeReasonRequired") : ""}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={busy}
            className="flex items-center px-4 py-2 text-white"
          >
            {cancelLabel ?? t("cancel")}
          </Button>

          <Button
            variant={tone === "danger" ? "destructive" : "primary"}
            startIcon={<CheckLineIcon className="h-4 w-4" />}
            onClick={() => void handleConfirm()}
            loading={busy}
            className="flex items-center px-4 py-2"
          >
            {confirmLabel ?? t("confirm")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
