import { formatDateTime } from "./utils";

type RetryAwareRun = {
  status: string;
  retryOfRunId?: string | null;
  scheduledRetryAt?: string | Date | null;
  scheduledRetryAttempt?: number | null;
  scheduledRetryReason?: string | null;
  retryExhaustedReason?: string | null;
};

export type RunRetryStateSummary = {
  kind: "scheduled" | "exhausted" | "attempted";
  badgeLabel: string;
  tone: string;
  detail: string | null;
  secondary: string | null;
  retryOfRunId: string | null;
};

const RETRY_REASON_LABELS: Record<string, string> = {
  native_provider_overloaded: "Model at capacity",
  ai_connection_pool_wait: "Waiting for pool usage to recover",
  transient_failure: "Transient failure",
  missing_issue_comment: "Missing task comment",
  process_lost: "Process lost",
  assignment_recovery: "Assignment recovery",
  issue_continuation_needed: "Continuation needed",
  max_turns_continuation: "Max-turn continuation",
};

const RETRY_REASON_KEYS: Record<string, string> = {
  native_provider_overloaded: "nativeProviderOverloaded",
  ai_connection_pool_wait: "aiConnectionPoolWait",
  transient_failure: "transientFailure",
  missing_issue_comment: "missingTaskComment",
  process_lost: "processLost",
  assignment_recovery: "assignmentRecovery",
  issue_continuation_needed: "continuationNeeded",
  max_turns_continuation: "maxTurnContinuation",
};

type RetryTranslator = (key: string, options?: Record<string, unknown>) => string;

function readNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function joinFragments(parts: Array<string | null>) {
  const filtered = parts.filter((part): part is string => Boolean(part));
  return filtered.length > 0 ? filtered.join(" · ") : null;
}

export function formatRetryReason(reason: string | null | undefined, translate?: RetryTranslator) {
  const normalized = readNonEmptyString(reason);
  if (!normalized) return null;
  const fallback = RETRY_REASON_LABELS[normalized] ?? normalized.replace(/_/g, " ");
  const key = RETRY_REASON_KEYS[normalized];
  return key && translate
    ? translate(`agentDetail.run.retryState.reasons.${key}`, { defaultValue: fallback })
    : fallback;
}

export function describeRunRetryState(run: RetryAwareRun, translate?: RetryTranslator): RunRetryStateSummary | null {
  const attempt =
    typeof run.scheduledRetryAttempt === "number" && Number.isFinite(run.scheduledRetryAttempt) && run.scheduledRetryAttempt > 0
      ? run.scheduledRetryAttempt
      : null;
  const attemptLabel = attempt
    ? translate ? translate("agentDetail.run.retryState.attempt", { count: attempt, defaultValue: `Attempt ${attempt}` }) : `Attempt ${attempt}`
    : null;
  const reasonLabel = formatRetryReason(run.scheduledRetryReason, translate);
  const retryOfRunId = readNonEmptyString(run.retryOfRunId);
  const exhaustedReason = readNonEmptyString(run.retryExhaustedReason);
  const dueAt = run.scheduledRetryAt ? formatDateTime(run.scheduledRetryAt) : null;
  const isMaxTurnContinuation = run.scheduledRetryReason === "max_turns_continuation";
  const hasRetryMetadata =
    Boolean(retryOfRunId)
    || Boolean(reasonLabel)
    || Boolean(dueAt)
    || Boolean(attemptLabel)
    || Boolean(exhaustedReason);

  if (!hasRetryMetadata) return null;

  if (run.status === "scheduled_retry") {
    return {
      kind: "scheduled",
      badgeLabel: run.scheduledRetryReason === "ai_connection_pool_wait"
        ? translate ? translate("agentDetail.run.retryState.poolExhausted", { defaultValue: "Pool exhausted" }) : "Pool exhausted"
        : isMaxTurnContinuation
          ? translate ? translate("agentDetail.run.retryState.continuationScheduled", { defaultValue: "Continuation scheduled" }) : "Continuation scheduled"
          : translate ? translate("agentDetail.run.retryState.retryScheduled", { defaultValue: "Retry scheduled" }) : "Retry scheduled",
      tone: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
      detail: joinFragments([attemptLabel, reasonLabel]),
      secondary: dueAt
        ? `${isMaxTurnContinuation
          ? translate ? translate("agentDetail.run.retryState.nextContinuation", { defaultValue: "Next continuation" }) : "Next continuation"
          : translate ? translate("agentDetail.run.retryState.nextRetry", { defaultValue: "Next retry" }) : "Next retry"} ${dueAt}`
        : `${isMaxTurnContinuation
          ? translate ? translate("agentDetail.run.retryState.nextContinuation", { defaultValue: "Next continuation" }) : "Next continuation"
          : translate ? translate("agentDetail.run.retryState.nextRetry", { defaultValue: "Next retry" }) : "Next retry"} ${translate ? translate("agentDetail.run.retryState.pendingSchedule", { defaultValue: "pending schedule" }) : "pending schedule"}`,
      retryOfRunId,
    };
  }

  if (exhaustedReason) {
    return {
      kind: "exhausted",
      badgeLabel: isMaxTurnContinuation
        ? translate ? translate("agentDetail.run.retryState.continuationExhausted", { defaultValue: "Continuation exhausted" }) : "Continuation exhausted"
        : translate ? translate("agentDetail.run.retryState.retryExhausted", { defaultValue: "Retry exhausted" }) : "Retry exhausted",
      tone: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      detail: joinFragments([attemptLabel, reasonLabel, translate ? translate("agentDetail.run.retryState.automaticRetriesExhausted", { defaultValue: "Automatic retries exhausted" }) : "Automatic retries exhausted"]),
      secondary: exhaustedReason.includes("Manual intervention required")
        ? exhaustedReason
        : `${exhaustedReason} ${translate ? translate("agentDetail.run.retryState.manualInterventionRequired", { defaultValue: "Manual intervention required." }) : "Manual intervention required."}`,
      retryOfRunId,
    };
  }

  return {
    kind: "attempted",
    badgeLabel: isMaxTurnContinuation
      ? translate ? translate("agentDetail.run.retryState.continuedRun", { defaultValue: "Continued run" }) : "Continued run"
      : translate ? translate("agentDetail.run.retryState.retriedRun", { defaultValue: "Retried run" }) : "Retried run",
    tone: "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    detail: joinFragments([attemptLabel, reasonLabel]),
    secondary: null,
    retryOfRunId,
  };
}
