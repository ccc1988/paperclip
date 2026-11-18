import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Providers supply only credentials the current user is authorized to use.
 * Values are opaque connection references, never secret values. */
export function ApiKeyCredentialField({ options, connectionId, onConnectionChange, value, onChange,
  disabled, loading, error, providerName, keysUrl, label }: {
  options: { id: string; label: string; disabled?: boolean }[];
  connectionId: string | null;
  onConnectionChange(id: string): void;
  value: string;
  onChange(value: string): void;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  providerName: string;
  keysUrl: string;
  label?: string;
}) {
  const { t } = useTranslation();
  const id = useId();
  const fieldLabel = label ?? t("credentialField.apiKey");
  const choices = connectionId && !options.some(option => option.id === connectionId)
    ? [{ id: connectionId, label: loading ? t("credentialField.checkingSavedApiKey") : t("credentialField.previouslySelectedUnavailable"), disabled: true }, ...options] : options;
  return <div className="space-y-2">
    <Label htmlFor={id}>{fieldLabel}</Label>
    {choices.length > 0 && <select id={id} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      value={connectionId ?? ""} disabled={disabled} onChange={event => onConnectionChange(event.target.value)}>
      {choices.map(option => <option key={option.id} value={option.id} disabled={option.disabled}>{option.label}</option>)}
      <option value="">{t("credentialField.enterNewApiKey")}</option>
    </select>}
    {!connectionId && <Input id={choices.length ? `${id}-new` : id} aria-label={choices.length ? t("credentialField.newApiKey") : undefined}
      type="password" autoComplete="off" value={value} disabled={disabled}
      onChange={event => { onConnectionChange(""); onChange(event.target.value); }} placeholder={`${t("credentialField.newApiKey")}: ${providerName}`} />}
    {loading && <p role="status" className="text-sm text-muted-foreground">{t("credentialField.checkingSavedApiKeys")}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{t("credentialField.couldNotLoadSavedApiKeys")} {error}</p>}
    <a href={keysUrl} target="_blank" rel="noreferrer" className="text-sm underline">{t("credentialField.getProviderApiKey", { provider: providerName })}</a>
  </div>;
}
