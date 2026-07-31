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
import type { components } from "@/types/openapi";

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
  return tags.map(({ name, id, url, content_html: contentHtml }) =>
    // non-regulation/guideline tags will only have a name
    id !== undefined ? (
      <RegulationTag
        key={id}
        id={id.toString()}
        type={url.indexOf("guideline") === -1 ? "Regulation" : "Guideline"}
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
  return (
    <Tag
      tagType="incident"
      labelClass="primary"
      label={id}
      title={`${type} ${id}`}
      titleLink={link}
      description={description}
      buttons={searchForTag(id, addToSearch, linkToSearch)}
    />
  );
}

interface MiscTagProps {
  tag: string;
  addToSearch?: (query: string) => void;
  linkToSearch?: boolean;
}

function searchForTag(
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
        Search incidents with this tag
      </Link>
    );
  }

  if (addToSearch) {
    return <Button onClick={() => addToSearch(tag)}>Filter by this tag</Button>;
  }
}

export function MiscTag({ tag, addToSearch, linkToSearch }: MiscTagProps) {
  return (
    <Tag
      tagType="incident"
      labelClass="default"
      label={tag}
      title={tag}
      buttons={searchForTag(tag, addToSearch, linkToSearch)}
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
  const { data: permissions } = usePermissionsQuery();
  const canViewDelegateMatters = permissions?.canViewDelegateReport(id);

  const links = (
    <>
      <Link href={competitionUrl(id)} className="hide-new-window-icon">
        Competition Page
      </Link>
      {canViewDelegateMatters && (
        <>
          <br />
          <Link
            href={competitionReportUrl(id)}
            className="hide-new-window-icon"
          >
            Delegate Report
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
