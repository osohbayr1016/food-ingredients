"use client";

import { useCallback, useEffect, useReducer, useState } from "react";

export type BubbleTimerState = {
  id: string;
  label: string;
  endsAt: number;
};

type Action =
  | { type: "upsert"; id: string; label: string; seconds: number }
  | { type: "clear"; id: string }
  | { type: "bootstrap"; timers: BubbleTimerState[] };

function reducer(state: BubbleTimerState[], action: Action) {
  if (action.type === "bootstrap") return action.timers;
  if (action.type === "clear") return state.filter((t) => t.id !== action.id);
  if (action.type === "upsert") {
    const next = state.filter((t) => t.id !== action.id);
    const endsAt = Date.now() + Math.max(1, action.seconds) * 1000;
    return [...next, { id: action.id, label: action.label, endsAt }];
  }
  return state;
}

export function useBubbleTimers() {
  const [timers, dispatch] = useReducer(reducer, []);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPulse((n) => n + 1), 250);
    return () => clearInterval(id);
  }, []);

  const upsert = useCallback((opts: { id: string; label: string; seconds: number }) => {
    dispatch({ type: "upsert", ...opts });
  }, []);

  const clear = useCallback((id: string) => dispatch({ type: "clear", id }), []);

  const bootstrap = useCallback((next: BubbleTimerState[]) =>
    dispatch({ type: "bootstrap", timers: next }), []);

  const remaining = useCallback((t: BubbleTimerState) =>
    Math.max(0, Math.ceil((t.endsAt - Date.now()) / 1000)), [pulse]);

  const formatMmSs = useCallback((secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, []);

  return { timers, upsert, clear, bootstrap, remaining, formatMmSs, pulse };
}
