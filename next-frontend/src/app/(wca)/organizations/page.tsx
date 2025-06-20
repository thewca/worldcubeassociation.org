"use client";

import {
  Box,
  Container,
  Heading,
  Link,
  SimpleGrid,
  Text,
  VStack,
  Image,
  List,
} from "@chakra-ui/react";
import Loading from "@/components/ui/loading";
import useAPI from "@/lib/wca/useAPI";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useT } from "@/lib/i18n/useI18n";
import Errored from "@/components/ui/errored";
import I18nHTMLTranslate from "@/components/I18nHTMLTranslate";
import _ from "lodash";

export default function RegionalOrganizations() {
  const I18n = useT();
  const api = useAPI();
  const { data: organizationRequest, isLoading } = useQuery({
    queryKey: ["regional-organizations"],
    queryFn: () => api.GET("/regional-organizations"),
  });

  const organizations = useMemo(
    () => organizationRequest?.data ?? [],
    [organizationRequest],
  );

  if (isLoading) return <Loading />;

  if (organizations.length === 0)
    return <Errored error={"Error Loading Regional Organizations"} />;

  return (
    <Container>
      <VStack align={"left"}>
        <Heading size={"5xl"}>{I18n.t("regional_organizations.title")}</Heading>
        <Text>{I18n.t("regional_organizations.content")}</Text>
        <SimpleGrid columns={3} gap="16px">
          {organizations.map((org) => (
            <Box
              key={org.name}
              position="relative"
              role="group"
              overflow="hidden"
              borderRadius="md"
              boxShadow="md"
              _hover={{ cursor: org.website ? "pointer" : "default" }}
            >
              <Link
                href={org.website}
                textDecoration="none"
                _hover={{ textDecoration: "none" }}
                display="block"
              >
                {org.logo_url && (
                  <Image
                    src={org.logo_url}
                    alt=""
                    objectFit="cover"
                    width="100%"
                    height="auto"
                    transition="opacity 0.3s"
                    _groupHover={{ opacity: 0.2 }}
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
                  _groupHover={{ opacity: 1 }}
                  transition="opacity 0.3s"
                  p={4}
                >
                  <Text fontSize="sm">{org.country}</Text>
                  <Text fontWeight="bold" fontSize="md" textAlign="center">
                    {org.name}
                  </Text>
                </VStack>
              </Link>
            </Box>
          ))}
        </SimpleGrid>
        <Heading size={"2xl"}>
          {I18n.t("regional_organizations.how_to.title")}
        </Heading>
        <Text>{I18n.t("regional_organizations.how_to.description")}</Text>

        <Heading size={"xl"}>
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

        <Heading size={"xl"}>
          {I18n.t("regional_organizations.application_instructions.title")}
        </Heading>
        <I18nHTMLTranslate i18nKey="regional_organizations.application_instructions.description_html" />
      </VStack>
    </Container>
  );
}
