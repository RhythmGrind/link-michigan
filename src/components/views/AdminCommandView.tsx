'use client';

import React, { useState } from 'react';
import MapWrapper from '../Map/MapWrapper';
import WatsonxConsole from '../WatsonxConsole';
import InvoiceModal from '../modals/InvoiceModal';

import {
  FactoryDestination,
  SafeHubStation,
  WorkerProfile,
  FleetVehicle,
  WeatherCondition,
  WatsonxDecisionLog,
  CostAllocationSummary,
  AgentStreamStep,
} from '../../types/transit';

import {
  Building2,
  Truck,
  RotateCcw,
  CloudSnow,
  Play,
  Sparkles,
  CheckCircle,
  FileText,
  AlertTriangle,
  Users,
  Compass,
  Bot,
  Cpu,
  MapPin,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface AdminCommandViewProps {
  factories: FactoryDestination[];
  stations: SafeHubStation[];
  workers: WorkerProfile[];
  vehicle: FleetVehicle;
  routePolyline: [number, number][];
  route2Polyline?: [number, number][];
  weather: WeatherCondition;
  decisionLog: WatsonxDecisionLog;
  costAllocation: CostAllocationSummary;
  isProcessingAI: boolean;
  isSimulatingDrive: boolean;
  isScaledMode?: boolean;
  isMultiAgentRunning?: boolean;
  agentStreamSteps?: AgentStreamStep[];
  isAgentStreamActive?: boolean;
  onFireMultiAgentDispatch?: () => void;
  onToggleBlizzard: () => void;
  onToggleDriveSim: () => void;
  onReset: () => void;
}

export default function AdminCommandView({
  factories,
  stations,
  workers,
  vehicle,
  routePolyline,
  route2Polyline,
  weather,
  decisionLog,
  costAllocation,
  isProcessingAI,
  isSimulatingDrive,
  isScaledMode = true,
  isMultiAgentRunning = false,
  agentStreamSteps = [],
  isAgentStreamActive = false,
  onFireMultiAgentDispatch,
  onToggleBlizzard,
  onToggleDriveSim,
  onReset,
}: AdminCommandViewProps) {
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [expandedFactoryId, setExpandedFactoryId] = useState<string | null>('fac-1');

  const getStationName = (stationId: string) => {
    const station = stations.find((s) => s.id === stationId);
    return station ? station.name : 'SafeHub';
  };

  // Check if Bob is marked skipped in live state
  const bob = workers.find((w) => w.id === 'worker-bob' || w.id === 'worker-carlos') || workers[0];
  const isBobSkipped = bob?.status === 'skipped';

  return (
    <div className="w-full flex flex-col gap-4 font-sans select-none text-slate-900">
      {/* Clean Operations Sub-header */}
      <div className="bg-white border border-slate-200 px-6 py-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Wayne State / Midtown ➔ Downtown Detroit Tech Network
              {isScaledMode && (
                <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                  2 Shuttles Active • 16 Employees Clustered
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {isScaledMode
                ? 'Dual-Corridor Fleet: Midtown (#809) & West Corridor (#412) ➔ 3 Downtown Tech Companies'
                : `9:00 AM Cohort • ${workers.length} Employees (4 Hubs) • Direct Shuttles`}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Fire Multi-Agent Fleet Swarm Dispatch */}
          {onFireMultiAgentDispatch && (
            <button
              onClick={onFireMultiAgentDispatch}
              disabled={isMultiAgentRunning}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                isMultiAgentRunning
                  ? 'bg-indigo-600 text-white animate-pulse'
                  : 'bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200'
              }`}
              title="Fires 3 cooperative AI agents: FleetBalancerAgent, GoogleRoutesAgent, and GraniteDispatchArbitrator"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{isMultiAgentRunning ? '🤖 Swarm Optimizing...' : '🤖 Fire Multi-Agent Dispatch'}</span>
            </button>
          )}

          {/* View B2B Invoice */}
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="px-3 py-2 rounded-xl font-bold bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>B2B Invoice</span>
          </button>

          {/* Weather Toggle */}
          <button
            onClick={onToggleBlizzard}
            className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-colors font-bold ${
              weather.isBlizzardActive
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <CloudSnow className="w-3.5 h-3.5 text-amber-600" />
            <span>{weather.isBlizzardActive ? '❄️ Snow Detour Active' : 'Simulate Snow Delay'}</span>
          </button>

          {/* Van Simulation Play/Pause */}
          <button
            onClick={onToggleDriveSim}
            className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 font-bold ${
              isSimulatingDrive
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isSimulatingDrive ? 'Pause Vans' : 'Simulate Vans'}</span>
          </button>

          {/* Map Expand / Focus Toggle */}
          <button
            onClick={() => setIsMapExpanded(!isMapExpanded)}
            className={`px-3 py-2 rounded-xl border flex items-center gap-1.5 font-bold transition-all shadow-sm ${
              isMapExpanded
                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title={isMapExpanded ? 'Restore standard 3-column layout' : 'Expand map layout'}
          >
            {isMapExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isMapExpanded ? 'Standard Map' : 'Expand Map'}</span>
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors shadow-sm"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3-Column Operations Layout */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch transition-all duration-300 ${
        isMapExpanded ? 'min-h-[720px]' : 'min-h-[640px]'
      }`}>
        {/* Left Column (3 cols in normal mode): Plant Roster & Fleet info */}
        <div className={`flex flex-col gap-3 transition-all duration-300 ${
          isMapExpanded ? 'hidden' : 'lg:col-span-3'
        }`}>
          {/* Employer Destinations: 3 Downtown Tech HQs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">3 Downtown Employer Destinations</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                {isBobSkipped ? 'Bob Remote' : '9:00 AM Cohort On-Time'}
              </span>
            </div>

            {/* Individual Company Cards with Expandable Employee Dropdown */}
            <div className="space-y-2">
              {factories.map((factory) => {
                const isExpanded = expandedFactoryId === factory.id;
                const companyWorkers = workers.filter((w) => w.factoryId === factory.id);

                return (
                  <div
                    key={factory.id}
                    className={`rounded-xl border transition-all text-xs ${
                      isExpanded
                        ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-300/40 shadow-sm p-3'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 p-2.5'
                    }`}
                  >
                    {/* Clickable Header */}
                    <div
                      onClick={() => setExpandedFactoryId(isExpanded ? null : factory.id)}
                      className="cursor-pointer select-none"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{factory.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-blue-700 bg-white px-1.5 py-0.2 rounded border border-blue-200">
                            08:50 AM
                          </span>
                          <button
                            type="button"
                            className="text-slate-400 hover:text-blue-600 p-0.5 transition-colors"
                            title={isExpanded ? 'Collapse employees' : 'Expand employees'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>{factory.city}</span>
                      </div>

                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
                        <span>{factory.industry}</span>
                        <span className="font-semibold text-slate-700">
                          {companyWorkers.length > 0 ? `${companyWorkers.length} Commuters` : `${factory.totalWorkersExpecting} employees`}
                        </span>
                      </div>
                    </div>

                    {/* Expandable Employee Dropdown List */}
                    {isExpanded && (
                      <div className="mt-2.5 pt-2.5 border-t border-blue-200/60 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <span>Active Shift Commuters ({companyWorkers.length})</span>
                          <span>Pickup SafeHub</span>
                        </div>

                        {companyWorkers.length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic py-1 text-center">
                            Shift synchronized with regional fleet
                          </div>
                        ) : (
                          <div className="space-y-1 max-h-44 overflow-y-auto pr-0.5">
                            {companyWorkers.map((emp) => {
                              const isEmpSkipped = emp.status === 'skipped';
                              return (
                                <div
                                  key={emp.id}
                                  className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                                    isEmpSkipped
                                      ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                                      : 'bg-white border-slate-200 text-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 ${
                                        isEmpSkipped ? 'bg-rose-500 ring-2 ring-rose-200' : 'bg-emerald-500 ring-2 ring-emerald-200'
                                      }`}
                                    />
                                    <div className="truncate">
                                      <div className="font-bold text-[11px] leading-tight flex items-center gap-1">
                                        <span>{emp.name}</span>
                                        <span className="text-[9px] font-normal text-slate-500 truncate">
                                          • {emp.role.split('@')[0].trim()}
                                        </span>
                                      </div>
                                      <div className="text-[9px] text-slate-500 truncate">
                                        🏠 {emp.apartmentName || emp.homeAddress}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0 pl-2">
                                    <div className="text-[10px] font-semibold text-slate-700">
                                      {getStationName(emp.assignedStationId)}
                                    </div>
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-0.5 ${
                                        isEmpSkipped
                                          ? 'bg-rose-100 text-rose-700'
                                          : 'bg-emerald-50 text-emerald-700'
                                      }`}
                                    >
                                      {isEmpSkipped ? 'Remote' : '08:48 AM'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Commute Time Reduction Impact */}
            <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-900 uppercase">Commute Time Cut</span>
                <span className="text-[10px] font-extrabold text-white bg-emerald-600 px-2 py-0.5 rounded-full">
                  -75.9% Time
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-slate-600 text-[11px]">Shuttle vs Bus Desert:</span>
                <strong className="text-emerald-700 font-extrabold">11.2m <span className="text-slate-400 font-normal">vs 46.5m</span></strong>
              </div>
            </div>
          </div>

          {/* Carrier Info: Multi-Van Fleet */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-slate-900">
                    {isScaledMode ? 'Great Lakes Transit (2 Vans)' : 'Carrier: Great Lakes Transit'}
                  </span>
                </div>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                  Small Business
                </span>
              </div>

              <div className="mt-3 text-xs text-slate-700 space-y-2 font-medium">
                <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-200">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Van #809 (Ford Transit 350)</span>
                    <span className="text-blue-700">{isScaledMode ? '8/15 Seats (53%)' : '4/15 Seats (27%)'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Driver: Mike Kowalski • Route MI-01 (North)</div>
                </div>

                {isScaledMode && (
                  <div className="p-2.5 bg-purple-50/60 rounded-xl border border-purple-200">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Van #412 (Ford Transit 250)</span>
                      <span className="text-purple-700">8/12 Seats (67%)</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Driver: Dave Henderson • Route MI-02 (West)</div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">B2B Settlement Invoicing</span>
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Open Invoice</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center Column (6 cols in normal, 9 cols in expanded): Map with Clustering Halos */}
        <div className={`flex flex-col h-full transition-all duration-300 ${
          isMapExpanded ? 'lg:col-span-9 min-h-[720px]' : 'lg:col-span-6 min-h-[640px]'
        }`}>
          <MapWrapper
            factories={factories}
            stations={stations}
            workers={workers}
            vehicle={vehicle}
            routePolyline={routePolyline}
            route2Polyline={route2Polyline}
            weather={weather}
            isSimulatingDrive={isSimulatingDrive}
            isScaledMode={isScaledMode}
            isMapExpanded={isMapExpanded}
          />
        </div>

        {/* Right Column (3 cols in both normal and expanded): Watsonx Copilot */}
        <div className={`flex flex-col h-full transition-all duration-300 ${
          isMapExpanded ? 'lg:col-span-3 min-h-[720px]' : 'lg:col-span-3 min-h-[640px]'
        }`}>
          <WatsonxConsole
            decisionLog={decisionLog}
            costAllocation={costAllocation}
            weather={weather}
            isProcessing={isProcessingAI}
            agentStreamSteps={agentStreamSteps}
            isAgentStreamActive={isAgentStreamActive}
          />
        </div>
      </div>

      {/* Modals */}
      {showInvoiceModal && (
        <InvoiceModal
          costAllocation={costAllocation}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}
    </div>
  );
}
