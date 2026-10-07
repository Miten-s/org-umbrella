import { useTranslation } from "react-i18next";

/** The header's "Guide" button that replays a page's tour. */
const TourButton = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      title={t("tourButtonHint")}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-theme-purple-500/40 bg-theme-purple-500/10 px-3 text-sm font-medium text-theme-purple-500 hover:bg-theme-purple-500/20"
    >
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px] font-bold">
        ?
      </span>
      {t("tourButton")}
    </button>
  );
};

export default TourButton;
