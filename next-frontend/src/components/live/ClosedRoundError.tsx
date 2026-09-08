import { Alert } from "@chakra-ui/react";
import { TFunction } from "i18next";

export default function ClosedRoundError({ t }: { t: TFunction }) {
  return (
    <Alert.Root status="error">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t("competitions.live.errors.round_closed")}</Alert.Title>
      </Alert.Content>
    </Alert.Root>
  );
}
