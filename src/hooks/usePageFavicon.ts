import { useEffect } from 'react';

/**
 * Temporarily swaps the document favicon while a page is mounted, restoring
 * whatever favicon (if any) was set before. Local Grindz doesn't ship a
 * site-wide favicon yet, so most pages restore to "none" on unmount.
 */
export function usePageFavicon(href: string) {
  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const existed = !!link;
    const prevHref = link?.getAttribute('href') ?? null;

    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.setAttribute('type', 'image/png');
    link.setAttribute('href', href);

    return () => {
      if (!link) return;
      if (existed && prevHref) {
        link.setAttribute('href', prevHref);
      } else {
        link.remove();
      }
    };
  }, [href]);
}
