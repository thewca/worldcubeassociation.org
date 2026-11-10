import {
  Button,
  CloseButton,
  Drawer,
  Float,
  Heading,
  Link,
  Portal,
} from "@chakra-ui/react";
import NationalChampionshipIcon from "../icons/NationalChampionshipIcon";
import CompetitionShortlist from "./CompetitionShortlist";
import { useT } from "@/lib/i18n/useI18n";
import { components } from "@/types/openapi";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { route } from "nextjs-routes";

type FlyoutProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  comp: components["schemas"]["CompetitionIndex"] | null;
  isChampionship: boolean;
};

export default function FlyoutDrawer({
  open,
  setOpen,
  comp,
  isChampionship,
}: FlyoutProps) {
  const { t } = useT();
  const lng = useLocale();
  if (!comp) {
    return null;
  }
  return (
    <Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)} size="xl">
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner padding="4" alignItems="center">
          <Drawer.Content
            overflow="hidden"
            borderRadius="wca"
            height="max-content"
          >
            {isChampionship && (
              <Float
                placement="middle-end"
                offsetX="20"
                fontSize="21vw"
                opacity="0.1"
              >
                <NationalChampionshipIcon />
              </Float>
            )}
            <Drawer.Header>
              <Heading size="3xl">{comp.name}</Heading>
            </Drawer.Header>
            <Drawer.Body>
              <CompetitionShortlist
                comp={comp}
                t={t}
                lng={lng}
                items={[
                  "city",
                  "venue_address",
                  "start_date",
                  "event_ids",
                  "base_entry_fee_lowest_denomination",
                ]}
              />
            </Drawer.Body>
            <Drawer.Footer justifyContent="space-between" width="full">
              {/* TODO: Only Show register button/link if registration is not full */}
              <Button variant="outline" asChild>
                <Link
                  href={route({
                    pathname: "/competitions/[competitionId]/register",
                    query: { competitionId: comp.id },
                  })}
                >
                  {t("competitions.index.register_now")}
                </Link>
              </Button>
              <Button variant="solid" asChild>
                <Link
                  href={route({
                    pathname: "/competitions/[competitionId]",
                    query: { competitionId: comp.id },
                  })}
                >
                  {t("competitions.index.view_competition")}
                </Link>
              </Button>
            </Drawer.Footer>
            <Drawer.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}
