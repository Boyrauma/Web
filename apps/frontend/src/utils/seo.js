function ensureMeta(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    element.setAttribute(key, value);
  });

  return element;
}

function ensureLink(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    element.setAttribute(key, value);
  });

  return element;
}

function toAbsoluteUrl(value) {
  if (!value) return "";

  try {
    return new URL(value, window.location.origin).toString();
  } catch {
    return value;
  }
}

export function applySeo({
  title,
  description,
  canonicalPath = "/",
  image,
  type = "website",
  siteName,
  robots = "index,follow",
  keywords,
  schema
}) {
  if (title) {
    document.title = title;
  }

  const canonicalUrl = toAbsoluteUrl(canonicalPath);
  const imageUrl = toAbsoluteUrl(image);

  ensureMeta("meta[name='description']", {
    name: "description",
    content: description
  });
  ensureMeta("meta[name='robots']", {
    name: "robots",
    content: robots
  });
  ensureMeta("meta[name='keywords']", {
    name: "keywords",
    content: keywords
  });
  ensureMeta("meta[property='og:locale']", {
    property: "og:locale",
    content: "vi_VN"
  });
  ensureMeta("meta[property='og:type']", {
    property: "og:type",
    content: type
  });
  ensureMeta("meta[property='og:title']", {
    property: "og:title",
    content: title
  });
  ensureMeta("meta[property='og:description']", {
    property: "og:description",
    content: description
  });
  ensureMeta("meta[property='og:url']", {
    property: "og:url",
    content: canonicalUrl
  });
  ensureMeta("meta[property='og:site_name']", {
    property: "og:site_name",
    content: siteName
  });
  ensureMeta("meta[property='og:image']", {
    property: "og:image",
    content: imageUrl
  });
  ensureMeta("meta[name='twitter:card']", {
    name: "twitter:card",
    content: imageUrl ? "summary_large_image" : "summary"
  });
  ensureMeta("meta[name='twitter:title']", {
    name: "twitter:title",
    content: title
  });
  ensureMeta("meta[name='twitter:description']", {
    name: "twitter:description",
    content: description
  });
  ensureMeta("meta[name='twitter:image']", {
    name: "twitter:image",
    content: imageUrl
  });
  ensureLink("link[rel='canonical']", {
    rel: "canonical",
    href: canonicalUrl
  });

  const scriptId = "seo-jsonld";
  const previousScript = document.getElementById(scriptId);

  if (previousScript) {
    previousScript.remove();
  }

  if (schema) {
    const schemaScript = document.createElement("script");
    schemaScript.id = scriptId;
    schemaScript.type = "application/ld+json";
    schemaScript.textContent = JSON.stringify(schema);
    document.head.appendChild(schemaScript);
  }
}

export function buildLocalBusinessSchema({
  siteName,
  description,
  url,
  image,
  logo,
  hotline,
  address,
  zalo,
  services = []
}) {
  return [
    {
      "@context": "https://schema.org",
      "@type": ["LocalBusiness", "TransportationService"],
      name: siteName,
      description,
      url,
      image,
      logo,
      telephone: hotline,
      address,
      sameAs: zalo ? [zalo] : undefined,
      areaServed: "Thanh Hóa, Việt Nam",
      knowsAbout: services.length ? services : undefined
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      url
    }
  ];
}

export function buildVehicleSchema({ vehicle, siteName, canonicalUrl, images = [] }) {
  return [
    {
      "@context": "https://schema.org",
      "@type": ["Service", "TransportationService"],
      name: vehicle.name,
      serviceType: vehicle.category?.name ?? "Dịch vụ vận chuyển hành khách",
      description: vehicle.description || vehicle.shortDescription || vehicle.name,
      url: canonicalUrl,
      image: images,
      category: vehicle.category?.name,
      provider: {
        "@type": "LocalBusiness",
        name: siteName,
        url: toAbsoluteUrl("/")
      },
      areaServed: {
        "@type": "AdministrativeArea",
        name: "Thanh Hóa, Việt Nam"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Trang chủ",
          item: toAbsoluteUrl("/")
        },
        {
          "@type": "ListItem",
          position: 2,
          name: vehicle.name,
          item: canonicalUrl
        }
      ]
    }
  ];
}
