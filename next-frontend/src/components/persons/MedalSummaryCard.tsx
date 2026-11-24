import React from "react";
import { Stat, Card, Heading, Float, StatGroup } from "@chakra-ui/react";
import MyResultsIcon from "@/components/icons/MyResultsIcon";
import { getT } from "@/lib/i18n/get18n";

interface MedalSummaryCardProps {
  gold: number;
  silver: number;
  bronze: number;
}

const MedalSummaryCard: React.FC<MedalSummaryCardProps> = async ({
  gold,
  silver,
  bronze,
}) => {
  const { t } = await getT();

  return (
    <Card.Root colorVariant="solid" colorPalette="yellow" overflow="hidden">
      <Float placement="middle-end" offsetX="20">
        <MyResultsIcon
          boxSize="13rem"
          color="colorPalette.contrast"
          opacity="0.3"
        />
      </Float>
      <Card.Body>
        <Card.Title textStyle="s4">
          {t("persons.show.medal_collection")}
        </Card.Title>
        <StatGroup justifyContent="flex-start" gap="5">
          {gold > 0 && (
            <Stat.Root>
              <Stat.ValueText alignItems="baseline">
                <Heading size="3xl">{gold}</Heading>
                <Stat.ValueUnit color="yellow.contrast">
                  {t("persons.show.medals.gold")}
                </Stat.ValueUnit>
              </Stat.ValueText>
            </Stat.Root>
          )}
          {silver > 0 && (
            <Stat.Root>
              <Stat.ValueText alignItems="baseline">
                <Heading size="3xl">{silver}</Heading>
                <Stat.ValueUnit color="yellow.contrast">
                  {t("persons.show.medals.silver")}
                </Stat.ValueUnit>
              </Stat.ValueText>
            </Stat.Root>
          )}
          {bronze > 0 && (
            <Stat.Root>
              <Stat.ValueText alignItems="baseline">
                <Heading size="3xl">{bronze}</Heading>
                <Stat.ValueUnit color="yellow.contrast">
                  {t("persons.show.medals.bronze")}
                </Stat.ValueUnit>
              </Stat.ValueText>
            </Stat.Root>
          )}
        </StatGroup>
      </Card.Body>
    </Card.Root>
  );
};

export default MedalSummaryCard;
