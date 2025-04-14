import React from "react";
import { Card } from "@chakra-ui/react";
import { Stat, Heading, Text, Float, StatGroup } from "@chakra-ui/react";
import RecordsIcon from "@/components/icons/RecordsIcon";

interface RecordSummaryCardProps {
  world: number;
  continental: number;
  national: number;
}

const RecordSummaryCard: React.FC<RecordSummaryCardProps> = ({
  world,
  continental,
  national,
}) => {
  return (
    <Card.Root variant="summary" colorPalette="green" overflow="hidden">
      <Float placement="middle-end" offsetX="20">
          <RecordsIcon boxSize="13rem" color="colorPallete.200" opacity="0.3" />
      </Float>
      <Card.Body>
        <Card.Title>
          <Text
            fontSize="md"
            textTransform="uppercase"
            fontWeight="medium"
            letterSpacing="wider"
          >
            Record Collection
          </Text>
        </Card.Title>
        <StatGroup justifyContent="start" flexDirection="row" gap="5">
          {world > 0 && (
            <Stat.Root flex="0">
              <Stat.ValueText alignItems="baseline">
                <Heading size="3xl">{world}</Heading>
                <Stat.ValueUnit color="green.contrast">World</Stat.ValueUnit>
              </Stat.ValueText>
            </Stat.Root>
          )}
          {continental > 0 && (
            <Stat.Root flex="0">
              <Stat.ValueText alignItems="baseline">
                <Heading size="3xl">{continental}</Heading>
                <Stat.ValueUnit color="green.contrast">
                  Continental
                </Stat.ValueUnit>
              </Stat.ValueText>
            </Stat.Root>
          )}
          {national > 0 && (
            <Stat.Root flex="0">
              <Stat.ValueText alignItems="baseline">
                <Heading size="3xl">{national}</Heading>
                <Stat.ValueUnit color="green.contrast">National</Stat.ValueUnit>
              </Stat.ValueText>
            </Stat.Root>
          )}
        </StatGroup>
      </Card.Body>
    </Card.Root>
  );
};

export default RecordSummaryCard;
