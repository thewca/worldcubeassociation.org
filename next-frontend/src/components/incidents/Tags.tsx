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

interface RegulationTagProps {
  id: string;
  type: string;
  description: string;
  link: string;
  addToSearch?: (query: string) => void;
}

export function RegulationTag({
  id,
  type,
  description,
  link,
  addToSearch,
}: RegulationTagProps) {
  const links = (
    <Link href={link} className="hide-new-window-icon">
      {type}s Reference
    </Link>
  );

  return (
    <Tag
      tagType="incident"
      labelClass="primary"
      label={id}
      title={`${type} ${id}`}
      description={description}
      links={links}
      buttons={addToSearch && SearchForTagButton(addToSearch, id)}
    />
  );
}

interface MiscTagProps {
  tag: string;
  addToSearch?: (query: string) => void;
}

function SearchForTagButton(
  addTagToSearch: (tag: string) => void,
  tag: string,
) {
  return (
    <Button onClick={() => addTagToSearch(tag)}>Filter by this tag</Button>
  );
}

export function MiscTag({ tag, addToSearch }: MiscTagProps) {
  return (
    <Tag
      tagType="incident"
      labelClass="default"
      label={tag}
      title={tag}
      buttons={addToSearch && SearchForTagButton(addToSearch, tag)}
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

  const links = canViewDelegateMatters ? (
    <>
      <Link href={competitionUrl(id)} className="hide-new-window-icon">
        Competition Page
      </Link>
      <br />
      <Link href={competitionReportUrl(id)} className="hide-new-window-icon">
        Delegate Report
      </Link>
    </>
  ) : (
    <Link href={competitionUrl(id)} className="hide-new-window-icon">
      Competition Page
    </Link>
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
  description?: string | null;
  links?: React.ReactNode;
  buttons?: React.ReactNode;
}

function Tag({
  labelClass,
  label,
  title,
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
          cursor="pointer"
          mr={2}
        >
          {label}
        </ChakraTag.Root>
      </Popover.Trigger>
      <Popover.Content>
        <Popover.Header fontWeight="bold">{title}</Popover.Header>
        <Popover.Body>
          {description && (
            <>
              <Separator my={2} />
              <Box dangerouslySetInnerHTML={{ __html: description }} />
            </>
          )}
          {links && (
            <>
              <Separator my={2} />
              <Box>{links}</Box>
            </>
          )}
          {buttons && (
            <>
              <Separator my={2} />
              <Box>{buttons}</Box>
            </>
          )}
        </Popover.Body>
      </Popover.Content>
    </Popover.Root>
  );
}
