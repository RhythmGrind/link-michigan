'use client';

import React, { useState, useEffect } from 'react';
import {
  WatsonxDecisionLog,
  CostAllocationSummary,
  WeatherCondition,
  AgentStreamStep,
} from '../types/transit';
import {
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  Compass,
  Route,
  Bot,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react';

interface WatsonxConsoleProps {
  decisionLog: WatsonxDecisionLog;
  costAllocation: CostAllocationSummary;
  weather: WeatherCondition;
  isProcessing: boolean;
  agentStreamSteps?: AgentStreamStep[];
  isAgentStreamActive?: boolean;
}

export default function WatsonxConsole({
  decisionLog,
  costAllocation,
  weather,
  isProcessing,
  agentStreamSteps = [],
  isAgentStreamActive = false,
}: WatsonxConsoleProps) {
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const hasStreamSteps = agentStreamSteps.length > 0;

  // Live seconds timer during active thinking stream
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isAgentStreamActive) {
      setElapsedSeconds(0);
      setIsThinkingExpanded(true);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => +(prev + 0.1).toFixed(1));
      }, 100);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAgentStreamActive]);

  const getAgentMeta = (id: string) => {
    switch (id) {
      case 'balancer':
        return {
          icon: <Compass className="w-3.5 h-3.5 text-blue-600" />,
          label: 'Fleet Balancer',
          sub: 'DBSCAN Spatial Clustering',
        };
      case 'router':
        return {
          icon: <Route className="w-3.5 h-3.5 text-purple-600" />,
          label: 'Route Optimizer',
          sub: 'Google Maps Routes VRP',
        };
      case 'arbitrator':
      default:
        return {
          icon: <Bot className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Dispatch Arbitrator',
          sub: 'IBM watsonx Granite 4.0',
        };
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between text-slate-900 font-sans h-full overflow-y-auto">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                IBM watsonx Copilot
              </div>
              <div className="text-xs text-slate-500">
                {isAgentStreamActive ? (
                  <span className="text-blue-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    Multi-Agent Reasoning Stream...
                  </span>
                ) : hasStreamSteps ? (
                  <span className="text-emerald-600 font-medium">Multi-Agent Swarm Optimized</span>
                ) : (
                  'Shift Dispatch Assistant'
                )}
              </div>
            </div>
          </div>

          <span className="text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 font-medium">
            {hasStreamSteps ? decisionLog.timestamp : 'Standby'}
          </span>
        </div>

        {/* Weather Contingency Alert Banner (Only when blizzard is active) */}
        {weather.isBlizzardActive && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="font-bold text-amber-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Weather Contingency Enacted</span>
            </div>
            <p className="text-amber-800 leading-relaxed text-xs">
              I-94 blizzard detour active. Departure buffers advanced to guarantee on-time shift arrival.
            </p>
          </div>
        )}

        {/* ChatGPT / Claude-style Collapsible Thinking Process Stream */}
        {hasStreamSteps ? (
          <div className="bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200/90 rounded-2xl p-3.5 space-y-3 transition-all duration-300">
            {/* Thinking Header Bar */}
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
            >
              <div className="flex items-center gap-2 text-xs">
                <span className="text-sm">💭</span>
                <span className="font-bold text-slate-800">
                  {isAgentStreamActive
                    ? `Thinking... (${elapsedSeconds}s)`
                    : `Thought for ${elapsedSeconds > 0 ? elapsedSeconds : '2.4'}s`}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 text-[11px] font-medium">
                  {agentStreamSteps.length} Agents Coordinated
                </span>
              </div>

              <button
                className="text-xs text-slate-400 hover:text-slate-700 font-medium flex items-center gap-1"
                aria-label="Toggle thinking process"
              >
                <span className="text-[11px]">{isThinkingExpanded ? 'Hide' : 'Show'}</span>
                {isThinkingExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Thinking Chain (Pure Natural Language Thoughts) */}
            {isThinkingExpanded && (
              <div className="pt-2 border-t border-slate-200/80 space-y-3">
                {agentStreamSteps.map((step, idx) => {
                  const meta = getAgentMeta(step.id);
                  const isLast = idx === agentStreamSteps.length - 1;
                  const isDone = step.status === 'completed';

                  return (
                    <div key={step.id + idx} className="relative flex items-start gap-2.5">
                      {/* Vertical Progress Line */}
                      {!isLast && (
                        <div className="absolute left-3.5 top-7 bottom-[-12px] w-[1.5px] bg-slate-200" />
                      )}

                      {/* Agent Step Icon */}
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border z-10 transition-colors ${
                          isDone
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-blue-50 border-blue-200 animate-pulse'
                        }`}
                      >
                        {meta.icon}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 min-w-0 space-y-1 text-xs">
                        {/* Title & Status */}
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                            <span>{meta.label}</span>
                            <span className="text-slate-400 font-normal text-[10px]">
                              ({meta.sub})
                            </span>
                          </div>

                          {isDone ? (
                            <span className="text-emerald-700 bg-emerald-100/60 font-semibold text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              Ready
                            </span>
                          ) : (
                            <span className="text-blue-600 font-semibold text-[10px] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                              Pondering...
                            </span>
                          )}
                        </div>

                        {/* Conversational Thinking Prose */}
                        {step.thinking && (
                          <div className="text-slate-600 leading-relaxed text-[11px] font-sans italic bg-white/70 p-2 rounded-xl border border-slate-100 shadow-2xs">
                            "{step.thinking}"
                          </div>
                        )}

                        {/* Reasoning Conclusion / Insight */}
                        {step.outputSummary && (
                          <div className="text-emerald-900 font-semibold text-[11px] bg-emerald-50/80 border border-emerald-200/80 px-2.5 py-1.5 rounded-lg leading-snug">
                            {step.outputSummary}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Clean Standby State when no dispatch has run yet */
          <div className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex flex-col items-center justify-center text-center space-y-3 my-auto">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-800">
                Multi-Agent Dispatch Standby
              </div>
              <p className="text-[11px] text-slate-500 max-w-[210px] leading-relaxed">
                Click <span className="font-semibold text-indigo-700">"🤖 Fire Multi-Agent Dispatch"</span> above to launch the real-time reasoning stream.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
