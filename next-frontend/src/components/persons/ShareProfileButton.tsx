"use client";

import { Clipboard, ClientOnly, IconButton, Skeleton } from "@chakra-ui/react";
import { LuCheck, LuShare2 } from "react-icons/lu";
import { route } from "nextjs-routes";
import { useT } from "@/lib/i18n/useI18n";

export default function ShareProfileButton({ wcaId }: { wcaId: string }) {
  const { t } = useT();

  const profilePath = route({ pathname: "/persons/[wcaId]", query: { wcaId } });

  return (
    <ClientOnly fallback={<Skeleton boxSize="10" />}>
      {() => (
        <Clipboard.Root
          value={new URL(profilePath, window.location.origin).href}
        >
          <Clipboard.Trigger asChild>
            <IconButton
              variant="ghost"
              aria-label={t("persons.show.copy_profile_link")}
            >
              <Clipboard.Indicator copied={<LuCheck />}>
                <LuShare2 />
              </Clipboard.Indicator>
            </IconButton>
          </Clipboard.Trigger>
        </Clipboard.Root>
      )}
    </ClientOnly>
  );
}
