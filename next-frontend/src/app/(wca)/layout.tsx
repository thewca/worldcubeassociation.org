import type { Metadata } from "next";
import React, { Suspense } from "react";
import Script from "next/script";
import WCAQueryClientProvider from "@/providers/WCAQueryClientProvider";
import { Provider as UiProvider } from "@/components/ui/provider";
import { ClientOnly } from "@chakra-ui/react";
import Navbar from "./navbar";
import Footer from "./footer";
import { ThemeProvider } from "@wrksz/themes/next";
import { appFont } from "@/styles/fonts";
import NextTopLoader from "nextjs-toploader";
import BetaDisclaimer from "@/components/BetaDisclaimer";
import TranslationDisclaimer from "@/components/TranslationDisclaimer";
import Loading from "@/components/ui/loading";
import NavbarSkeleton from "./navbar-skeleton";
import FooterSkeleton from "./footer-skeleton";
import { EmotionRegistry } from "@/components/ui/emotion-registry";
import { Toaster } from "@/components/ui/toaster";
import LocaleProvider from "@/lib/i18n/LocaleProvider";
import { getT } from "@/lib/i18n/get18n";
import { isLiveSite } from "@/lib/wca/isLiveSite";

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
        {isLiveSite() && (
          <Script src="https://e049388b9e9e.us-west-2.sdk.awswaf.com/e049388b9e9e/53e2df08ab2b/challenge.js" />
        )}
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
                {/* The flag is only set at runtime, so the Suspense boundary has to stay outside of
                    the check. Otherwise the tree doesn't match the shell prerendered at build time. */}
                <Suspense>
                  <WithLocale>
                    {!process.env.LIVE_RESULT_BETA && (
                      <ClientOnly>
                        <BetaDisclaimer />
                      </ClientOnly>
                    )}
                  </WithLocale>
                </Suspense>
                <Suspense>
                  <TranslationDisclaimer />
                </Suspense>
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
