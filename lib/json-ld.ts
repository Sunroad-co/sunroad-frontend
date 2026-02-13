/**
 * SEO structured data (JSON-LD) helpers.
 * Builds deterministic schema.org objects for site-wide and artist profile pages.
 */

const DEFAULT_DESCRIPTION =
  "Discover and connect with local creatives. A directory for artists, photographers, musicians, and makers in your area.";

/** Input for organization/website JSON-LD (site-wide) */
export type SiteJsonLdInput = {
  siteUrl: string;
  siteName?: string;
  organizationName?: string;
  description?: string;
  logoUrl?: string;
  sameAs?: string[];
};

/** Input for artist Person JSON-LD (public profile page) */
export type ArtistJsonLdInput = {
  displayName: string;
  canonicalUrl: string;
  imageUrl: string | null;
  description: string | null;
  address?: {
    city?: string;
    state?: string;
    country?: string;
  } | null;
  sameAs: string[];
};

/**
 * Build site-wide JSON-LD graph: Organization + WebSite with SearchAction.
 * Use on homepage / root layout. Deterministic (no timestamps or random fields).
 */
export function buildSiteJsonLd(input: SiteJsonLdInput): object {
  const {
    siteUrl,
    siteName = "Sun Road",
    organizationName = "Sun Road Co.",
    description = DEFAULT_DESCRIPTION,
    logoUrl,
    sameAs = [],
  } = input;

  const organizationId = `${siteUrl}/#organization`;

  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": organizationId,
    name: organizationName,
    url: siteUrl,
    description,
  };

  if (logoUrl) {
    organization.logo = logoUrl;
  }

  if (sameAs.length > 0) {
    organization.sameAs = sameAs;
  }

  const webSite: Record<string, unknown> = {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: siteName,
    url: siteUrl,
    description,
    publisher: { "@id": organizationId },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organization, webSite],
  };
}

/**
 * Build Person schema for a public artist profile page.
 * Only use when the profile is accessible to anonymous users.
 */
export function buildArtistPersonJsonLd(input: ArtistJsonLdInput): object {
  const {
    displayName,
    canonicalUrl,
    imageUrl,
    description,
    address,
    sameAs,
  } = input;

  const person: Record<string, unknown> = {
    "@type": "Person",
    name: displayName,
    url: canonicalUrl,
  };

  if (imageUrl) {
    person.image = imageUrl;
  }

  if (description && description.trim()) {
    person.description = description.trim();
  }

  if (address && (address.city || address.state || address.country)) {
    const parts: string[] = [];
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.country) parts.push(address.country);
    if (parts.length > 0) {
      person.address = {
        "@type": "PostalAddress",
        addressLocality: address.city ?? undefined,
        addressRegion: address.state ?? undefined,
        addressCountry: address.country ?? undefined,
      };
    }
  }

  if (sameAs.length > 0) {
    person.sameAs = sameAs;
  }

  return {
    "@context": "https://schema.org",
    ...person,
  };
}

/**
 * Collect sameAs URLs for an artist: website_url + instagram + facebook + artist_links (public).
 */
export function collectArtistSameAs(artist: {
  website_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  artist_links?: Array<{ url: string; is_public?: boolean }> | null;
}): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  const add = (url: string | null | undefined) => {
    const u = typeof url === "string" ? url.trim() : "";
    if (u && /^https?:\/\//i.test(u) && !seen.has(u)) {
      seen.add(u);
      urls.push(u);
    }
  };

  add(artist.website_url);
  add(artist.instagram_url);
  add(artist.facebook_url);

  const links = artist.artist_links || [];
  for (const link of links) {
    if (link.is_public !== false && link.url) {
      add(link.url);
    }
  }

  return urls;
}
