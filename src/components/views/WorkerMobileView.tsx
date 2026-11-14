'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  WorkerProfile,
  SafeHubStation,
  WeatherCondition,
  FleetVehicle,
  FactoryDestination,
} from '../../types/transit';

const DynamicRiderTrackingMap = dynamic(() => import('../Map/RiderLiveTrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[200px] rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-500 gap-2 shadow-inner">
      <div className="w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
      <div className="text-[11px] font-semibold text-slate-600">Connecting to Shuttle GPS...</div>
    </div>
  ),
});

import {
  MapPin,
  Clock,
  QrCode,
  AlertCircle,
  Languages,
  X,
  Phone,
  HelpCircle,
  Wifi,
  Battery,
  Signal,
  Calendar,
  User,
  Navigation,
  RotateCcw,
  Coffee,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  ChevronRight,
  Flame,
  Award,
  Maximize2,
  Minimize2,
  Radio,
} from 'lucide-react';

interface WorkerMobileViewProps {
  worker: WorkerProfile;
  station: SafeHubStation;
  factory: FactoryDestination;
  vehicle: FleetVehicle;
  routePolyline?: [number, number][];
  weather: WeatherCondition;
  onSkipShift: (status: 'skipped' | 'scheduled') => void;
}

export default function WorkerMobileView({
  worker,
  station,
  factory,
  vehicle,
  routePolyline = [],
  weather,
  onSkipShift,
}: WorkerMobileViewProps) {
  const [lang, setLang] = useState<'en' | 'es' | 'ar'>(worker.preferredLanguage);
  const [activeTab, setActiveTab] = useState<'ride' | 'schedule' | 'safehub' | 'profile'>('ride');
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Real-world road distance calculation (Haversine * 1.3 Detroit grid factor)
  const calculateDistanceMiles = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3958.8;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return +(R * c * 1.3).toFixed(1);
  };

  const distanceToStop = calculateDistanceMiles(
    vehicle.currentLocation.lat,
    vehicle.currentLocation.lng,
    station.coordinates.lat,
    station.coordinates.lng
  );

  // Weekly Schedule State (Monday - Friday)
  const [weeklySchedule, setWeeklySchedule] = useState([
    { day: 'Mon', date: 'Nov 10', morning: '05:18 AM', return: '14:40 PM', status: 'completed' },
    { day: 'Tue', date: 'Nov 11', morning: '05:18 AM', return: '14:40 PM', status: 'completed' },
    { day: 'Wed', date: 'Nov 12', morning: '05:18 AM', return: '14:40 PM', status: 'completed' },
    { day: 'Thu', date: 'Nov 13', morning: '05:18 AM', return: '14:40 PM', status: 'today' },
    { day: 'Fri', date: 'Nov 14', morning: '05:18 AM', return: '14:40 PM', status: 'scheduled' },
  ]);

  const toggleDayOff = (index: number) => {
    setWeeklySchedule((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              status: item.status === 'off' ? 'scheduled' : 'off',
            }
          : item
      )
    );
  };

  const isSkipped = worker.status === 'skipped';

  const handleConfirmSkip = () => {
    setShowSkipModal(false);
    onSkipShift('skipped');
  };

  const handleUndoSkip = () => {
    onSkipShift('scheduled');
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-2 sm:py-6 font-sans select-none">
      {/* Viewport Dimension Tag */}
      <div className="hidden sm:flex items-center gap-2 mb-3 text-xs text-slate-500 font-medium">
        <span>Worker Mobile App (390 × 812 pt • Standard iPhone / Android)</span>
      </div>

      {/* Smartphone Chassis */}
      <div className="relative w-full sm:w-[390px] h-[812px] bg-slate-900 sm:border-[8px] sm:border-slate-800 sm:rounded-[48px] shadow-2xl flex flex-col overflow-hidden">
        {/* Smartphone Screen Glass */}
        <div className="w-full h-full bg-white flex flex-col sm:rounded-[40px] overflow-hidden text-slate-900">
          
          {/* Native Mobile Status Bar */}
          <div className="px-6 pt-3 pb-2 flex items-center justify-between text-xs text-slate-800 font-semibold shrink-0 bg-slate-50/80 border-b border-slate-100">
            <span>05:14</span>
            <div className="flex items-center gap-1.5">
              <Signal className="w-3.5 h-3.5" />
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-4 h-4" />
            </div>
          </div>

          {/* App Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
            <div>
              <span className="text-[11px] text-slate-500 font-medium">
                {activeTab === 'ride' && 'Good morning,'}
                {activeTab === 'schedule' && 'Weekly Shifts,'}
                {activeTab === 'safehub' && 'SafeHub Guide,'}
                {activeTab === 'profile' && 'Machinist Badge,'}
              </span>
              <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>{worker.name}</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.2 rounded-full">
                  Shift 1
                </span>
              </h1>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-full border border-slate-200 text-[10px] shadow-sm">
              <Languages className="w-3 h-3 text-slate-400 ml-1" />
              <button
                onClick={() => setLang('en')}
                className={`px-1.5 py-0.5 rounded-full font-bold transition-colors ${lang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('es')}
                className={`px-1.5 py-0.5 rounded-full font-bold transition-colors ${lang === 'es' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                ES
              </button>
              <button
                onClick={() => setLang('ar')}
                className={`px-1.5 py-0.5 rounded-full font-bold transition-colors ${lang === 'ar' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                عربي
              </button>
            </div>
          </div>

          {/* Scrollable Content View by Tab */}
          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
            {/* ================= TAB 1: RIDE TODAY ================= */}
            {activeTab === 'ride' && (
              <>
                {/* Weather Notice */}
                {weather.isBlizzardActive && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800 text-[11px] uppercase tracking-wider">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Snow Notice • Early Pickup</span>
                    </div>
                    <p className="text-[11px] text-amber-900 leading-snug">
                      I-94 snow delays. Van pickup advanced <strong>15 mins early to 05:05 AM</strong> to protect your 6:00 AM shift.
                    </p>
                    <div className="text-[10px] text-amber-800 font-medium bg-amber-100/70 p-1.5 rounded-lg flex items-center gap-1.5">
                      <Coffee className="w-3 h-3 text-amber-700" />
                      <span>Wait inside the heated Speedway store until the van arrives.</span>
                    </div>
                  </div>
                )}

                {/* Live Driver Tracking on Map */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="relative flex items-center justify-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute inset-0 animate-ping"></span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>Driver Mike is approaching</span>
                          <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-full">
                            {isSkipped ? 'Bypassing' : `${distanceToStop} mi away`}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {isSkipped
                            ? 'Bypassing Stop 1 • Zero riders scheduled'
                            : `On Woodward Ave • ETA ~${station.estimatedArrivalMinutes} mins to ${station.name.split(' ')[0]}`}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsMapExpanded(!isMapExpanded)}
                      className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors border border-slate-200"
                      title={isMapExpanded ? 'Minimize map' : 'Expand map'}
                    >
                      {isMapExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Leaflet Map Embed */}
                  <div className={`transition-all duration-300 ${isMapExpanded ? 'h-[300px]' : 'h-[180px]'}`}>
                    <DynamicRiderTrackingMap
                      worker={worker}
                      station={station}
                      vehicle={vehicle}
                      routePolyline={routePolyline}
                      isSkipped={isSkipped}
                      weather={weather}
                    />
                  </div>

                  {/* Walking Recommendation */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span>🚶</span>
                      <span>Walk to SafeHub: <strong>{worker.walkTimeMinutes} mins</strong></span>
                    </span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                      {isSkipped ? 'Shift Exemption' : 'Time to head out'}
                    </span>
                  </div>
                </div>

                {/* Primary ETA Card */}
                <div className={`border rounded-2xl p-4 space-y-3 shadow-sm transition-colors ${
                  isSkipped ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {isSkipped ? 'Shift Exemption Active' : 'Shuttle Status'}
                      </span>
                      <div className={`text-2xl font-black tracking-tight mt-0.5 ${
                        isSkipped ? 'text-rose-700' : 'text-slate-900'
                      }`}>
                        {isSkipped ? 'Ride Skipped Today' : weather.isBlizzardActive ? 'In 3 minutes' : 'In 4 minutes'}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {isSkipped
                          ? 'Van MI-TR-809 bypassing Stop 1 for your pickup'
                          : weather.isBlizzardActive
                          ? 'Pickup at 05:05 AM'
                          : `Pickup at ${station.scheduledPickupTime}`}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500">Assigned Van</span>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">{vehicle.licensePlate}</div>
                      <span className="text-[10px] text-slate-500">Driver Mike</span>
                    </div>
                  </div>

                  {/* 2-Step Trip Path */}
                  <div className="pt-2 border-t border-slate-200 space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px] ${
                        isSkipped ? 'bg-slate-200 text-slate-500' : 'bg-blue-100 text-blue-700'
                      }`}>
                        1
                      </div>
                      <div className="flex-1">
                        <div className={`text-xs font-bold ${isSkipped ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          Walk 3 min to Speedway SafeHub
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {station.address} • 24/7 heated store
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px] ${
                        isSkipped ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        2
                      </div>
                      <div className="flex-1">
                        <div className={`text-xs font-bold ${isSkipped ? 'text-slate-400' : 'text-slate-900'}`}>
                          Drop-off at {factory.name.split('(')[0]}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isSkipped ? 'Plant supervisor notified of sick absence' : 'ETA 05:48 AM • 12 min before shift start'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                    {!isSkipped ? (
                      <>
                        <button
                          onClick={() => setShowQrModal(true)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Tap Pass</span>
                        </button>

                        <button
                          id="tour-cant-ride-btn"
                          onClick={() => setShowSkipModal(true)}
                          className="py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-700 text-[11px] font-semibold transition-colors"
                        >
                          Can't ride?
                        </button>
                      </>
                    ) : (
                      <div className="w-full flex items-center justify-between gap-2 bg-rose-100/60 p-2 rounded-xl border border-rose-200">
                        <span className="text-[11px] text-rose-800 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Skipped for today</span>
                        </span>
                        <button
                          onClick={handleUndoSkip}
                          className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Undo</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Return Trip Guaranteed Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">Return Trip (Shift End)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Departs plant at 14:40 PM ➔ Speedway</div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Confirmed
                  </span>
                </div>

                {/* Dispatch Support Row */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                  <span>Running late or need help?</span>
                  <button
                    onClick={() => setShowSupportModal(true)}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>Contact Dispatch</span>
                  </button>
                </div>
              </>
            )}

            {/* ================= TAB 2: WEEKLY SCHEDULE ================= */}
            {activeTab === 'schedule' && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs space-y-1">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Weekly Bidirectional Commute Pass</span>
                  </div>
                  <p className="text-[11px] text-blue-800">
                    Tap any upcoming day to toggle vacation/off-duty exemption.
                  </p>
                </div>

                <div className="space-y-2">
                  {weeklySchedule.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleDayOff(idx)}
                      className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        item.status === 'today'
                          ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                          : item.status === 'off'
                          ? 'bg-rose-50/60 border-rose-200 opacity-80'
                          : item.status === 'completed'
                          ? 'bg-slate-50/70 border-slate-200 text-slate-500'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex flex-col items-center justify-center font-bold text-slate-800 text-[11px]">
                          <span>{item.day}</span>
                          <span className="text-[9px] text-slate-500 font-normal">{item.date.split(' ')[1]}</span>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {item.status === 'off' ? 'Exemption / Off Duty' : 'Shift 1 Commute (Romulus)'}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {item.status === 'off' ? 'No shuttle booked' : `Morning: ${item.morning} • Return: ${item.return}`}
                          </div>
                        </div>
                      </div>

                      <div>
                        {item.status === 'today' && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                            Today
                          </span>
                        )}
                        {item.status === 'completed' && (
                          <span className="text-[10px] font-medium text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Done
                          </span>
                        )}
                        {item.status === 'off' && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                            Off
                          </span>
                        )}
                        {item.status === 'scheduled' && (
                          <span className="text-[10px] font-medium text-slate-500">Booked</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800">Return Guarantee Policy</div>
                  <p>
                    Link Michigan shuttles guarantee your afternoon return to Speedway SafeHub even if the morning run faced delays.
                  </p>
                </div>
              </div>
            )}

            {/* ================= TAB 3: SAFEHUB GUIDE ================= */}
            {activeTab === 'safehub' && (
              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                        Your Assigned Assembly Point
                      </span>
                      <div className="text-base font-bold text-slate-900 mt-0.5">
                        Speedway 24/7 SafeHub
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        6500 Woodward Ave (Corner of Grand Blvd)
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Active
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                      Verified Safety Amenities
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-600" />
                        <span>Heated Waiting Store</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>24/7 CCTV Monitored</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Coffee className="w-3.5 h-3.5 text-amber-700" />
                        <span>Shift Worker Coffee</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Salted Sidewalks</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    <strong>Winter Protocol:</strong> In weather below 20°F, stay inside the heated Speedway store. Driver Mike will sound a courtesy chime when pulling into the north canopy.
                  </div>
                </div>

                {/* Secondary Hub */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Midtown CVS SafeHub</span>
                    <span className="text-[10px] text-slate-400">Stop 2</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    5200 Warren Ave & Junction Plaza (Serving Dearborn Toolmakers)
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 4: PROFILE & BADGE ================= */}
            {activeTab === 'profile' && (
              <div className="space-y-3">
                {/* Official Tier-1 Plant Transit Badge */}
                <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white rounded-2xl p-4 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] tracking-wider uppercase font-semibold text-blue-200">
                      Tier-1 Manufacturing Transit Pass
                    </div>
                    <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
                      #MI-W-104
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-12 h-12 rounded-xl bg-white text-blue-900 font-extrabold text-lg flex items-center justify-center shadow">
                      CM
                    </div>
                    <div>
                      <div className="text-base font-bold">{worker.name}</div>
                      <div className="text-xs text-blue-200">{worker.role}</div>
                      <div className="text-[11px] text-blue-300 font-medium">AutoParts Michigan • Line #2</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/20 flex justify-between items-center text-[10px] text-blue-200">
                    <span>Valid: Shift 1 (06:00 - 14:30)</span>
                    <span className="text-emerald-300 font-bold">Consortium Certified</span>
                  </div>
                </div>

                {/* Rider Shift & Attendance Guarantee Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Manufacturing Shift Attendance Guarantee</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Shift 1 Punctuality</div>
                      <div className="font-extrabold text-emerald-700 text-sm mt-0.5">100% Guaranteed</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Weather-exempt tardiness protection</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">SafeHub Access</div>
                      <div className="font-extrabold text-blue-700 text-sm mt-0.5">24/7 Heated Store</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Zero outdoor cold exposure</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Your ride is certified under the Wayne County Industrial Transit Consortium, guaranteeing arrival at Line #2 at least 10 minutes before shift start.
                  </p>
                </div>

                {/* Emergency & Plant Contact Info */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 text-xs space-y-2">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Emergency & Plant Info
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600">
                    <div>• Plant Contact: AutoParts MI Desk (313) 555-0100</div>
                    <div>• Emergency Contact: Alice (Family) (313) 555-0199</div>
                    <div>• Preferred Language: <strong className="text-slate-800">Español (ES)</strong></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Mobile Navigation Tabs */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 grid grid-cols-4 gap-1 text-[10px] font-medium text-slate-500 shrink-0 select-none">
            <button
              onClick={() => setActiveTab('ride')}
              className={`flex flex-col items-center gap-0.5 py-1 rounded-lg transition-colors ${
                activeTab === 'ride' ? 'text-blue-600 font-bold' : 'hover:text-slate-900'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>Ride</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex flex-col items-center gap-0.5 py-1 rounded-lg transition-colors ${
                activeTab === 'schedule' ? 'text-blue-600 font-bold' : 'hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule</span>
            </button>

            <button
              onClick={() => setActiveTab('safehub')}
              className={`flex flex-col items-center gap-0.5 py-1 rounded-lg transition-colors ${
                activeTab === 'safehub' ? 'text-blue-600 font-bold' : 'hover:text-slate-900'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>SafeHub</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center gap-0.5 py-1 rounded-lg transition-colors ${
                activeTab === 'profile' ? 'text-blue-600 font-bold' : 'hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
          </div>

          {/* iOS Home Indicator Bar */}
          <div className="pt-1 pb-1.5 bg-slate-50 flex justify-center shrink-0">
            <div className="w-28 h-1 bg-slate-300 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Boarding Pass Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xs w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-900">Digital Boarding Pass</span>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mx-auto w-44 h-44 flex items-center justify-center shadow-inner">
              <QrCode className="w-36 h-36 text-slate-900" />
            </div>

            <div>
              <div className="text-base font-bold text-slate-900">{worker.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {factory.name.split('(')[0]} • Shift 1
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Hold near reader when boarding Van {vehicle.licensePlate}.
            </div>
          </div>
        </div>
      )}

      {/* Skip Confirmation Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xs w-full p-5 space-y-3.5 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Skip today's ride?</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Cancels your pickup and notifies your plant supervisor at {factory.name.split('(')[0]}. No phone call needed.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setShowSkipModal(false)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Keep ride
              </button>
              <button
                onClick={handleConfirmSkip}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white"
              >
                Yes, skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xs w-full p-5 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-900">Support & Dispatch</span>
              <button
                onClick={() => setShowSupportModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Driver Mike Kowalski</div>
                  <div className="text-slate-500 text-[11px]">Van {vehicle.licensePlate}</div>
                </div>
                <a
                  href="tel:3135550192"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-900">AutoParts MI Desk</div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Operations: (313) 555-0100
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
