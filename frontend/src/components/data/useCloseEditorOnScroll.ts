import { useRef } from "react";
import type {
  BodyScrollEvent,
  CellEditingStartedEvent
} from "ag-grid-community";

/** Ignores the small scroll AG Grid makes to bring a half-visible cell into view. */
const THRESHOLD = 40;

/** A popup editor (and its dropdown) stays where it opened while the grid scrolls away under
 * it, so the editor closes once the grid has really been scrolled. Spread into AgGridReact. */
export const useCloseEditorOnScroll = () => {
  const start = useRef<{ left: number; top: number } | null>(null);
  return {
    onCellEditingStarted: (event: CellEditingStartedEvent) => {
      start.current = {
        left: event.api.getHorizontalPixelRange().left,
        top: event.api.getVerticalPixelRange().top
      };
    },
    onCellEditingStopped: () => {
      start.current = null;
    },
    onBodyScroll: (event: BodyScrollEvent) => {
      const from = start.current;
      if (
        from &&
        (Math.abs(event.left - from.left) > THRESHOLD ||
          Math.abs(event.top - from.top) > THRESHOLD)
      )
        event.api.stopEditing();
    }
  };
};
