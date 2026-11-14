import { NextResponse } from 'next/server';
import {
  HIGH_RES_NORMAL_ROUTE,
  HIGH_RES_BYPASSED_ROUTE,
  HIGH_RES_BLIZZARD_ROUTE,
} from '@/data/highResRoutes';

// Standard Google Maps Encoded Polyline Algorithm Decoder
function decodeGooglePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([Number((lat / 1e5).toFixed(5)), Number((lng / 1e5).toFixed(5))]);
  }

  return points;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { waypoints, isBlizzard, isBypassed } = body;

    let apiKey =
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // Fallback: load from local apikey.json if provided
    if (!apiKey) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const keyPath = path.join(process.cwd(), 'apikey.json');
        if (fs.existsSync(keyPath)) {
          const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
          if (keyData.googleMapsApiKey) apiKey = keyData.googleMapsApiKey;
        }
      } catch {
        // ignore
      }
    }

    // If Google Maps API Key is provided, call Google Maps Routes API v2
    if (apiKey && waypoints && waypoints.length >= 2) {
      try {
        const routesUrl = 'https://routes.googleapis.com/directions/v2:computeRoutes';
        const intermediates = waypoints.slice(1, -1).map((w: { lat: number; lng: number }) => ({
          location: { latLng: { latitude: w.lat, longitude: w.lng } },
        }));

        const routesBody = {
          origin: {
            location: {
              latLng: {
                latitude: waypoints[0].lat,
                longitude: waypoints[0].lng,
              },
            },
          },
          destination: {
            location: {
              latLng: {
                latitude: waypoints[waypoints.length - 1].lat,
                longitude: waypoints[waypoints.length - 1].lng,
              },
            },
          },
          ...(intermediates.length > 0 ? { intermediates } : {}),
          travelMode: 'DRIVE',
        };

        const res = await fetch(routesUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask':
              'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
          },
          body: JSON.stringify(routesBody),
        });

        if (res.ok) {
          const data = await res.json();
          const route = data.routes?.[0];
          const encodedPolyline = route?.polyline?.encodedPolyline;
          if (encodedPolyline) {
            const decodedCoords = decodeGooglePolyline(encodedPolyline);
            const totalMeters = route.distanceMeters || 0;
            const durationSeconds =
              parseInt((route.duration || '0s').replace('s', ''), 10) || 0;

            return NextResponse.json({
              coordinates: decodedCoords,
              distanceMiles: Number((totalMeters / 1609.34).toFixed(1)),
              durationMinutes: Math.round(durationSeconds / 60),
              engine: 'google_maps_routes_v2',
              status: 'OK',
            });
          }
        }
      } catch (err) {
        console.warn('Google Maps Routes API call failed, falling back to local physical road geometry:', err);
      }
    }

    // Default high-precision street geometry fallback
    const fallbackCoords = isBlizzard
      ? HIGH_RES_BLIZZARD_ROUTE
      : isBypassed
      ? HIGH_RES_BYPASSED_ROUTE
      : HIGH_RES_NORMAL_ROUTE;

    return NextResponse.json({
      coordinates: fallbackCoords,
      distanceMiles: isBypassed ? 19.8 : isBlizzard ? 25.1 : 23.4,
      durationMinutes: isBlizzard ? 48 : isBypassed ? 26 : 34,
      engine: 'osrm_high_res_geometry',
      status: 'FALLBACK',
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
