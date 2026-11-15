import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LOCALE_STORAGE_KEY } from "@/components/shell/locale";
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

/**
 * The page is prerendered in English and switches language once React has
 * loaded. For someone who will see it in Vietnamese, this script (run while
 * the HTML is parsed, before the first paint) hides the page until AppShell
 * has applied the language, so the English version never flashes up. It
 * follows the order of resolveInitialLocale in src/components/shell/locale.ts:
 * the link's `lang`, then the saved choice, then the browser's language.
 * If something goes wrong, the page shows itself after 2 seconds anyway.
 */
const LOCALE_SCRIPT = `(function(){try{var d=document.documentElement,l=null,p=new URLSearchParams(location.search).get("lang");if(p==="en"||p==="vi")l=p;if(!l){try{var s=localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)});if(s==="en"||s==="vi")l=s}catch(e){}}if(!l){var n=(navigator.languages&&navigator.languages[0])||navigator.language||"";if(n.toLowerCase().indexOf("vi")===0)l="vi"}if(l==="vi"){d.lang="vi";d.setAttribute("data-locale-pending","vi");setTimeout(function(){d.removeAttribute("data-locale-pending")},2000)}}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The script above may change `lang` and add data-locale-pending before
    // React hydrates; suppressHydrationWarning lets the DOM keep them.
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: LOCALE_SCRIPT }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
