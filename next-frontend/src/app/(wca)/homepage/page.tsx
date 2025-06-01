"use server";

import React from "react";
import {
  SimpleGrid,
  GridItem,
  Button,
  Card,
  Separator,
  Box,
  Image,
  Heading,
  Text,
  Tabs,
  Badge,
  VStack,
} from "@chakra-ui/react";
import AnnouncementsCard from "@/components/AnnouncementsCard";
import { getPayload } from "payload";
import config from "@payload-config";

import CompRegoCloseDateIcon from "@/components/icons/CompRegoCloseDateIcon";
import CompetitorsIcon from "@/components/icons/CompetitorsIcon";
import RegisterIcon from "@/components/icons/RegisterIcon";
import LocationIcon from "@/components/icons/LocationIcon";

import Flag from "react-world-flags";
import CountryMap from "@/components/CountryMap";

const colorMap: Record<string, string> = {
  blue: "blue.50",
  red: "red.50",
  green: "green.50",
  orange: "orange.50",
  yellow: "yellow.50",
  darkBlue: "blue.100",
  darkRed: "red.100",
  darkGreen: "green.100",
  darkOrange: "orange.100",
  darkYellow: "yellow.100",
  white: "supplementary.texts.light",
  black: "supplementary.texts.dark",
};

const colorGradientMap: Record<string, string> = {
  blue: "blue-50",
  red: "red-50",
  green: "green-50",
  orange: "orange-50",
  yellow: "yellow-50",
  darkBlue: "blue-100",
  darkRed: "red-100",
  darkGreen: "green-100",
  darkOrange: "orange-100",
  darkYellow: "yellow-100",
};

const BasicCard = ({ heading, body, buttonText, buttonLink }) => {
  return (
    <Card.Root variant="info" size="lg" width="full">
      <Card.Body>
        <Card.Title>{heading}</Card.Title>
        <Separator size="md" />
        <Card.Description>{body}</Card.Description>
        {buttonText?.trim() && (
          <Button mr="auto" href={buttonLink}>
            {buttonText}
          </Button>
        )}
      </Card.Body>
    </Card.Root>
  );
};

const HeroCard = ({ heading, body, buttonText, buttonLink, colorPalette }) => {
  return (
    <Card.Root
      variant="info"
      size="lg"
      colorPalette={colorPalette}
      width="full"
    >
      <Card.Body>
        <Card.Title>{heading}</Card.Title>
        <Card.Description>{body}</Card.Description>
        {buttonText?.trim() && (
          <Button mr="auto" href={buttonLink}>
            {buttonText}
          </Button>
        )}
      </Card.Body>
    </Card.Root>
  );
};

const CardWithImage = ({ heading, body, buttonText, buttonLink, image }) => {
  return (
    <Card.Root variant="info" width="full">
      <Image
        src={image.url}
        alt="Green double couch with wooden legs"
        aspectRatio="3/1"
      />
      <Card.Body>
        <Card.Title>{heading}</Card.Title>
        <Separator size="md" />
        <Card.Description>{body}</Card.Description>
        {buttonText?.trim() && (
          <Button mr="auto" href={buttonLink}>
            {buttonText}
          </Button>
        )}
      </Card.Body>
    </Card.Root>
  );
};

const AnnouncementsSection = () => {
  return (
    <AnnouncementsCard
      hero={{
        title: "Big Update: WCA World Championship 2025!",
        postedBy: "Mitchell Anderson",
        postedAt: "May 25, 2025",
        markdown: `**Get ready!**\n\nThe next WCA World Championship is coming to Sydney 🇦🇺. More details soon.`,
        fullLink: "/articles/world-champs-2025",
      }}
      others={[
        {
          title: "New Regulations Update",
          href: "/articles/regulations-update",
        },
        {
          title: "Highlights from Asian Championship",
          href: "/articles/asia-highlights",
        },
      ]}
    />
  );
};

const ImageBanner = ({
  heading,
  body,
  image,
  colorPalette,
  headingColor,
  textColor,
  bgColor,
  bgImage,
  bgSize,
  bgPos,
}) => {
  return (
    <Card.Root
      variant="info"
      flexDirection="row"
      overflow="hidden"
      colorPalette={colorPalette}
      size="lg"
    >
      <Box position="relative" flex="1" minW="50%" maxW="50%" overflow="hidden">
        <Image
          src={image.url}
          alt="Cubing event"
          objectFit="cover"
          width="100%"
          height="40vh"
          bg={colorMap[bgColor]}
        />
        {/* Blue Gradient Overlay */}
        <Box
          position="absolute"
          top="0"
          right="0"
          bottom="0"
          left="50%"
          style={{
            backgroundImage: `linear-gradient(to right, transparent, var(--chakra-colors-${colorGradientMap[bgColor]}))`,
          }}
          zIndex="1"
        />
      </Box>

      <Card.Body
        flex="1"
        zIndex="2"
        color="white"
        p="8"
        bg={colorMap[bgColor]}
        justifyContent="center"
        pr="15%"
        backgroundImage={`url('${bgImage.url}')`}
        backgroundSize={`${bgSize}%`}
        backgroundPosition={bgPos}
        backgroundRepeat="no-repeat"
      >
        <Heading size="4xl" color={colorMap[headingColor]} mb="4">
          {heading}
        </Heading>
        <Text fontSize="md" color={colorMap[textColor]}>
          {body}
        </Text>
      </Card.Body>
    </Card.Root>
  );
};

