"use server";

import React from "react";
import {
  SimpleGrid,
  GridItem,
  Button,
  Card,
  Separator,
  Box,
  Text,
  Tabs,
  Badge,
  VStack,
  Link as ChakraLink,
  Center,
  Icon,
  HStack,
} from "@chakra-ui/react";
import { MarkdownProse } from "@/components/Markdown";
import AnnouncementsCard from "@/components/AnnouncementsCard";
import { getPayload } from "payload";
import config from "@payload-config";

import CompRegoCloseDateIcon from "@/components/icons/CompRegoCloseDateIcon";
import CompetitorsIcon from "@/components/icons/CompetitorsIcon";
import RegisterIcon from "@/components/icons/RegisterIcon";
import LocationIcon from "@/components/icons/LocationIcon";

import WcaFlag from "@/components/WcaFlag";
import CountryMap from "@/components/CountryMap";

import type {
  TextCardBlock,
  FeaturedCompetitionsBlock,
  FullWidthBlock,
  ImageBannerBlock,
  ImageOnlyCardBlock,
  Media,
  TestimonialsBlock,
  TwoBlocksBlock,
  TwoBlocksBranchBlock,
  TwoBlocksLeafBlock,
  Testimonial,
  AnnouncementsSectionBlock,
  Announcement,
  User,
} from "@/types/payload";
import Link from "next/link";
import { route } from "nextjs-routes";
import { getT } from "@/lib/i18n/get18n";
import { draftMode } from "next/headers";
import { MediaImage } from "@/components/MediaImage";

const TextCard = ({ block }: { block: TextCardBlock }) => {
  return (
    <Card.Root
      variant={block.variant}
      size="lg"
      colorPalette={block.colorPalette}
      width="full"
    >
      {block.headerImage && (
        <MediaImage media={block.headerImage as Media} aspectRatio="3/1" />
      )}
      <Card.Body bg="colorPalette.textBox.bg" color="colorPalette.textBox.text">
        <Card.Title textStyle="h2">{block.heading}</Card.Title>
        {block.separatorAfterHeading && <Separator size="md" />}
        <MarkdownProse
          as={Card.Description}
          content={block.bodyMarkdown!}
          textStyle="body"
        />
      </Card.Body>
      <Card.Footer bg="colorPalette.textBox.bg">
        {block.buttonText?.trim() && (
          <Button mr="auto" asChild>
            <ChakraLink href={block.buttonLink!}>{block.buttonText}</ChakraLink>
          </Button>
        )}
      </Card.Footer>
    </Card.Root>
  );
};

const AnnouncementsSection = ({
  block,
}: {
  block: AnnouncementsSectionBlock;
}) => {
  const mainAnnouncement = block.mainAnnouncement as Announcement;

  return (
    <AnnouncementsCard
      hero={{
        title: mainAnnouncement.title,
        postedBy: (mainAnnouncement.publishedBy as User).name!,
        postedAt: mainAnnouncement.publishedAt,
        markdown: mainAnnouncement.contentMarkdown!,
        fullLink: `/articles/${mainAnnouncement.id}`,
      }}
      others={block
        .furtherAnnouncements!.map(
          (announcement) => announcement as Announcement,
        )
        .map((announcement) => ({
          title: announcement.title,
          href: `/articles/${announcement.id}`,
        }))}
      colorPalette={block.colorPalette}
    />
  );
};

const ImageBanner = ({ block }: { block: ImageBannerBlock }) => {
  // TODO GB flip, this should become "brighter" instead of "darker"
  const colorGradientMode = block.colorPaletteDarker ? ".brighter" : "";

  const headingColor = block.headingColor
    ? `${block.headingColor}.solid`
    : `colorPalette.textBox.text${colorGradientMode}`;

  return (
    <Card.Root
      variant="info"
      flexDirection="row"
      overflow="hidden"
      colorPalette={block.colorPalette}
    >
      <Box position="relative" width="50%" overflow="hidden">
        <MediaImage
          media={block.mainImage as Media}
          objectFit="cover"
          width="100%"
          height="40vh"
          bg={`colorPalette.textBox.bg${colorGradientMode}`}
        />
        {/* Gradient Overlay */}
        <Box
          position="absolute"
          top="0"
          right="0"
          bottom="0"
          left="50%"
          bgImage={`linear-gradient(to right, transparent, {colors.colorPalette.textBox.bg${colorGradientMode}})`}
          zIndex="1"
        />
      </Box>

      <Card.Body
        flex="1"
        zIndex="2"
        color="white"
        p="8"
        bg={`colorPalette.textBox.bg${colorGradientMode}`}
        justifyContent="center"
        paddingRight="15%"
        backgroundImage={
          block.bgImage != null
            ? `url('${(block.bgImage as Media).url}')`
            : undefined
        }
        backgroundSize={`${block.bgSize}%`}
        backgroundPosition={block.bgPos}
        backgroundRepeat="no-repeat"
      >
        <Card.Title color={headingColor} textStyle="h1">
          {block.heading}
        </Card.Title>
        <MarkdownProse
          as={Card.Description}
          content={block.bodyMarkdown!}
          color={`colorPalette.textBox.text${colorGradientMode}`}
          textStyle="s2"
        />
      </Card.Body>
    </Card.Root>
  );
};

