import type { Metadata } from "next";
import { Geist, Geist_Mono, Bebas_Neue } from "next/font/google";
import "./globals.css";
import StoreProvider from './StoreProvider';
import ClientShell from './ClientShell';
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ELITE Beerpong",
  description: "Európa és Magyarország legelső profi beerpong bajnoksága",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative z-[1]` }
        >
        <StoreProvider>
          <Toaster richColors position="top-right" />
          <ClientShell>
            {children}
          </ClientShell>
        </StoreProvider>
      </body>
    </html>
  );
}
