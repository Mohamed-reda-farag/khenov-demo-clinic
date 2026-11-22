import { useEffect, useRef, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { NAV_ITEMS } from './nav';

/**
 * Keeps the document title in step with the screen, announces each navigation to screen readers
 * (through `announcerRef`, a polite live region) and moves focus to the main area, like a page load.
 */
export function useRouteAnnouncement(
  mainRef: RefObject<HTMLElement | null>,
  announcerRef: RefObject<HTMLElement | null>,
): void {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const item = NAV_ITEMS.find((i) => pathname === i.path || pathname.startsWith(`${i.path}/`));
  const title = item ? t(item.labelKey) : t('app.name');
  const firstRoute = useRef(true);

  useEffect(() => {
    document.title = `${title} · ${t('app.name')}`;
  }, [title, t]);

  useEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false;
      return;
    }
    if (announcerRef.current) announcerRef.current.textContent = title;
    mainRef.current?.focus({ preventScroll: true });
    // Only a real navigation (not a language change) moves focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
}
