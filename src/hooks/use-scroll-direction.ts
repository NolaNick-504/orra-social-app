'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Detects scroll direction (up/down) and whether the UI nav should be hidden.
 * Mimics Instagram/TikTok behavior:
 * - Scrolling DOWN hides the nav bars
 * - Scrolling UP reveals them
 * - At the very top of the page, nav is always visible
 * - Small scroll movements are ignored (dead zone) to prevent jitter
 */
export function useScrollDirection(threshold = 10) {
  const [hidden, setHidden] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;

        // At the very top — always show nav
        if (scrollY <= 0) {
          setHidden(false);
          setAtTop(true);
          lastScrollY.current = scrollY;
          ticking.current = false;
          return;
        }

        setAtTop(false);

        const delta = scrollY - lastScrollY.current;

        // Ignore tiny scroll movements (dead zone)
        if (Math.abs(delta) < threshold) {
          ticking.current = false;
          return;
        }

        if (delta > 0 && scrollY > 50) {
          // Scrolling DOWN past 50px — hide nav
          setHidden(true);
        } else {
          // Scrolling UP — show nav
          setHidden(false);
        }

        lastScrollY.current = scrollY;
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll, { passive: true });
  }, [threshold]);

  return { hidden, atTop };
}
