/**
 * Navigation module.
 *
 * Handles keyboard shortcuts, click-to-advance, and touch/swipe gestures.
 */

export interface NavigationCallbacks {
  /** Go to the next slide. */
  next: () => void;
  /** Go to the previous slide. */
  prev: () => void;
  /** Toggle fullscreen mode. */
  toggleFullscreen: () => void;
  /** Toggle overview / slide-grid mode. */
  toggleOverview: () => void;
}

export interface NavigationCleanup {
  /** Remove all event listeners. */
  destroy: () => void;
}

/**
 * Bind keyboard, click, and touch navigation to the given container.
 * Returns a cleanup handle.
 */
export function setupNavigation(
  container: HTMLElement,
  callbacks: NavigationCallbacks,
): NavigationCleanup {
  /* ---- keyboard ---- */
  const onKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowRight":
      case " ":
      case "PageDown":
        e.preventDefault();
        callbacks.next();
        break;
      case "ArrowLeft":
      case "PageUp":
        e.preventDefault();
        callbacks.prev();
        break;
      case "ArrowDown":
        e.preventDefault();
        callbacks.next();
        break;
      case "ArrowUp":
        e.preventDefault();
        callbacks.prev();
        break;
      case "f":
        e.preventDefault();
        callbacks.toggleFullscreen();
        break;
      case "o":
        e.preventDefault();
        callbacks.toggleOverview();
        break;
      default:
        break;
    }
  };
  document.addEventListener("keydown", onKeyDown);

  /* ---- click ---- */
  const onClick = (e: MouseEvent) => {
    // Ignore clicks on links or buttons
    const target = e.target as HTMLElement;
    if (target.closest("a, button, input, textarea, select")) return;
    callbacks.next();
  };
  container.addEventListener("click", onClick);

  /* ---- touch / swipe ---- */
  let touchStartX = 0;
  let touchStartY = 0;
  const SWIPE_THRESHOLD = 50; // minimum px to count as a swipe

  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  };

  const onTouchEnd = (e: TouchEvent) => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    // Only fire if horizontal swipe is dominant
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx < 0) {
        callbacks.next();
      } else {
        callbacks.prev();
      }
    }
  };

  container.addEventListener("touchstart", onTouchStart, { passive: true });
  container.addEventListener("touchend", onTouchEnd, { passive: true });

  /* ---- cleanup ---- */
  return {
    destroy() {
      document.removeEventListener("keydown", onKeyDown);
      container.removeEventListener("click", onClick);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchend", onTouchEnd);
    },
  };
}
