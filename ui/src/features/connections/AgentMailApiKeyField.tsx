import { getAppStoreDefinition } from "@paperclipai/shared";
import { useTranslation } from "react-i18next";
import { ApiKeyCredentialField } from "./ApiKeyCredentialField";

export const AGENTMAIL_API_KEYS_URL = getAppStoreDefinition("agentmail")!.methods[0]!.consoleLinks!.keys!;

export function AgentMailApiKeyField({ value, onChange, disabled = false, label }: {
  value: string;
  onChange(value: string): void;
  disabled?: boolean;
  label?: string;
}) {
  const { t } = useTranslation();
  return <ApiKeyCredentialField providerName="AgentMail" keysUrl={AGENTMAIL_API_KEYS_URL}
    options={[]} connectionId="" onConnectionChange={() => {}} value={value} onChange={onChange}
    disabled={disabled} label={label ?? t("credentialField.apiKey")} />;
}
