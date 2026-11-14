'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FleetVehicle, SafeHubStation, FactoryDestination } from '../../types/transit';
import { HIGH_RES_NORMAL_ROUTE } from '../../data/highResRoutes';

interface DriverNavigationMapProps {
  vehicle: FleetVehicle;
  routePolyline?: [number, number][];
  currentStopName: string;
  currentStopCoords?: { lat: number; lng: number };
  stations: SafeHubStation[];
  factories: FactoryDestination[];
}

export default function DriverNavigationMap({
  vehicle,
  routePolyline = [],
  currentStopName,
  currentStopCoords,
  stations,
  factories,
}: DriverNavigationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const activeRoute = (routePolyline && routePolyline.length > 1)
      ? routePolyline
      : HIGH_RES_NORMAL_ROUTE;

    const initialCenter: [number, number] = activeRoute.length > 0
      ? [activeRoute[0][0], activeRoute[0][1]]
      : [vehicle.currentLocation.lat, vehicle.currentLocation.lng];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Google Maps Official Roadmap Tiles
    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
    }).addTo(map);

    layersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Attach ResizeObserver to automatically invalidateSize whenever container size changes
    const container = mapContainerRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(container);
    }

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (resizeObserver) resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Route Polyline and Markers dynamically whenever routePolyline changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // Use passed routePolyline or fallback to high-resolution Detroit corridor route
    const activeRoute = (routePolyline && routePolyline.length > 1)
      ? routePolyline
      : HIGH_RES_NORMAL_ROUTE;

    // 1. Draw Route Polyline from props
    if (activeRoute && activeRoute.length > 1) {
      // White casing outline for high contrast
      L.polyline(activeRoute, {
        color: '#ffffff',
        weight: 7,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(group);

      // Google Navigation Blue Route Line
      L.polyline(activeRoute, {
        color: '#1a73e8',
        weight: 4.5,
        opacity: 1.0,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(group);

      // Fit bounds to show the entire live route
      map.fitBounds(L.polyline(activeRoute).getBounds(), {
        padding: [30, 30],
        maxZoom: 15,
        animate: true,
      });
    }

    // 2. Draw SafeHub Stations
    stations.forEach((station) => {
      const stationIcon = L.divIcon({
        className: 'custom-station-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-6 h-6 rounded-full bg-emerald-600 border-2 border-white shadow-md flex items-center justify-center text-white text-[10px] font-bold">
              H
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker([station.coordinates.lat, station.coordinates.lng], { icon: stationIcon })
        .addTo(group)
        .bindTooltip(`<b>${station.name}</b>`, { direction: 'top', offset: [0, -10] });
    });

    // 3. Draw Factory / Employer Destinations
    factories.forEach((factory) => {
      const factoryIcon = L.divIcon({
        className: 'custom-factory-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-7 h-7 rounded-xl bg-blue-700 border-2 border-white shadow-md flex items-center justify-center text-white text-[11px] font-bold">
              🏢
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([factory.coordinates.lat, factory.coordinates.lng], { icon: factoryIcon })
        .addTo(group)
        .bindTooltip(`<b>${factory.name}</b><br/>${factory.city}`, { direction: 'top', offset: [0, -12] });
    });

    // 4. Vehicle 3D GPS Navigation Arrow Pin
    const vehiclePos: [number, number] = activeRoute.length > 0
      ? [activeRoute[0][0], activeRoute[0][1]]
      : [vehicle.currentLocation.lat, vehicle.currentLocation.lng];

    const vehicleIcon = L.divIcon({
      className: 'driver-vehicle-pin',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-2 rounded-full bg-blue-500/30 animate-ping"></div>
          <div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    L.marker(vehiclePos, { icon: vehicleIcon }).addTo(group);

    // 5. Highlight Current Target Stop
    if (currentStopCoords) {
      const targetIcon = L.divIcon({
        className: 'target-stop-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute -inset-2 rounded-full bg-emerald-500/40 animate-pulse"></div>
            <div class="w-7 h-7 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
              ★
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([currentStopCoords.lat, currentStopCoords.lng], { icon: targetIcon })
        .addTo(group)
        .bindTooltip(`<b>Next Target: ${currentStopName}</b>`, {
          permanent: true,
          direction: 'top',
          offset: [0, -12],
          className: 'bg-emerald-700 text-white font-bold text-xs rounded-lg px-2 py-1 border-0 shadow-md',
        });
    }
  }, [routePolyline, vehicle, currentStopName, currentStopCoords, stations, factories]);

  return (
    <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm shrink-0">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Google Maps Live Turn-by-Turn GPS Badge */}
      <div className="absolute top-2.5 left-2.5 z-[500] bg-white/95 backdrop-blur px-2.5 py-1 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-800 shadow-sm flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Google Maps GPS Turn-by-Turn</span>
      </div>

      {/* Live Route Distance / Waypoints pill */}
      <div className="absolute top-2.5 right-2.5 z-[500] bg-slate-900/90 text-white px-2 py-1 rounded-lg text-[10px] font-mono font-bold shadow-sm">
        {routePolyline.length > 0 ? `${(routePolyline.length * 0.02).toFixed(1)} mi • Dynamic Route` : 'GPS Connected'}
      </div>
    </div>
  );
}
