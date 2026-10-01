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
          theme="dark"
          toastOptions={{
            className:
              "!rounded-2xl !border-slate-800 !bg-slate-900/95 !backdrop-blur-md !text-white !shadow-2xl !text-[0.86rem] !font-medium",
            descriptionClassName: "!text-slate-300 !text-[0.76rem]",
          }}
        />
      </body>
    </html>
  );
}
