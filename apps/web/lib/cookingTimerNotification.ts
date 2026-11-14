export type TimedAlert = { id: string; endsAt: number };

/**
 * Alert once per timer run. Restarting the same step produces a new endsAt,
 * so the new completion can vibrate again without duplicates every second.
 */
export function shouldNotifyTimer(
  timer: TimedAlert,
  notified: Map<string, number>,
  now: number = Date.now(),
): boolean {
  if (!timer.id || !Number.isFinite(timer.endsAt) || timer.endsAt > now) return false;
  if (notified.get(timer.id) === timer.endsAt) return false;
  notified.set(timer.id, timer.endsAt);
  return true;
}
