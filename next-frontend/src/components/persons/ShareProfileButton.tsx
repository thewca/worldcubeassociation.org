"use client";

import { useSyncExternalStore } from "react";
import { Clipboard, IconButton } from "@chakra-ui/react";
import { LuCheck, LuShare2 } from "react-icons/lu";
import { route } from "nextjs-routes";

const neverChanges = () => () => {};

export default function ShareProfileButton({ wcaId }: { wcaId: string }) {
  // The server can't tell which host the page was requested from, so the absolute link is only
  // known once the button hydrates.
  const origin = useSyncExternalStore(
    neverChanges,
    () => window.location.origin,
    () => undefined,
  );

  const profileUrl =
    origin &&
    new URL(route({ pathname: "/persons/[wcaId]", query: { wcaId } }), origin)
      .href;

  return (
    <Clipboard.Root value={profileUrl}>
      <Clipboard.Trigger asChild>
        <IconButton variant="ghost" aria-label="Copy link to profile">
          <Clipboard.Indicator copied={<LuCheck />}>
            <LuShare2 />
          </Clipboard.Indicator>
        </IconButton>
      </Clipboard.Trigger>
    </Clipboard.Root>
  );
}
