import type { DeploymentExposure, DeploymentMode } from "@paperclipai/shared";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n";

export function ModeBadge({
  deploymentMode,
  deploymentExposure,
}: {
  deploymentMode?: DeploymentMode;
  deploymentExposure?: DeploymentExposure;
}) {
  const { t } = useTranslation();
  if (!deploymentMode) return null;

  const label =
    deploymentMode === "local_trusted"
      ? t("settingsPages.general.localTrustedBadge")
      : deploymentExposure === "public"
        ? t("settingsPages.general.authenticatedPublicBadge")
        : t("settingsPages.general.authenticatedPrivateBadge");

  return <Badge variant="outline">{label}</Badge>;
}
