"use client";

import React from "react";
import {
  Tag as ChakraTag,
  Link,
  Box,
  Popover,
  Separator,
  Button,
} from "@chakra-ui/react";

import { usePermissionsQuery } from "@/lib/hooks/usePermissionsQuery";
import { useT } from "@/lib/i18n/useI18n";
import type { components } from "@/types/openapi";
import { TFunction } from "i18next";

const incidentSearchUrl = (tag: string) =>
  `/incidents?tags=${encodeURIComponent(tag)}`;

type IncidentTag = components["schemas"]["Incident"]["tags"][number];

interface IncidentTagsProps {
  tags: IncidentTag[];
  addToSearch?: (tag: string) => void;
  linkToSearch?: boolean;
}

export function IncidentTags({
  tags,
  addToSearch,
  linkToSearch,
}: IncidentTagsProps) {
  const { t } = useT();

  return tags.map(({ name, id, url, content_html: contentHtml }) =>
    // non-regulation/guideline tags will only have a name
    id !== undefined ? (
      <RegulationTag
        key={id}
        id={id.toString()}
        type={t(
          url.indexOf("guideline") === -1
            ? "incidents_log.tags.regulation"
            : "incidents_log.tags.guideline",
        )}
        link={url}
        description={contentHtml}
        addToSearch={addToSearch}
        linkToSearch={linkToSearch}
      />
    ) : (
      <MiscTag
        key={name}
        tag={name}
        addToSearch={addToSearch}
        linkToSearch={linkToSearch}
      />
    ),
  );
}

interface RegulationTagProps {
  id: string;
  type: string;
  description: string;
  link: string;
  addToSearch?: (query: string) => void;
  linkToSearch?: boolean;
}

export function RegulationTag({
  id,
  type,
  description,
  link,
  addToSearch,
  linkToSearch,
}: RegulationTagProps) {
  const { t } = useT();

  return (
    <Tag
      tagType="incident"
      labelClass="primary"
      label={id}
      title={`${type} ${id}`}
      titleLink={link}
      description={description}
      buttons={searchForTag(t, id, addToSearch, linkToSearch)}
    />
  );
}

interface MiscTagProps {
  tag: string;
  addToSearch?: (query: string) => void;
  linkToSearch?: boolean;
}

function searchForTag(
  t: TFunction,
  tag: string,
  addToSearch?: (tag: string) => void,
  linkToSearch?: boolean,
) {
  if (linkToSearch) {
    return (
      <Link
        href={incidentSearchUrl(tag)}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("incidents_log.tags.search_with_tag")}
      </Link>
    );
  }

  if (addToSearch) {
    return (
      <Button onClick={() => addToSearch(tag)}>
        {t("incidents_log.tags.filter_by_tag")}
      </Button>
    );
  }
}

export function MiscTag({ tag, addToSearch, linkToSearch }: MiscTagProps) {
  const { t } = useT();

  return (
    <Tag
      tagType="incident"
      labelClass="default"
      label={tag}
      title={tag}
      buttons={searchForTag(t, tag, addToSearch, linkToSearch)}
    />
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

  const sections = [
    description && <Box dangerouslySetInnerHTML={{ __html: description }} />,
    links && <Box>{links}</Box>,
    buttons && <Box>{buttons}</Box>,
  ].filter(Boolean);

  return (
    <Popover.Root>
      <Popover.Trigger>
        <ChakraTag.Root
          size="md"
          colorScheme={colorSchemeMap[labelClass]}
          cursor="pointer"
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
          {sections.map((section, index) => (
            <React.Fragment key={index}>
              {index > 0 && <Separator my={2} />}
              {section}
            </React.Fragment>
          ))}
        </Popover.Body>
      </Popover.Content>
    </Popover.Root>
  );
}
