/**
 * A Worker ticking every 1 s for `use-focus-timer`. In an inactive tab the main-thread
 * timer is throttled (Edge: throttling / Sleeping Tabs); the Worker's tick wakes up
 * unhindered, so `document.title` and the counter update in the background too. The
 * counter value is computed from the timestamp on the main side, so the tick itself only
 * "wakes" — even if it drops a second, the result always snaps correctly.
 *
 * `self` shadowed with a local type, to decouple from libs (no WebWorker
 * in tsconfig). Terminated by the main thread (`worker.terminate()`) on pause.
 */
declare const self: {
  setInterval: (handler: () => void, timeout?: number) => number;
  postMessage: (message: unknown) => void;
};

self.setInterval(() => self.postMessage('tick'), 1000);

export {};
