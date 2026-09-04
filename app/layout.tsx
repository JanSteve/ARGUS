import type { Metadata } from "next";
import { Newsreader, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Verdikt by Soulvai Technologies — India's First Multi-Agent Legal AI",
  description:
    "12 specialist agents. Every domain of Indian law. Separately trained, orchestrated into one seamless platform for Indian advocates, enterprises, and courts.",
  metadataBase: new URL("https://soulvai.ai"),
  openGraph: {
    title: "Verdikt by Soulvai Technologies — India's First Multi-Agent Legal AI",
    description:
      "Every Indian law. A dedicated agent. Orchestrated multi-agent legal intelligence built for Indian statutes and courts.",
    url: "https://soulvai.ai",
    siteName: "Soulvai Technologies",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Verdikt by Soulvai Technologies",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Verdikt by Soulvai Technologies — India's First Multi-Agent Legal AI",
    description: "Every Indian law. A dedicated agent.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Soulvai Technologies Pvt. Ltd.",
    url: "https://soulvai.ai",
    logo: "https://soulvai.ai/logo.png",
    description:
      "India's first multi-agent legal AI platform with a separately trained specialist for every domain of Indian law.",
    foundingDate: "2024",
    address: {
      "@type": "PostalAddress",
      addressCountry: "IN",
    },
  };

  return (
    <html lang="en" className={`${newsreader.variable} ${ibmPlexSans.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased bg-ink-navy text-court-paper selection:bg-gazette-brass selection:text-ink-navy">
        {children}
      </body>
    </html>
  );
}
