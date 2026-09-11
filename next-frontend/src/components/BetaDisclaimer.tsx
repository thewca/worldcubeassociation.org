"use client";

import { useState } from "react";
import { Button, Dialog, Link, Portal, Text } from "@chakra-ui/react";
import Cookies from "js-cookie";

const BETA_DISCLAIMER_COOKIE = "beta_disclaimer_accepted";

const ONE_YEAR_IN_DAYS = 365;

export default function BetaDisclaimer() {
  // Rendered inside <ClientOnly>, so the cookie is readable on first render.
  const [open, setOpen] = useState(() => !Cookies.get(BETA_DISCLAIMER_COOKIE));

  const acceptDisclaimer = () => {
    Cookies.set(BETA_DISCLAIMER_COOKIE, "true", {
      path: "/",
      expires: ONE_YEAR_IN_DAYS,
      sameSite: "Lax",
    });
    setOpen(false);
  };

  // Deliberately uncontrolled by `onOpenChange`: the dialog must not close on
  // Escape or a backdrop click, only on the acknowledgement button.
  return (
    <Dialog.Root open={open} size="xl" role="alertdialog" placement="center">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title textStyle="h3">
                WCA Website Redesign Beta Disclaimer
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body display="flex" alignItems="center">
              <Text textStyle="s2">
                You are viewing the beta version of the redesigned WCA Website.
                This is intended to give the community a sneak peek at the
                website, for feedback and discussion. <br /> You should expect
                to find glitches and issues when browsing the website - when you
                do, please report them to{" "}
                <Link
                  href="mailto:software@worldcubeassociation.org"
                  textStyle="s2"
                >
                  software@worldcubeassociation.org
                </Link>
                .
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="pastelSolid"
                size="lg"
                w={{ base: "full", md: "auto" }}
                onClick={acceptDisclaimer}
              >
                I understand, let me in!
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
