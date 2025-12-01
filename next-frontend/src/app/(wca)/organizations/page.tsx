"use server";

import {
  Container,
  Heading,
  Link,
  SimpleGrid,
  Text,
  VStack,
  Image,
  List,
  Icon,
  Float,
  LinkBox,
  LinkOverlay,
} from "@chakra-ui/react";
import Loading from "@/components/ui/loading";
import { getRegionalOrganizations } from "@/lib/wca/organizations/getRegionalOrganizations";
import { getT } from "@/lib/i18n/get18n";
import Errored from "@/components/ui/errored";
import I18nHTMLTranslate from "@/components/I18nHTMLTranslate";
import _ from "lodash";
import WcaFlag from "@/components/WcaFlag";

export default async function RegionalOrganizations() {
  const I18n = await getT();

  const { data: organizations, error } = await getRegionalOrganizations();

  if (error) return <Errored error={error} />;
  if (!organizations) return <Loading />;

  return (
    <Container>
      <VStack align="left">
        <Heading size="5xl">{I18n.t("regional_organizations.title")}</Heading>
        <Text>{I18n.t("regional_organizations.content")}</Text>
        <SimpleGrid columns={3} columnGap={4} rowGap={6}>
          {organizations.map((org) => (
            <LinkBox
              key={org.name}
              position="relative"
              role="group"
              borderRadius="md"
              boxShadow="md"
              _hover={{ cursor: org.website ? "pointer" : "default" }}
            >
              <Float offsetX={6}>
                <Icon asChild size="sm">
                  <WcaFlag code={org.country_iso2} />
                </Icon>
              </Float>
              {org.logo_url && (
                <Image
                  src={org.logo_url}
                  alt={org.name}
                  objectFit="cover"
                  width="100%"
                  height="auto"
                  transition="opacity 0.3s"
                  _hover={{ opacity: 0.2 }}
                />
              )}
              <VStack
                position={org.logo_url ? "absolute" : "relative"}
                top={0}
                left={0}
                right={0}
                bottom={0}
                justify="center"
                align="center"
                bg={org.logo_url ? "rgba(255,255,255,0.9)" : "transparent"}
                opacity={org.logo_url ? 0 : 1}
                _hover={{ opacity: 1 }}
                transition="opacity 0.3s"
                p={4}
              >
                <LinkOverlay asChild>
                  <Link
                    href={org.website}
                    textStyle="headerLink"
                    textAlign="center"
                  >
                    {org.name}
                  </Link>
                </LinkOverlay>
              </VStack>
            </LinkBox>
          ))}
        </SimpleGrid>
        <Heading size="2xl">
          {I18n.t("regional_organizations.how_to.title")}
        </Heading>
        <Text>{I18n.t("regional_organizations.how_to.description")}</Text>

        <Heading size="xl">
          {I18n.t("regional_organizations.requirements.title")}
        </Heading>
        <List.Root>
          {_.times(6).map((requirement) => (
            <List.Item
              key={`regional_organizations.requirements.list.${requirement}`}
            >
              {I18n.t(
                `regional_organizations.requirements.list.${requirement + 1}`,
              )}
            </List.Item>
          ))}
        </List.Root>

        <Heading size="xl">
          {I18n.t("regional_organizations.application_instructions.title")}
        </Heading>
        <I18nHTMLTranslate i18nKey="regional_organizations.application_instructions.description_html" />
      </VStack>
    </Container>
  );
}
