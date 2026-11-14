export interface Coordinates {
  lat: number;
  lng: number;
}

export interface WorkerProfile {
  id: string;
  name: string;
  role: string;
  factoryId: string;
  homeAddress: string;
  coordinates: Coordinates;
  assignedStationId: string;
  walkTimeMinutes: number;
  shiftTime: string;
  status: 'scheduled' | 'boarded' | 'skipped' | 'arrived';
  preferredLanguage: 'en' | 'es' | 'ar';
  // Optional housing & commute-simulation fields (young-talent storyline)
  apartmentName?: string;
  monthlyRent?: number;
  baselineTransitMins?: number;
  shuttleCommuteMins?: number;
}

export interface SafeHubStation {
  id: string;
  name: string;
  category: 'gas_station_24h' | 'pharmacy_plaza' | 'community_lot';
  address: string;
  coordinates: Coordinates;
  scheduledPickupTime: string;
  estimatedArrivalMinutes: number;
  assignedWorkerIds: string[];
  features: string[]; // e.g. ["24/7 Lighting", "Heated Convenience Store", "CCTV"]
  status: 'upcoming' | 'approaching' | 'completed' | 'skipped';
  // Optional hub amenity metadata
  heatingStatus?: 'ACTIVE' | 'INACTIVE' | 'STANDBY';
  store24Hour?: boolean;
  walkingSavedMeters?: number;
}

export interface FactoryDestination {
  id: string;
  name: string;
  industry: string;
  city: string;
  coordinates: Coordinates;
  shiftStartTime: string;
  targetArrivalTime: string;
  totalWorkersExpecting: number;
  criticalLineRole: string;
}

export interface FleetVehicle {
  id: string;
  fleetOperator: string;
  licensePlate: string;
  vehicleModel: string;
  capacity: number;
  driverName: string;
  currentLocation: Coordinates;
  currentSpeedMph: number;
  status: 'idle' | 'en_route' | 'holding' | 'completed';
}

export interface TransitRoutePlan {
  routeId: string;
  routeName: string;
  fleetVehicle: FleetVehicle;
  stations: SafeHubStation[];
  destinations: FactoryDestination[];
  totalDistanceMiles: number;
  estimatedDurationMinutes: number;
  departureTime: string;
  arrivalTime: string;
  routePolyline: [number, number][]; // [lat, lng] array
}

export interface WeatherCondition {
  isBlizzardActive: boolean;
  severity: 'normal' | 'snow_squall_warning' | 'severe_blizzard';
  temperatureF: number;
  snowDepthInches: number;
  affectedCorridors: string[];
  recommendedDepartureBufferMinutes: number;
}

export interface WatsonxDecisionLog {
  timestamp: string;
  model: string; // e.g., "ibm/granite-3-8b-instruct"
  triggerEvent: string;
  reasoning: string[];
  actionTaken: string;
  financialImpact: string;
  workerNotification: {
    en: string;
    es: string;
    ar: string;
  };
}

export interface AgentToolCall {
  toolName: string;
  description: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  status: 'calling' | 'completed' | 'failed';
  executionTimeMs?: number;
}

export interface AgentStreamStep {
  id: 'balancer' | 'router' | 'arbitrator';
  agentName: string;
  role: string;
  modelOrEngine: string;
  status: 'pending' | 'thinking' | 'tool_calling' | 'completed' | 'error';
  thinking: string;
  thoughtLog: string[];
  toolCall?: AgentToolCall;
  outputSummary?: string;
  metrics?: Record<string, any>;
  durationMs?: number;
}

export interface SwarmStreamEvent {
  type: 
    | 'dispatch_started'
    | 'step_started'
    | 'step_thinking'
    | 'step_tool_call'
    | 'step_tool_result'
    | 'step_completed'
    | 'dispatch_finalized'
    | 'error';
  stepId?: 'balancer' | 'router' | 'arbitrator';
  timestamp: string;
  data: any;
}

export interface CostAllocationSummary {
  totalCharterCost: number;
  factoryAShare: number;
  factoryBShare: number;
  savingsVsSoloCharterPercent: number;
  savingsDollarAmount: number;
  localFleetOperatorPayout: number;
}
