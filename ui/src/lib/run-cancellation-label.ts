export type RunCancellationLabels = {
  stoppingPaperclipWork: string;
  stopPaperclipWork: string;
  stopping: string;
  stop: string;
  cancelling: string;
  cancel: string;
};

const DEFAULT_LABELS: RunCancellationLabels = {
  stoppingPaperclipWork: "Stopping Paperclip work…",
  stopPaperclipWork: "Stop Paperclip work",
  stopping: "Stopping…",
  stop: "Stop",
  cancelling: "Cancelling…",
  cancel: "Cancel",
};

export function runCancellationLabel(input: {
  grokWork?: boolean;
  isFailed: boolean;
  isPending: boolean;
  labels?: Partial<RunCancellationLabels>;
}): string {
  const labels = { ...DEFAULT_LABELS, ...input.labels };
  if (input.grokWork) return input.isPending ? labels.stoppingPaperclipWork : labels.stopPaperclipWork;
  if (input.isFailed) return input.isPending ? labels.stopping : labels.stop;
  return input.isPending ? labels.cancelling : labels.cancel;
}
