import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";
import { NewsAlertManager } from "@/components/dashboard/NewsAlertManager";
import { GoogleAnalytics } from "@next/third-parties/google";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

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
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${outfit.variable} antialiased selection:bg-yellow-500 selection:text-black min-h-screen flex flex-col transition-colors duration-300 overflow-x-hidden`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ThemeProvider>
            {children}
            <NewsAlertManager />
            <ChatWidget />
          </ThemeProvider>
        </AuthProvider>
      </body>
      <GoogleAnalytics gaId="G-XXXXXXXXXX" />
    </html>
  );
}

