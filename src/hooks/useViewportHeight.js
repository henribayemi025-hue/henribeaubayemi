import { useEffect } from 'react';

// Keeps the CSS var --app-height in sync with the *visible* viewport height.
// On iOS Safari the on-screen keyboard shrinks window.visualViewport but NOT
// 100dvh, which is why the shell used to get scrolled up (nav floating over the
// keyboard). Driving the shell height from visualViewport keeps it fixed.
export function useViewportHeight() {
  useEffect(() => {
    const vv = window.visualViewport;
    const apply = () => {
      const h = vv ? vv.height : window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${Math.round(h)}px`);
    };
    apply();
    if (vv) {
      vv.addEventListener('resize', apply);
      vv.addEventListener('scroll', apply);
    }
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
    return () => {
      if (vv) {
        vv.removeEventListener('resize', apply);
        vv.removeEventListener('scroll', apply);
      }
      window.removeEventListener('resize', apply);
      window.removeEventListener('orientationchange', apply);
    };
  }, []);
}
