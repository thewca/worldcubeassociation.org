"use client";

import { components } from "@/types/openapi";
import Loading from "@/components/ui/loading";
import { Text, Icon, Link, Heading } from "@chakra-ui/react";
import NextLink from "next/link";
import { route } from "nextjs-routes";
import { dateRange } from "@/lib/wca/dates";
import { isProbablyOver } from "@/lib/dates/competition";
import MapContainer, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { LuMapPin } from "react-icons/lu";
import { Tooltip } from "@/components/ui/tooltip";
import { useMemo } from "react";

interface MapProps {
  competitions:
    | components["schemas"]["CompetitionIndex"][]
    | components["schemas"]["CompetitionInfo"][];
  isLoading?: boolean;
}

// Limit number of markers on map, especially for "All Past Competitions"
export const MAP_DISPLAY_LIMIT = 500;

const tileProvider = {
  style: "https://tiles.openfreemap.org/styles/bright",
};

export default function Map({ competitions, isLoading = false }: MapProps) {
  const markers = useMemo(
    () =>
      competitions.slice(0, MAP_DISPLAY_LIMIT).map((comp) => (
        <Marker
          key={comp.id}
          longitude={comp.longitude_degrees}
          latitude={comp.latitude_degrees}
        >
          <Tooltip
            showArrow
            content={
              <Text>
                <Heading textStyle="headerLink">{comp.name}</Heading>
                <br />
                {`${dateRange(comp.start_date, comp.end_date)} - ${comp.city}`}
              </Text>
            }
          >
            <Icon asChild size="xl">
              <Link asChild>
                <NextLink
                  href={route({
                    pathname: "/competitions/[competitionId]",
                    query: { competitionId: comp.id },
                  })}
                >
                  <LuMapPin
                    size="xl"
                    fill="white"
                    color={isProbablyOver(comp.end_date) ? "blue" : "red"}
                  />
                </NextLink>
              </Link>
            </Icon>
          </Tooltip>
        </Marker>
      )),
    [competitions],
  );

  return (
    <MapContainer
      initialViewState={{ longitude: 0, latitude: 0, zoom: 2 }}
      mapStyle={tileProvider.style}
    >
      {isLoading && <Loading />}
      {markers}
    </MapContainer>
  );
}
