import React from "react";
import { Stat, Card, Heading, Text, Float, StatGroup } from "@chakra-ui/react";
import MyResultsIcon from "@/components/icons/MyResultsIcon";

interface MedalSummaryCardProps {
  gold: number;
  silver: number;
  bronze: number;
}

const MedalSummaryCard: React.FC<MedalSummaryCardProps> = ({
  gold,
  silver,
  bronze,
}) => {
  return (
    <Card.Root variant="summary" colorPalette="yellow" overflow="hidden">
      <Float placement="middle-end" offsetX="20">
        <MyResultsIcon boxSize="13rem" color="colorPallete.200" opacity="0.3" />
      </Float>
      <Card.Body>
        <Card.Title>
          <Text
            fontSize="md"
            textTransform="uppercase"
            fontWeight="medium"
            letterSpacing="wider"
          >
            Medals
          </Text>
        </Card.Title>
        <StatGroup justifyContent="start" flexDirection="row" gap="5">
          {gold > 0 && (
            <Stat.Root flex="0">
              <Stat.ValueText alignItems="baseline">
                <Heading size="3xl">{gold}</Heading>
                <Stat.ValueUnit color="yellow.contrast">Gold</Stat.ValueUnit>
              </Stat.ValueText>
            </Stat.Root>
          )}
          {silver > 0 && (
            <Stat.Root flex="0">
              <Stat.ValueText alignItems="baseline">
                <Heading size="3xl">{silver}</Heading>
                <Stat.ValueUnit color="yellow.contrast">Silver</Stat.ValueUnit>
              </Stat.ValueText>
            </Stat.Root>
          )}
          {bronze > 0 && (
            <Stat.Root flex="0">
              <Stat.ValueText alignItems="baseline">
                <Heading size="3xl">{bronze}</Heading>
                <Stat.ValueUnit color="yellow.contrast">Bronze</Stat.ValueUnit>
              </Stat.ValueText>
            </Stat.Root>
          )}
        </StatGroup>
      </Card.Body>
    </Card.Root>
  );
};

export default MedalSummaryCard;
