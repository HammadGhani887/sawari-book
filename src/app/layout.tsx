import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "@/components/ErrorBoundary";
import InstallBanner from "@/components/layout/InstallBanner";
import OfflineSyncProvider from "@/components/layout/OfflineSyncProvider";
import PushNotificationProvider from "@/components/layout/PushNotificationProvider";
import StoreCleaner from "@/components/layout/StoreCleaner";
import ImageLightbox from "@/components/layout/ImageLightbox";
import "./globals.css";

// Use local Geist font — no Google Fonts network request needed
const inter = localFont({
  src: [
    { path: "./fonts/GeistVF.woff",     weight: "100 900", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sawari Book — Track Every Ride",
  description: "Revenue tracking app for Pakistani ride-hailing car owners. Log rides, track expenses, settle with drivers.",
  manifest: "/manifest.json",
  icons: {
    icon: "/sawari-app.png",
    apple: "/sawari-app.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sawari Book",
    startupImage: "/sawari-app.png",
  },
  openGraph: {
    title: "Sawari Book — Track Every Ride",
    description: "Revenue tracking app for Pakistani ride-hailing car owners.",
    siteName: "Sawari Book",
    locale: "en_PK",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Sawari Book",
    description: "Revenue tracking for Pakistani ride-hailing car owners.",
  },
  keywords: ["ride hailing", "inDrive", "Yango", "Pakistan", "income tracker", "سواری"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0F172A",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${inter.variable} font-sans bg-brand-bg text-slate-900 antialiased min-h-screen`}
      >
        <ErrorBoundary>
          <StoreCleaner />
          <OfflineSyncProvider />
          <PushNotificationProvider />
          {children}
          <InstallBanner />
          <ImageLightbox />
        </ErrorBoundary>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1E293B",
              color: "#fff",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 500,
            },
            success: {
              style: {
                background: "#1E293B",
                color: "#fff",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 500,
                borderLeft: "4px solid #10B981",
              },
              iconTheme: { primary: "#10B981", secondary: "#fff" },
            },
            error: {
              style: {
                background: "#1E293B",
                color: "#fff",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 500,
                borderLeft: "4px solid #EF4444",
              },
              iconTheme: { primary: "#EF4444", secondary: "#fff" },
            },
          }}
        />
      </body>
    </html>
  );
}
