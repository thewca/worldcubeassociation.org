import { Button, Link as ChakraLink } from "@chakra-ui/react";
import { announcementReadMoreHref } from "@/components/announcements/announcement";
import { Announcement } from "@/types/payload";

export default function ReadMoreButton({
  announcement,
}: {
  announcement: Announcement;
}) {
  return (
    <Button variant="pastelSolid" size="sm" alignSelf="flex-start" asChild>
      <ChakraLink
        href={announcementReadMoreHref(announcement)}
        color="currentColor"
      >
        Read More
      </ChakraLink>
    </Button>
  );
}
