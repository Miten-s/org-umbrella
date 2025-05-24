import { useRef, useEffect } from "react";
import SignaturePad from "signature_pad";

const SignatureCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    const canvas = canvasRef?.current as HTMLCanvasElement;
    signaturePadRef.current = new SignaturePad(canvas);
  }, []);

  const saveSignature = async () => {
    if (signaturePadRef.current?.isEmpty()) {
      alert("Please provide a signature first.");
      return;
    }

    const dataURL = signaturePadRef.current?.toDataURL("image/png");
    const response = await fetch("/api/save-signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: dataURL, userId: "123" })
    });

    if (response.ok) {
      alert("Signature saved!");
      signaturePadRef.current?.clear();
    } else {
      alert("Failed to save signature.");
    }
  };

  return (
    <div className="flex gap-4">
      <canvas
        ref={canvasRef}
        className="flex-1 rounded-2xl"
        height={60}
        style={{ border: "1px solid #ccc" }}
      />
      <button onClick={saveSignature}>Save Signature</button>
    </div>
  );
};

export default SignatureCanvas;
