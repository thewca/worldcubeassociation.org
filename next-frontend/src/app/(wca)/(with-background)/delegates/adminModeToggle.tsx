"use client";

import { Switch } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { route } from "nextjs-routes";

export default function AdminModeToggle({
  region,
  isAdminMode,
}: {
  region: string;
  isAdminMode: boolean;
}) {
  const router = useRouter();

  const setAdminMode = (enabled: boolean) =>
    router.replace(
      route({
        pathname: "/delegates",
        query: enabled ? { region, admin: "true" } : { region },
      }),
    );

  return (
    <Switch.Root
      checked={isAdminMode}
      onCheckedChange={(e) => setAdminMode(e.checked)}
    >
      <Switch.HiddenInput />
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
      {/* No i18n because this is only visible to admins */}
      <Switch.Label>Enable admin mode</Switch.Label>
    </Switch.Root>
  );
}
