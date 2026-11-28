"use client";

import { ReactNode, useState } from "react";
import { Button, Dialog, Portal, Text } from "@chakra-ui/react";
import Cookies from "js-cookie";

const ONE_YEAR_IN_DAYS = 365;

export default function DisclaimerDialog({
  cookieName,
  title,
  acceptLabel,
  children,
}: {
  cookieName: string;
  title: string;
  acceptLabel: string;
  children: ReactNode;
}) {
  // Rendered inside <ClientOnly>, so the cookie is readable on first render.
  const [open, setOpen] = useState(() => !Cookies.get(cookieName));

  const acceptDisclaimer = () => {
    Cookies.set(cookieName, "true", {
      path: "/",
      expires: ONE_YEAR_IN_DAYS,
      sameSite: "Lax",
    });
    setOpen(false);
  };

  // Deliberately uncontrolled by `onOpenChange`: the dialog must not close on
  // Escape or a backdrop click, only on the acknowledgement button.
  return (
    <Dialog.Root
      open={open}
      size="xl"
      role="alertdialog"
      placement="center"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title textStyle="h3">{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body display="flex" alignItems="center">
              <Text textStyle="s2">{children}</Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="pastelSolid"
                size="lg"
                w={{ base: "full", md: "auto" }}
                onClick={acceptDisclaimer}
              >
                {acceptLabel}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
