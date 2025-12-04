import type { Metadata } from "next";
import React from "react";
import AuthProvider from "@/providers/SessionProvider";
import WCAQueryClientProvider from "@/providers/WCAQueryClientProvider";
import { Provider as UiProvider } from "@/components/ui/provider";
import Navbar from "./navbar";
import Footer from "@/components/Footer";
import RandomBackground from "@/components/RandomBackground";
import { Rubik } from "next/font/google";

export const metadata: Metadata = {
  title: {
    template: "%s | World Cube Association",
    default: "",
  },
};

const devFont = Rubik({ subsets: ["latin"] });

const computeFont = async () => {
  // if (process.env.PROPRIETARY_FONT === "TTNormsPro") {
  //   const { ttNormsPro } = await import("@/styles/fonts");
  //
  //   return ttNormsPro;
  // }

  return devFont;
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appFont = await computeFont();

  return (
    <html suppressHydrationWarning>
      <body className={appFont.className}>
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
      </body>
    </html>
  );
}
