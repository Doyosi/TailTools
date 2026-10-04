// Cancels scheduled DOM work and settles animation promises during teardown.
export class Lifecycle {
  timers = new Set();
  frames = new Set();
  pending = new Set();
  canceled = false;

  timeout(callback, delay) {
    if (this.canceled) return;
    const id = setTimeout(() => { this.timers.delete(id); callback(); }, delay);
    this.timers.add(id);
    return id;
  }
  frame(callback) {
    if (this.canceled) return;
    const id = requestAnimationFrame(() => { this.frames.delete(id); callback(); });
    this.frames.add(id);
    return id;
  }
  settle(resolve) {
    if (this.canceled) { resolve(); return () => {}; }
    const finish = value => { this.pending.delete(finish); resolve(value); };
    this.pending.add(finish);
    return finish;
  }
  cancel() {
    this.canceled = true;
    this.timers.forEach(clearTimeout);
    this.frames.forEach(cancelAnimationFrame);
    this.timers.clear();
    this.frames.clear();
    [...this.pending].forEach(resolve => resolve());
  }
}
