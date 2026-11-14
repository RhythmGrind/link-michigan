'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  FactoryDestination,
  SafeHubStation,
  WorkerProfile,
  FleetVehicle,
  WeatherCondition,
} from '../../types/transit';
import { ROUTE_2_POLYLINE, ACTIVE_FLEET_VEHICLES } from '../../data/mockTransitData';

interface DetroitTransitMapProps {
  factories: FactoryDestination[];
  stations: SafeHubStation[];
  workers: WorkerProfile[];
  vehicle: FleetVehicle;
  routePolyline: [number, number][];
  route2Polyline?: [number, number][];
  weather: WeatherCondition;
  isSimulatingDrive: boolean;
  isScaledMode?: boolean;
  isMapExpanded?: boolean;
}

export default function DetroitTransitMap({
  factories,
  stations,
  workers,
  vehicle,
  routePolyline,
  route2Polyline = ROUTE_2_POLYLINE,
  weather,
  isSimulatingDrive,
  isScaledMode = false,
  isMapExpanded = false,
}: DetroitTransitMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const polylineLayerRef = useRef<L.Polyline | null>(null);
  const polyline2LayerRef = useRef<L.Polyline | null>(null);
  const catchmentLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const vehicle2MarkerRef = useRef<L.Marker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Map Basemap Style: Defaults to Google Maps Official Roadmap
  const [mapStyle, setMapStyle] = useState<'googleRoad' | 'googleSat' | 'osm'>('googleRoad');
  // Camera Tracking Mode: 'fleet' (multi-van global framing) | 'van1' | 'van2' | 'free'
  const [cameraMode, setCameraMode] = useState<'fleet' | 'van1' | 'van2' | 'free'>('fleet');
  // Real-time passenger boarding / drop-off notification banner
  const [activeBoardingNotice, setActiveBoardingNotice] = useState<string | null>(null);

  // Synchronize default camera mode based on fleet size
  useEffect(() => {
    setCameraMode(isScaledMode ? 'fleet' : 'van1');
  }, [isScaledMode]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const detroitCenter: [number, number] = [42.3480, -83.0600];

    const map = L.map(mapContainerRef.current, {
      center: detroitCenter,
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    catchmentLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Attach ResizeObserver to automatically invalidateSize whenever container width/height changes
    const container = mapContainerRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(container);
    }

    // Trigger invalidateSize to prevent blank gray tiles when rendering inside flex grid
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (resizeObserver) resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Reactively handle container expansion and trigger tile invalidation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => {
      map.invalidateSize();
      const allCoords = isScaledMode && route2Polyline.length > 0
        ? [...routePolyline, ...route2Polyline]
        : routePolyline;
      if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords.map((c) => [c[0], c[1]]));
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13, duration: 0.4 });
      }
    }, 320);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isMapExpanded, isScaledMode, routePolyline, route2Polyline]);

  // Update Base Tile Layer when style changes (Google Maps Roadmap vs Satellite vs OSM)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    let tileUrl = 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    let subdomains = ['mt0', 'mt1', 'mt2', 'mt3'];
    let attribution = '&copy; Google Maps';
    let maxZoom = 20;

    if (mapStyle === 'googleSat') {
      tileUrl = 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Maps Satellite';
    } else if (mapStyle === 'osm') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      subdomains = ['a', 'b', 'c'];
      attribution = '&copy; OpenStreetMap contributors';
      maxZoom = 19;
    }

    const tileLayer = L.tileLayer(tileUrl, {
      subdomains,
      maxZoom,
      attribution,
    }).addTo(map);

    baseTileLayerRef.current = tileLayer;
  }, [mapStyle]);

  // Update Route Polyline, Catchments & Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (markersLayerRef.current) markersLayerRef.current.clearLayers();
    if (catchmentLayerRef.current) catchmentLayerRef.current.clearLayers();

    if (polylineLayerRef.current) map.removeLayer(polylineLayerRef.current);
    if (polyline2LayerRef.current) map.removeLayer(polyline2LayerRef.current);

    // 1. Draw Route 1 (MI-01 North Corridor - Vivid Royal Blue / Blizzard Amber)
    if (routePolyline.length > 0) {
      const routeColor = weather.isBlizzardActive ? '#d97706' : '#2563eb';
      const polyline = L.polyline(routePolyline, {
        color: routeColor,
        weight: 5.5,
        opacity: 0.95,
        dashArray: weather.isBlizzardActive ? '8, 8' : undefined,
      }).addTo(map);
      polylineLayerRef.current = polyline;
    }

    // 2. Draw Route 2 (MI-02 West Corridor - Vivid Purple) if Scaled Mode
    if (isScaledMode && route2Polyline.length > 0) {
      const polyline2 = L.polyline(route2Polyline, {
        color: '#9333ea', // Distinct high-contrast Purple
        weight: 5.5,
        opacity: 0.95,
      }).addTo(map);
      polyline2LayerRef.current = polyline2;
    }

    // 3. Render DBSCAN 400m Catchment Halos around SafeHubs (Visual Clustering Proof!)
    stations.forEach((station, idx) => {
      const circleColor = idx === 0 ? '#2563eb' : '#7c3aed';
      const catchmentCircle = L.circle([station.coordinates.lat, station.coordinates.lng], {
        radius: 650, // 650m visual catchment radius
        color: circleColor,
        dashArray: '4, 4',
        weight: 1.5,
        fillColor: circleColor,
        fillOpacity: isScaledMode ? 0.12 : 0.08,
      });

      catchmentCircle.bindTooltip(
        `<span class="text-xs font-bold font-sans">${station.name.split(' ')[0]} 400m Walking Cluster</span>`,
        { permanent: false, direction: 'top' }
      );
      catchmentLayerRef.current?.addLayer(catchmentCircle);
    });

    // 4. Add Factory Markers
    factories.forEach((factory) => {
      const factoryIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-9 h-9 rounded-xl bg-white border-2 border-blue-600 shadow-md flex items-center justify-center text-blue-700 font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
              </svg>
            </div>
            <div class="absolute -top-7 whitespace-nowrap bg-slate-900 text-white px-2 py-0.5 rounded text-[11px] font-semibold shadow">
              ${factory.name.split(' ')[0]} (Shift 1)
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([factory.coordinates.lat, factory.coordinates.lng], { icon: factoryIcon });
      marker.bindPopup(`
        <div class="p-1 font-sans">
          <div class="text-xs font-bold text-blue-600 uppercase">Manufacturing Plant</div>
          <div class="text-sm font-bold text-slate-900 mt-0.5">${factory.name}</div>
          <div class="text-xs text-slate-500">${factory.city}</div>
          <div class="mt-2 text-xs border-t border-slate-100 pt-1 text-slate-600">
            • Target Arrival: <b>${factory.targetArrivalTime}</b><br/>
            • Critical Role: ${factory.criticalLineRole}
          </div>
        </div>
      `);
      markersLayerRef.current?.addLayer(marker);
    });

    // 5. Add SafeHub Stations
    stations.forEach((station, idx) => {
      const activeWorkersAtStation = workers.filter(
        (w) => w.assignedStationId === station.id && w.status !== 'skipped'
      );
      const isBypassed = activeWorkersAtStation.length === 0;

      const hubIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="w-8 h-8 rounded-full ${
              isBypassed
                ? 'bg-slate-100 border-2 border-slate-300 opacity-60'
                : idx === 0
                ? 'bg-white border-2 border-blue-600 shadow-md'
                : 'bg-white border-2 border-purple-600 shadow-md'
            } flex items-center justify-center">
              <span class="${isBypassed ? 'text-slate-400' : idx === 0 ? 'text-blue-600' : 'text-purple-600'} font-bold text-xs">${
                isBypassed ? '0' : '24h'
              }</span>
            </div>
            <div class="absolute -bottom-6 whitespace-nowrap ${
              isBypassed ? 'bg-slate-100 text-slate-400 line-through' : 'bg-white text-slate-800'
            } border border-slate-200 px-2 py-0.5 rounded text-[11px] font-medium shadow-sm">
              ${station.name.split(' ')[0]} Hub ${isScaledMode ? (idx === 0 ? '(Cluster A)' : '(Cluster B)') : ''}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([station.coordinates.lat, station.coordinates.lng], { icon: hubIcon });
      marker.bindPopup(`
        <div class="p-1">
          <div class="text-xs font-bold text-amber-600 uppercase">Safe Waiting Hub</div>
          <div class="text-sm font-bold text-slate-900 mt-0.5">${station.name}</div>
          <div class="text-xs text-slate-500">${station.address}</div>
          <div class="mt-2 text-xs bg-slate-50 p-2 rounded text-slate-700">
            ${
              isBypassed
                ? '<b class="text-rose-600">Bypassed</b>: All assigned riders reported absent today.'
                : `Cluster Density: <b>${activeWorkersAtStation.length} riders</b> • Pickup: ${station.scheduledPickupTime}`
            }
          </div>
        </div>
      `);
      markersLayerRef.current?.addLayer(marker);
    });

    // 6. Add Worker Origin Pins (Color coded by Cluster!)
    workers.forEach((worker) => {
      const isSkipped = worker.status === 'skipped';
      const isClusterA = worker.assignedStationId === stations[0].id;
      const pinColor = isSkipped
        ? 'bg-slate-400'
        : isClusterA
        ? 'bg-blue-600'
        : 'bg-purple-600';

      const workerIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div class="flex items-center justify-center">
            <div class="w-3.5 h-3.5 rounded-full ${pinColor} border-2 border-white shadow"></div>
          </div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([worker.coordinates.lat, worker.coordinates.lng], { icon: workerIcon });
      marker.bindPopup(`
        <div class="p-1 text-xs">
          <b>${worker.name}</b> (${worker.role})<br/>
          <span class="text-slate-500">${
            isSkipped ? 'Status: Sick leave synced' : `Assigned: ${isClusterA ? 'Woodward Hub (Van #809)' : 'Warren Hub (Van #412)'}`
          }</span>
        </div>
      `);
      markersLayerRef.current?.addLayer(marker);
    });

    // 7. Add Fleet Vehicle 1 Marker (MI-TR-809 - North Corridor Blue)
    const van1Icon = L.divIcon({
      className: 'custom-fleet-pin',
      html: `
        <div class="relative flex flex-col items-center" style="transform: translate(-50%, -100%);">
          <!-- Floating Status Badge -->
          <div class="mb-1 px-2.5 py-0.5 rounded-full text-[10px] font-black text-white shadow-md border border-white/40 flex items-center gap-1.5 whitespace-nowrap bg-blue-700">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Van #809</span>
            <span class="opacity-80 font-semibold text-[9px]">(North)</span>
          </div>

          <!-- Modern Navigation Shuttle Pin -->
          <div class="relative w-9 h-9 rounded-2xl bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white">
            ${isSimulatingDrive ? '<span class="absolute -inset-1 rounded-2xl ring-4 ring-blue-400/40 animate-pulse"></span>' : ''}
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="16" height="12" x="4" y="4" rx="2"/>
              <path d="M4 10h16"/>
              <path d="M10 16h4"/>
              <circle cx="7" cy="18" r="2"/>
              <circle cx="17" cy="18" r="2"/>
            </svg>
          </div>
          <!-- Pointer Tip pointing exactly at road coordinate -->
          <div class="w-2.5 h-2.5 bg-blue-600 rotate-45 -mt-1.5 border-r border-b border-white shadow-sm"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const vMarker1 = L.marker([vehicle.currentLocation.lat, vehicle.currentLocation.lng], {
      icon: van1Icon,
      zIndexOffset: 1000,
    });
    markersLayerRef.current?.addLayer(vMarker1);
    vehicleMarkerRef.current = vMarker1;

    // 8. Add Fleet Vehicle 2 Marker (MI-TR-412 - West Corridor Purple) if Scaled Mode
    if (isScaledMode) {
      const van2 = ACTIVE_FLEET_VEHICLES[1];
      const van2Icon = L.divIcon({
        className: 'custom-fleet-pin',
        html: `
          <div class="relative flex flex-col items-center" style="transform: translate(-50%, -100%);">
            <!-- Floating Status Badge -->
            <div class="mb-1 px-2.5 py-0.5 rounded-full text-[10px] font-black text-white shadow-md border border-white/40 flex items-center gap-1.5 whitespace-nowrap bg-purple-700">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Van #412</span>
              <span class="opacity-80 font-semibold text-[9px]">(West)</span>
            </div>

            <!-- Modern Navigation Shuttle Pin -->
            <div class="relative w-9 h-9 rounded-2xl bg-purple-600 border-2 border-white shadow-xl flex items-center justify-center text-white">
              ${isSimulatingDrive ? '<span class="absolute -inset-1 rounded-2xl ring-4 ring-purple-400/40 animate-pulse"></span>' : ''}
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="16" height="12" x="4" y="4" rx="2"/>
                <path d="M4 10h16"/>
                <path d="M10 16h4"/>
                <circle cx="7" cy="18" r="2"/>
                <circle cx="17" cy="18" r="2"/>
              </svg>
            </div>
            <!-- Pointer Tip pointing exactly at road coordinate -->
            <div class="w-2.5 h-2.5 bg-purple-600 rotate-45 -mt-1.5 border-r border-b border-white shadow-sm"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const vMarker2 = L.marker([van2.currentLocation.lat, van2.currentLocation.lng], {
        icon: van2Icon,
        zIndexOffset: 1000,
      });
      markersLayerRef.current?.addLayer(vMarker2);
      vehicle2MarkerRef.current = vMarker2;
    }

    // Refresh map layout bounds
    map.invalidateSize();
  }, [factories, stations, workers, vehicle, routePolyline, weather, isScaledMode, isSimulatingDrive]);

  // Live Drive Simulation Animation Loop (Fluid Motion, Real SafeHub Boarding & Multi-Van Tracking)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!isSimulatingDrive || routePolyline.length === 0) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setActiveBoardingNotice(null);
      // Zoom back out to Detroit corridor overview
      map.flyTo([42.3480, -83.0600], 13, { duration: 0.8 });
      return;
    }

    // Camera initial framing based on cameraMode
    if (cameraMode === 'van1') {
      map.flyTo([routePolyline[0][0], routePolyline[0][1]], 14, { duration: 0.8 });
    } else if (cameraMode === 'van2' && isScaledMode && route2Polyline.length > 0) {
      map.flyTo([route2Polyline[0][0], route2Polyline[0][1]], 14, { duration: 0.8 });
    } else {
      // 'fleet' or overview mode: frame all active routes once without jitter
      const allCoords = isScaledMode && route2Polyline.length > 0
        ? [...routePolyline, ...route2Polyline]
        : routePolyline;
      const initialBounds = L.latLngBounds(allCoords.map((c) => [c[0], c[1]]));
      map.fitBounds(initialBounds, { padding: [60, 60], maxZoom: 13, duration: 0.8 });
    }

    let currentIndex = 0;
    const totalPoints = routePolyline.length;
    // Pacing: ~200 smooth steps (~9s drive cycle + pauses)
    const stepIncrement = Math.max(1, Math.floor(totalPoints / 200));

    let current2Index = 0;
    const total2Points = route2Polyline.length;
    const step2Increment = Math.max(1, Math.floor(total2Points / 200));

    let isPaused = false;
    let lastCameraTime = 0;
    let lastFrameTime = performance.now();
    const FRAME_INTERVAL = 45; // ms per step for steady cruising

    // Station visit flags to trigger boarding stops once per cycle
    let stoppedStation1 = false;
    let stoppedStation2 = false;
    let stoppedDearborn = false;

    const stop1Target = Math.floor(totalPoints * 0.10);
    const stop2Target = Math.floor(totalPoints * 0.29);
    const dearbornTarget = Math.floor(totalPoints * 0.56);

    const animateVehicle = (timestamp: number) => {
      if (isPaused) return;

      const elapsed = timestamp - lastFrameTime;
      if (elapsed < FRAME_INTERVAL) {
        animationFrameRef.current = requestAnimationFrame(animateVehicle);
        return;
      }
      lastFrameTime = timestamp;

      let nextPos: [number, number] = routePolyline[currentIndex];
      let next2Pos: [number, number] | null = null;

      // ---------------------------------------------
      // MILESTONE STOP 1: Wayne State SafeHub Boarding
      // ---------------------------------------------
      if (!stoppedStation1 && currentIndex >= stop1Target) {
        stoppedStation1 = true;
        isPaused = true;
        setActiveBoardingNotice(
          isScaledMode
            ? '🟢 Wayne State Hub: Boarding 8 Employees • Van #809'
            : '🟢 Wayne State Hub: Boarding Bob, Alice & Grace • Van #809'
        );
        setTimeout(() => {
          setActiveBoardingNotice(null);
          isPaused = false;
          lastFrameTime = performance.now();
          animationFrameRef.current = requestAnimationFrame(animateVehicle);
        }, 1400);
        return;
      }

      // ---------------------------------------------
      // MILESTONE STOP 2: Woodbridge SafeHub Boarding
      // ---------------------------------------------
      if (!stoppedStation2 && currentIndex >= stop2Target) {
        stoppedStation2 = true;
        isPaused = true;
        setActiveBoardingNotice(
          isScaledMode
            ? '🟢 Woodbridge / Corktown: Boarding 8 Tech Cohort Riders • Van #412'
            : '🟢 Woodbridge Hub: Boarding Charlie, David & Ivan • Van #809'
        );
        setTimeout(() => {
          setActiveBoardingNotice(null);
          isPaused = false;
          lastFrameTime = performance.now();
          animationFrameRef.current = requestAnimationFrame(animateVehicle);
        }, 1400);
        return;
      }

      // ---------------------------------------------
      // MILESTONE STOP 3: Detroit Labs (Woodward) Drop-off
      // ---------------------------------------------
      if (!stoppedDearborn && currentIndex >= dearbornTarget) {
        stoppedDearborn = true;
        isPaused = true;
        setActiveBoardingNotice('🏢 Detroit Labs (Woodward): Drop-off Software Engineering Cohort');
        setTimeout(() => {
          setActiveBoardingNotice(null);
          isPaused = false;
          lastFrameTime = performance.now();
          animationFrameRef.current = requestAnimationFrame(animateVehicle);
        }, 1200);
        return;
      }

      // ---------------------------------------------
      // MILESTONE STOP 4: Final Downtown Tech HQs Drop-off
      // ---------------------------------------------
      if (currentIndex + stepIncrement >= totalPoints - 1) {
        currentIndex = totalPoints - 1;
        nextPos = routePolyline[currentIndex];
        if (vehicleMarkerRef.current) vehicleMarkerRef.current.setLatLng(nextPos);

        isPaused = true;
        setActiveBoardingNotice('🏁 Downtown Tech Hub: Autobooks & Capitol Park Cohort Delivered 100% On-Time!');

        setTimeout(() => {
          currentIndex = 0;
          current2Index = 0;
          stoppedStation1 = false;
          stoppedStation2 = false;
          stoppedDearborn = false;
          setActiveBoardingNotice(null);
          isPaused = false;
          lastFrameTime = performance.now();

          if (cameraMode === 'van1' && mapInstanceRef.current && routePolyline.length > 0) {
            mapInstanceRef.current.panTo([routePolyline[0][0], routePolyline[0][1]], {
              animate: true,
              duration: 0.8,
            });
          }
          animationFrameRef.current = requestAnimationFrame(animateVehicle);
        }, 1800);
        return;
      }

      // Progress Van 1
      currentIndex += stepIncrement;
      nextPos = routePolyline[currentIndex];
      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.setLatLng([nextPos[0], nextPos[1]]);
      }

      // Progress Van 2 (if scaled mode active)
      if (isScaledMode && vehicle2MarkerRef.current && total2Points > 0) {
        current2Index = (current2Index + step2Increment) % total2Points;
        next2Pos = route2Polyline[current2Index];
        vehicle2MarkerRef.current.setLatLng([next2Pos[0], next2Pos[1]]);
      }

      // ---------------------------------------------
      // GENTLE CAMERA FOLLOW (Rate-limited, ZERO jitter)
      // ---------------------------------------------
      const now = Date.now();
      if (now - lastCameraTime > 1600 && mapInstanceRef.current) {
        if (cameraMode === 'van1' && nextPos) {
          lastCameraTime = now;
          mapInstanceRef.current.panTo([nextPos[0], nextPos[1]], {
            animate: true,
            duration: 1.2,
          });
        } else if (cameraMode === 'van2' && next2Pos) {
          lastCameraTime = now;
          mapInstanceRef.current.panTo([next2Pos[0], next2Pos[1]], {
            animate: true,
            duration: 1.2,
          });
        }
        // In 'fleet' mode, camera remains rock-solid on the framed corridor (no shaking!)
      }

      animationFrameRef.current = requestAnimationFrame(animateVehicle);
    };

    const startTimer = setTimeout(() => {
      lastFrameTime = performance.now();
      animationFrameRef.current = requestAnimationFrame(animateVehicle);
    }, 400);

    return () => {
      clearTimeout(startTimer);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isSimulatingDrive, routePolyline, route2Polyline, isScaledMode, cameraMode]);

  return (
    <div
      className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm"
      style={{ minHeight: '640px', height: '100%' }}
    >
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ minHeight: '640px', height: '100%', width: '100%' }}
      />

      {/* Floating Active Boarding Notice Banner (SafeHub Pickups & Plant Drop-offs) */}
      {activeBoardingNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[600] bg-slate-950/95 text-white border border-emerald-500/70 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2.5 animate-bounce max-w-[90%] whitespace-nowrap backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <span className="tracking-tight text-emerald-300">{activeBoardingNotice}</span>
        </div>
      )}

      {/* Corridor HUD Badge */}
      <div className="absolute top-4 left-4 z-[500] bg-white/95 backdrop-blur border border-slate-200 px-3 py-2 rounded-xl text-xs shadow-md">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="font-bold text-slate-800">
            {isScaledMode ? 'Dual-Corridor Employee Shuttle Fleet (2 Shuttles)' : 'Wayne State / Midtown ➔ Downtown Detroit'}
          </span>
          <span className="text-slate-500">| Woodward Ave / Broadway / Trumbull</span>
        </div>
      </div>

      {/* Live Camera Tracking HUD Overlay (Floating Bottom Dock) */}
      {isSimulatingDrive && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] bg-slate-900/95 text-white backdrop-blur border border-slate-700/80 p-1.5 rounded-2xl text-xs shadow-2xl flex items-center gap-1.5 whitespace-nowrap">
          <div className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-bold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Camera:</span>
          </div>

          {isScaledMode && (
            <button
              onClick={() => setCameraMode('fleet')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                cameraMode === 'fleet' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              🌐 Fleet Overview
            </button>
          )}

          <button
            onClick={() => setCameraMode('van1')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
              cameraMode === 'van1' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            🚐 Van #809
          </button>

          {isScaledMode && (
            <button
              onClick={() => setCameraMode('van2')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                cameraMode === 'van2' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              🚐 Van #412
            </button>
          )}

          <button
            onClick={() => setCameraMode('free')}
            className={`px-2 py-1 rounded-xl text-xs font-bold transition-all ${
              cameraMode === 'free' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            🔓 Free Pan
          </button>
        </div>
      )}

      {/* Top Right: Google Maps / Satellite / OSM Switcher */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col items-end gap-2">
        <div className="bg-white/95 backdrop-blur border border-slate-200 p-1 rounded-xl text-xs shadow-md flex items-center gap-1 font-semibold">
          <button
            onClick={() => setMapStyle('googleRoad')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
              mapStyle === 'googleRoad'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🗺️ Google Roads</span>
          </button>
          <button
            onClick={() => setMapStyle('googleSat')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
              mapStyle === 'googleSat'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🛰️ Satellite</span>
          </button>
          <button
            onClick={() => setMapStyle('osm')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
              mapStyle === 'osm'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🌐 OSM</span>
          </button>
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 z-[500] bg-white/95 backdrop-blur border border-slate-200 p-3 rounded-xl text-xs text-slate-700 shadow-md space-y-1.5 hidden sm:block">
        <div className="font-bold text-slate-900 text-xs mb-1">Clustered Network Legend</div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-blue-600 inline-block"></span>
          <span>Route MI-01 (Van #809 • North Cluster)</span>
        </div>
        {isScaledMode && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-purple-600 inline-block"></span>
            <span>Route MI-02 (Van #412 • West Cluster)</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border border-blue-600 border-dashed inline-block bg-blue-50"></span>
          <span>400m SafeHub Walking Catchment</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-blue-800 inline-block"></span>
          <span>Detroit Labs, Autobooks & Capitol Park Tech</span>
        </div>
      </div>
    </div>
  );
}
