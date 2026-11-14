'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import GoogleMapsNavModal from '../modals/GoogleMapsNavModal';
import {
  FleetVehicle,
  SafeHubStation,
  FactoryDestination,
  WeatherCondition,
  WorkerProfile,
} from '../../types/transit';
import {
  Navigation,
  CheckCircle,
  ExternalLink,
  Volume2,
  Users,
  AlertTriangle,
  ShieldCheck,
  Signal,
  Wifi,
  Battery,
} from 'lucide-react';

const DynamicDriverNavigationMap = dynamic(() => import('../Map/DriverNavigationMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-56 rounded-2xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
      Loading Driver Turn-by-Turn GPS Map...
    </div>
  ),
});

interface DriverCockpitViewProps {
  vehicle: FleetVehicle;
  stations: SafeHubStation[];
  factories: FactoryDestination[];
  workers: WorkerProfile[];
  weather: WeatherCondition;
  routePolyline?: [number, number][];
  onConfirmPickup: (stationId: string) => void;
  onReportIncident?: () => void;
}

export default function DriverCockpitView({
  vehicle,
  stations,
  factories,
  workers,
  weather,
  routePolyline = [],
  onConfirmPickup,
  onReportIncident,
}: DriverCockpitViewProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAudioSpeaking, setIsAudioSpeaking] = useState(false);
  const [showGoogleMapsNav, setShowGoogleMapsNav] = useState(false);

  // Dynamically map workers assigned to station 1 & station 2
  const station1Workers = workers.filter((w) => w.assignedStationId === stations[0]?.id);
  const station2Workers = workers.filter((w) => w.assignedStationId === stations[1]?.id);

  const stops = [
    {
      id: stations[0]?.id || 'hub-wayne',
      name: stations[0]?.name || 'Wayne State SafeHub',
      address: stations[0]?.address || '5221 Gullen Mall',
      coordinates: stations[0]?.coordinates || { lat: 42.3575, lng: -83.0660 },
      time: weather.isBlizzardActive ? '08:15 AM' : (stations[0]?.scheduledPickupTime || '08:28 AM'),
      type: 'pickup',
      passengers: station1Workers.map((w) =>
        w.status === 'skipped'
          ? `${w.name} (Remote Today)`
          : `${w.name} (${w.role.split('@')[0].trim()})`
      ),
      activeCount: station1Workers.filter((w) => w.status !== 'skipped').length,
    },
    {
      id: stations[1]?.id || 'hub-woodbridge',
      name: stations[1]?.name || 'Woodbridge SafeHub',
      address: stations[1]?.address || '4410 Trumbull Ave',
      coordinates: stations[1]?.coordinates || { lat: 42.3490, lng: -83.0772 },
      time: weather.isBlizzardActive ? '08:30 AM' : (stations[1]?.scheduledPickupTime || '08:35 AM'),
      type: 'pickup',
      passengers: station2Workers.map((w) =>
        w.status === 'skipped'
          ? `${w.name} (Remote Today)`
          : `${w.name} (${w.role.split('@')[0].trim()})`
      ),
      activeCount: station2Workers.filter((w) => w.status !== 'skipped').length,
    },
    {
      id: factories[0]?.id || 'fac-1',
      name: factories[0]?.name || 'Detroit Labs',
      address: factories[0]?.city || '1520 Woodward Ave, Downtown Detroit',
      coordinates: factories[0]?.coordinates || { lat: 42.3342, lng: -83.0490 },
      time: '08:50 AM',
      type: 'dropoff',
      passengers: ['Drop off Detroit Labs Engineering Cohort'],
      activeCount: workers.filter((w) => w.factoryId === factories[0]?.id && w.status !== 'skipped').length,
    },
    {
      id: factories[1]?.id || 'fac-2',
      name: factories[1]?.name || 'Autobooks',
      address: factories[1]?.city || '1555 Broadway St, Downtown Detroit',
      coordinates: factories[1]?.coordinates || { lat: 42.3360, lng: -83.0455 },
      time: '08:55 AM',
      type: 'dropoff',
      passengers: ['Drop off Autobooks FinTech Team'],
      activeCount: workers.filter((w) => w.factoryId === factories[1]?.id && w.status !== 'skipped').length,
    },
  ];

  const currentStop = stops[currentStepIndex] || stops[0];

  // Dynamically generate Google Maps Turn-by-Turn URL using live routePolyline
  const googleMapsUrl = useMemo(() => {
    if (routePolyline && routePolyline.length >= 2) {
      const origin = `${routePolyline[0][0].toFixed(5)},${routePolyline[0][1].toFixed(5)}`;
      const destination = `${routePolyline[routePolyline.length - 1][0].toFixed(5)},${routePolyline[routePolyline.length - 1][1].toFixed(5)}`;
      
      const wp1 = routePolyline[Math.floor(routePolyline.length * 0.25)];
      const wp2 = routePolyline[Math.floor(routePolyline.length * 0.50)];
      const wp3 = routePolyline[Math.floor(routePolyline.length * 0.75)];
      
      const waypoints = [wp1, wp2, wp3]
        .map((p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`)
        .join('|');

      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
    }

    const startLat = vehicle.currentLocation.lat;
    const startLng = vehicle.currentLocation.lng;
    const dest = factories[0]?.coordinates || { lat: 42.3342, lng: -83.0490 };
    const stationWaypoints = stations
      .slice(0, 3)
      .map((s) => `${s.coordinates.lat},${s.coordinates.lng}`)
      .join('|');

    return `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${dest.lat},${dest.lng}&waypoints=${stationWaypoints}&travelmode=driving`;
  }, [routePolyline, vehicle, factories, stations]);

  const speakAudioPrompt = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onstart = () => setIsAudioSpeaking(true);
      utterance.onend = () => setIsAudioSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAdvanceStop = () => {
    onConfirmPickup(currentStop.id);
    speakAudioPrompt(`Stop verified. Next stop: ${stops[Math.min(currentStepIndex + 1, stops.length - 1)].name.split(' ')[0]}.`);
    if (currentStepIndex < stops.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-0 sm:py-6 font-sans select-none min-h-[100dvh] sm:min-h-0">
      <div className="hidden sm:flex items-center gap-2 mb-3 text-xs text-slate-500 font-medium">
        <span>Driver In-Cabin Mount Viewport (390 × 812 pt • Responsive Mobile / Desktop)</span>
      </div>

      <div className="relative w-full sm:w-[390px] h-[100dvh] sm:h-[812px] bg-slate-900 sm:border-[8px] sm:border-slate-800 sm:rounded-[48px] shadow-2xl flex flex-col overflow-hidden">
        <div className="w-full h-full bg-slate-50 flex flex-col sm:rounded-[40px] overflow-hidden text-slate-900 select-none">
          
          {/* Status Bar - Hidden on Real Mobile Devices */}
          <div className="hidden sm:flex px-6 pt-3 pb-2 items-center justify-between text-xs text-slate-800 font-semibold shrink-0 bg-white border-b border-slate-100">
            <span>08:24</span>
            <div className="flex items-center gap-1.5">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4" />
            </div>
          </div>

          {/* Turn-by-Turn Navigation Header */}
          <div className="bg-emerald-700 text-white px-4 py-3 shrink-0 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Navigation className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">
                  {currentStop.type === 'pickup' ? `Stop ${currentStepIndex + 1}/4 • Pickup` : `Stop ${currentStepIndex + 1}/4 • Drop-off`}
                </div>
                <div className="text-sm font-bold leading-tight">
                  In 0.4 mi, turn right to {currentStop.name.split('(')[0]}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-base font-black">{currentStop.time}</div>
              <div className="text-[10px] text-emerald-200">ETA</div>
            </div>
          </div>

          {/* Van & Driver Telemetry Strip */}
          <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900">Van {vehicle.licensePlate}</span>
              <span>•</span>
              <span>28 MPH</span>
            </div>

            <div className="flex items-center gap-1 text-emerald-700 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DOT Logged</span>
            </div>
          </div>

          {/* Scrollable Driver Content Feed */}
          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
            {/* Weather Notice */}
            {weather.isBlizzardActive && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <div className="flex items-center gap-1 font-bold text-amber-800 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Winter Detour: I-94 Blocked</span>
                </div>
                <p className="text-[11px] leading-snug">
                  Route detoured via Michigan Ave. Departure was advanced 15 mins early.
                </p>
              </div>
            )}

            {/* Embedded Live Google Maps Turn-by-Turn GPS Map */}
            <DynamicDriverNavigationMap
              vehicle={vehicle}
              routePolyline={routePolyline}
              currentStopName={currentStop.name}
              currentStopCoords={currentStop.coordinates}
              stations={stations}
              factories={factories}
            />

            {/* Current Waypoint Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                    Current Destination
                  </span>
                  <div className="text-lg font-bold text-slate-900 mt-0.5 leading-tight">
                    {currentStop.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {currentStop.address}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-slate-900">{currentStop.time}</div>
                  <div className="text-[10px] text-slate-400">Target</div>
                </div>
              </div>

              {/* Dynamic Passenger Manifest */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Manifest ({currentStop.activeCount} active boarding)</span>
                  </span>
                  {currentStop.passengers.some((p) => p.includes('Skipped')) && (
                    <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      1 Absent
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {currentStop.passengers.map((p, idx) => {
                    const isSkippedWorker = p.includes('Skipped');
                    return (
                      <div
                        key={idx}
                        className={`text-xs flex items-center gap-2 ${
                          isSkippedWorker
                            ? 'text-slate-400 line-through'
                            : 'font-semibold text-slate-800'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isSkippedWorker ? 'bg-slate-300' : 'bg-emerald-600'
                          }`}
                        ></div>
                        <span>{p}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Big Touch-Friendly Buttons */}
              <div className="pt-1 space-y-2">
                <button
                  onClick={handleAdvanceStop}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {currentStepIndex >= stops.length - 1
                      ? 'Complete Route'
                      : `Confirm ${currentStop.activeCount} Riders Boarded • Next`}
                  </span>
                </button>

                <button
                  id="tour-google-maps-btn"
                  onClick={() => setShowGoogleMapsNav(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Open in Google Maps Navigation</span>
                </button>
              </div>
            </div>

            {/* Stops Timeline List */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2 shadow-sm">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Shift 1 Route Sequence
              </span>

              <div className="space-y-2 text-xs">
                {stops.map((stop, idx) => {
                  const isCurrent = idx === currentStepIndex;
                  const isPast = idx < currentStepIndex;

                  return (
                    <div
                      key={stop.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                        isCurrent
                          ? 'bg-blue-50/80 border-blue-500 text-blue-900 font-bold'
                          : isPast
                          ? 'bg-slate-50 border-slate-200 text-slate-400'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {idx + 1}
                        </span>
                        <span className="truncate">{stop.name.split('(')[0]}</span>
                      </div>
                      <span className="font-mono font-bold shrink-0">{stop.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Audio Cue Button */}
            <div className="pt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Hands-free voice prompt</span>
              <button
                onClick={() =>
                  speakAudioPrompt(
                    `Approaching ${currentStop.name.split(' ')[0]}. ${currentStop.activeCount} riders waiting.`
                  )
                }
                className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 text-[11px]"
              >
                <Volume2 className={`w-3.5 h-3.5 ${isAudioSpeaking ? 'animate-bounce text-blue-600' : ''}`} />
                <span>Play Voice Prompt</span>
              </button>
            </div>
          </div>

          {/* iOS Home Indicator Bar */}
          <div className="pt-1 pb-1.5 bg-slate-50 flex justify-center shrink-0 border-t border-slate-200">
            <div className="w-28 h-1 bg-slate-300 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* In-Cabin Turn-by-Turn Google Maps Navigation Modal */}
      <GoogleMapsNavModal
        isOpen={showGoogleMapsNav}
        onClose={() => setShowGoogleMapsNav(false)}
        vehicle={vehicle}
        routePolyline={routePolyline}
        currentStopName={currentStop.name}
        currentStopCoords={currentStop.coordinates}
        targetTime={currentStop.time}
        stations={stations}
        factories={factories}
        googleMapsUrl={googleMapsUrl}
      />
    </div>
  );
}
