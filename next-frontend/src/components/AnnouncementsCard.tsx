import { Accordion } from "@chakra-ui/react";
import { ChakraMarkdown } from "@/components/Markdown";
import { Announcement, User } from "@/types/payload";

function AnnouncementItem({ announcement }: { announcement: Announcement }) {
  const publishedByUser = announcement.publishedBy as User;

  return (
    <Accordion.Item value={announcement.id} layerStyle="fill.deep">
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
}: {
  hero: Announcement;
  others: Announcement[];
  colorPalette: string;
}) {
  return (
    <Accordion.Root
      variant="card"
      defaultValue={[hero.id]}
      colorPalette={colorPalette}
    >
      <AnnouncementItem announcement={hero} />

      {others.map((announcement) => (
        <AnnouncementItem key={announcement.id} announcement={announcement} />
      ))}
    </Accordion.Root>
  );
}
