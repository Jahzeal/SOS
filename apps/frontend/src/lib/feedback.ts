// Small in-app replacement for the browser's alert() and confirm() pop-ups.
// The UI lives in components/ui/FeedbackHost.tsx; this file is the store so it
// can be used from anywhere (including lib/api.ts) without importing React.

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

export interface ConfirmRequest {
  id: number;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  resolve: (ok: boolean) => void;
}

interface FeedbackState {
  toasts: Toast[];
  confirm: ConfirmRequest | null;
}

let state: FeedbackState = { toasts: [], confirm: null };
let nextId = 1;
const listeners = new Set<() => void>();

function setState(next: FeedbackState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export function subscribeFeedback(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getFeedbackState() {
  return state;
}

const ERROR_WORDS = /fail|error|unable|could not|couldn't|cannot|can't|invalid|denied|expired|not found|wrong/i;

/** Shows a short message. The style is picked from the wording unless given. */
export function notify(message: unknown, kind?: ToastKind) {
  const text = String(message ?? '').trim();
  if (!text) return;
  const id = nextId++;
  const resolvedKind: ToastKind = kind || (ERROR_WORDS.test(text) ? 'error' : 'success');
  setState({ ...state, toasts: [...state.toasts.slice(-3), { id, message: text, kind: resolvedKind }] });
  if (typeof window !== 'undefined') {
    window.setTimeout(() => dismissToast(id), resolvedKind === 'error' ? 7000 : 4500);
  }
}

export function dismissToast(id: number) {
  if (!state.toasts.some((t) => t.id === id)) return;
  setState({ ...state, toasts: state.toasts.filter((t) => t.id !== id) });
}

/** Asks the user to confirm. Resolves true for confirm, false for cancel. */
export function confirmDialog(
  message: string,
  options: { confirmLabel?: string; cancelLabel?: string } = {},
): Promise<boolean> {
  return new Promise((resolve) => {
    // Only one question at a time: a pending one is treated as cancelled.
    state.confirm?.resolve(false);
    setState({
      ...state,
      confirm: {
        id: nextId++,
        message,
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
        resolve,
      },
    });
  });
}

export function answerConfirm(ok: boolean) {
  const pending = state.confirm;
  if (!pending) return;
  setState({ ...state, confirm: null });
  pending.resolve(ok);
}
