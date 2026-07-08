window.FDH_SCHEMA = {
  organization: {
    '@type': 'MedicalBusiness',
    '@id': 'https://floridadayhospital.co.za/#organization',
    name: 'Florida Day Hospital',
    url: 'https://floridadayhospital.co.za/',
    description: 'Florida Day Hospital is a private day hospital in Florida Park, Roodepoort, offering scheduled same-day surgical care across ophthalmology, gastroenterology, ENT, gynaecology, general surgery, and pain management.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '25 Jan Hofmeyr Avenue',
      addressLocality: 'Florida Park, Roodepoort',
      postalCode: '1709',
      addressCountry: 'ZA',
    },
  },
  navigation: [
    { name: 'About Us', url: 'https://floridadayhospital.co.za/about.html' },
    { name: 'Services', url: 'https://floridadayhospital.co.za/services.html' },
    { name: 'Specialist Physicians', url: 'https://floridadayhospital.co.za/specialists.html' },
    { name: 'Contact Us', url: 'https://floridadayhospital.co.za/contact.html' },
    { name: 'Medical Aid', url: 'https://floridadayhospital.co.za/medical-aid.html' },
    { name: 'Career Opportunities', url: 'https://floridadayhospital.co.za/careers.html' },
  ],
};

window.FDH_renderSchema = (pageUrl, pageName, breadcrumb) => {
  const graph = [
    window.FDH_SCHEMA.organization,
    {
      '@type': 'WebSite',
      '@id': 'https://floridadayhospital.co.za/#website',
      url: 'https://floridadayhospital.co.za/',
      name: 'Florida Day Hospital',
      publisher: { '@id': 'https://floridadayhospital.co.za/#organization' },
    },
    {
      '@type': 'SiteNavigationElement',
      '@id': 'https://floridadayhospital.co.za/#navigation',
      name: window.FDH_SCHEMA.navigation.map((item) => item.name),
      url: window.FDH_SCHEMA.navigation.map((item) => item.url),
    },
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: pageName,
      isPartOf: { '@id': 'https://floridadayhospital.co.za/#website' },
      about: { '@id': 'https://floridadayhospital.co.za/#organization' },
    },
  ];

  if (breadcrumb) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumb.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    });
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  document.head.appendChild(script);
};
