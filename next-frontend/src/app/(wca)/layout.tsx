import type { Metadata } from "next";
import React from "react";
import AuthProvider from "@/providers/SessionProvider";
import WCAQueryClientProvider from "@/providers/WCAQueryClientProvider";
import PermissionProvider from "@/providers/PermissionProvider";
import { Provider as UiProvider } from "@/components/ui/provider";
import Navbar from "./navbar";
import Footer from "@/components/Footer";
import RandomBackground from "@/components/RandomBackground";
import { Rubik } from "next/font/google";

export const metadata: Metadata = {
  title: "WCA Website",
  description: "WST x SLATE",
};

const devFont = Rubik({ subsets: ["latin"] });

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className={devFont.className}>
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
