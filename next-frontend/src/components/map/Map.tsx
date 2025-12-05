"use client";

import { components } from "@/types/openapi";
import Loading from "@/components/ui/loading";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { AspectRatio, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import { route } from "nextjs-routes";
import { dateRange } from "@/lib/wca/dates";
import { isProbablyOver } from "@/lib/dates/competition";
import ResizeMapIFrame from "@/components/map/ResizeMapIFrame";
import { blueMarker, redMarker } from "@/components/map/Markers";
import "leaflet/dist/leaflet.css";

interface MapProps {
  competitions:
    | components["schemas"]["CompetitionIndex"][]
    | components["schemas"]["CompetitionInfo"][];
  isLoading?: boolean;
}

// Limit number of markers on map, especially for "All Past Competitions"
export const MAP_DISPLAY_LIMIT = 500;

const tileProvider = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
};

export default function Map({ competitions, isLoading = false }: MapProps) {
  return (
    <AspectRatio ratio={16 / 9}>
      <MapContainer center={[0, 0]} zoom={2} scrollWheelZoom>
        {isLoading && <Loading />}
        <ResizeMapIFrame />
        <TileLayer
          url={tileProvider.url}
          attribution={tileProvider.attribution}
        />
        {competitions.slice(0, MAP_DISPLAY_LIMIT).map((comp) => (
          <Marker
            key={comp.id}
            position={{
              lat: comp.latitude_degrees,
              lng: comp.longitude_degrees,
            }}
            icon={isProbablyOver(comp.end_date) ? blueMarker : redMarker}
          >
            <Popup>
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
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </AspectRatio>
  );
}
