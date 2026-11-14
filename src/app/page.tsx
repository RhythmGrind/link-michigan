'use client';

import React, { useState, useEffect } from 'react';
import WorkerMobileView from '../components/views/WorkerMobileView';
import AdminCommandView from '../components/views/AdminCommandView';
import DriverCockpitView from '../components/views/DriverCockpitView';

import {
  DETROIT_FACTORIES,
  SAFE_HUB_STATIONS,
  WORKER_PROFILES,
  SCALED_WORKER_PROFILES,
  ACTIVE_FLEET_VEHICLE,
  DEFAULT_WEATHER,
  SIMULATED_BLIZZARD,
  INITIAL_COST_ALLOCATION,
  SCALED_COST_ALLOCATION,
  INITIAL_WATSONX_LOG,
  SCALED_WATSONX_LOG,
  ROUTE_2_POLYLINE,
} from '../data/mockTransitData';
import {
  WeatherCondition,
  WatsonxDecisionLog,
  CostAllocationSummary,
  WorkerProfile,
  AgentStreamStep,
} from '../types/transit';
import {
  calculateDetroitRoute,
  FALLBACK_NORMAL_ROUTE,
  FALLBACK_BLIZZARD_ROUTE,
  FALLBACK_BYPASSED_ROUTE,
} from '../lib/osrm';
import { requestWatsonxDispatchInference } from '../lib/watsonxMock';

import {
  Smartphone,
  LayoutDashboard,
  Truck,
  CloudSnow,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  QrCode,
} from 'lucide-react';

