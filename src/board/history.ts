// Undo history (R33).
//
// A stack of earlier board states, kept by the browser store — not the kernel,
// which stays a pure reducer. Three things make a "step" feel right:
//   - a gesture (the burst of moves in one drag) is one step, not forty;
//   - consecutive edits to the same line (typing a headline) coalesce;
//   - a change that arrived from an agent through the bridge is a step too,
//     so the person can take back what the agent did.
// Pure and generic so it can be tested without a browser.

export class History<S> {
  private past: S[] = [];
  private future: S[] = [];
  private lastKey: string | null = null;
  private gestureStart: S | null = null;
  private gestureTouched = false;
  private readonly cap: number;

  constructor(cap = 100) {
    this.cap = cap;
  }

  get canUndo(): boolean {
    return this.past.length > 0 || (this.gestureStart !== null && this.gestureTouched);
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  get depth(): number {
    return this.past.length;
  }

  /**
   * `before` is about to be replaced. Consecutive records with the same
   * non-null `key` merge into one step, keeping the earliest `before`.
   */
  record(before: S, key: string | null = null): void {
    this.endGesture();
    if (key !== null && key === this.lastKey && this.past.length > 0) {
      this.future = [];
      return;
    }
    this.past.push(before);
    if (this.past.length > this.cap) this.past.shift();
    this.future = [];
    this.lastKey = key;
  }

  /** A drag has started from `before`; moves until endGesture are one step. */
  beginGesture(before: S): void {
    if (this.gestureStart === null) {
      this.gestureStart = before;
      this.gestureTouched = false;
    }
  }

  /** Something changed during the gesture, so it will be worth a step. */
  touchGesture(): void {
    if (this.gestureStart !== null) this.gestureTouched = true;
  }

  endGesture(): void {
    const start = this.gestureStart;
    const touched = this.gestureTouched;
    this.gestureStart = null;
    this.gestureTouched = false;
    if (start !== null && touched) {
      this.past.push(start);
      if (this.past.length > this.cap) this.past.shift();
      this.future = [];
      this.lastKey = null;
    }
  }

  /** The state to go back to, or null. `current` becomes redo-able. */
  undo(current: S): S | null {
    this.endGesture();
    const previous = this.past.pop();
    if (previous === undefined) return null;
    this.future.push(current);
    this.lastKey = null;
    return previous;
  }

  /** The state to go forward to, or null. */
  redo(current: S): S | null {
    this.endGesture();
    const next = this.future.pop();
    if (next === undefined) return null;
    this.past.push(current);
    this.lastKey = null;
    return next;
  }
}
