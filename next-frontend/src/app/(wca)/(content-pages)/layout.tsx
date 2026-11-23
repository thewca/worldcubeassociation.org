import React, { type ReactNode } from "react";
import { Container } from "@chakra-ui/react";
import LocaleProvider from "@/lib/i18n/LocaleProvider";
import { getT } from "@/lib/i18n/get18n";

export default async function ContentLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { lng } = await getT();
  return (
    <LocaleProvider lng={lng}>
      <Container paddingTop="8">{children}</Container>
    </LocaleProvider>
  );
}
