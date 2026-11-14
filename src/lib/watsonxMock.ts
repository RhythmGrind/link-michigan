import { WatsonxDecisionLog, WeatherCondition } from '../types/transit';
import { INITIAL_WATSONX_LOG, BLIZZARD_WATSONX_LOG } from '../data/mockTransitData';

export type WatsonxScenario =
  | 'routine'
  | 'blizzard'
  | 'machinery_halt'
  | 'single_tap_skip'
  | 'batch_csv';

export interface WatsonxInferenceOptions {
  scenario?: WatsonxScenario;
  weather?: WeatherCondition;
  incidentReport?: string;
  workerName?: string;
  batchCount?: number;
}

export const MOCK_WATSONX_SCENARIOS: Record<WatsonxScenario, WatsonxDecisionLog> = {
  routine: {
    timestamp: '04:45:10 AM EST',
    model: 'ibm/granite-3-8b-instruct',
    triggerEvent: 'Routine Shift-1 Multi-Tenant Route Optimization Scheduled',
    reasoning: [
      'Aggregated 4 workers across 2 Tier-1 automotive suppliers into 2 high-safety 24h hubs (Speedway & Midtown CVS).',
      'Computed Shapley value cost allocation: AutoParts MI saves 52%, Great Lakes Tooling saves 57% versus running separate charter shuttles.',
      'Verified DOT Hours-of-Service compliance: Driver Mike Kowalski has 8.5 remaining duty hours.',
    ],
    actionTaken: 'Dispatched Route #MI-01 to Great Lakes Transit LLC. Departure set for 05:12 AM.',
    financialImpact: 'Consolidated fuel & vehicle mileage: -42% CO2, $230 combined daily manufacturer savings.',
    workerNotification: {
      en: 'Link Michigan: Good morning! Your 06:00 AM shift shuttle arrives at Speedway SafeHub at 05:18 AM. Van MI-TR-809.',
      es: 'Link Michigan: ¡Buenos días! Su transporte para el turno de las 06:00 AM llega a Speedway SafeHub a las 05:18 AM.',
      ar: 'Link Michigan: صباح الخير! حافلة وردية الساعة 06:00 صباحاً ستصل إلى محطة Speedway في تمام 05:18 صباحاً.',
    },
  },

  blizzard: {
    timestamp: '05:02:18 AM EST',
    model: 'ibm/granite-3-8b-instruct',
    triggerEvent: 'NOAA Lake-Effect Blizzard Alert: I-94 Westbound Blocked at Metro Airport corridor',
    reasoning: [
      'CRITICAL CONSTRAINT: AutoParts MI CNC Stamping Line #2 downtime cost is $2,200/hr. Senior programmer Bob must arrive by 05:55 AM.',
      'DETERMINISTIC ROUTE AUDIT: I-94 detour adds +22 mins delay. Regular 05:18 AM departure would result in 06:12 AM arrival (Late by 12 mins).',
      'AUTONOMOUS MITIGATION: Reverse-scheduled dispatch clock. Advanced departure buffer by +15 minutes across all stops.',
      'SAFETY PROTOCOL: Avoided unplowed residential side streets; rerouted via MDOT Priority Arterial (Michigan Ave / US-12).',
    ],
    actionTaken: 'Pushed +15min early boarding notice to riders. Transmitted hands-free reroute HUD update to Driver Mike.',
    financialImpact: 'Prevented estimated $4,400 in factory line stoppage penalty. Zero cold-weather exposure for waiting workers.',
    workerNotification: {
      en: '⚠️ Link Michigan Weather Alert: Blizzard delay on I-94. Your shuttle is adjusted 15 mins EARLY to ensure on-time factory arrival. Arriving Speedway at 05:05 AM. Please stay indoors until 05:02 AM!',
      es: '⚠️ Link Michigan Alerta Clima: Tormenta de nieve en I-94. Su transporte llegará 15 min ANTES (05:05 AM) para evitar demoras. ¡Espere dentro del local!',
      ar: '⚠️ Link Michigan تنبيه الطقس: عاصفة ثلجية على I-94. تم تقديم موعد الحافلة 15 دقيقة (05:05 صباحاً). يُرجى البقاء داخل المحطة الدافئة!',
    },
  },

  machinery_halt: {
    timestamp: '05:08:42 AM EST',
    model: 'ibm/granite-3-8b-instruct',
    triggerEvent: 'AutoParts MI Stamping Line #2 Press Failure — Master Die Specialist Expedited',
    reasoning: [
      'Received automated telemetry from AutoParts MI plant floor: 800-ton progressive die press hydraulic fault.',
      'PRIORITY DISPATCH: Bob is the certified technician for die recalibration. Production line cannot restart without him.',
      'DYNAMIC LOGISTICS: Instructed Driver Mike to execute direct non-stop transit to Romulus post-Speedway pickup.',
    ],
    actionTaken: 'Expedited Line #2 arrival to 05:42 AM (6 minutes ahead of standard schedule).',
    financialImpact: 'Safeguarded $18,000 hourly stamping throughput for OEM client assembly plant.',
    workerNotification: {
      en: 'Link Michigan Priority Notice: AutoParts MI requested expedited arrival for Line #2 die calibration. Express shuttle active.',
      es: 'Link Michigan Aviso Prioritario: AutoParts MI solicitó llegada acelerada para calibración de troqueles en Línea #2.',
      ar: 'Link Michigan إشعار أولوية: طلبت إدارة المصنع تسريع وصولك لمعايرة خط الإنتاج رقم 2.',
    },
  },

  single_tap_skip: {
    timestamp: '05:11:05 AM EST',
    model: 'ibm/granite-3-8b-instruct',
    triggerEvent: 'Rider Single-Tap Exemption: Bob reported sick',
    reasoning: [
      'Single-tap exception detected for Bob (Lead CNC, AutoParts MI).',
      'DYNAMIC ROUTE PRUNING: Stop 1 (Speedway Woodward) has 0 riders remaining.',
      'Van MI-TR-809 instructed to bypass Woodward loop directly to Warren Ave Hub (Saves 8 mins & 3.6 miles).',
      'AutoParts MI plant operations webhook triggered: assigned apprentice backup for Stamping Line #2.',
    ],
    actionTaken: 'OSRM route dynamically redrawn on live map; Driver HUD Stop 1 bypassed.',
    financialImpact: 'Eliminated unnecessary idle van mileage; automated shift coverage triggered with zero call overhead.',
    workerNotification: {
      en: 'Link Michigan: Your ride exemption is confirmed. Driver Mike and AutoParts MI supervisor have been notified. Get well soon!',
      es: 'Link Michigan: Su exención de viaje está confirmada. El conductor Mike y su supervisor fueron notificados. ¡Que se mejore!',
      ar: 'Link Michigan: تم تأكيد إلغاء رحلتك اليوم وإبلاغ المشرف في المصنع. نتمنى لك الشفاء العاجل!',
    },
  },

  batch_csv: {
    timestamp: '05:14:30 AM EST',
    model: 'ibm/granite-3-8b-instruct',
    triggerEvent: 'Bulk CSV Shift Ingestion: 12 Machinists Batched into Route Network',
    reasoning: [
      'Ingested 12 employee addresses from Detroit manufacturing corridor roster.',
      'Clustered workers using 400m walking radius into 2 safe assembly hubs (Speedway Woodward & Midtown CVS).',
      'Van occupancy increased from 26% to 80% (12 of 15 seats booked).',
      'Recomputed cooperative Shapley value: Individual employer cost per worker dropped from $8.80 to $4.20/shift.',
    ],
    actionTaken: 'OSRM route updated with optimal vehicle loading. Departure scheduled at 05:10 AM.',
    financialImpact: 'Maximizes consortium capacity utilization; saves small suppliers combined $480/day.',
    workerNotification: {
      en: 'Link Michigan: Your weekly manufacturing shuttle pass is activated. Assigned SafeHub: Speedway Woodward.',
      es: 'Link Michigan: Su pase semanal de transporte industrial está activo. SafeHub asignado: Speedway Woodward.',
      ar: 'Link Michigan: تم تفعيل تصريح التنقل الأسبوعي لمصنع السيارات. المحطة المعتمدة: Speedway Woodward.',
    },
  },
};

