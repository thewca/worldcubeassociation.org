import React from "react";
import {
  SimpleGrid,
  GridItem,
  Button,
  Card,
  Separator,
  Box,
  Text,
  VStack,
  Link as ChakraLink,
  Center,
  HStack,
  AbsoluteCenter,
  Float,
  Carousel,
} from "@chakra-ui/react";
import { MarkdownProse } from "@/components/Markdown";
import AnnouncementsCard from "@/components/AnnouncementsCard";
import { getPayload } from "payload";
import config from "@payload-config";

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
  ColorPaletteSelect,
} from "@/types/payload";
import Link from "next/link";
import { route } from "nextjs-routes";
import { getT } from "@/lib/i18n/get18n";
import { draftMode } from "next/headers";
import { MediaImage } from "@/components/MediaImage";
import { getCompetitionInfo } from "@/lib/wca/competitions/getCompetitionInfo";
import CompetitionShortlist from "@/components/competitions/CompetitionShortlist";
import OpenapiError from "@/components/ui/openapiError";

const TextCard = ({ block }: { block: TextCardBlock }) => {
  return (
    <Card.Root
      colorPalette={block.colorPalette}
      colorVariant="deep"
      width="full"
    >
      {block.headerImage && (
        <MediaImage media={block.headerImage as Media} aspectRatio="3/1" />
      )}
      <Card.Body>
        <Card.Title textStyle="h2">{block.heading}</Card.Title>
        {block.separatorAfterHeading && <Separator size="md" />}
        <MarkdownProse
          as={Card.Description}
          content={block.bodyMarkdown!}
          textStyle="body"
        />
      </Card.Body>
      {block.buttonText?.trim() && (
        <Card.Footer>
          <Button asChild variant="outline" color="currentColor">
            <ChakraLink href={block.buttonLink!}>{block.buttonText}</ChakraLink>
          </Button>
        </Card.Footer>
      )}
    </Card.Root>
  );
};

const AnnouncementsSection = ({
  block,
}: {
  block: AnnouncementsSectionBlock;
}) => {
  const mainAnnouncement = block.mainAnnouncement as Announcement;
  const furtherAnnouncements = block.furtherAnnouncements!.map(
    (announcement) => announcement as Announcement,
  );

  return (
    <AnnouncementsCard
      hero={mainAnnouncement}
      others={furtherAnnouncements}
      colorPalette={block.colorPalette}
    />
  );
};

const ImageBanner = ({ block }: { block: ImageBannerBlock }) => {
  return (
    <Card.Root
      flexDirection="row"
      colorPalette={block.colorPalette}
      colorVariant="deep"
      width="full"
      maxHeight="lg"
      overflow="hidden"
    >
      <Box position="relative" width="50%">
        <MediaImage
          media={block.mainImage as Media}
          width="full"
          maxHeight="lg"
          bg="colorPalette.deep"
        />
        <AbsoluteCenter
          width="101%" // weirdly enough, 100% (or "full") creates a tiny gap even though it shouldn't. Shout if you know how to fix this!
          height="full"
          bg="linear-gradient(to right, transparent, transparent, {colors.colorPalette.deep})"
        />
      </Box>

      <Card.Body justifyContent="center">
        <Card.Title colorPalette={block.headingColor} textStyle="h1">
          {block.heading}
        </Card.Title>
        <MarkdownProse
          as={Card.Description}
          content={block.bodyMarkdown!}
          textStyle="s2"
        />
        {block.bgImage && (
          <Float
            placement="bottom-end"
            width={`${block.bgSize}%`}
            height={`${block.bgSize}%`}
            offset={28}
          >
            <MediaImage
              media={block.bgImage as Media}
              width="auto"
              height="full"
              fit="contain"
            />
          </Float>
        )}
      </Card.Body>
    </Card.Root>
  );
};

const ImageOnlyCard = ({ block }: { block: ImageOnlyCardBlock }) => {
  return (
    <Card.Root
      overflow="hidden"
      colorPalette={block.colorPalette}
      colorVariant="deep"
      width="full"
    >
      <MediaImage
        media={block.mainImage as Media}
        altFallback={block.heading}
        aspectRatio="2/1"
      />
      {block.heading && (
        <Card.Body>
          <Card.Title textStyle="h2">{block.heading}</Card.Title>
        </Card.Body>
      )}
    </Card.Root>
  );
};

