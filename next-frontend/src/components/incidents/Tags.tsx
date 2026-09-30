"use client";

import React from "react";
import {
  Tag as ChakraTag,
  Link,
  Box,
  Popover,
  Separator,
  Button,
  Stack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { route } from "nextjs-routes";

import { usePermissionsQuery } from "@/lib/hooks/usePermissionsQuery";
import { useT } from "@/lib/i18n/useI18n";
import type { components } from "@/types/openapi";

const incidentSearchRoute = (tag: string) =>
  route({ pathname: "/incidents", query: { tags: tag } });

type IncidentTag = components["schemas"]["Incident"]["tags"][number];

// On the log itself a tag toggles the filter in place; on a single incident there is no filter to
// toggle, so the tag links back to the log instead.
export type TagAction =
  | { kind: "toggleFilter"; onToggle: (tag: string) => void }
  | { kind: "linkToLog" };

interface IncidentTagsProps {
  tags: IncidentTag[];
  action?: TagAction;
}

export function IncidentTags({ tags, action }: IncidentTagsProps) {
  const { t } = useT();

  return tags.map(({ name, id, url, content_html: contentHtml }) =>
    // non-regulation/guideline tags will only have a name
    id !== undefined ? (
      <RegulationTag
        key={id}
        id={id.toString()}
        typeLabel={t(
          url.includes("guideline")
            ? "incidents_log.tags.guideline"
            : "incidents_log.tags.regulation",
        )}
        link={url}
        description={contentHtml}
        action={action}
      />
    ) : (
      <MiscTag key={name} tag={name} action={action} />
    ),
  );
}

interface RegulationTagProps {
  id: string;
  typeLabel: string;
  description: string;
  link: string;
  action?: TagAction;
}

function RegulationTag({
  id,
  typeLabel,
  description,
  link,
  action,
}: RegulationTagProps) {
  return (
    <Tag
      tagType="incident"
      labelClass="primary"
      label={id}
      title={`${typeLabel} ${id}`}
      titleLink={link}
      description={description}
      buttons={action && <SearchForTag tag={id} action={action} />}
    />
  );
}

interface MiscTagProps {
  tag: string;
  action?: TagAction;
}

function MiscTag({ tag, action }: MiscTagProps) {
  return (
    <Tag
      tagType="incident"
      labelClass="default"
      label={tag}
      title={tag}
      buttons={action && <SearchForTag tag={tag} action={action} />}
    />
  );
}

function SearchForTag({ tag, action }: { tag: string; action: TagAction }) {
  const { t } = useT();

  if (action.kind === "linkToLog") {
    return (
      <Link asChild>
        <NextLink href={incidentSearchRoute(tag)}>
          {t("incidents_log.tags.search_with_tag")}
        </NextLink>
      </Link>
    );
  }

  return (
    <Button onClick={() => action.onToggle(tag)}>
      {t("incidents_log.tags.filter_by_tag")}
    </Button>
  );
}

interface CompetitionTagProps {
  id: string;
  name: string;
  comments: string | null | undefined;
}

const competitionUrl = (id: string) => `/competitions/${id}`;
const competitionReportUrl = (id: string) =>
  `/competitions/${id}/delegate-report`;

export function CompetitionTag({ id, name, comments }: CompetitionTagProps) {
  const { t } = useT();
  const { data: permissions } = usePermissionsQuery();
  const canViewDelegateMatters = permissions?.canViewDelegateReport(id);

  const links = (
    <>
      <Link href={competitionUrl(id)} className="hide-new-window-icon">
        {t("incidents_log.tags.competition_page")}
      </Link>
      {canViewDelegateMatters && (
        <>
          <br />
          <Link
            href={competitionReportUrl(id)}
            className="hide-new-window-icon"
          >
            {t("incidents_log.tags.delegate_report")}
          </Link>
        </>
      )}
    </>
  );

  return (
    <Tag
      tagType="competition"
      labelClass="info"
      label={id}
      title={name}
      description={canViewDelegateMatters ? comments : null}
      links={links}
    />
  );
}

interface TagProps {
  tagType: string;
  labelClass: "primary" | "default" | "info";
  label: string;
  title: string;
  titleLink?: string;
  description?: string | null;
  links?: React.ReactNode;
  buttons?: React.ReactNode;
}

function Tag({
  labelClass,
  label,
  title,
  titleLink,
  description,
  links,
  buttons,
}: TagProps) {
  const colorSchemeMap: Record<string, string> = {
    primary: "blue",
    default: "gray",
    info: "teal",
  };

  return (
    <Popover.Root>
      <Popover.Trigger>
        <ChakraTag.Root
          size="md"
          colorScheme={colorSchemeMap[labelClass]}
          mr={2}
        >
          {label}
        </ChakraTag.Root>
      </Popover.Trigger>
      <Popover.Content>
        <Popover.Header fontWeight="bold">
          {titleLink ? (
            <Link href={titleLink} target="_blank" rel="noopener noreferrer">
              {title}
            </Link>
          ) : (
            title
          )}
        </Popover.Header>
        <Popover.Body>
          {/* Stack drops falsy children, so absent sections take no separator with them. */}
          <Stack separator={<Separator />} gap="2">
            {description && (
              <Box dangerouslySetInnerHTML={{ __html: description }} />
            )}
            {links && <Box>{links}</Box>}
            {buttons && <Box>{buttons}</Box>}
          </Stack>
        </Popover.Body>
      </Popover.Content>
    </Popover.Root>
  );
}