export async function requestWatsonxDispatchInference(
  weatherOrOptions: WeatherCondition | WatsonxInferenceOptions,
  incidentReport?: string
): Promise<WatsonxDecisionLog> {
  const isOptions = 'scenario' in weatherOrOptions || 'batchCount' in weatherOrOptions;
  const scenario: WatsonxScenario = isOptions
    ? (weatherOrOptions as WatsonxInferenceOptions).scenario || 'routine'
    : (weatherOrOptions as WeatherCondition).isBlizzardActive
    ? 'blizzard'
    : 'routine';

  // Live IBM Cloud watsonx.ai REST Call Check
  const apiKey = process.env.NEXT_PUBLIC_WATSONX_API_KEY || process.env.WATSONX_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_WATSONX_PROJECT_ID || process.env.WATSONX_PROJECT_ID;

  if (apiKey && projectId) {
    try {
      const response = await fetch('/api/watsonx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weather: isOptions ? (weatherOrOptions as WatsonxInferenceOptions).weather : weatherOrOptions,
          incidentReport,
          scenario,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return data as WatsonxDecisionLog;
      }
    } catch (err) {
      console.warn('watsonx live cloud call returned error, using local Granite 3.0 mock response', err);
    }
  }

  // Realistic mock inference delay (420ms simulating cloud token streaming)
  await new Promise((resolve) => setTimeout(resolve, 420));

  const baseLog = MOCK_WATSONX_SCENARIOS[scenario] || MOCK_WATSONX_SCENARIOS.routine;

  return {
    ...baseLog,
    timestamp: new Date().toLocaleTimeString('en-US', {
      timeZone: 'America/Detroit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }) + ' EST',
  };
}
