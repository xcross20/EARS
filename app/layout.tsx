import type { Metadata } from "next";

import { DemoBanner } from "@/components/DemoBanner";

import "./globals.css";

export const metadata: Metadata = {
  title: "EARS demo",
  description: "Synthetic invoice review demo. Not production authentication.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DemoBanner />
        <a className="sr-only" href="#main">
          Skip to content
        </a>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