const FeaturedCompetition = async ({
  competitionId,
  colorPalette,
}: {
  competitionId: string;
  colorPalette: ColorPaletteSelect;
}) => {
  const { t } = await getT();
  const {
    data: competition,
    error,
    response,
  } = await getCompetitionInfo(competitionId);

  if (error) return <OpenapiError t={t} response={response} />;

  return (
    <Card.Root colorPalette={colorPalette} colorVariant="deep">
      <Card.Body>
        <Card.Title textStyle="h2">{competition.name}</Card.Title>
        <CompetitionShortlist comp={competition} t={t} />
      </Card.Body>
    </Card.Root>
  );
};

const FeaturedCompetitions = async ({
  block,
}: {
  block: FeaturedCompetitionsBlock;
}) => (
  <Card.Root width="full">
    <Card.Body>
      <Card.Title textStyle="h2" asChild>
        <HStack justify="space-between">
          <Text>Featured Upcoming Competitions</Text>
          <Button asChild variant="outline" color="currentColor">
            <Link href="/competitions">View all Competitions</Link>
          </Button>
        </HStack>
      </Card.Title>
      <SimpleGrid columns={block.competitions?.length} gap={4}>
        {block.competitions?.map((featuredComp) => (
          <FeaturedCompetition
            key={featuredComp.id}
            competitionId={featuredComp.competitionId}
            colorPalette={featuredComp.colorPalette}
          />
        ))}
      </SimpleGrid>
    </Card.Body>
  </Card.Root>
);

const TestimonialsSpinner = ({ block }: { block: TestimonialsBlock }) => {
  const slides = block.slides;

  return (
    <Carousel.Root
      orientation="vertical"
      slideCount={slides.length}
      width="full"
      maxHeight="lg"
      loop
      position="relative"
    >
      <Carousel.ItemGroup width="full">
        {slides.map((slide, i) => {
          const testimonial = slide.testimonial as Testimonial;

          return (
            <Carousel.Item key={slide.id} index={i} asChild>
              <Card.Root
                colorVariant="deep"
                flexDirection="row"
                overflow="hidden"
                colorPalette={slide.colorPalette}
              >
                <MediaImage
                  media={testimonial.image as Media}
                  altFallback={testimonial.punchline}
                  maxW="1/3"
                />
                <Card.Body>
                  <Card.Title textStyle="h1">
                    {testimonial.punchline}
                  </Card.Title>
                  <Separator size="md" />
                  <MarkdownProse
                    as={Card.Description}
                    content={testimonial.fullTestimonialMarkdown!}
                    textStyle="quote"
                  />
                  <Text>{testimonial.whoDunnit}</Text>
                </Card.Body>
              </Card.Root>
            </Carousel.Item>
          );
        })}
        <Float placement="middle-end" offset={8}>
          <Carousel.Control>
            <Carousel.Indicators />
          </Carousel.Control>
        </Float>
      </Carousel.ItemGroup>
    </Carousel.Root>
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
              <GridItem
                key={key}
                colSpan={columns[i] || 1}
                display="flex"
                width="full"
              >
                <TextCard block={subEntry} />
              </GridItem>
            );
          case "AnnouncementsSection":
            return (
              <GridItem
                key={key}
                colSpan={columns[i] || 1}
                display="flex"
                width="full"
              >
                <AnnouncementsSection block={subEntry} />
              </GridItem>
            );
          case "twoBlocksBranch":
            return (
              <GridItem
                key={key}
                colSpan={columns[i] || 1}
                display="flex"
                width="full"
              >
                {renderBlockGroup(subEntry, key)}
              </GridItem>
            );
          case "twoBlocksLeaf":
            return (
              <GridItem
                key={key}
                colSpan={columns[i] || 1}
                display="flex"
                width="full"
              >
                {renderBlockGroup(subEntry, key)}
              </GridItem>
            );
          case "ImageBanner":
            return (
              <GridItem
                key={key}
                colSpan={columns[i] || 1}
                display="flex"
                width="full"
              >
                <ImageBanner block={subEntry} />
              </GridItem>
            );
          case "ImageOnlyCard":
            return (
              <GridItem
                key={key}
                colSpan={columns[i] || 1}
                display="flex"
                width="full"
              >
                <ImageOnlyCard block={subEntry} />
              </GridItem>
            );
          case "FeaturedComps":
            return (
              <GridItem
                key={key}
                colSpan={columns[i] || 1}
                display="flex"
                width="full"
              >
                <FeaturedCompetitions block={subEntry} />
              </GridItem>
            );
          case "TestimonialsSpinner":
            return (
              <GridItem
                key={key}
                colSpan={columns[i] || 1}
                display="flex"
                width="full"
              >
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
