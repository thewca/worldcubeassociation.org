import { Accordion, Link as ChakraLink } from "@chakra-ui/react";
import { ChakraMarkdown } from "@/components/Markdown";
import { Announcement, User } from "@/types/payload";
import { LuChevronsRight } from "react-icons/lu";

function AnnouncementItem({ announcement }: { announcement: Announcement }) {
  const publishedByUser = announcement.publishedBy as User;

  return (
    <Accordion.Item
      value={announcement.id}
      layerStyle="fill.subtle"
      _open={{ layerStyle: "card.pastel" }}
    >
      <Accordion.ItemTrigger textStyle="s1" _open={{ textStyle: "h2" }}>
        <Accordion.ItemIndicator _open={{ display: "none" }} />
        {announcement.title}
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        <Accordion.ItemBody textStyle="s2">
          Posted by {publishedByUser.name} · {announcement.publishedAt}
        </Accordion.ItemBody>
        <ChakraMarkdown paragraphAs={Accordion.ItemBody} textStyle="body">
          {announcement.contentMarkdown}
        </ChakraMarkdown>
      </Accordion.ItemContent>
    </Accordion.Item>
  );
}

export default function AnnouncementsCard({
  hero,
  others = [],
  colorPalette,
  showSeeAll = true,
  fill = false,
}: {
  hero: Announcement;
  others: Announcement[];
  colorPalette: string;
  showSeeAll?: boolean;
  fill?: boolean;
}) {
  return (
    <Accordion.Root
      variant="card"
      defaultValue={[hero.id]}
      colorPalette={colorPalette}
      height={fill ? "full" : undefined}
    >
      <AnnouncementItem announcement={hero} />

      {others.map((announcement) => (
        <AnnouncementItem key={announcement.id} announcement={announcement} />
      ))}

      {showSeeAll && (
        <Accordion.Item value="see-all" layerStyle="fill.subtle">
          <Accordion.ItemTrigger textStyle="s1" asChild>
            <ChakraLink href="/posts" color="currentColor">
              <Accordion.ItemIndicator transition={undefined}>
                <LuChevronsRight />
              </Accordion.ItemIndicator>
              See all announcements
            </ChakraLink>
          </Accordion.ItemTrigger>
        </Accordion.Item>
      )}
    </Accordion.Root>
  );
}
