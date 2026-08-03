import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Draft Eleven — Soccer Card Collection Simulator",
  description:
    "Open every soccer trading card product ever released. Realistic pack openings, World Cup collections, and the definitive digital archive for soccer cards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${dmSans.variable} ${bebas.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-white/10 px-4 py-8 text-center text-xs text-ink-muted md:px-6">
          Draft Eleven — a fan-made soccer trading card simulator and archive. Not affiliated with
          FIFA, Topps, Panini, or any manufacturer. Card images are stylized representations.
        </footer>
      </body>
    </html>
  );
}
