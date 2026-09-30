import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppChrome } from "@/components/layout/app-chrome";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Setor Gmail Winter",
  description:
    "Setor Gmail Winter. Setor Gmail dengan harga transparan, penarikan cepat via DANA.",
  applicationName: "Setor Gmail",
  appleWebApp: {
    capable: true,
    title: "Setor Gmail",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#E0F2FE",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="app-bg min-h-full">
        <AppChrome>{children}</AppChrome>
        <Toaster
          position="top-center"
          toastOptions={{
            className:
              "!rounded-2xl !border-slate-200 !shadow-card !text-[0.85rem] !font-medium",
          }}
        />
      </body>
    </html>
  );
}
