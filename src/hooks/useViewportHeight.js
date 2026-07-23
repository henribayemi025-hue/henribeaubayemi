import { useEffect } from 'react';

// Keyboard-aware layout for iOS Safari — the *non-fighting* approach.
//
// Earlier we shrank/re-pinned the shell to window.visualViewport (height +
// offsetTop). The problem: chasing offsetTop fights iOS's own "scroll the
// focused input into view", so the view oscillates (jumps up, snaps back).
//
// Instead we keep the shell perfectly still (fixed, full height) and publish
// the on-screen keyboard's height as --kb. The shell adds that as padding at
// the bottom, which lifts the message input above the keyboard. Because the
// input is then already visible, iOS has no reason to scroll → no fight.
//
//   --kb         : height of the on-screen keyboard (0 when closed)
//   --app-height : visible height above the keyboard (used by bottom sheets)
export function useViewportHeight() {
  useEffect(() => {
    const vv = window.visualViewport;
    const root = document.documentElement;
    let raf = 0;
    const apply = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const visible = vv ? vv.height : window.innerHeight;
        const offset = vv ? vv.offsetTop : 0;
        // Layout height minus what's visible = space the keyboard covers.
        const kb = Math.max(0, Math.round(window.innerHeight - visible - offset));
        root.style.setProperty('--kb', `${kb}px`);
        root.style.setProperty('--app-height', `${Math.round(visible)}px`);
      });
    };
    apply();
    if (vv) {
      vv.addEventListener('resize', apply);
      vv.addEventListener('scroll', apply);
    }
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
    return () => {
      cancelAnimationFrame(raf);
      if (vv) {
        vv.removeEventListener('resize', apply);
        vv.removeEventListener('scroll', apply);
      }
      window.removeEventListener('resize', apply);
      window.removeEventListener('orientationchange', apply);
    };
  }, []);
}
