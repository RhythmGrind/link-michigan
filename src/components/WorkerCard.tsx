'use client';

import React, { useState } from 'react';
import { WorkerProfile, SafeHubStation, WeatherCondition } from '../types/transit';
import { Bell, MapPin, CheckCircle, AlertTriangle, Globe } from 'lucide-react';

interface WorkerCardProps {
  worker: WorkerProfile;
  station: SafeHubStation;
  weather: WeatherCondition;
  onSkipShift: () => void;
}

export default function WorkerCard({ worker, station, weather, onSkipShift }: WorkerCardProps) {
  const [lang, setLang] = useState<'en' | 'es' | 'ar'>(worker.preferredLanguage);
  const [isSkipped, setIsSkipped] = useState(worker.status === 'skipped');

  const handleSkip = () => {
    setIsSkipped(true);
    onSkipShift();
  };

  const getSmsText = () => {
    if (weather.isBlizzardActive) {
      if (lang === 'es') {
        return '⚠️ Link Michigan Alerta Clima: I-94 con demoras. Su van llega 15 min ANTES (05:05 AM) a Speedway SafeHub. ¡Espere dentro del local calefaccionado!';
      }
      if (lang === 'ar') {
        return '⚠️ تنبيه Link Michigan: تأخير في I-94. ستصل الحافلة مبكراً 15 دقيقة (05:05 ص) إلى محطة Speedway. يرجى الانتظار داخل المحطة الدافئة!';
      }
      return '⚠️ Link Michigan Weather Alert: Blizzard delay on I-94. Your van arrives 15 mins EARLY (05:05 AM) at Speedway SafeHub. Stay indoors until 05:02 AM!';
    }

    if (lang === 'es') {
      return `Link Michigan: ¡Buenos días ${worker.name}! Su transporte llega a Speedway SafeHub a las 05:18 AM (Van MI-TR-809). Buen turno.`;
    }
    if (lang === 'ar') {
      return 'Link Michigan: صباح الخير! حافلتك تصل إلى محطة Speedway في الساعة 05:18 ص (لوحة MI-TR-809).';
    }
    return `Link Michigan: Good morning ${worker.name}! Your shuttle arrives at Speedway SafeHub at 05:18 AM (Van MI-TR-809). Have a safe shift!`;
  };

  return (
    <div className="bg-industrial-900 border border-industrial-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between relative overflow-hidden">
      {/* Background Accent glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div>
        {/* Header bar */}
        <div className="flex items-center justify-between pb-3 border-b border-industrial-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-sm">
              CM
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                {worker.name}
                <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded">
                  Rider View
                </span>
              </div>
              <div className="text-xs text-slate-400">{worker.role}</div>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-industrial-950 p-1 rounded-lg border border-industrial-800 text-[11px] font-mono">
            <Globe className="w-3 h-3 text-slate-400 ml-1" />
            <button
              onClick={() => setLang('en')}
              className={`px-1.5 py-0.5 rounded ${lang === 'en' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('es')}
              className={`px-1.5 py-0.5 rounded ${lang === 'es' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              ES
            </button>
            <button
              onClick={() => setLang('ar')}
              className={`px-1.5 py-0.5 rounded ${lang === 'ar' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              عربي
            </button>
          </div>
        </div>

        {/* Boarding Status Box */}
        <div className="mt-4 bg-industrial-950/80 border border-industrial-800 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">Designated SafeHub</span>
            <span className="text-[11px] text-amber-400 font-mono font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              24/7 Heated Store
            </span>
          </div>

          <div className="flex items-start gap-2 text-slate-200">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-slate-100">{station.name}</div>
              <div className="text-xs text-slate-400">
                {worker.walkTimeMinutes} min walk from home • Boarding at{' '}
                <span className="text-amber-300 font-bold font-mono">
                  {weather.isBlizzardActive ? '05:05 AM (-15m)' : station.scheduledPickupTime}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Arrival Countdown */}
          <div className="pt-2 border-t border-industrial-800/80 flex items-center justify-between">
            <div className="text-xs text-slate-400 font-mono">Live Shuttle ETA:</div>
            <div className="text-sm font-mono font-bold text-cyan-400 animate-pulse flex items-center gap-1.5">
              <span>{weather.isBlizzardActive ? '3 mins away' : `${station.estimatedArrivalMinutes} mins away`}</span>
              <span className="text-[10px] text-slate-500 font-normal">(Ford Transit #809)</span>
            </div>
          </div>
        </div>

        {/* SMS Notification Bubble */}
        <div className="mt-3.5 bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-3 text-xs text-indigo-200 flex items-start gap-2.5">
          <Bell className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-mono text-[10px] text-indigo-400 uppercase tracking-wider font-semibold">
              Carrier SMS Dispatch Push ({lang.toUpperCase()})
            </div>
            <p className="leading-relaxed text-[11px]">{getSmsText()}</p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-industrial-800 flex items-center justify-between">
        <div className="text-xs text-slate-400">
          Status:{' '}
          {isSkipped ? (
            <span className="text-rose-400 font-bold font-mono">Skipped (Sick Day Notified)</span>
          ) : (
            <span className="text-emerald-400 font-bold font-mono flex items-center gap-1 inline-flex">
              <CheckCircle className="w-3 h-3" /> Ready for Pickup
            </span>
          )}
        </div>

        {!isSkipped && (
          <button
            onClick={handleSkip}
            className="px-3 py-1.5 rounded-lg bg-industrial-800 hover:bg-rose-950/80 border border-industrial-700 hover:border-rose-600/60 text-xs font-mono text-slate-300 hover:text-rose-300 transition-colors flex items-center gap-1.5"
            title="Single-tap sick day: cancels pickup and notifies plant foreman without phone calls"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Skip Today (Sick)
          </button>
        )}
      </div>
    </div>
  );
}
