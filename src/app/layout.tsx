import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter ships a Vietnamese subset, so both UI languages render in one typeface.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "World History Platform",
  description:
    "Scrub through time, watch empires rise and fall on the map, and ask an AI tutor that knows what you are looking at.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
