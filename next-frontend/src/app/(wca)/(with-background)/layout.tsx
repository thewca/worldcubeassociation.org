import React from "react";
import RandomBackground from "@/components/RandomBackground";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function WithBackgroundLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <RandomBackground numRows={8} numCols={18} />
      {children}
    </>
  );
}
