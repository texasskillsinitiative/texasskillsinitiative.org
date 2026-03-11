(() => {
  const labels = {
    career_opportunities: {
      full: 'Career Opportunities',
      footer: 'Career',
      href: 'portal-hub.html'
    },
    job_listings: {
      full: 'Job Listings',
      href: 'portal-employment.html'
    },
    internship_application: {
      full: 'Internship Application',
      href: 'portal-internship.html'
    },
    future_career_interest: {
      full: 'Future Career Interest',
      href: 'portal-career-interest.html'
    },
    investment_inquiry: {
      full: 'Investment Inquiry',
      footer: 'Investment',
      href: 'portal-investment.html'
    },
    public_relations_media_request: {
      full: 'Public Relations/Media Request',
      footer: 'PR',
      href: 'portal-press.html'
    },
    legal_desk: {
      full: 'Legal Desk',
      href: 'legal-hub.html'
    },
    privacy_policy: {
      full: 'Privacy Policy',
      footer: 'Privacy',
      href: 'privacy.html'
    },
    terms_of_use: {
      full: 'Terms of Use',
      footer: 'Terms',
      href: 'terms.html'
    },
    accessibility_statement: {
      full: 'Accessibility Statement',
      footer: 'Accessibility',
      href: 'accessibility.html'
    },
    security_statement: {
      full: 'Security Statement',
      footer: 'Security',
      href: 'security.html'
    }
  };

  window.TSI_SITE_LABELS = {
    labels,
    getLabel(key, variant = 'full') {
      const row = labels[key];
      if (!row) return '';
      return String(row[variant] || row.full || '').trim();
    },
    getHref(key) {
      const row = labels[key];
      return row ? String(row.href || '').trim() : '';
    }
  };
})();
