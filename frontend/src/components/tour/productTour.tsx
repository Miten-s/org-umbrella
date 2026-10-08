/**
 * Product tour / in-app tutorial, built on driver.js: dims the page, highlights one element at
 * a time and explains it. Any page can reuse it — mark elements with `data-tour="…"`, list steps.
 */
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "./productTour.css";

export interface TourStep {
  /** CSS selector; the first visible match is highlighted, and the step is skipped if none is. */
  target: string;
  title: string;
  body: string;
  side?: "top" | "bottom" | "left" | "right";
}

const visible = (selector: string) =>
  [...document.querySelectorAll<HTMLElement>(selector)].find(
    (el) => el.getClientRects().length > 0 && el.offsetParent !== null
  );

const SEEN_PREFIX = "umbrella.tour.";
const seen = (id: string) => {
  try {
    return localStorage.getItem(SEEN_PREFIX + id) === "1";
  } catch {
    return true;
  }
};
const markSeen = (id: string) => {
  try {
    localStorage.setItem(SEEN_PREFIX + id, "1");
  } catch {
    // Storage blocked (private window): the tour just shows again next time.
  }
};

/**
 * A page's tour. `start()` runs it (the Guide button); it also opens by itself the first time
 * `ready` is true on this browser, once `waitFor` (if given) is on screen.
 */
export const useProductTour = (
  id: string,
  steps: TourStep[],
  { ready = true, waitFor }: { ready?: boolean; waitFor?: string } = {}
) => {
  const { t } = useTranslation();
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const start = useCallback(() => {
    const drive: DriveStep[] = stepsRef.current.flatMap((step) => {
      const element = visible(step.target);
      return element
        ? [
            {
              element,
              popover: {
                title: step.title,
                description: step.body,
                side: step.side,
                align: "start" as const
              }
            }
          ]
        : [];
    });
    if (!drive.length) return;
    markSeen(id);
    driver({
      steps: drive,
      showProgress: true,
      progressText: t("tourProgress", {
        current: "{{current}}",
        total: "{{total}}"
      }),
      nextBtnText: t("tourNext"),
      prevBtnText: t("tourBack"),
      doneBtnText: t("tourDone"),
      popoverClass: "umbrella-tour",
      stagePadding: 4,
      stageRadius: 8
    }).drive();
  }, [id, t]);

  useEffect(() => {
    if (!ready || seen(id)) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      if (!waitFor || visible(waitFor)) {
        window.clearInterval(timer);
        start();
      } else if (tries > 20) window.clearInterval(timer);
    }, 400);
    return () => window.clearInterval(timer);
  }, [id, ready, waitFor, start]);

  return start;
};
