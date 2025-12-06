import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui";
import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { APP_NAME, APP_DESCRIPTION, APP_URL, ITCH_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} - Action Stick Figure Game`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "stick figure game",
    "action game",
    "indie game",
    "stick crisis",
    "combat game",
    "arcade game",
  ],
  authors: [{ name: "VMRam95" }],
  creator: "VMRam95",
  openGraph: {
    title: `${APP_NAME} - Action Stick Figure Game`,
    description: APP_DESCRIPTION,
    url: APP_URL,
    siteName: APP_NAME,
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Stick Crisis Game",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: "/",
  },
  other: {
    "itch-game": ITCH_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col bg-pixel-bg-primary text-pixel-text-primary antialiased">
        <ToastProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
