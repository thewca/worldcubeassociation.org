import React from "react";
import RandomBackground from "@/components/RandomBackground";

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
