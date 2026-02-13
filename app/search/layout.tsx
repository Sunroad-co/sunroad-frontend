import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Directory",
  description:
    "Search and discover local creatives—artists, photographers, musicians, designers, and more—in your area.",
  alternates: {
    canonical: "/search",
  },
  openGraph: {
    title: "Directory | Sun Road",
    description:
      "Search and discover local creatives—artists, photographers, musicians, designers, and more—in your area.",
    url: "/search",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Directory | Sun Road",
    description:
      "Search and discover local creatives—artists, photographers, musicians, designers, and more—in your area.",
  },
  // Search page is CSR and shouldn't be indexed as thin content
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
