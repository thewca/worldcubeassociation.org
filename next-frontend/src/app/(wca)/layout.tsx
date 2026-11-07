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
import { Toaster } from "@/components/ui/toaster";
import LocaleProvider from "@/lib/i18n/LocaleProvider";
import { getT } from "@/lib/i18n/get18n";

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

// Reading the language touches cookies and headers, so it has to happen inside a Suspense
//   boundary. Otherwise Cache Components can't prerender the static shell.
async function WithLocale({ children }: { children: React.ReactNode }) {
  const { lng } = await getT();

  return <LocaleProvider lng={lng}>{children}</LocaleProvider>;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appFont = await computeFont();

  return (
    <html suppressHydrationWarning>
      <body className={appFont.className}>
        <ThemeProvider
          attribute="class"
          storage="hybrid"
          cookieOptions={{
            domain: process.env.NEXT_PUBLIC_THEME_COOKIE_DOMAIN,
          }}
          disableTransitionOnChange
        >
          <WCAQueryClientProvider>
            <EmotionRegistry>
              <UiProvider>
                {!process.env.LIVE_RESULT_BETA && (
                  <Suspense>
                    <WithLocale>
                      <ClientOnly>
                        <BetaDisclaimer />
                      </ClientOnly>
                    </WithLocale>
                  </Suspense>
                )}
                <Suspense fallback={<NavbarSkeleton />}>
                  <WithLocale>
                    <Navbar />
                  </WithLocale>
                </Suspense>
                <NextTopLoader height={5} showForHashAnchor={false} />
                <Suspense fallback={<Loading />}>
                  <WithLocale>{children}</WithLocale>
                </Suspense>
                <Suspense fallback={<FooterSkeleton />}>
                  <WithLocale>
                    <Footer />
                  </WithLocale>
                </Suspense>
                <Toaster />
              </UiProvider>
            </EmotionRegistry>
          </WCAQueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
