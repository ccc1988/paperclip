import { useMutation } from "@tanstack/react-query";
import type { AiConnectionUsage, AiConnectionUsageLimit, AiManagedConnectionSummary } from "@paperclipai/shared";
import { supportsAiConnectionUsage } from "@paperclipai/shared";
import { aiConnectionsApi } from "@/api/ai-connections";
import { describeError } from "@/api/errors";
import { Button } from "@/components/ui/button";
import { QuotaBar } from "@/components/QuotaBar";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { useTranslation } from "@/i18n";

const usageNumber = (value: number) => formatNumber(value, { maximumFractionDigits: 20 });
const amount = (value: number, unit: string | null) => unit === "USD"
  ? formatNumber(value, { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 20 })
  : `${usageNumber(value)}${unit ? ` ${unit}` : ""}`;

type UsageText = (key: string, options?: Record<string, unknown>) => string;

function limitLabel(window: AiConnectionUsageLimit, text: UsageText) {
  const label = window.label.replace(/\b(\d+(?:\.\d+)?) hour limit\b/i, "$1h").replace(/\bweekly limit\b/i, text("aiConnectionUsage.weekly"));
  if (window.windowDurationSeconds == null) return label;
  const hours = window.windowDurationSeconds / 3600;
  const period = hours === 168 ? text("aiConnectionUsage.weekly") : `${usageNumber(hours)}h`;
  if (/\b(?:Primary|Secondary)$/.test(label)) return `${label} · ${period}`;
  if ((hours === 168 && /weekly/i.test(label)) || label.split(/[\s·()]+/).includes(period)) return label;
  return `${label} · ${period}`;
}

function limitValue(window: AiConnectionUsageLimit, text: UsageText) {
  if (window.used === 0 && window.limit === 0) return `${amount(window.limit, window.unit)} ${text("aiConnectionUsage.cap")}`;
  if (window.used != null && window.limit != null) return `${amount(window.used, window.unit)} / ${amount(window.limit, window.unit)} ${text("aiConnectionUsage.used")}`;
  if (window.usedPercent != null) return `${usageNumber(window.usedPercent)}% ${text("aiConnectionUsage.used")}`;
  if (window.used != null) return `${amount(window.used, window.unit)} ${text("aiConnectionUsage.used")}`;
  if (window.remainingPercent != null) return `${usageNumber(window.remainingPercent)}% ${text("aiConnectionUsage.left")}`;
  return text("aiConnectionUsage.notReported");
}

function limitDetails(window: AiConnectionUsageLimit, text: UsageText) {
  const details: string[] = [];
  if (window.allowed === false) details.push(text("aiConnectionUsage.blocked"));
  else if (window.limitReached === true) details.push(text("aiConnectionUsage.limitReached"));
  if (window.allowed === true && (window.limitReached === true || window.usedPercent == null)) details.push(text("aiConnectionUsage.usageAllowed"));
  if (window.used == null || window.limit == null) {
    if (window.remaining != null) details.push(`${amount(window.remaining, window.unit)} ${text("aiConnectionUsage.left")}`);
    if (window.limit != null) details.push(`${amount(window.limit, window.unit)} ${text("aiConnectionUsage.cap")}`);
  }
  if (window.resetsAt) details.push(text("aiConnectionUsage.resets", { value: formatDateTime(window.resetsAt, { includeYear: false }) }));
  else if (window.resetInterval) details.push(text("aiConnectionUsage.resets", { value: window.resetInterval }));
  return details.join(" · ");
}

function overageSummary(usage: AiConnectionUsage, text: UsageText) {
  const overage = usage.overage!;
  const details = [overage.available === true ? text("aiConnectionUsage.available")
    : overage.enabled === false ? text("aiConnectionUsage.off")
    : overage.available === false ? (overage.enabled === true ? text("aiConnectionUsage.onUnavailable") : text("aiConnectionUsage.unavailable"))
    : overage.enabled === true ? text("aiConnectionUsage.onUnknown") : text("aiConnectionUsage.notReported")];
  if (overage.unlimited === true) details.push(text("aiConnectionUsage.unlimited"));
  else if (overage.balance != null && (overage.balance !== 0 || overage.enabled !== false)) details.push(amount(overage.balance, overage.unit));
  if (overage.remaining != null && (overage.remaining !== 0 || overage.enabled !== false)
    && !usage.limits.some((window) => window.scope === "overage" && window.remaining === overage.remaining && window.unit === overage.unit)) {
    details.push(`${amount(overage.remaining, overage.unit)} ${text("aiConnectionUsage.left")}`);
  }
  return details.join(" · ");
}

