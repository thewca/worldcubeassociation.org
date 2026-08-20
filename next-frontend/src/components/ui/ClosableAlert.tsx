"use client";

import { Alert, CloseButton } from "@chakra-ui/react";
import { useState } from "react";

export default function ClosableAlert({
  title,
  status,
}: {
  title: string;
  status: Alert.RootProps["status"];
}) {
  const [alertDismissed, setAlertDismissed] = useState(false);

  if (!alertDismissed) {
    return (
      <Alert.Root status={status}>
        <Alert.Indicator />
        <Alert.Title>{title}</Alert.Title>
        <CloseButton
          pos="relative"
          top="-2"
          insetEnd="-2"
          onClick={() => setAlertDismissed(true)}
        />
      </Alert.Root>
    );
  }
}