const ImageCard = ({ heading, image, colorPalette }) => {
  return (
    <Card.Root
      overflow="hidden"
      variant="hero"
      colorPalette={colorPalette}
      width="full"
    >
      <Image src={image.url} alt={heading} aspectRatio={2 / 1} />
      <Card.Body p={6}>
        <Heading size="3xl" textTransform="uppercase">
          {heading}
        </Heading>
      </Card.Body>
    </Card.Root>
  );
};

const FeaturedCompetitions = ({
  Competition1ID,
  colorPalette1,
  Competition2ID,
  colorPalette2,
}) => {
  return (
    <Card.Root variant="info" colorPalette="grey" width="full">
      <Card.Body justifyContent="space-around">
        <Card.Title display="flex" justifyContent="space-between">
          Featured Upcoming Competitions
          <Button variant="outline">View all Competitions</Button>
        </Card.Title>
        <SimpleGrid columns={2} rows={1} gap={4}>
          <Card.Root variant="info" colorPalette={colorPalette1}>
            <Card.Body>
              <Heading size="3xl">{Competition1ID}</Heading>
              <VStack alignItems="start">
                <Badge variant="information" colorPalette={colorPalette1}>
                  <Flag code={"US"} fallback={"US"} />
                  <CountryMap code="US" bold /> Seattle
                </Badge>
                <Badge variant="information" colorPalette={colorPalette1}>
                  <CompRegoCloseDateIcon />
                  <Text>Jul 3 - 6, 2025</Text>
                </Badge>
                <Badge variant="information" colorPalette={colorPalette1}>
                  <CompetitorsIcon />
                  2000 Competitor Limit
                </Badge>
                <Badge variant="information" colorPalette={colorPalette1}>
                  <RegisterIcon />0 Spots Left
                </Badge>
                <Badge variant="information" colorPalette={colorPalette1}>
                  <LocationIcon />
                  Seattle Convention Center
                </Badge>
              </VStack>
            </Card.Body>
          </Card.Root>

          <Card.Root variant="info" colorPalette="yellow">
            <Card.Body>
              <Heading size="3xl">{Competition2ID}</Heading>
              <VStack alignItems="start">
                <Badge variant="information" colorPalette={colorPalette2}>
                  <Flag code={"NZ"} fallback={"NZ"} />
                  <CountryMap code="NZ" bold /> Auckland
                </Badge>
                <Badge variant="information" colorPalette={colorPalette2}>
                  <CompRegoCloseDateIcon />
                  <Text>Dec 12 - 14, 2025</Text>
                </Badge>
                <Badge variant="information" colorPalette={colorPalette2}>
                  <CompetitorsIcon />
                  300 Competitor Limit
                </Badge>
                <Badge variant="information" colorPalette={colorPalette2}>
                  <RegisterIcon />
                  300 Spots Left
                </Badge>
                <Badge variant="information" colorPalette={colorPalette2}>
                  <LocationIcon />
                  Auckland Netball Centre
                </Badge>
              </VStack>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
};

const Testimonials = (entry = "") => {
  const slides = entry.entry.blocks;
  return (
    <Tabs.Root
      defaultValue={slides?.[0]?.id}
      variant="slider"
      orientation="vertical"
      width="full"
    >
      <Card.Root
        variant="info"
        flexDirection="row"
        overflow="hidden"
        colorPalette={
          slides.find((s) => s.id === slides?.[0]?.id)?.colorPalette
        }
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
              <Tabs.Trigger key={slide.id} value={slide.id} />
            ))}
          </Box>
        </Tabs.List>

        {/* Slides */}
        {slides.map((slide) => (
          <Tabs.Content key={slide.id} value={slide.id} asChild>
            <Card.Root
              variant="info"
              flexDirection="row"
              overflow="hidden"
              colorPalette={slide.colorPalette}
            >
              <Image
                src={slide.image?.url || "/placeholder.png"}
                alt={slide.image?.alt || slide.title}
                maxW="1/3"
                objectFit="cover"
              />
              <Card.Body pr="3em">
                <Card.Title>{slide.title}</Card.Title>
                <Separator size="md" />
                <Card.Description>{slide.description}</Card.Description>
                <Text>{slide.subtitle}</Text>
              </Card.Body>
            </Card.Root>
          </Tabs.Content>
        ))}
      </Card.Root>
    </Tabs.Root>
  );
};