const ImageOnlyCard = ({ block }: { block: ImageOnlyCardBlock }) => {
  return (
    <Card.Root
      overflow="hidden"
      variant="hero"
      colorPalette={block.colorPalette}
      width="full"
    >
      <MediaImage
        media={block.mainImage as Media}
        altFallback={block.heading}
        aspectRatio="2/1"
      />
      {block.heading && (
        <Card.Body p={6}>
          <Card.Title textStyle="h2">{block.heading}</Card.Title>
        </Card.Body>
      )}
    </Card.Root>
  );
};

const FeaturedCompetitions = async ({
  block,
}: {
  block: FeaturedCompetitionsBlock;
}) => {
  const { t } = await getT();

  return (
    <Card.Root variant="info" colorPalette="white" width="full">
      <Card.Body>
        <Card.Title textStyle="h2" asChild>
          <HStack justify="space-between">
            <Text>Featured Upcoming Competitions</Text>
            <Button variant="outline" asChild>
              <Link href="/competitions">
                View all Competitions
              </Link>
            </Button>
          </HStack>
        </Card.Title>
        <SimpleGrid columns={block.competitions?.length} gap={4}>
          {block.competitions?.map((featuredComp) => (
            <Card.Root
              key={featuredComp.competitionId}
              variant="info"
              colorPalette={featuredComp.colorPalette}
            >
              <Card.Header bg="colorPalette.textBox.bg">
                <Card.Title textStyle="h2" color="colorPalette.textBox.text">
                  {featuredComp.competitionId}
                </Card.Title>
                <Card.Description>
                  <Badge
                    variant="information"
                    colorPalette={featuredComp.colorPalette}
                    textStyle="s3"
                  >
                    <Icon size="lg">
                      <WcaFlag code="US" fallback="US" />
                    </Icon>
                    <CountryMap
                      code="US"
                      t={t}
                      color="colorPalette.textBox.text"
                    />{" "}
                    Seattle
                  </Badge>
                </Card.Description>
              </Card.Header>
              <Card.Body bg="colorPalette.textBox.bg">
                <VStack alignItems="start">
                  <Badge
                    variant="information"
                    colorPalette={featuredComp.colorPalette}
                  >
                    <CompRegoCloseDateIcon />
                    <Text>Jul 3 - 6, 2025</Text>
                  </Badge>
                  <Badge
                    variant="information"
                    colorPalette={featuredComp.colorPalette}
                  >
                    <CompetitorsIcon />
                    2000 Competitor Limit
                  </Badge>
                  <Badge
                    variant="information"
                    colorPalette={featuredComp.colorPalette}
                  >
                    <RegisterIcon />0 Spots Left
                  </Badge>
                  <Badge
                    variant="information"
                    colorPalette={featuredComp.colorPalette}
                  >
                    <LocationIcon />
                    Seattle Convention Center
                  </Badge>
                </VStack>
              </Card.Body>
            </Card.Root>
          ))}
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
};

const TestimonialsSpinner = ({ block }: { block: TestimonialsBlock }) => {
  const slides = block.slides;

  return (
    <Tabs.Root
      defaultValue={slides[0].id}
      variant="slider"
      orientation="vertical"
      width="full"
    >
      <Card.Root
        variant="info"
        flexDirection="row"
        overflow="hidden"
        colorPalette={slides[0].colorPalette}
        position="relative"
        width="full"
      >
        {/* Dot Navigation */}
        <Tabs.List asChild>
          <Box
            position="absolute"
            right="6"
            top="50%"
            transform="translateY(-50%)"
            display="flex"
            flexDirection="column"
            gap="2"
            zIndex="10"
          >
            {slides.map((slide) => (
              <Tabs.Trigger key={slide.id} value={slide.id!} />
            ))}
          </Box>
        </Tabs.List>

        {/* Slides */}
        {slides.map((slide) => {
          const testimonial = slide.testimonial as Testimonial;

          return (
            <Tabs.Content key={slide.id} value={slide.id!} asChild>
              <Card.Root
                variant="info"
                flexDirection="row"
                overflow="hidden"
                colorPalette={slide.colorPalette}
              >
                <MediaImage
                  media={testimonial.image as Media}
                  srcFallback="/placeholder.png"
                  altFallback={testimonial.punchline}
                  maxW="1/3"
                  objectFit="cover"
                />
                <Card.Body pr="3em">
                  <Card.Title textStyle="h1">
                    {testimonial.punchline}
                  </Card.Title>
                  <Separator size="md" />
                  <MarkdownProse
                    as={Card.Description}
                    content={testimonial.fullTestimonialMarkdown!}
                    color="colorPalette.fg"
                    textStyle="quote"
                  />
                  <Text>{testimonial.whoDunnit}</Text>
                </Card.Body>
              </Card.Root>
            </Tabs.Content>
          );
        })}
      </Card.Root>
    </Tabs.Root>
  );
};

type TwoBlocksUnion =
  | TwoBlocksBlock
  | TwoBlocksBranchBlock
  | TwoBlocksLeafBlock;

const renderBlockGroup = (entry: TwoBlocksUnion, keyPrefix = "") => {
  let columnCount = 2;
  let col1 = 1;
  let col2 = 1;

  switch (entry.type) {
    case "1/3 & 2/3":
      columnCount = 3;
      col2 = 2;
      break;
    case "2/3 & 1/3":
      columnCount = 3;
      col1 = 2;
      break;
    case "1/2 & 1/2":
      columnCount = 2;
      break;
    case "1/4 & 3/4":
      columnCount = 4;
      col2 = 3;
      break;
    case "3/4 & 1/4":
      columnCount = 4;
      col1 = 3;
      break;
    default:
      columnCount = 2;
  }

  const columns = [col1, col2];

  const isHorizontal = entry.alignment === "horizontal";
  const RenderAs = isHorizontal ? SimpleGrid : VStack;

  return (
    <RenderAs key={keyPrefix} columns={columnCount} gap={8} width="full">
      {entry.blocks.map((subEntry, i) => {
        const key = `${keyPrefix}-${i}`;

        switch (subEntry.blockType) {
          case "TextCard":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex" width="full">
                <TextCard block={subEntry} />
              </GridItem>
            );
          case "AnnouncementsSection":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex" width="full">
                <AnnouncementsSection block={subEntry} />
              </GridItem>
            );
          case "twoBlocksBranch":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex" width="full">
                {renderBlockGroup(subEntry, key)}
              </GridItem>
            );
          case "twoBlocksLeaf":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex" width="full">
                {renderBlockGroup(subEntry, key)}
              </GridItem>
            );
          case "ImageBanner":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex" width="full">
                <ImageBanner block={subEntry} />
              </GridItem>
            );
          case "ImageOnlyCard":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex" width="full">
                <ImageOnlyCard block={subEntry} />
              </GridItem>
            );
          case "FeaturedComps":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex" width="full">
                <FeaturedCompetitions block={subEntry} />
              </GridItem>
            );
          case "TestimonialsSpinner":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex" width="full">
                <TestimonialsSpinner block={subEntry} />
              </GridItem>
            );
          default:
            return null;
        }
      })}
    </RenderAs>
  );
};

