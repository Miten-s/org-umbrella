import { useEffect } from "react";

/** Asks the browser to confirm a reload/close while there is unsaved work in the grid. */
export const useWarnBeforeUnload = (dirty: boolean) => {
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
};
