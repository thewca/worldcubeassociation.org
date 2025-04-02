import type { Metadata } from "next";
import React from "react";
import AuthProvider from "@/providers/SessionProvider";
import WCAQueryClientProvider from "@/providers/WCAQueryClientProvider";
import PermissionProvider from "@/providers/PermissionProvider";
import { Provider as UiProvider } from "@/components/ui/provider";
import Navbar from "./navbar";
import Footer from "@/components/Footer";
import localFont from "next/font/local";
import { Rubik } from "next/font/google";
import RandomBackground from "@/components/RandomBackground";

const loadWcaFont = () => {
  const envFontPath = process.env.WCA_FONT_RELATIVE_PATH;

  if (envFontPath) {
    return localFont({
      src: [
        {
          path: `${envFontPath}/TT_Norms_Pro_Light.woff2`,
          weight: "300",
          style: "normal",
        },
        {
          path: `${envFontPath}/TT_Norms_Pro_Light_Italic.woff2`,
          weight: "300",
          style: "italic",
        },
        {
          path: `${envFontPath}/TT_Norms_Pro_Regular.woff2`,
          weight: "400",
          style: "normal",
        },
        {
          path: `${envFontPath}/TT_Norms_Pro_Medium.woff2`,
          weight: "500",
          style: "normal",
        },
        {
          path: `${envFontPath}/TT_Norms_Pro_Bold.woff2`,
          weight: "700",
          style: "normal",
        },
        {
          path: `${envFontPath}/TT_Norms_Pro_Condensed_ExtraBold.woff2`,
          weight: "800",
          style: "normal",
        },
      ],
    });
  } else {
    return Rubik();
  }
};

export const metadata: Metadata = {
  title: "WCA Website",
  description: "WST x SLATE",
};

const configuredFont = loadWcaFont();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className={configuredFont.className}>
        <WCAQueryClientProvider>
          <AuthProvider>
            <UiProvider>
              <Navbar />
              <RandomBackground numRows={8} numCols={18} />
              <PermissionProvider>{children}</PermissionProvider>
              <Footer />
            </UiProvider>
          </AuthProvider>
        </WCAQueryClientProvider>
      </body>
    </html>
  );
}
