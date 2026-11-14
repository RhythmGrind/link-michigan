'use client';

import React, { useState } from 'react';
import { FleetVehicle, SafeHubStation } from '../types/transit';
import { Navigation, CheckSquare, ShieldCheck, Volume2, ExternalLink } from 'lucide-react';

interface DriverHUDProps {
  vehicle: FleetVehicle;
  stations: SafeHubStation[];
  onConfirmPickup: (stationId: string) => void;
}

export default function DriverHUD({ vehicle, stations, onConfirmPickup }: DriverHUDProps) {
  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [isAudioSpeaking, setIsAudioSpeaking] = useState(false);

  const currentStation = stations[activeStopIndex] || stations[0];

  // Deep-link to native Google Maps turn-by-turn navigation
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${vehicle.currentLocation.lat},${vehicle.currentLocation.lng}&destination=42.2220,-83.3766&waypoints=42.3688,-83.0754|42.3485,-83.1250|42.3085,-83.1610&travelmode=driving`;

  const speakAudioPrompt = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsAudioSpeaking(true);
      utterance.onend = () => setIsAudioSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleConfirm = () => {
    onConfirmPickup(currentStation.id);
    speakAudioPrompt(`Boarding confirmed for ${currentStation.name.split(' ')[0]}. Next destination: Dearborn Industrial.`);
    if (activeStopIndex < stations.length - 1) {
      setActiveStopIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="bg-industrial-900 border border-industrial-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden">
      <div>
        {/* HUD Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-industrial-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-sm">
              <Navigation className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                {vehicle.licensePlate}
                <span className="text-[10px] bg-cyan-950 text-cyan-300 font-mono px-1.5 py-0.5 rounded border border-cyan-800/60">
                  Driver HUD
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono">{vehicle.driverName.split('(')[0]}</div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-1 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>DOT Compliant</span>
          </div>
        </div>

        {/* Current Active Waypoint Card */}
        <div className="mt-4 bg-industrial-950 border border-cyan-500/30 rounded-xl p-4 shadow-inner">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>NEXT WAYPOINT ({activeStopIndex + 1}/{stations.length})</span>
            <span className="text-cyan-400 font-bold">In-Transit (28 MPH)</span>
          </div>

          <div className="mt-2 text-base font-bold text-slate-100">{currentStation.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">{currentStation.address}</div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-industrial-900 p-2 rounded-lg border border-industrial-800">
              <div className="text-slate-400 text-[10px]">SCHEDULED TIME</div>
              <div className="text-amber-300 font-bold text-sm mt-0.5">{currentStation.scheduledPickupTime}</div>
            </div>
            <div className="bg-industrial-900 p-2 rounded-lg border border-industrial-800">
              <div className="text-slate-400 text-[10px]">MANIFEST WORKERS</div>
              <div className="text-cyan-300 font-bold text-sm mt-0.5">2 Workers (Bob / Alice)</div>
            </div>
          </div>
        </div>

        {/* Navigation Hand-off to Native Google Maps */}
        <div className="mt-3">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 flex items-center justify-center gap-2 transition-all shadow-md group"
          >
            <ExternalLink className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>🌐 Open Route in Native Google Maps</span>
          </a>
          <p className="text-[10px] text-slate-500 text-center mt-1">
            Hands-free legal compliance: Turns & voice delegated to driver's native navigation app.
          </p>
        </div>
      </div>

      {/* Driver Confirmation Button (Super Large Touch Target) */}
      <div className="mt-4 pt-3 border-t border-industrial-800 space-y-2">
        <button
          onClick={handleConfirm}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold font-sans text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 active:scale-[0.98] transition-all"
        >
          <CheckSquare className="w-5 h-5 text-emerald-200" />
          <span>✅ Confirmed: All Riders Boarded at Stop</span>
        </button>

        <button
          onClick={() =>
            speakAudioPrompt(
              `Dispatch notice from Watsonx: Approaching Woodward SafeHub. Two machinists waiting inside store. Drive safe.`
            )
          }
          className="w-full py-1 text-[11px] font-mono text-slate-400 hover:text-cyan-300 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Volume2 className={`w-3.5 h-3.5 ${isAudioSpeaking ? 'text-cyan-400 animate-bounce' : ''}`} />
          <span>{isAudioSpeaking ? 'Broadcasting Audio...' : 'Play Simulated In-Cabin Audio Prompt'}</span>
        </button>
      </div>
    </div>
  );
}
