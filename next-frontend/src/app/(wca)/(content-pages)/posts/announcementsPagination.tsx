"use client";

import { ButtonGroup, IconButton, Pagination } from "@chakra-ui/react";
import Link from "next/link";
import { route } from "nextjs-routes";
import type { ComponentProps } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

const pageRoute = (page: number) =>
  route({ pathname: "/posts", query: { page: page.toString() } });

// An anchor cannot be disabled, so render the step out of bounds as a plain button.
function StepLink({
  targetPage,
  disabled,
  label,
  children,
  ...buttonProps
}: {
  targetPage: number;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
} & ComponentProps<typeof IconButton>) {
  if (disabled) {
    return (
      <IconButton {...buttonProps} disabled aria-label={label}>
        {children}
      </IconButton>
    );
  }

  return (
    <IconButton {...buttonProps} asChild>
      <Link href={pageRoute(targetPage)} aria-label={label}>
        {children}
      </Link>
    </IconButton>
  );
}

export default function AnnouncementsPagination({
  page,
  totalAnnouncements,
  pageSize,
}: {
  page: number;
  totalAnnouncements: number;
  pageSize: number;
}) {
  const totalPages = Math.ceil(totalAnnouncements / pageSize);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <Pagination.Root
      count={totalAnnouncements}
      pageSize={pageSize}
      page={page}
      alignSelf="center"
    >
      <ButtonGroup variant="ghost" size="sm" wrap="wrap">
        <Pagination.PrevTrigger asChild>
          <StepLink
            targetPage={page - 1}
            disabled={page === 1}
            label="Previous page"
          >
            <LuChevronLeft />
          </StepLink>
        </Pagination.PrevTrigger>

        <Pagination.Items
          render={(pageItem) => (
            <IconButton
              asChild
              variant={{ base: "ghost", _selected: "outline" }}
            >
              <Link href={pageRoute(pageItem.value)}>{pageItem.value}</Link>
            </IconButton>
          )}
        />

        <Pagination.NextTrigger asChild>
          <StepLink
            targetPage={page + 1}
            disabled={page === totalPages}
            label="Next page"
          >
            <LuChevronRight />
          </StepLink>
        </Pagination.NextTrigger>
      </ButtonGroup>
    </Pagination.Root>
  );
}
