import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
// import { ThemeProvider } from "next-themes";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { UserProvider } from "@/contexts/user-context";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();
const defaultDescription =
  "Discover and connect with local creatives. A directory for artists, photographers, musicians, and makers in your area.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sun Road",
    template: "%s | Sun Road",
  },
  description: defaultDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Sun Road",
    locale: "en_US",
    url: "/",
    title: "Sun Road",
    description: defaultDescription,
    images: [
      {
        url: "/sunroad_artwork.png",
        width: 1200,
        height: 630,
        alt: "Sun Road – The local creative community",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sun Road",
    description: defaultDescription,
    images: [
      {
        url: "/sunroad_artwork.png",
        alt: "Sun Road – The local creative community",
      },
    ],
  },
};

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // Removed 300 (unused)
});

const inter = Inter({
  variable: "--font-inter",
  display: "swap",
  subsets: ["latin"],
});

function SiteJsonLd() {
  const url = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: "Sun Road",
        description: defaultDescription,
      },
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: "Sun Road",
        url,
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${inter.variable} font-body antialiased bg-sunroad-cream`}>
        <SiteJsonLd />
        {/* <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        > */}
        <UserProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </UserProvider>
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
