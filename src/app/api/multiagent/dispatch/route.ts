import { NextRequest } from 'next/server';
import { HIGH_RES_NORMAL_ROUTE, HIGH_RES_ROUTE_2 } from '@/data/highResRoutes';
import { SCALED_WATSONX_LOG } from '@/data/mockTransitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper: write one SSE event into the stream
function sseEvent(
  controller: ReadableStreamDefaultController,
  eventType: string,
  payload: object
) {
  const data = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  controller.enqueue(new TextEncoder().encode(data));
}

// Helper: sleep
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const isBlizzard = body?.weather?.isBlizzardActive ?? false;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // ─────────────────────────────────────────────
        // DISPATCH STARTED
        // ─────────────────────────────────────────────
        sseEvent(controller, 'dispatch_started', {
          stepId: null,
          timestamp: new Date().toISOString(),
          message: 'Multi-Agent Swarm initializing. 3 agents dispatched.',
        });
        await sleep(400);

        // ─────────────────────────────────────────────
        // AGENT 1: FleetBalancerAgent  (DBSCAN Clustering)
        // ─────────────────────────────────────────────
        sseEvent(controller, 'step_started', {
          stepId: 'balancer',
          timestamp: new Date().toISOString(),
        });
        await sleep(500);

        sseEvent(controller, 'step_thinking', {
          stepId: 'balancer',
          thinking:
            "I have 16 workers across the Detroit corridor. Let me cluster them by 400m walking radius. Palmer Park / Hamtramck density forms Cluster Alpha around Woodward. Warren Ave / Junction density forms Cluster Beta. I'll assign Van #809 to Alpha (8 workers, 53% load) and Van #412 to Beta (8 workers, 67% load).",
        });
        await sleep(1200);

        sseEvent(controller, 'step_tool_call', {
          stepId: 'balancer',
          toolCall: {
            toolName: 'run_dbscan_cluster',
            description: 'DBSCAN spatial clustering with 400m epsilon radius',
            input: { workers: 16, epsilon_meters: 400, min_samples: 2 },
            status: 'calling',
          },
        });
        await sleep(900);

        sseEvent(controller, 'step_tool_result', {
          stepId: 'balancer',
          output: {
            clusterAlpha: { hub: 'Speedway Woodward', workers: 8, van: 'MI-TR-809' },
            clusterBeta: { hub: 'Midtown Warren', workers: 8, van: 'MI-TR-412' },
            deadheadSaved_miles: 14.8,
          },
        });
        await sleep(400);

        sseEvent(controller, 'step_completed', {
          stepId: 'balancer',
          outputSummary:
            '16 workers partitioned into 2 clusters. Van #809 → Woodward (53% load). Van #412 → Warren (67% load). Saves 14.8 deadhead miles.',
          telemetry: { clustersFound: 2, workersBalanced: 16, deadheadSavedMiles: 14.8 },
        });
        await sleep(600);

        // ─────────────────────────────────────────────
        // AGENT 2: GoogleRoutesAgent  (VRP Route Calculation)
        // ─────────────────────────────────────────────
        sseEvent(controller, 'step_started', {
          stepId: 'router',
          timestamp: new Date().toISOString(),
        });
        await sleep(500);

        sseEvent(controller, 'step_thinking', {
          stepId: 'router',
          thinking: isBlizzard
            ? "NOAA alert: I-94 Westbound blocked near Metro Airport. I need to reroute both vans via Michigan Ave / US-12. This adds ~18 minutes but avoids the closure. Let me compute the alternate geometry for Van #809 and keep Van #412's west corridor unchanged — it doesn't use I-94."
            : 'Cluster Alpha needs: Depot → Speedway Hub → Warren Hub → Great Lakes Dearborn → AutoParts Romulus. Cluster Beta needs its own west-corridor path. Let me call the VRP solver for both simultaneously.',
        });
        await sleep(1400);

        sseEvent(controller, 'step_tool_call', {
          stepId: 'router',
          toolCall: {
            toolName: 'solve_vrp_routes',
            description: 'Vehicle Routing Problem solver for dual-van fleet',
            input: {
              van1_waypoints: ['Depot', 'Speedway', 'Warren', 'Great Lakes', 'AutoParts'],
              van2_waypoints: ['Depot West', 'Warren', 'Great Lakes', 'AutoParts'],
              avoid_corridors: isBlizzard ? ['I-94 Westbound'] : [],
            },
            status: 'calling',
          },
        });
        await sleep(1100);

        // The actual route coordinates come from our high-res precomputed data
        const van1Coords = HIGH_RES_NORMAL_ROUTE;
        const van2Coords = HIGH_RES_ROUTE_2;

        sseEvent(controller, 'step_tool_result', {
          stepId: 'router',
          output: {
            van1: { distanceMiles: 23.4, durationMinutes: isBlizzard ? 48 : 34, points: van1Coords.length },
            van2: { distanceMiles: 18.7, durationMinutes: 29, points: van2Coords.length },
          },
        });
        await sleep(400);

        sseEvent(controller, 'step_completed', {
          stepId: 'router',
          outputSummary: isBlizzard
            ? `Both routes computed. Van #809 rerouted via Michigan Ave (+14 min buffer). Van #412 west corridor unaffected. Routes live on map.`
            : `Dual-corridor routes computed. Van #809: 23.4 mi / 34 min. Van #412: 18.7 mi / 29 min. Routes now live on map.`,
          telemetry: {
            van1Coords,
            van2Coords,
            van1Miles: 23.4,
            van2Miles: 18.7,
          },
        });
        await sleep(700);

        // ─────────────────────────────────────────────
        // AGENT 3: GraniteDispatchArbitrator  (IBM Granite 4.0 Final Decision)
        // ─────────────────────────────────────────────
        sseEvent(controller, 'step_started', {
          stepId: 'arbitrator',
          timestamp: new Date().toISOString(),
        });
        await sleep(500);

        sseEvent(controller, 'step_thinking', {
          stepId: 'arbitrator',
          thinking: isBlizzard
            ? "FleetBalancer confirmed 2-van partition. Router computed blizzard-safe detour. AutoParts MI Stamping Line #2 downtime cost is $2,200/hr — Bob must arrive by 05:55 AM. With +18 min detour I need to advance departure by 15 min. Shapley value recalculation: extra fuel cost ($12) splits 60/40 by worker-mile ratio. Issuing final dispatch with advanced boarding times and trilingual worker alerts."
            : 'FleetBalancer confirmed 2-van partition. Router confirmed optimal dual-corridor geometry. Shapley value allocation: AutoParts MI (10 workers) owes $210, Great Lakes Tooling (6 workers) owes $170. Combined savings of $470 vs solo charter. Issuing final dispatch authorization.',
        });
        await sleep(1600);

        // Try live Granite inference; fall back to mock on failure
        let arbitratorSummary =
          'IBM Granite 4.0 authorized dual-corridor dispatch. Shapley settlement locked. All workers notified in preferred language.';

        try {
          const apiKey = process.env.WATSONX_API_KEY;
          const projectId = process.env.WATSONX_PROJECT_ID;

          if (apiKey && projectId) {
            const tokenRes = await fetch('https://iam.cloud.ibm.com/identity/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`,
            });

            if (tokenRes.ok) {
              const { access_token } = await tokenRes.json();
              const prompt = `You are Link Michigan Dispatch Arbitrator. Clusters: Alpha (8 workers, Van #809, North Corridor), Beta (8 workers, Van #412, West Corridor). Weather: ${isBlizzard ? 'BLIZZARD — I-94 blocked, +18 min detour applied' : 'Normal winter conditions'}. Factory shift deadline: 06:00 AM. Provide a one-sentence executive dispatch authorization decision.`;

              const wxRes = await fetch(
                'https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29',
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                  },
                  body: JSON.stringify({
                    model_id: 'ibm/granite-4-h-small',
                    input: prompt,
                    parameters: { decoding_method: 'greedy', max_new_tokens: 80, min_new_tokens: 10 },
                    project_id: projectId,
                  }),
                }
              );

              if (wxRes.ok) {
                const wxData = await wxRes.json();
                const generated = (wxData.results?.[0]?.generated_text || '').trim();
                if (generated) arbitratorSummary = generated;
              }
            }
          }
        } catch {
          // Fall through to mock summary
        }

        sseEvent(controller, 'step_completed', {
          stepId: 'arbitrator',
          outputSummary: arbitratorSummary,
          telemetry: {
            model: 'ibm/granite-4-h-small',
            shapleyAutoparts: isBlizzard ? 127.0 : 210.0,
            shapleyGreatLakes: isBlizzard ? 98.0 : 170.0,
            totalSavings: isBlizzard ? 320.0 : 470.0,
          },
        });
        await sleep(500);

        // ─────────────────────────────────────────────
        // DISPATCH FINALIZED — push updated decisionLog
        // ─────────────────────────────────────────────
        sseEvent(controller, 'dispatch_finalized', {
          stepId: null,
          timestamp: new Date().toISOString(),
          decisionLog: {
            ...SCALED_WATSONX_LOG,
            timestamp:
              new Date().toLocaleTimeString('en-US', {
                timeZone: 'America/Detroit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }) + ' EST',
            model: 'ibm/granite-4-h-small',
          },
        });
      } catch (err) {
        sseEvent(controller, 'error', { message: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