export default function AppEntry() {
  // Current Active Top-Level View: 'worker' | 'admin' | 'driver'
  const [currentView, setCurrentView] = useState<'worker' | 'admin' | 'driver'>('admin');
  const [showQrModal, setShowQrModal] = useState(false);

  // Auto-detect mobile devices for optimal landing (Mobile -> Rider App; Desktop -> Management Console)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setCurrentView('worker');
    }
  }, []);

  // Shared Reactive Cross-Platform Operational State (Routes & Vans Appear After Multi-Agent Dispatch)
  const [workers, setWorkers] = useState<WorkerProfile[]>(SCALED_WORKER_PROFILES);
  const [weather, setWeather] = useState<WeatherCondition>(DEFAULT_WEATHER);
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>(FALLBACK_NORMAL_ROUTE);
  const [route2Polyline, setRoute2Polyline] = useState<[number, number][]>(ROUTE_2_POLYLINE);
  const [isSimulatingDrive, setIsSimulatingDrive] = useState(false);
  const isScaledMode = true; // Natively dual-shuttle fleet active for 3 tech companies
  const [isMultiAgentRunning, setIsMultiAgentRunning] = useState(false);
  
  // Agent Reasoning Stream State
  const [agentStreamSteps, setAgentStreamSteps] = useState<AgentStreamStep[]>([]);
  const [isAgentStreamActive, setIsAgentStreamActive] = useState(false);
  
  const [decisionLog, setDecisionLog] = useState<WatsonxDecisionLog>(INITIAL_WATSONX_LOG);
  const [costAllocation, setCostAllocation] = useState<CostAllocationSummary>(SCALED_COST_ALLOCATION);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // Check if Station 1 (Speedway / Wayne State) is bypassed (0 active scheduled riders)
  const isStation1Bypassed = !workers.some(
    (w) => w.assignedStationId === SAFE_HUB_STATIONS[0].id && w.status !== 'skipped'
  );

  // Reactive Cross-Portal Sick/Skip Handler (Bidirectional)
  const handleSkipShift = (
    workerId: string = 'worker-bob',
    status: 'skipped' | 'scheduled' = 'skipped'
  ) => {
    setWorkers((prev) =>
      prev.map((w) =>
        w.id === workerId || w.id === 'worker-bob'
          ? { ...w, status }
          : w
      )
    );

    if (status === 'skipped') {
      setRoutePolyline(FALLBACK_BYPASSED_ROUTE);
      setDecisionLog((prev) => ({
        ...prev,
        timestamp:
          new Date().toLocaleTimeString('en-US', {
            timeZone: 'America/Detroit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }) + ' EST',
        triggerEvent: 'Rider Single-Tap Exemption: Bob reported sick',
        reasoning: [
          'Single-tap exception received for Bob (Lead CNC, AutoParts MI).',
          'DYNAMIC ROUTE PRUNING: Stop 1 (Speedway Woodward) has 0 riders remaining.',
          'Van MI-TR-809 instructed to bypass Woodward loop directly to Warren Ave Hub (Saves 12 mins & 4.2 miles).',
          'AutoParts MI plant operations webhook triggered: assigned apprentice backup for Stamping Line #2.',
        ],
        actionTaken: 'Route dynamically pruned on live map; Driver HUD Stop 1 bypassed.',
      }));
    } else {
      setRoutePolyline(FALLBACK_NORMAL_ROUTE);
      setDecisionLog(INITIAL_WATSONX_LOG);
    }
  };

  // Toggle Winter Blizzard Simulation
  const handleToggleBlizzard = async () => {
    setIsProcessingAI(true);
    const nextWeather = weather.isBlizzardActive ? DEFAULT_WEATHER : SIMULATED_BLIZZARD;
    setWeather(nextWeather);

    const newLog = await requestWatsonxDispatchInference(nextWeather);
    setDecisionLog(newLog);
    setIsProcessingAI(false);

    setRoutePolyline(nextWeather.isBlizzardActive ? FALLBACK_BLIZZARD_ROUTE : FALLBACK_NORMAL_ROUTE);
  };

  // Fire Multi-Agent Swarm: Streaming SSE implementation
  const handleFireMultiAgentDispatch = async () => {
    if (isMultiAgentRunning) return;
    setIsMultiAgentRunning(true);
    setIsAgentStreamActive(true);
    setAgentStreamSteps([]);
    setIsProcessingAI(true);
    
    // Internal helper to mutate specific steps in the stream
    const updateStep = (id: string, updates: Partial<AgentStreamStep>) => {
      setAgentStreamSteps(prev => {
        const existing = prev.find(p => p.id === id);
        if (existing) {
          return prev.map(p => p.id === id ? { ...p, ...updates } : p);
        } else {
          // Defaults if step somehow arrives out of order
          return [...prev, {
            id: id as any,
            agentName: id === 'balancer' ? 'FleetBalancerAgent' : id === 'router' ? 'GoogleRoutesAgent' : 'GraniteDispatchArbitrator',
            role: 'Agent',
            modelOrEngine: 'Unknown',
            status: 'pending',
            thinking: '',
            thoughtLog: [],
            ...updates
          }];
        }
      });
    };

    try {
      const res = await fetch('/api/multiagent/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({ workersCount: 16, weather }),
      });

      if (!res.body) throw new Error('No readable stream returned');
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let buffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || ''; // Keep the last incomplete part in the buffer

          for (const part of parts) {
            if (part.trim() === '') continue;
            
            const lines = part.split('\n');
            let eventType = '';
            let eventData = '';
            for (const line of lines) {
              if (line.startsWith('event:')) eventType = line.replace('event:', '').trim();
              if (line.startsWith('data:')) eventData = line.replace('data:', '').trim();
            }

            if (eventType && eventData) {
              const payload = JSON.parse(eventData);
              const { stepId } = payload;
              
              switch (eventType) {
                case 'dispatch_started':
                  break;
                case 'step_started':
                  updateStep(stepId, {
                    id: stepId,
                    status: 'thinking',
                    agentName: stepId === 'balancer' ? 'FleetBalancerAgent' : stepId === 'router' ? 'GoogleRoutesAgent' : 'GraniteDispatchArbitrator',
                    modelOrEngine: stepId === 'balancer' ? 'DBSCAN Cluster' : stepId === 'router' ? 'Google Maps Routes V2' : 'IBM Granite 4.0',
                    role: stepId === 'balancer' ? 'Spatial Partitioner' : stepId === 'router' ? 'VRP Navigator' : 'Executive Arbitrator',
                  });
                  break;
                case 'step_thinking':
                  updateStep(stepId, { thinking: payload.thinking });
                  break;
                case 'step_tool_call':
                  updateStep(stepId, { status: 'tool_calling', toolCall: payload.toolCall });
                  break;
                case 'step_tool_result':
                  setAgentStreamSteps(prev => prev.map(p => p.id === stepId ? {
                    ...p,
                    toolCall: p.toolCall ? { ...p.toolCall, output: payload.output, status: 'completed' } : undefined
                  } : p));
                  break;
                case 'step_completed':
                  updateStep(stepId, { status: 'completed', outputSummary: payload.outputSummary, metrics: payload.telemetry });
                  
                  // React immediately to UI consequences of each agent completing!
                  if (stepId === 'balancer') {
                    setWorkers(SCALED_WORKER_PROFILES);
                    setCostAllocation(SCALED_COST_ALLOCATION);
                  } else if (stepId === 'router') {
                    if (payload.telemetry?.van1Coords && payload.telemetry.van1Coords.length > 0) {
                      setRoutePolyline(payload.telemetry.van1Coords);
                    } else {
                      setRoutePolyline(FALLBACK_NORMAL_ROUTE);
                    }
                    if (payload.telemetry?.van2Coords && payload.telemetry.van2Coords.length > 0) {
                      setRoute2Polyline(payload.telemetry.van2Coords);
                    } else {
                      setRoute2Polyline(ROUTE_2_POLYLINE);
                    }
                  }
                  break;
                case 'dispatch_finalized':
                  setDecisionLog(payload.decisionLog);
                  setIsAgentStreamActive(false);
                  setIsProcessingAI(false);
                  setIsMultiAgentRunning(false);
                  break;
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Multi-agent dispatch error:', err);
      setRoutePolyline(FALLBACK_NORMAL_ROUTE);
      setRoute2Polyline(ROUTE_2_POLYLINE);
      setIsProcessingAI(false);
      setIsMultiAgentRunning(false);
      setIsAgentStreamActive(false);
    }
  };

  // Reset System State (Clears routes and resets fleet to staging)
  const handleReset = () => {
    setWorkers(SCALED_WORKER_PROFILES);
    setWeather(DEFAULT_WEATHER);
    setDecisionLog(INITIAL_WATSONX_LOG);
    setCostAllocation(SCALED_COST_ALLOCATION);
    setRoutePolyline([]);
    setRoute2Polyline([]);
    setIsSimulatingDrive(false);
    setIsMultiAgentRunning(false);
    setIsAgentStreamActive(false);
    setAgentStreamSteps([]);
  };

  const isBobSkippedGlobal = workers.some(
    (w) => w.id === 'worker-bob' && w.status === 'skipped'
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Clean Responsive Header */}
      <header className="sticky top-0 z-[1000] bg-white border-b border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          {/* Top Row on Mobile: Brand & Weather/Reset Controls */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-2.5">
              <img
                src="/icon.svg"
                alt="Link Michigan Logo"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl shadow-md shrink-0 object-contain bg-blue-700 p-1"
              />

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Link Michigan</span>
                  <span className="hidden sm:inline-block text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    Michigan DevFest 2026
                  </span>
                </div>
                <div className="hidden sm:block text-xs text-slate-500 font-medium">
                  Detroit Tech & Industrial Corridor Microtransit Network
                </div>
              </div>
            </div>

            {/* Quick Actions (QR, Weather & Reset) on Mobile Screen */}
            <div className="flex md:hidden items-center gap-1.5 text-xs">
              <button
                onClick={() => setShowQrModal(true)}
                className="p-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700"
                title="Scan QR Code to open on phone"
              >
                <QrCode className="w-4 h-4" />
              </button>

              <button
                onClick={handleToggleBlizzard}
                className={`p-1.5 rounded-xl border flex items-center justify-center ${
                  weather.isBlizzardActive
                    ? 'bg-amber-100 border-amber-300 text-amber-900'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
                title="Toggle Blizzard Delay"
              >
                <CloudSnow className="w-4 h-4 text-amber-600" />
              </button>

              <button
                onClick={handleReset}
                className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors shadow-sm"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Three Portals Switcher - Full-width Thumb-friendly on Mobile */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center justify-between sm:justify-start gap-1 text-xs border border-slate-200 w-full md:w-auto">
            {/* 1. Worker Mobile App */}
            <button
              onClick={() => setCurrentView('worker')}
              className={`flex-1 md:flex-initial px-3 sm:px-3.5 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
                currentView === 'worker'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Rider App</span>
            </button>

            {/* 2. Management & Fleet Console */}
            <button
              onClick={() => setCurrentView('admin')}
              className={`flex-1 md:flex-initial px-3 sm:px-3.5 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
                currentView === 'admin'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Plant & Fleet Management</span>
              <span className="md:hidden">Fleet Console</span>
            </button>

            {/* 3. Driver HUD */}
            <button
              onClick={() => setCurrentView('driver')}
              className={`flex-1 md:flex-initial px-3 sm:px-3.5 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
                currentView === 'driver'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Driver Cockpit</span>
            </button>
          </div>

          {/* Desktop Presentation & Simulation Controls */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            {/* Mobile Demo QR Code Trigger */}
            <button
              onClick={() => setShowQrModal(true)}
              className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Open QR Code for audience & judges to test on their phones"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>📱 Scan Mobile Demo</span>
            </button>

            <button
              id="tour-snow-delay-btn"
              onClick={handleToggleBlizzard}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors font-bold ${
                weather.isBlizzardActive
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CloudSnow className="w-3.5 h-3.5 text-amber-600" />
              <span>{weather.isBlizzardActive ? 'Snow Detour Active' : 'Simulate Snow Delay'}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors shadow-sm"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Global Cross-Portal Attendance Sync Notification Banner */}
      {isBobSkippedGlobal && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 mx-auto">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Dynamic Route Pruning:</strong> Bob reported sick. Stop 1 (Woodward) has 0 riders & is <strong>automatically bypassed on the map</strong> (saves 12 mins).
            </span>
            <button
              onClick={() => handleSkipShift('worker-bob', 'scheduled')}
              className="font-bold text-blue-700 hover:underline ml-2"
            >
              [Undo / Restore Stop 1]
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col justify-start">
        {/* VIEW 1: Worker Mobile App */}
        {currentView === 'worker' && (
          <WorkerMobileView
            worker={workers.find((w) => w.id === 'worker-bob') || workers[0]}
            station={SAFE_HUB_STATIONS[0]}
            factory={DETROIT_FACTORIES[0]}
            vehicle={ACTIVE_FLEET_VEHICLE}
            routePolyline={routePolyline}
            weather={weather}
            onSkipShift={(status) => handleSkipShift('worker-bob', status)}
          />
        )}

        {/* VIEW 2: Plant & Fleet Operations Console */}
        {currentView === 'admin' && (
          <AdminCommandView
            factories={DETROIT_FACTORIES}
            stations={SAFE_HUB_STATIONS}
            workers={workers}
            vehicle={ACTIVE_FLEET_VEHICLE}
            routePolyline={routePolyline}
            route2Polyline={route2Polyline}
            weather={weather}
            decisionLog={decisionLog}
            costAllocation={costAllocation}
            isProcessingAI={isProcessingAI}
            isSimulatingDrive={isSimulatingDrive}
            isScaledMode={isScaledMode}
            isMultiAgentRunning={isMultiAgentRunning}
            agentStreamSteps={agentStreamSteps}
            isAgentStreamActive={isAgentStreamActive}
            onFireMultiAgentDispatch={handleFireMultiAgentDispatch}
            onToggleBlizzard={handleToggleBlizzard}
            onToggleDriveSim={() => setIsSimulatingDrive(!isSimulatingDrive)}
            onReset={handleReset}
          />
        )}

        {/* VIEW 3: Driver View */}
        {currentView === 'driver' && (
          <DriverCockpitView
            vehicle={ACTIVE_FLEET_VEHICLE}
            stations={SAFE_HUB_STATIONS}
            factories={DETROIT_FACTORIES}
            workers={workers}
            weather={weather}
            routePolyline={routePolyline}
            onConfirmPickup={(stationId) => {
              console.log('Confirmed pickup at station:', stationId);
            }}
          />
        )}
      </main>

      {/* Audience / Judges Mobile QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Scan to Test on Your Phone
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Open your phone camera to experience the live <strong>Rider Commuter App</strong> on your own device.
              </p>
            </div>

            {/* High-Res QR Code */}
            <div className="p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-inner">
              <img
                src="/qr_code.png"
                alt="Link Michigan Live Mobile Demo QR Code"
                className="w-56 h-56 rounded-xl object-contain"
              />
            </div>

            <div className="w-full bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex items-center justify-between text-xs font-mono">
              <span className="text-[11px] text-slate-600 truncate mr-2">
                link-michigan.2h53i8gh3rua.au-syd...
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('https://link-michigan.2h53i8gh3rua.au-syd.codeengine.appdomain.cloud');
                  alert('Live deployment link copied to clipboard!');
                }}
                className="px-2 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px] hover:bg-blue-700 transition-colors shrink-0"
              >
                Copy Link
              </button>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
