'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { FleetVehicle, SafeHubStation, FactoryDestination } from '../../types/transit';
import {
  X,
  Navigation,
  Car,
  Bus,
  Footprints,
  Bike,
  ExternalLink,
  ChevronRight,
  Compass,
  Volume2,
} from 'lucide-react';

const DynamicDriverNavigationMap = dynamic(() => import('../Map/DriverNavigationMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-slate-100 flex items-center justify-center text-xs text-slate-500 font-medium">
      Loading Google Maps Directions Engine...
    </div>
  ),
});

interface GoogleMapsNavModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: FleetVehicle;
  routePolyline?: [number, number][];
  currentStopName: string;
  currentStopCoords?: { lat: number; lng: number };
  targetTime: string;
  stations: SafeHubStation[];
  factories: FactoryDestination[];
  googleMapsUrl: string;
}

export default function GoogleMapsNavModal({
  isOpen,
  onClose,
  vehicle,
  routePolyline = [],
  currentStopName,
  currentStopCoords,
  targetTime,
  stations,
  factories,
  googleMapsUrl,
}: GoogleMapsNavModalProps) {
  const [navMode, setNavMode] = useState<'directions' | 'hud'>('directions');

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[2500] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-300 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col text-slate-900 font-sans relative"
      >
        {/* Top Google Maps Header Bar */}
        <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center gap-3">
            {/* Authentic Google Maps Brand Logo */}
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center justify-center">
                <span className="text-base font-black text-[#4285F4]">G</span>
              </div>
              <span className="text-base font-bold tracking-tight">
                <span className="text-[#4285F4]">G</span>
                <span className="text-[#EA4335]">o</span>
                <span className="text-[#FBBC05]">o</span>
                <span className="text-[#4285F4]">g</span>
                <span className="text-[#34A853]">l</span>
                <span className="text-[#EA4335]">e</span>{' '}
                <span className="text-slate-700 font-semibold">Maps</span>
              </span>
            </div>

            <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Live Navigation Active
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              id="google-maps-external-link-btn"
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-xl transition-colors"
              title="Open in Native maps.google.com"
            >
              <span>maps.google.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              id="exit-google-maps-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              title="Close Navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Google Maps Search & Directions Bar */}
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Transportation Mode Tabs */}
          <div className="flex items-center gap-1">
            <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold shadow-xs">
              <Car className="w-3.5 h-3.5" />
              <span>Driving</span>
            </button>
            <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-200 text-slate-600 font-medium">
              <Bus className="w-3.5 h-3.5" />
              <span>Transit</span>
            </button>
            <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-200 text-slate-600 font-medium">
              <Footprints className="w-3.5 h-3.5" />
              <span>Walk</span>
            </button>
          </div>

          {/* Mode Switcher Button (Driving HUD vs Route Overview) */}
          <button
            onClick={() => setNavMode(navMode === 'directions' ? 'hud' : 'directions')}
            className="text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1"
          >
            <Navigation className="w-3 h-3 text-blue-600" />
            <span>{navMode === 'directions' ? 'Switch to In-Cabin HUD' : 'Switch to Route Details'}</span>
          </button>
        </div>

        {/* Route Details Card (Waypoints & Live ETA) */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              <span className="font-semibold text-slate-800">
                Origin: Detroit Corridor • Van #809
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
              <span className="font-bold text-slate-900">
                Next Waypoint: {currentStopName}
              </span>
            </div>
          </div>

          <div className="sm:text-right bg-emerald-50 sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-emerald-100">
            <div className="flex sm:justify-end items-baseline gap-1.5">
              <span className="text-base font-black text-emerald-700">18 min</span>
              <span className="text-xs text-slate-600 font-bold">• 6.1 mi</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-medium">
              Fastest route now • Avoids I-94 construction
            </div>
          </div>
        </div>

        {/* Turn-by-Turn Emerald Maneuver Bar (When In-Cabin HUD is Active) */}
        {navMode === 'hud' && (
          <div className="bg-[#0f9d58] text-white px-4 py-2.5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-lg shrink-0">
                ↱
              </div>
              <div>
                <div className="text-[10px] font-semibold text-emerald-100 uppercase tracking-wider">
                  In 450 ft • Woodward Ave
                </div>
                <div className="text-sm font-bold text-white leading-tight">
                  Turn right toward {currentStopName.split(' ')[0]} Hub
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-white/90">
              <button className="p-1.5 rounded-full hover:bg-white/10" title="Voice Guidance">
                <Volume2 className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-full hover:bg-white/10" title="Compass">
                <Compass className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Google Maps Vector Map Canvas */}
        <div className="relative w-full h-[380px] bg-slate-100">
          <DynamicDriverNavigationMap
            vehicle={vehicle}
            routePolyline={routePolyline}
            currentStopName={currentStopName}
            currentStopCoords={currentStopCoords}
            stations={stations}
            factories={factories}
          />

          {/* Genuine Google Watermark in Bottom-Left */}
          <div className="absolute bottom-2 left-3 z-[500] pointer-events-none flex items-center gap-2 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded shadow-xs text-[10px] text-slate-600">
            <span className="font-bold">
              <span className="text-[#4285F4]">G</span>
              <span className="text-[#EA4335]">o</span>
              <span className="text-[#FBBC05]">o</span>
              <span className="text-[#4285F4]">g</span>
              <span className="text-[#34A853]">l</span>
              <span className="text-[#EA4335]">e</span>
            </span>
            <span className="text-[9px] text-slate-500">Map data ©2026 Google</span>
          </div>

          {/* Speed Indicator Floating Badge */}
          <div className="absolute bottom-3 right-3 z-[500] bg-white text-slate-900 border border-slate-300 px-3 py-1.5 rounded-xl shadow-md text-center">
            <div className="text-xs font-black text-slate-900">28</div>
            <div className="text-[9px] text-slate-500 font-bold uppercase">MPH</div>
          </div>
        </div>

        {/* Bottom Action Footer Bar */}
        <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-bold text-slate-800">Target Stop Arrival:</span>
            <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {targetTime}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(googleMapsUrl, '_blank')}
              className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Launch External App</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            </button>

            <button
              onClick={onClose}
              className="py-1.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
