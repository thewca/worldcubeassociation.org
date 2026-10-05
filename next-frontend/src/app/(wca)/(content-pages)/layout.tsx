import React, { type ReactNode } from "react";
import { Container } from "@chakra-ui/react";

export default async function ContentLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <Container paddingTop="8">{children}</Container>;
}
