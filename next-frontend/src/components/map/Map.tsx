"use client";

import { components } from "@/types/openapi";
import Loading from "@/components/ui/loading";
import { Text, Icon, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import { route } from "nextjs-routes";
import { dateRange } from "@/lib/wca/dates";
import { isProbablyOver } from "@/lib/dates/competition";
import MapContainer, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { LuMapPinPlusInside } from "react-icons/lu";
import { Tooltip } from "@/components/ui/tooltip";

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
  return (
    <MapContainer
      initialViewState={{ longitude: 0, latitude: 0, zoom: 2 }}
      mapStyle={tileProvider.style}
    >
      {isLoading && <Loading />}
      {competitions.slice(0, MAP_DISPLAY_LIMIT).map((comp) => (
        <Marker
          key={comp.id}
          longitude={comp.longitude_degrees}
          latitude={comp.latitude_degrees}
        >
          <Tooltip
            showArrow
            content={
              <Text>
                <Link asChild>
                  <NextLink
                    href={route({
                      pathname: "/competitions/[competitionId]",
                      query: { competitionId: comp.id },
                    })}
                  >
                    {comp.name}
                  </NextLink>
                </Link>
                <br />
                {`${dateRange(comp.start_date, comp.end_date)} - ${comp.city}`}
              </Text>
            }
          >
            <Icon asChild size="sm">
              <LuMapPinPlusInside
                color={isProbablyOver(comp.end_date) ? "blue" : "red"}
              />
            </Icon>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
