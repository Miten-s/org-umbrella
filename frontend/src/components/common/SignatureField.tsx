import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import Label from "@/components/common/form/Label";
import Checkbox from "@/components/common/form/input/Checkbox";
import Button from "@/components/ui/button/Button";

export interface SignatureFieldHandle {
  /** "" if nothing was drawn — same shape every consumer already submits. */
  getSignature: () => string;
}

interface SignatureFieldProps {
  /** Existing signature image URL (already resolved via getImageUrl), if any. */
  existingUrl?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Draw-a-signature field — same UI and behavior as System IT Administration's
 * Users form, so every "who signed this" input in the app looks and works
 * identically. Value is read imperatively at submit time (getSignature()),
 * matching how that form already captures it.
 */
const SignatureField = forwardRef<SignatureFieldHandle, SignatureFieldProps>(
  ({ existingUrl, disabled = false, required = false }, ref) => {
    const [showSignature, setShowSignature] = useState(false);
    const padRef = useRef<SignatureCanvas | null>(null);

    useImperativeHandle(ref, () => ({
      getSignature: () => {
        if (padRef.current && !padRef.current.isEmpty()) {
          return padRef.current.toDataURL("image/png");
        }
        return "";
      }
    }));

    return (
      <div>
        <Checkbox
          checked={showSignature}
          disabled={disabled}
          onChange={setShowSignature}
          label={existingUrl ? "Replace Signature" : "Add Signature"}
          className="mb-2"
        />

        {existingUrl ? (
          <div className="mb-4">
            <Label>Signature</Label>
            <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <img
                src={existingUrl}
                alt="Signature"
                className="h-[120px] w-full max-w-[520px] object-contain"
              />
            </div>
          </div>
        ) : null}

        {showSignature ? (
          <div className="mt-4">
            <Label required={required}>Signature</Label>
            <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="h-[200px] w-full rounded-lg bg-gray-100 dark:bg-gray-700">
                <SignatureCanvas ref={padRef} canvasProps={{ className: "w-full h-full" }} penColor="black" />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => padRef.current?.clear()}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
);

SignatureField.displayName = "SignatureField";

export default SignatureField;
