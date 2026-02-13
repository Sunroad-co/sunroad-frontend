import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
// import { ThemeProvider } from "next-themes";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { UserProvider } from "@/contexts/user-context";
import { getSiteUrl } from "@/lib/site-url";
import { buildSiteJsonLd } from "@/lib/json-ld";
import { JsonLdScript } from "@/lib/json-ld-script";
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
  const logoUrl = `${url}/sunroad_logo.png`;
  const jsonLd = buildSiteJsonLd({
    siteUrl: url,
    siteName: "Sun Road",
    organizationName: "Sun Road Co.",
    description: defaultDescription,
    logoUrl,
    sameAs: [
      "https://www.youtube.com/@sunroadco",
      "https://www.instagram.com/sunroadco/",
      "https://www.facebook.com/sunroadapp",
      "https://www.linkedin.com/company/sunroadco/",
    ],
  });
  return <JsonLdScript data={jsonLd} />;
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
