import { GeoCoordinates } from "@/lib/types/geolocation";

export const EARTH_RADIUS_KM = 6371;

// Haversine formula to compute distance between two lat/lng pairs
export function getDistanceInKm(
  position1: GeoCoordinates,
  position2: GeoCoordinates,
) {
  const dLat = deg2rad(position2.latitude - position1.latitude);
  const dLon = deg2rad(position2.longitude - position1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(position1.latitude)) *
      Math.cos(deg2rad(position2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c; // Distance in km
}

export function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}
