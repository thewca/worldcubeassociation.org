import type { Metadata } from "next";
import React, { Suspense } from "react";
import WCAQueryClientProvider from "@/providers/WCAQueryClientProvider";
import { Provider as UiProvider } from "@/components/ui/provider";
import { ClientOnly } from "@chakra-ui/react";
import Navbar from "./navbar";
import Footer from "./footer";
import { ThemeProvider } from "@wrksz/themes/next";
import { appFont } from "@/styles/fonts";
import NextTopLoader from "nextjs-toploader";
import BetaDisclaimer from "@/components/BetaDisclaimer";
import Loading from "@/components/ui/loading";
import NavbarSkeleton from "./navbar-skeleton";
import FooterSkeleton from "./footer-skeleton";
import { EmotionRegistry } from "@/components/ui/emotion-registry";

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
            <EmotionRegistry>
              <UiProvider>
                {!process.env.LIVE_RESULT_BETA && (
                  <ClientOnly>
                    <BetaDisclaimer />
                  </ClientOnly>
                )}
                <Suspense fallback={<NavbarSkeleton />}>
                  <Navbar />
                </Suspense>
                <NextTopLoader height={5} />
                <Suspense fallback={<Loading />}>{children}</Suspense>
                <Suspense fallback={<FooterSkeleton />}>
                  <Footer />
                </Suspense>
              </UiProvider>
            </EmotionRegistry>
          </WCAQueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
