import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Handwerker Service App",
  description: "Digitale Vor-Ort-Auftragserfassung für SHK-Betriebe",
  applicationName: "Handwerker Service App",
  icons: { icon: "/app-icon.svg", apple: "/app-icon.svg" },
  appleWebApp: {
    capable: true,
    title: "Handwerker",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#007aff"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
