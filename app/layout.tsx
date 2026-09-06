import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GARGANTUA // 3D Relativistic Black Hole & 5D Timeline Portal",
  description:
    "An interactive, photorealistic 3D relativistic Black Hole simulation inspired by Kip Thorne and Interstellar. Plunge through the accretion disk, photon ring, and traverse the 5D timeline portal.",
  keywords: [
    "black hole",
    "gargantua",
    "three.js",
    "general relativity",
    "tesseract",
    "timeline portal",
    "interstellar",
    "webgl",
    "einstein ring",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-black`}
    >
      <body className="min-h-full flex flex-col bg-black text-white selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
