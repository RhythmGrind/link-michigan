'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { WorkerProfile, SafeHubStation, FleetVehicle, WeatherCondition } from '../../types/transit';

interface RiderLiveTrackingMapProps {
  worker: WorkerProfile;
  station: SafeHubStation;
  vehicle: FleetVehicle;
  routePolyline?: [number, number][];
  isSkipped?: boolean;
  weather?: WeatherCondition;
}

export default function RiderLiveTrackingMap({
  worker,
  station,
  vehicle,
  routePolyline = [],
  isSkipped = false,
  weather,
}: RiderLiveTrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [station.coordinates.lat, station.coordinates.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Google Maps Roadmap Tiles
    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
    }).addTo(map);

    layersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Recalculate size to ensure smooth rendering
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Layers & Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layersGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    const vanLatLng: [number, number] = [vehicle.currentLocation.lat, vehicle.currentLocation.lng];
    const hubLatLng: [number, number] = [station.coordinates.lat, station.coordinates.lng];
    const homeLatLng: [number, number] = [worker.coordinates.lat, worker.coordinates.lng];

    // 1. Draw Route Polyline from Van to SafeHub
    if (routePolyline && routePolyline.length > 0) {
      // Glow background line
      L.polyline(routePolyline, {
        color: '#93c5fd',
        weight: 6,
        opacity: 0.7,
        lineCap: 'round',
      }).addTo(layers);

      // Main driving line
      L.polyline(routePolyline, {
        color: isSkipped ? '#94a3b8' : '#2563eb',
        weight: 3.5,
        opacity: 0.95,
        dashArray: isSkipped ? '6, 6' : undefined,
      }).addTo(layers);
    } else {
      // Fallback direct connector line
      L.polyline([vanLatLng, hubLatLng], {
        color: '#2563eb',
        weight: 3.5,
        opacity: 0.9,
      }).addTo(layers);
    }

    // 2. Walking Path from Rider's Home to SafeHub
    L.polyline([homeLatLng, hubLatLng], {
      color: '#10b981',
      weight: 2.5,
      dashArray: '4, 4',
      opacity: 0.8,
    }).addTo(layers);

    // 3. Worker Home Marker
    const homeIcon = L.divIcon({
      className: 'rider-map-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div class="absolute -bottom-5 whitespace-nowrap bg-white text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded border border-emerald-200 shadow-xs">
            You (3m walk)
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    L.marker(homeLatLng, { icon: homeIcon }).addTo(layers);

    // 4. SafeHub Station Pickup Marker
    const hubIcon = L.divIcon({
      className: 'rider-map-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-8 h-8 rounded-full bg-white border-2 border-amber-500 text-amber-600 flex items-center justify-center shadow-md font-bold text-xs">
            ⛽
          </div>
          <div class="absolute -top-6 whitespace-nowrap bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
            Pickup: ${station.name.split(' ')[0]} Hub
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    L.marker(hubLatLng, { icon: hubIcon }).addTo(layers);

    // 5. Shuttle Van Marker with animated pulse ring
    const vanIcon = L.divIcon({
      className: 'rider-map-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <!-- Pulse Halo -->
          <div class="absolute w-12 h-12 rounded-full bg-blue-500/20 animate-ping"></div>
          <!-- Vehicle Badge -->
          <div class="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg border-2 border-white z-10">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="16" x="4" y="4" rx="2"/><circle cx="9" cy="18" r="2"/><circle cx="15" cy="18" r="2"/><path d="M15 8h2l2 4v4H5V8h10z"/></svg>
          </div>
          <!-- Label Pill -->
          <div class="absolute -top-7 whitespace-nowrap bg-blue-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md border border-blue-400">
            ${vehicle.licensePlate} • Driver Mike
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    L.marker(vanLatLng, { icon: vanIcon }).addTo(layers);

    // Fit bounds to comfortably frame Van, SafeHub, and Rider Home
    const bounds = L.latLngBounds([vanLatLng, hubLatLng, homeLatLng]);
    map.fitBounds(bounds, {
      padding: [45, 45],
      maxZoom: 15,
    });
  }, [worker, station, vehicle, routePolyline, isSkipped]);

  const handleCenterOnVan = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([vehicle.currentLocation.lat, vehicle.currentLocation.lng], 15, { animate: true });
  };

  const handleCenterOnHub = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([station.coordinates.lat, station.coordinates.lng], 15, { animate: true });
  };

  const handleResetFit = () => {
    if (!mapInstanceRef.current) return;
    const vanLatLng: [number, number] = [vehicle.currentLocation.lat, vehicle.currentLocation.lng];
    const hubLatLng: [number, number] = [station.coordinates.lat, station.coordinates.lng];
    const homeLatLng: [number, number] = [worker.coordinates.lat, worker.coordinates.lng];
    const bounds = L.latLngBounds([vanLatLng, hubLatLng, homeLatLng]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [45, 45] });
  };

  return (
    <div className="relative w-full h-[220px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Mini Overlay Controls */}
      <div className="absolute bottom-2.5 right-2.5 z-[500] flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-xl shadow border border-slate-200 text-[10px] font-semibold text-slate-700">
        <button
          onClick={handleCenterOnVan}
          className="px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
          title="Center on Van"
        >
          <span>🚐 Van</span>
        </button>
        <button
          onClick={handleCenterOnHub}
          className="px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1"
          title="Center on SafeHub"
        >
          <span>📍 Hub</span>
        </button>
        <button
          onClick={handleResetFit}
          className="px-1.5 py-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          title="Fit view"
        >
          <span>⤢</span>
        </button>
      </div>
    </div>
  );
}
