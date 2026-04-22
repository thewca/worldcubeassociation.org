import type { Metadata } from "next";
import React from "react";
import AuthProvider from "@/providers/SessionProvider";
import WCAQueryClientProvider from "@/providers/WCAQueryClientProvider";
import { Provider as UiProvider } from "@/components/ui/provider";
import Navbar from "./navbar";
import Footer from "@/components/Footer";
import RandomBackground from "@/components/RandomBackground";
import { ThemeProvider } from "@wrksz/themes/next";
import { appFont } from "@/styles/fonts";

export const metadata: Metadata = {
  title: {
    template: "%s | World Cube Association",
    default: "",
  },
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className={appFont.className}>
        <ThemeProvider attribute="class" disableTransitionOnChange>
          <WCAQueryClientProvider>
            <AuthProvider>
              <UiProvider>
                <Navbar />
                <RandomBackground numRows={8} numCols={18} />
                {children}
                <Footer />
              </UiProvider>
            </AuthProvider>
          </WCAQueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
