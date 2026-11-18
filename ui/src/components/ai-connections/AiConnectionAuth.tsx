import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
import {
  OnboardingCardField,
  OnboardingLoginCodeRow,
  ProviderApiKeyCard,
  ProviderSubscriptionCard,
} from "@/components/AdapterLoginChrome";
import {
  AI_PROVIDERS,
  type AiAuthMethod,
  type AiProvider,
} from "./model";

/** Redacted view of the existing login lifecycle, supplied by the host. */
export type AiAuthState =
  | { phase: "idle" | "starting" | "submitting" | "connected" | "cancelled" }
  | { phase: "waiting"; authorizationUrl: string; code?: string }
  | { phase: "error" | "expired" | "unsupported"; message: string };

export interface AiConnectionAuthProps {
  provider: AiProvider;
  method: AiAuthMethod;
  state: AiAuthState;
  onStart: () => void;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  onDone: () => void;
}

/** No provider calls or polling here: live hosts keep the existing login controllers. */
export function AiConnectionAuth(props: AiConnectionAuthProps) {
  // Remount private input state when the provider, method, or attempt changes phase.
  return (
    <AuthAttempt
      key={`${props.provider}:${props.method}:${props.state.phase}`}
      {...props}
    />
  );
}

function AuthAttempt({
  provider,
  method,
  state,
  onStart,
  onSubmit,
  onCancel,
  onDone,
}: AiConnectionAuthProps) {
  const [value, setValue] = useState("");
  const { t } = useTranslation();
  const info = AI_PROVIDERS[provider];
  const busy = state.phase === "starting" || state.phase === "submitting";
  const unsupported =
    state.phase === "unsupported" ||
    (method === "subscription" && !info.subscriptionName);
  const submit = () => {
    if (!value.trim() || busy) return;
    const submitted = value.trim();
    setValue("");
    onSubmit(submitted);
  };
  const methodLabel = method === "subscription"
    ? provider === "openai" ? t("onboarding.connection.chatgptSubscription")
      : provider === "anthropic" ? t("onboarding.connection.claudeSubscription")
        : provider === "google" ? t("onboarding.connection.googleAntigravity")
          : provider === "xai" ? t("onboarding.connection.grokSubscription")
            : t("onboarding.connection.subscriptionUnavailable")
    : provider === "github" ? t("onboarding.connection.personalToken") : t("onboarding.connection.apiKeyMethod");
  return (
    <section
      aria-label={t("onboarding.connection.connectProvider", { provider: info.name })}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">{t("onboarding.connection.connectProvider", { provider: info.name })}</h3>
        <p className="text-xs text-muted-foreground">
          {methodLabel}
        </p>
      </div>
      {state.phase === "connected" ? (
        <>
          <p role="status" className="text-sm">
            {t("onboarding.connection.accountConnected")}
          </p>
          <Button onClick={onDone}>{t("onboarding.connection.useConnection")}</Button>
        </>
      ) : (
        <>
          {unsupported ? (
            <p role="status" className="text-sm text-muted-foreground">
              {state.phase === "unsupported"
                ? state.message
                : t("onboarding.connection.noSubscriptionConnection")}
            </p>
          ) : (
            <>
              {(state.phase === "error" || state.phase === "expired") && (
                <p role="alert" className="text-sm text-destructive">
                  {state.message}
                </p>
              )}
              {state.phase === "cancelled" && (
                <p role="status" className="text-sm text-muted-foreground">
                  {t("onboarding.connection.signInCancelled")}
                </p>
              )}
              {method === "api_key" ? (
                <ProviderApiKeyCard
                  providerName={info.name}
                  value={value}
                  onChange={setValue}
                  onSubmit={submit}
                  placeholder={t("onboarding.connection.enterApiKey")}
                  disabled={busy}
                  autoFocus
                />
              ) : busy ? (
                <ProviderSubscriptionCard
                  providerName={info.name}
                  mode={
                    provider === "anthropic"
                      ? "submitted_code"
                      : "displayed_code"
                  }
                  loading
                >
                  <span />
                </ProviderSubscriptionCard>
              ) : state.phase === "waiting" ? (
                <ProviderSubscriptionCard
                  providerName={info.name}
                  authorizationUrl={state.authorizationUrl}
                  mode={
                    provider === "anthropic"
                      ? "submitted_code"
                      : "displayed_code"
                  }
                >
                  {provider === "anthropic" ? (
                    <OnboardingCardField
                      value={value}
                      onChange={setValue}
                      onSubmit={submit}
                    />
                  ) : (
                    <OnboardingLoginCodeRow code={state.code ?? ""} />
                  )}
                </ProviderSubscriptionCard>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("onboarding.connection.signInWithSubscription", { subscription: methodLabel })}
                </p>
              )}
            </>
          )}
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setValue("");
                onCancel();
              }}
            >
              {t("common.cancel")}
            </Button>
            {!unsupported &&
              (method === "api_key" ? (
                <Button disabled={busy || !value.trim()} onClick={submit}>
                  {busy ? t("onboarding.connection.connecting") : t("onboarding.connection.connect")}
                </Button>
              ) : state.phase === "waiting" ? (
                provider === "anthropic" ? (
                  <Button disabled={!value.trim()} onClick={submit}>
                    {t("onboarding.connection.submitCode")}
                  </Button>
                ) : (
                  <span role="status" className="text-sm text-muted-foreground">
                    {t("onboarding.connection.waitingSignIn")}
                  </span>
                )
              ) : (
                <Button disabled={busy} onClick={onStart}>
                  {busy
                    ? t("onboarding.connection.preparingSignIn")
                    : state.phase === "idle"
                      ? t("onboarding.connection.signIn")
                      : t("onboarding.connection.tryAgain")}
                </Button>
              ))}
          </div>
        </>
      )}
    </section>
  );
}
