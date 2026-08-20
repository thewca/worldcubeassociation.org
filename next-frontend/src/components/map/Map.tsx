"use client";

import { components } from "@/types/openapi";
import Loading from "@/components/ui/loading";
import { Box, Heading, Text, useToken } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { route } from "nextjs-routes";
import { dateRange, hasPassedEndOfDay } from "@/lib/wca/dates";
import MapContainer, { Layer, Popup, Source } from "react-map-gl/maplibre";
import type { MapEvent, MapLayerMouseEvent } from "react-map-gl/maplibre";
import type { FeatureCollection, Point } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import { useState } from "react";

type MapCompetition = Pick<
  components["schemas"]["CompetitionInfo"],
  | "id"
  | "name"
  | "city"
  | "start_date"
  | "end_date"
  | "latitude_degrees"
  | "longitude_degrees"
>;

interface MapProps {
  competitions: MapCompetition[];
  isLoading?: boolean;
}

// Limit number of markers on map, especially for "All Past Competitions"
export const MAP_DISPLAY_LIMIT = 500;

const TILE_STYLE = "https://tiles.openfreemap.org/styles/bright";

const PIN_LAYER_ID = "competition-pins";
const PIN_ICON_ID = "competition-pin";
const PIN_ICON_PIXEL_RATIO = 2;
const PIN_ICON_SIZE = 64;
const PIN_DISPLAY_SIZE = PIN_ICON_SIZE / PIN_ICON_PIXEL_RATIO;

// Lucide's `map-pin` as a filled silhouette, with the centre hole cut out by
//   `evenodd`. maplibre loads it as an SDF, which is what lets one image be
//   recoloured per competition by the `icon-color` expression below.
const PIN_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${PIN_ICON_SIZE}" height="${PIN_ICON_SIZE}" viewBox="0 0 24 24"><path fill="#000" fill-rule="evenodd" d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Zm-5 0a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z"/></svg>`;

export default function Map({ competitions, isLoading = false }: MapProps) {
  const router = useRouter();
  const [hoveredCompetitionId, setHoveredCompetitionId] = useState<string>();

  // maplibre paints in WebGL and cannot resolve the CSS variables that Chakra
  //   tokens compile to, so the pin palette has to be read as literal colours.
  //   That rules out the `solid` tokens, which resolve to a variable reference,
  //   so these name the rungs that `brandSolid` points red and blue at.
  const [upcomingColor, pastColor, haloColor] = useToken("colors", [
    "red.600",
    "blue.700",
    "white",
  ]);

  const shownCompetitions = competitions.slice(0, MAP_DISPLAY_LIMIT);

  const competitionPins: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: shownCompetitions.map((competition) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [
          competition.longitude_degrees,
          competition.latitude_degrees,
        ],
      },
      properties: {
        id: competition.id,
        isOver: hasPassedEndOfDay(competition.end_date),
      },
    })),
  };

  const competitionAt = (event: MapLayerMouseEvent) =>
    shownCompetitions.find(
      (competition) => competition.id === event.features?.[0]?.properties?.id,
    );

  const hoveredCompetition = shownCompetitions.find(
    (competition) => competition.id === hoveredCompetitionId,
  );

  const registerPinIcon = (event: MapEvent) => {
    const map = event.target;

    if (map.hasImage(PIN_ICON_ID)) {
      return;
    }

    const pinIcon = new window.Image(PIN_ICON_SIZE, PIN_ICON_SIZE);

    pinIcon.onload = () =>
      map.addImage(PIN_ICON_ID, pinIcon, {
        pixelRatio: PIN_ICON_PIXEL_RATIO,
        sdf: true,
      });

    pinIcon.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(PIN_ICON_SVG)}`;
  };

  const trackHoveredPin = (event: MapLayerMouseEvent) =>
    setHoveredCompetitionId(competitionAt(event)?.id);

  const openClickedCompetition = (event: MapLayerMouseEvent) => {
    const competition = competitionAt(event);

    if (!competition) {
      return;
    }

    router.push(
      route({
        pathname: "/competitions/[competitionId]",
        query: { competitionId: competition.id },
      }),
    );
  };

  return (
    <Box h="lg" w="full" position="relative">
      {isLoading && (
        <Box position="absolute" top="0" insetX="0" zIndex="1">
          <Loading />
        </Box>
      )}
      <MapContainer
        reuseMaps
        initialViewState={{ longitude: 0, latitude: 0, zoom: 2 }}
        mapStyle={TILE_STYLE}
        onLoad={registerPinIcon}
        onMouseMove={trackHoveredPin}
        onClick={openClickedCompetition}
        interactiveLayerIds={[PIN_LAYER_ID]}
        cursor={hoveredCompetition ? "pointer" : "grab"}
      >
        <Source id="competitions" type="geojson" data={competitionPins}>
          <Layer
            id={PIN_LAYER_ID}
            type="symbol"
            layout={{
              "icon-image": PIN_ICON_ID,
              "icon-anchor": "bottom",
              "icon-allow-overlap": true,
            }}
            paint={{
              "icon-color": [
                "case",
                ["get", "isOver"],
                pastColor,
                upcomingColor,
              ],
              "icon-halo-color": haloColor,
              "icon-halo-width": 1,
            }}
          />
        </Source>
        {hoveredCompetition && (
          <Popup
            longitude={hoveredCompetition.longitude_degrees}
            latitude={hoveredCompetition.latitude_degrees}
            anchor="bottom"
            offset={PIN_DISPLAY_SIZE}
            closeButton={false}
            closeOnClick={false}
          >
            <Heading textStyle="headerLink">{hoveredCompetition.name}</Heading>
            <Text>
              {`${dateRange(hoveredCompetition.start_date, hoveredCompetition.end_date)} - ${hoveredCompetition.city}`}
            </Text>
          </Popup>
        )}
      </MapContainer>
    </Box>
  );
}