const renderFullBlock = (entry: FullWidthBlock, keyPrefix = "") => {
  return (
    <Box key={keyPrefix} width="full">
      {entry.blocks.map((subEntry, i) => {
        const key = `${keyPrefix}-${i}`;

        switch (subEntry.blockType) {
          case "TextCard":
            return <TextCard key={key} block={subEntry} />;
          case "AnnouncementsSection":
            return <AnnouncementsSection key={key} block={subEntry} />;
          case "ImageBanner":
            return <ImageBanner key={key} block={subEntry} />;
          case "ImageOnlyCard":
            return <ImageOnlyCard key={key} block={subEntry} />;
          case "FeaturedComps":
            return <FeaturedCompetitions key={key} block={subEntry} />;
          case "TestimonialsSpinner":
            return <TestimonialsSpinner key={key} block={subEntry} />;

          default:
            return null;
        }
      })}
    </Box>
  );
};

export default async function Homepage() {
  const payload = await getPayload({ config });
  const { isEnabled: isDraftMode } = await draftMode();
  const homepage = await payload.findGlobal({
    slug: "home",
    draft: isDraftMode,
  });

  const homepageEntries = homepage?.item || [];

  if (homepageEntries.length === 0) {
    return (
      <Center padding={10}>
        <Text>
          No homepage content yet, go ahead and{" "}
          <ChakraLink asChild>
            <Link
              href={route({ pathname: "/payload/[[...segments]]", query: {} })}
            >
              add some!
            </Link>
          </ChakraLink>
        </Text>
      </Center>
    );
  }

  return (
    <SimpleGrid columns={1} gap={8} p={8}>
      {homepageEntries.map((entry, index) => {
        // Handle `twoBlocks` layout
        if (entry.blockType === "twoBlocks") {
          return renderBlockGroup(entry, `entry-${index}`);
        }

        // Handle `fullWidth` layout
        if (entry.blockType === "fullWidth") {
          return renderFullBlock(entry, `entry-${index}`);
        }

        // Handle unknown blockType
        return null;
      })}
    </SimpleGrid>
  );
}