const renderBlockGroup = (entry, keyPrefix = "") => {
  const isHorizontal = entry.alignment === "horizontal";
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

  return (
    <SimpleGrid
      key={keyPrefix}
      columns={isHorizontal ? columnCount : 1}
      rows={isHorizontal ? 1 : 2}
      gap={8}
      width="full"
    >
      {entry.blocks.map((subEntry, i) => {
        const key = `${keyPrefix}-${i}`;
        switch (subEntry.blockType) {
          case "BasicCard":
            return (
              <GridItem key={key} colSpan={columns[i]} display="flex">
                <BasicCard
                  heading={subEntry.heading}
                  body={subEntry.body}
                  buttonText={subEntry.buttonText}
                  buttonLink={subEntry.buttonLink}
                />
              </GridItem>
            );
          case "HeroCard":
            return (
              <GridItem key={key} colSpan={columns[i]} display="flex">
                <HeroCard
                  heading={subEntry.heading}
                  body={subEntry.body}
                  buttonText={subEntry.buttonText}
                  buttonLink={subEntry.buttonLink}
                  colorPalette={subEntry.colorPalette}
                />
              </GridItem>
            );
          case "CardWithImage":
            return (
              <GridItem key={key} colSpan={columns[i]} display="flex">
                <CardWithImage
                  heading={subEntry.heading}
                  body={subEntry.body}
                  buttonText={subEntry.buttonText}
                  buttonLink={subEntry.buttonLink}
                  image={subEntry.image}
                />
              </GridItem>
            );

          case "AnnouncementsSection":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex">
                <AnnouncementsSection />
              </GridItem>
            );

          case "twoBlocksBranch":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex">
                {renderBlockGroup(subEntry, key)}
              </GridItem>
            );
          case "twoBlocksLeaf":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex">
                {renderBlockGroup(subEntry, key)}
              </GridItem>
            );
          case "ImageBanner":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex">
                <ImageBanner
                  key={key}
                  heading={subEntry.heading}
                  body={subEntry.body}
                  image={subEntry.mainImage}
                  colorPalette={subEntry.colorPalette}
                  headingColor={subEntry.headingColor}
                  textColor={subEntry.textColor}
                  bgColor={subEntry.bgColor}
                  bgSize={subEntry.bgSize}
                  bgPos={subEntry.bgPos}
                  bgImage={subEntry.bgImage}
                ></ImageBanner>
              </GridItem>
            );
          case "ImageCard":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex">
                <ImageCard
                  key={key}
                  heading={subEntry.heading}
                  image={subEntry.mainImage}
                  colorPalette={subEntry.colorPalette}
                ></ImageCard>
              </GridItem>
            );
          case "FeaturedCompetitions":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex">
                <FeaturedCompetitions
                  key={key}
                  Competition1ID={subEntry.Competition1ID}
                  colorPalette1={subEntry.colorPalette1}
                  Competition2ID={subEntry.Competition2ID}
                  colorPalette2={subEntry.colorPalette2}
                ></FeaturedCompetitions>
              </GridItem>
            );
          case "testimonials":
            return (
              <GridItem key={key} colSpan={columns[i] || 1} display="flex">
                <Testimonials key={key} entry={subEntry}></Testimonials>
              </GridItem>
            );

          default:
            return null;
        }
      })}
    </SimpleGrid>
  );
};

const renderFullBlock = (entry, keyPrefix = "") => {
  return (
    <Box key={keyPrefix} width="full">
      {entry.blocks.map((subEntry, i) => {
        const key = `${keyPrefix}-${i}`;
        switch (subEntry.blockType) {
          case "BasicCard":
            return (
              <BasicCard
                heading={subEntry.heading}
                body={subEntry.body}
                buttonText={subEntry.buttonText}
                buttonLink={subEntry.buttonLink}
              />
            );
          case "HeroCard":
            return (
              <HeroCard
                heading={subEntry.heading}
                body={subEntry.body}
                buttonText={subEntry.buttonText}
                buttonLink={subEntry.buttonLink}
                colorPalette={subEntry.colorPalette}
              />
            );

          case "AnnouncementsSection":
            return <AnnouncementsSection />;

          case "ImageBanner":
            return (
              <ImageBanner
                key={key}
                heading={subEntry.heading}
                body={subEntry.body}
                image={subEntry.mainImage}
                colorPalette={subEntry.colorPalette}
                headingColor={subEntry.headingColor}
                textColor={subEntry.textColor}
                bgColor={subEntry.bgColor}
                bgSize={subEntry.bgSize}
                bgPos={subEntry.bgPos}
                bgImage={subEntry.bgImage}
              ></ImageBanner>
            );
          case "ImageCard":
            return (
              <ImageCard
                key={key}
                heading={subEntry.heading}
                image={subEntry.mainImage}
                colorPalette={subEntry.colorPalette}
              ></ImageCard>
            );
          case "FeaturedCompetitions":
            return (
              <FeaturedCompetitions
                key={key}
                Competition1ID={subEntry.Competition1ID}
                colorPalette1={subEntry.colorPalette1}
                Competition2ID={subEntry.Competition2ID}
                colorPalette2={subEntry.colorPalette2}
              ></FeaturedCompetitions>
            );
          case "Testimonials":
            return <Testimonials key={key} entry={subEntry}></Testimonials>;

          default:
            return null;
        }
      })}
    </Box>
  );
};

export default async function Homepage() {
  const payload = await getPayload({ config });
  const homepage = await payload.findGlobal({ slug: "home" });

  const homepageEntries = homepage?.item || [];

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
