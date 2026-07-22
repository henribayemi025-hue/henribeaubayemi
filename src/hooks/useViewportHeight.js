import { useEffect } from 'react';

// Keeps the app shell locked to the *visible* viewport on iOS Safari.
//
// Two CSS vars are published on <html>:
//   --app-height : the height available above the on-screen keyboard
//   --app-top    : how far the visual viewport has been scrolled down
//
// The second one is the piece that was missing: when the keyboard opens iOS
// doesn't just shrink window.visualViewport, it also SCROLLS it (offsetTop > 0).
// A `position: fixed; top: 0` shell is anchored to the layout viewport, so it
// gets left behind — the header slides off the top and the input ends up
// floating with a big gap above the keyboard. Re-pinning the shell to
// offsetTop (via --app-top) makes it track the visible area exactly.
export function useViewportHeight() {
  useEffect(() => {
    const vv = window.visualViewport;
    const root = document.documentElement;
    let raf = 0;
    const apply = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = vv ? vv.height : window.innerHeight;
        const top = vv ? vv.offsetTop : 0;
        root.style.setProperty('--app-height', `${Math.round(h)}px`);
        root.style.setProperty('--app-top', `${Math.round(top)}px`);
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
