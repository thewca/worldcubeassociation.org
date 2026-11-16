"use client";

import { Alert, Link, Stack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import NextLink from "next/link";
import { route } from "nextjs-routes";
import ExternalLinkIcon from "@/components/icons/ExternalLinkIcon";
import { useT } from "@/lib/i18n/useI18n";
import { components } from "@/types/openapi";

const REDIRECT_DELAY_SECONDS = 5;

export default function ExternalLiveResults({
  competitionInfo,
  externalHref,
}: {
  competitionInfo: Pick<
    components["schemas"]["CompetitionInfo"],
    "id" | "name"
  >;
  externalHref?: string;
}) {
  const { t } = useT();
  const [redirectPending, setRedirectPending] = useState(true);

  useEffect(() => {
    if (!externalHref || !redirectPending) return;

    const timer = setTimeout(() => {
      globalThis.location.replace(externalHref);
    }, REDIRECT_DELAY_SECONDS * 1000);

    return () => clearTimeout(timer);
  }, [externalHref, redirectPending]);

  return (
    <Alert.Root status="info">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>
          {t("competitions.live.external_results.title", {
            competition_name: competitionInfo.name,
          })}
        </Alert.Title>
        <Alert.Description asChild>
          <Stack gap="3">
            {externalHref ? (
              <>
                <Text>
                  {t("competitions.live.external_results.description")}
                </Text>
                <Link
                  href={externalHref}
                  onClick={() => setRedirectPending(false)}
                  alignSelf="start"
                >
                  {t("competitions.live.external_results.link")}
                  <ExternalLinkIcon flexShrink="0" />
                </Link>
                {redirectPending && (
                  <Text>
                    {t("competitions.live.external_results.redirect_notice", {
                      seconds: REDIRECT_DELAY_SECONDS,
                    })}
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text>{t("competitions.live.incompatible.external")}</Text>
                <Link asChild alignSelf="start">
                  <NextLink
                    href={route({
                      pathname: "/competitions/[competitionId]",
                      query: { competitionId: competitionInfo.id },
                    })}
                  >
                    {t("competitions.competition_info.information")}
                  </NextLink>
                </Link>
              </>
            )}
          </Stack>
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}