function usageError(usage: AiConnectionUsage, text: UsageText) {
  switch (usage.errorCode) {
    case "authentication_required": return text("aiConnectionUsage.errors.authenticationRequired");
    case "permission_denied": return text("aiConnectionUsage.errors.permissionDenied");
    case "rate_limited": return text("aiConnectionUsage.errors.rateLimited");
    case "provider_unavailable": return text("aiConnectionUsage.errors.providerUnavailable");
    case "invalid_response": return text("aiConnectionUsage.errors.invalidResponse");
    case "connection_unavailable": return text("aiConnectionUsage.errors.connectionUnavailable");
    case "unsupported": return text("aiConnectionUsage.errors.unavailable");
    default: return usage.message ?? text("aiConnectionUsage.errors.unavailable");
  }
}

export function AiConnectionUsagePanel({ account, observation, cachedOnly = false }: { account: AiManagedConnectionSummary; observation?: AiConnectionUsage; cachedOnly?: boolean }) {
  const { t } = useTranslation();
  const probe = useMutation({
    mutationFn: () => aiConnectionsApi.probeUsage(account.companyId, account.id, account.grantId),
  });
  const supported = supportsAiConnectionUsage(account.provider, account.method);
  const usage = cachedOnly ? observation : probe.isSuccess ? probe.data : undefined;
  return (
    <section aria-label={t("aiConnectionUsage.accountLimits")} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{t("aiConnectionUsage.usage")}</h3>
        {supported && !cachedOnly && <Button variant="outline" size="sm" disabled={probe.isPending || account.status !== "connected"} onClick={() => probe.mutate()}>
          {probe.isPending ? t("aiConnectionUsage.checking") : usage?.status === "ok" ? t("common.refresh") : t("aiConnectionUsage.check")}
        </Button>}
      </div>
      {cachedOnly && !usage && <p className="text-xs text-muted-foreground">{t("aiConnectionUsage.notObserved")}</p>}
      {!supported && <p className="text-xs text-muted-foreground">{t("aiConnectionUsage.unavailableForMethod")}</p>}
      {probe.error && <p role="alert" className="text-sm text-destructive">{describeError(probe.error).body}</p>}
      {usage && usage.status !== "ok" && <p role={usage.status === "unsupported" ? "status" : "alert"} className="text-sm text-muted-foreground">{usageError(usage, t)}</p>}
      {usage?.status === "ok" && (
        <div className="space-y-3" aria-live="polite">
          {usage.limits.length === 0 && <p className="text-xs text-muted-foreground">{t("aiConnectionUsage.notReported")}</p>}
          {usage.limits.map((window) => {
            const details = limitDetails(window, t);
            return <div key={window.id} className="space-y-1.5">
              {window.usedPercent != null ? <QuotaBar label={limitLabel(window, t)} percentUsed={window.usedPercent} leftLabel={limitValue(window, t)} />
                : <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">{limitLabel(window, t)}</span>
                  <span className="font-mono">{limitValue(window, t)}</span>
                </div>}
              {details && <p className="text-xs text-muted-foreground">{details}</p>}
            </div>;
          })}
          {usage.overage && <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">{t("aiConnectionUsage.overage")}</span>
            <span className="font-mono">{overageSummary(usage, t)}</span>
          </div>}
          <p className="text-xs text-muted-foreground">{t("aiConnectionUsage.updated")} <time className="font-mono" dateTime={usage.checkedAt} title={formatDateTime(usage.checkedAt)}>{formatDateTime(usage.checkedAt, { includeYear: false })}</time>{usage.planType ? ` · ${usage.planType}` : ""}</p>
        </div>
      )}
    </section>
  );
}
