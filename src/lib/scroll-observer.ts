/**
 * One passive scroll listener for the whole page.
 *
 * Before this, six components each registered their own `scroll` handler with
 * its own requestAnimationFrame gate, so a single flick of the thumb woke six
 * callbacks and scheduled up to six frame callbacks. Now there is exactly one
 * listener and one rAF per frame: subscribers are fanned out inside that frame
 * with the scroll position already measured, which also means no subscriber can
 * trigger a layout read/write interleave against another.
 *
 * Subscribers are called once immediately so they can paint their initial state
 * without duplicating the measurement themselves.
 */

type ScrollSubscriber = (scrollY: number) => void;

const subscribers = new Set<ScrollSubscriber>();
let frame = 0;
let listening = false;

function flush() {
  frame = 0;
  const y = window.scrollY;
  for (const subscriber of subscribers) subscriber(y);
}

function schedule() {
  if (frame) return;
  frame = window.requestAnimationFrame(flush);
}

/**
 * Subscribe to rAF-coalesced scroll (and resize) updates.
 * Returns an unsubscribe function; the shared listener is removed automatically
 * once the last subscriber leaves.
 */
export function onScrollFrame(subscriber: ScrollSubscriber): () => void {
  subscribers.add(subscriber);

  if (!listening && typeof window !== "undefined") {
    listening = true;
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
  }

  if (typeof window !== "undefined") subscriber(window.scrollY);

  return () => {
    subscribers.delete(subscriber);
    if (subscribers.size === 0 && listening) {
      listening = false;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
    }
  };
}
