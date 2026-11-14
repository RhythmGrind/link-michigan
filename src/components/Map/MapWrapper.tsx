'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import {
  FactoryDestination,
  SafeHubStation,
  WorkerProfile,
  FleetVehicle,
  WeatherCondition,
} from '../../types/transit';

const DynamicMap = dynamic(() => import('./DetroitTransitMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[640px] rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-500 gap-3 shadow-inner">
      <div className="w-8 h-8 rounded-full border-3 border-blue-600 border-t-transparent animate-spin"></div>
      <div className="text-xs font-semibold text-slate-600">
        Loading Detroit Industrial Transit Map...
      </div>
    </div>
  ),
});

interface MapWrapperProps {
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

export default function MapWrapper(props: MapWrapperProps) {
  return <DynamicMap {...props} />;
}
