import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";
import { GoogleAnalytics } from "@next/third-parties/google";
import { AuthProvider } from "@/context/AuthContext";
import { ExternalLink } from "lucide-react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zen Pips | Elite Market Dominators",
  description: "Join the elite circle of traders. Precision signals, unbreakable discipline, and real market dominance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${inter.variable} ${outfit.variable} antialiased bg-[#0a0a0a] text-white selection:bg-yellow-500 selection:text-black min-h-screen flex flex-col`}
      >
        <AuthProvider>
          {children}
          <ChatWidget />
        </AuthProvider>
      </body>
      <GoogleAnalytics gaId="G-XXXXXXXXXX" />
    </html>
  );
}

