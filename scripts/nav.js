// Shared navigation — injected into every page at runtime.
// Reads window.location.pathname to mark the current page.
(function () {
  const NAV_ITEMS = [
    { label: 'Home',          href: '/'               },
    { label: 'Menu',          href: '/menu.html'      },
    { label: 'Location',      href: '/#live-location' },
    { label: 'Loyalty',       href: '/loyalty.html'   },
    { label: 'Vendor Portal', href: '/vendor.html'    },
    { label: 'Dashboard',     href: '/dashboard.html' },
  ];

  const path = window.location.pathname;

  function isCurrent(href) {
    if (href.includes('#')) return false;
    if (href === '/') return path === '/' || path === '/index.html';
    return path === href || path === href.slice(0, -5); // strip .html
  }

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Main navigation');

  nav.innerHTML = NAV_ITEMS.map(item => {
    const current = isCurrent(item.href);
    return `<a href="${item.href}"${current ? ' aria-current="page"' : ''}>${item.label}</a>`;
  }).join('');

  document.body.appendChild(nav);
})();
