import type { Metadata } from "next";
import React from "react";
import AuthProvider from "@/providers/SessionProvider";
import WCAQueryClientProvider from "@/providers/WCAQueryClientProvider";
import { Provider as UiProvider } from "@/components/ui/provider";
import Navbar from "./navbar";
import Footer from "./footer";
import { ThemeProvider } from "@wrksz/themes/next";
import { appFont } from "@/styles/fonts";
import NextTopLoader from "nextjs-toploader";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: {
    template: "%s | World Cube Association",
    default: "World Cube Association",
  },
};

const computeFont = async () => {
  if (process.env.PROPRIETARY_FONT === "TTNormsPro") {
    const { appFont } = await import("@/styles/fonts.proprietary");

    return appFont;
  }

  return appFont;
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appFont = await computeFont();

  return (
    <html suppressHydrationWarning>
      <body className={appFont.className}>
        <ThemeProvider attribute="class" disableTransitionOnChange>
          <WCAQueryClientProvider>
            <AuthProvider>
              <UiProvider>
                <Navbar />
                <NextTopLoader height={5} />
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
