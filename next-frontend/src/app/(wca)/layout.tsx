import type { Metadata } from "next";
import React from "react";
import AuthProvider from "@/providers/SessionProvider";
import WCAQueryClientProvider from "@/providers/WCAQueryClientProvider";
import PermissionProvider from "@/providers/PermissionProvider";
import { Provider as UiProvider } from "@/components/ui/provider";
import Navbar from "./navbar";
import localFont from 'next/font/local'
import RandomBackground from "@/components/RandomBackground";


const TTNormsPro = localFont({
  src: [
    {
      path: 'fonts/TTNormsPro/TT_Norms_Pro_Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: 'fonts/TTNormsPro/TT_Norms_Pro_Light_Italic.woff2',
      weight: '300',
      style: 'italic',
    },
    {
      path: 'fonts/TTNormsPro/TT_Norms_Pro_Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: 'fonts/TTNormsPro/TT_Norms_Pro_Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: 'fonts/TTNormsPro/TT_Norms_Pro_Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: 'fonts/TTNormsPro/TT_Norms_Pro_Condensed_ExtraBold.woff2',
      weight: '800',
      style: 'normal',
    },
  ],
})

export const metadata: Metadata = {
  title: "WCA Website",
  description: "WST x SLATE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className={TTNormsPro.className}>
        <WCAQueryClientProvider>
          <AuthProvider>
            <UiProvider>
              <Navbar />
              <RandomBackground numRows={8} numCols={18} />
              <PermissionProvider>{children}</PermissionProvider>
            </UiProvider>
          </AuthProvider>
        </WCAQueryClientProvider>
      </body>
    </html>
  );
}
