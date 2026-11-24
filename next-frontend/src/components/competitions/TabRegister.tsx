import React from "react";
import { Card, Text } from "@chakra-ui/react";
import { getT } from "@/lib/i18n/get18n";

export default async function TabRegister() {
  const { t } = await getT();

  return (
    <Card.Root>
      <Card.Body>
        <Text>{t("competitions.nav.menu.register")}</Text>
      </Card.Body>
    </Card.Root>
  );
}
