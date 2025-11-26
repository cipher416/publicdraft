import type { PresenceSummary } from "./types";

export type Status =
  | "connected"
  | "connecting"
  | "blocked"
  | "disconnected"
  | string
  | undefined;

export interface CollabHeaderState {
  title?: string;
  status?: Status;
  users: PresenceSummary[];
}

type Listener = (state: CollabHeaderState) => void;

const initialState: CollabHeaderState = {
  title: undefined,
  status: undefined,
  users: [],
};

let state: CollabHeaderState = initialState;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener(state));
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return state;
}

export function setHeaderState(partial: Partial<CollabHeaderState>) {
  const next = {
    ...state,
    ...partial,
  } satisfies CollabHeaderState;

  if (
    next.title === state.title &&
    next.status === state.status &&
    next.users === state.users
  ) {
    return;
  }

  state = next;
  notify();
}

export function resetHeaderState() {
  state = initialState;
  notify();
}
