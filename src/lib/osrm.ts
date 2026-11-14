import { Coordinates } from '../types/transit';
import {
  HIGH_RES_NORMAL_ROUTE,
  HIGH_RES_BYPASSED_ROUTE,
  HIGH_RES_BLIZZARD_ROUTE,
} from '../data/highResRoutes';

// High-resolution real Detroit street network routes (Snapped to OSM physical roads)
export const FALLBACK_NORMAL_ROUTE: [number, number][] = HIGH_RES_NORMAL_ROUTE;
export const FALLBACK_BYPASSED_ROUTE: [number, number][] = HIGH_RES_BYPASSED_ROUTE;
export const FALLBACK_BLIZZARD_ROUTE: [number, number][] = HIGH_RES_BLIZZARD_ROUTE;

export interface OSRMRouteResult {
  coordinates: [number, number][];
  distanceMiles: number;
  durationMinutes: number;
  isLive: boolean;
}

export async function calculateDetroitRoute(
  waypoints: Coordinates[],
  isBlizzard: boolean = false,
  isStop1Bypassed: boolean = false
): Promise<OSRMRouteResult> {
  const defaultFallback = isBlizzard
    ? FALLBACK_BLIZZARD_ROUTE
    : isStop1Bypassed
    ? FALLBACK_BYPASSED_ROUTE
    : FALLBACK_NORMAL_ROUTE;

  if (waypoints.length < 2) {
    return {
      coordinates: defaultFallback,
      distanceMiles: isStop1Bypassed ? 19.8 : 23.4,
      durationMinutes: isBlizzard ? 48 : isStop1Bypassed ? 26 : 34,
      isLive: false,
    };
  }

  // Attempt Google Maps Directions API route via local API proxy
  try {
    if (typeof window !== 'undefined') {
      const apiRes = await fetch('/api/directions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waypoints,
          isBlizzard,
          isBypassed: isStop1Bypassed,
        }),
      });
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData.coordinates && apiData.coordinates.length > 0) {
          return {
            coordinates: apiData.coordinates,
            distanceMiles: apiData.distanceMiles,
            durationMinutes: apiData.durationMinutes,
            isLive: apiData.engine === 'google_maps_api',
          };
        }
      }
    }
  } catch {
    // Fallthrough to direct OSRM or high-res geometry
  }

  try {
    const coordString = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const latLngs: [number, number][] = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );
        const distanceMiles = Number((route.distance / 1609.34).toFixed(1));
        const durationMinutes = Math.round(route.duration / 60);

        return {
          coordinates: latLngs,
          distanceMiles,
          durationMinutes: isBlizzard ? durationMinutes + 14 : durationMinutes,
          isLive: true,
        };
      }
    }
  } catch (error) {
    console.warn('OSRM Live API unreachable or timed out. Falling back to high-res local geometry.', error);
  }

  return {
    coordinates: defaultFallback,
    distanceMiles: isStop1Bypassed ? 19.8 : isBlizzard ? 25.1 : 23.4,
    durationMinutes: isBlizzard ? 48 : isStop1Bypassed ? 26 : 34,
    isLive: false,
  };
}
