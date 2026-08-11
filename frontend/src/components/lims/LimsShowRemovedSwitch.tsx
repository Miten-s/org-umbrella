import { useTranslation } from "react-i18next";

import Switch from "@/components/common/form/switch/Switch";
import { LIMS_SUPPORTS_REMOVED } from "@/utils/lims.backend.shim";

interface LimsShowRemovedSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * "Show removed" toggle for LIMS list pages.
 *
 * Renders nothing while the backend cannot return removed rows (punch list B4),
 * so the control never appears as something that works and then does nothing.
 * Delete the guard — not this component — once `includeRemoved` ships.
 */
const LimsShowRemovedSwitch = ({ checked, onChange }: LimsShowRemovedSwitchProps) => {
  const { t } = useTranslation();

  if (!LIMS_SUPPORTS_REMOVED) return null;

  return <Switch checked={checked} onChange={onChange} label={t("limsShowRemoved")} />;
};

export default LimsShowRemovedSwitch;
