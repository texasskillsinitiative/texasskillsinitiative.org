(() => {
  const HOME_REPLAY_URL = 'index.html?home=00#overview';
  const root = document.documentElement;
  const themeToggle = document.querySelector('[data-utility-theme-toggle]');
  const homeLinks = document.querySelectorAll('[data-utility-home-link]');
  const defaultThemeAttr = String(root.getAttribute('data-default-theme') || '').trim().toLowerCase();
  const defaultTheme = (defaultThemeAttr === 'light' || defaultThemeAttr === 'dark') ? defaultThemeAttr : 'dark';
  const themeStorageKey = String(root.getAttribute('data-theme-storage-key') || 'tsi-theme').trim() || 'tsi-theme';

  const fallbackLabels = {
    career_opportunities: { full: 'Career Opportunities', footer: 'Career', href: 'portal-hub.html' },
    job_listings: { full: 'Job Listings', href: 'portal-employment.html' },
    internship_application: { full: 'Internship Application', href: 'portal-internship.html' },
    investment_inquiry: { full: 'Investment Inquiry', footer: 'Investment', href: 'portal-investment.html' },
    public_relations_media_request: { full: 'Public Relations/Media Request', footer: 'PR', href: 'portal-press.html' },
    legal_desk: { full: 'Legal Desk', href: 'legal-hub.html' },
    privacy_policy: { full: 'Privacy Policy', footer: 'Privacy', href: 'privacy.html' },
    terms_of_use: { full: 'Terms of Use', footer: 'Terms', href: 'terms.html' },
    accessibility_statement: { full: 'Accessibility Statement', footer: 'Accessibility', href: 'accessibility.html' },
    security_statement: { full: 'Security Statement', footer: 'Security', href: 'security.html' }
  };

  const labelStore = (window.TSI_SITE_LABELS && window.TSI_SITE_LABELS.labels) || fallbackLabels;
  const getLabel = (key, variant = 'full') => {
    const row = labelStore[key];
    if (!row) return '';
    return String(row[variant] || row.full || '').trim();
  };
  const getHref = (key) => {
    const row = labelStore[key];
    return row ? String(row.href || '').trim() : '';
  };

  const logoMenuLinks = [
    'career_opportunities',
    'investment_inquiry',
    'public_relations_media_request',
    'legal_desk'
  ].map((key) => ({ key, href: getHref(key), label: getLabel(key) })).filter((entry) => entry.href && entry.label);

  const logoSubpagesByKey = {
    career_opportunities: ['job_listings', 'internship_application'],
    legal_desk: ['privacy_policy', 'terms_of_use', 'accessibility_statement', 'security_statement']
  };

  const crumbSubpagesByHref = {
    'portal-hub.html': ['job_listings', 'internship_application'],
    'legal-hub.html': ['privacy_policy', 'terms_of_use', 'accessibility_statement', 'security_statement']
  };

  const normalizeLabelNodes = () => {
    const nodes = document.querySelectorAll('[data-tsi-label-key]');
    nodes.forEach((node) => {
      const key = String(node.getAttribute('data-tsi-label-key') || '').trim();
      if (!key) return;
      const variant = String(node.getAttribute('data-tsi-label-variant') || 'full').trim();
      const nextText = getLabel(key, variant);
      if (nextText) node.textContent = nextText;
    });

    const linkNodes = document.querySelectorAll('[data-tsi-href-key]');
    linkNodes.forEach((node) => {
      if (!(node instanceof HTMLAnchorElement)) return;
      const key = String(node.getAttribute('data-tsi-href-key') || '').trim();
      if (!key) return;
      const href = getHref(key);
      if (href) node.href = href;
    });
  };

  const wireHoverPersistence = (wrap) => {
    if (!(wrap instanceof HTMLElement)) return;
    let closeTimer = 0;
    const open = () => {
      if (closeTimer) window.clearTimeout(closeTimer);
      closeTimer = 0;
      wrap.classList.add('is-open');
    };
    const scheduleClose = () => {
      if (closeTimer) window.clearTimeout(closeTimer);
      closeTimer = window.setTimeout(() => {
        wrap.classList.remove('is-open');
        closeTimer = 0;
      }, 220);
    };
    wrap.addEventListener('mouseenter', open);
    wrap.addEventListener('mouseleave', scheduleClose);
    wrap.addEventListener('focusin', open);
    wrap.addEventListener('focusout', () => {
      window.setTimeout(() => {
        if (wrap.contains(document.activeElement)) return;
        wrap.classList.remove('is-open');
      }, 0);
    });
  };

  normalizeLabelNodes();

  homeLinks.forEach((link) => {
    if (!(link instanceof HTMLAnchorElement)) return;
    link.setAttribute('href', HOME_REPLAY_URL);
  });

  const brandLinks = document.querySelectorAll('.tsi-utility-brand');
  brandLinks.forEach((brandLink) => {
    if (!(brandLink instanceof HTMLAnchorElement)) return;
    if (brandLink.closest('.tsi-utility-brand-wrap')) return;
    const parent = brandLink.parentNode;
    if (!parent) return;

    const wrap = document.createElement('div');
    wrap.className = 'tsi-utility-brand-wrap';
    parent.insertBefore(wrap, brandLink);
    wrap.appendChild(brandLink);

    const menu = document.createElement('div');
    menu.className = 'tsi-brand-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Site locations');

    logoMenuLinks.forEach((entry) => {
      const submenuKeys = logoSubpagesByKey[entry.key];
      const submenuEntries = Array.isArray(submenuKeys)
        ? submenuKeys.map((key) => ({ href: getHref(key), label: getLabel(key) })).filter((item) => item.href && item.label)
        : [];

      if (!submenuEntries.length) {
        const link = document.createElement('a');
        link.className = 'tsi-brand-menu__link';
        link.href = entry.href;
        link.textContent = entry.label;
        link.setAttribute('role', 'menuitem');
        menu.appendChild(link);
        return;
      }

      const itemWrap = document.createElement('div');
      itemWrap.className = 'tsi-brand-menu__item';

      const link = document.createElement('a');
      link.className = 'tsi-brand-menu__link has-submenu';
      link.href = entry.href;
      link.textContent = entry.label;
      link.setAttribute('role', 'menuitem');
      itemWrap.appendChild(link);

      const subMenu = document.createElement('div');
      subMenu.className = 'tsi-brand-submenu';
      subMenu.setAttribute('role', 'menu');
      subMenu.setAttribute('aria-label', `${entry.label} links`);

      submenuEntries.forEach((subEntry) => {
        const subLink = document.createElement('a');
        subLink.className = 'tsi-brand-submenu__link';
        subLink.href = subEntry.href;
        subLink.textContent = subEntry.label;
        subLink.setAttribute('role', 'menuitem');
        subMenu.appendChild(subLink);
      });

      itemWrap.appendChild(subMenu);
      menu.appendChild(itemWrap);
      wireHoverPersistence(itemWrap);
    });

    wrap.appendChild(menu);
    wireHoverPersistence(wrap);
  });

  const getHrefKey = (href) => {
    if (!href) return '';
    try {
      const u = new URL(href, window.location.href);
      const path = String(u.pathname || '');
      const parts = path.split('/').filter(Boolean);
      return (parts[parts.length - 1] || '').toLowerCase();
    } catch (_) {
      return String(href).trim().toLowerCase();
    }
  };

  const crumbLinks = document.querySelectorAll('.tsi-utility-crumb[href]');
  crumbLinks.forEach((crumbLink) => {
    if (!(crumbLink instanceof HTMLAnchorElement)) return;
    if (crumbLink.closest('.tsi-utility-crumb-wrap')) return;
    const hrefKey = getHrefKey(crumbLink.getAttribute('href'));
    const submenuKeys = crumbSubpagesByHref[hrefKey];
    if (!Array.isArray(submenuKeys) || submenuKeys.length === 0) return;

    const submenuEntries = submenuKeys
      .map((key) => ({ href: getHref(key), label: getLabel(key) }))
      .filter((entry) => entry.href && entry.label);
    if (!submenuEntries.length) return;

    const parent = crumbLink.parentNode;
    if (!parent) return;

    const wrap = document.createElement('span');
    wrap.className = 'tsi-utility-crumb-wrap';
    parent.insertBefore(wrap, crumbLink);
    wrap.appendChild(crumbLink);

    const menu = document.createElement('div');
    menu.className = 'tsi-crumb-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', `${crumbLink.textContent || 'Subpages'} subpages`);

    submenuEntries.forEach((entry) => {
      const link = document.createElement('a');
      link.className = 'tsi-crumb-menu__link';
      link.href = entry.href;
      link.textContent = entry.label;
      link.setAttribute('role', 'menuitem');
      menu.appendChild(link);
    });

    wrap.appendChild(menu);
    wireHoverPersistence(wrap);
  });

  if (!themeToggle) return;

  const readTheme = () => {
    const stored = localStorage.getItem(themeStorageKey);
    if (stored === 'light' || stored === 'dark') return stored;
    return defaultTheme;
  };

  const applyTheme = (theme) => {
    const next = theme === 'light' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    themeToggle.textContent = `Theme: ${next === 'light' ? 'Light' : 'Dark'}`;
    localStorage.setItem(themeStorageKey, next);
  };

  applyTheme(readTheme());

  themeToggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    applyTheme(current === 'light' ? 'dark' : 'light');
  });
})();
