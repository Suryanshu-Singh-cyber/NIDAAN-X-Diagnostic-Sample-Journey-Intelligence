import { motion } from 'framer-motion';
import type { Journey, Anomaly } from '@/types';
import { STAGE_LABELS, STAGE_ICONS, formatTimestamp, minutesBetween, cn } from '@/lib/utils';

export default function JourneyTimeline({ journey, anomalies }: {
  journey: Journey; anomalies: Anomaly[];
}) {
  const events = journey.events;
  const hasMissing = (stage: string) => journey.missing_stages.includes(stage);
  const stageAnomaly = (stage: string) =>
    anomalies.find(a => a.stage === stage && a.severity === 'critical');

  return (
    <div className="card">
      <h2 className="font-semibold mb-6">Sample Journey Timeline</h2>

      <div className="relative overflow-x-auto pb-4">
        <div className="flex items-stretch gap-0 min-w-max">
          {journey.expected_path.map((stage, idx) => {
            const event = events.find(e => e.activity === stage);
            const isMissing = !event && hasMissing(stage);
            const anomaly = stageAnomaly(stage);
            const prevEvent = idx > 0 ? events.find(e => e.activity === journey.expected_path[idx - 1]) : null;
            const gapMinutes = event && prevEvent ? minutesBetween(prevEvent.timestamp, event.timestamp) : 0;
            const isDelayed = gapMinutes > 120;

            return (
              <div key={stage} className="flex items-center">
                {/* Node */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.08 }}
                  className="flex flex-col items-center w-40"
                >
                  <div
                    className={cn(
                      'w-14 h-14 rounded-xl flex items-center justify-center text-2xl border-2 relative',
                      isMissing && 'bg-red-500/10 border-red-500 border-dashed animate-pulse',
                      anomaly && !isMissing && 'bg-orange-500/10 border-orange-500',
                      event && !anomaly && 'bg-nidaan-accent/10 border-nidaan-accent/40',
                      !event && !isMissing && 'bg-gray-500/5 border-gray-700'
                    )}
                  >
                    {STAGE_ICONS[stage]}
                    {isMissing && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">!</span>
                    )}
                  </div>

                  <p className="text-xs font-medium mt-3 text-center">
                    {STAGE_LABELS[stage]}
                  </p>

                  {event ? (
                    <>
                      <p className="text-[10px] text-gray-500 mt-1 text-center font-mono">
                        {formatTimestamp(event.timestamp).split(',')[1]?.trim()}
                      </p>
                      <p className="text-[10px] text-gray-600 text-center">{event.location}</p>
                      {gapMinutes > 0 && (
                        <p className={cn(
                          'text-[10px] mt-1 font-mono px-1.5 py-0.5 rounded',
                          isDelayed ? 'bg-red-500/20 text-red-400' : 'text-gray-600'
                        )}>
                          +{gapMinutes.toFixed(0)}m
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-[10px] text-red-400 mt-1 font-semibold">MISSING</p>
                  )}
                </motion.div>

                {/* Connector */}
                {idx < journey.expected_path.length - 1 && (
                  <div className="flex flex-col items-center px-1">
                    <div
                      className={cn(
                        'h-0.5 w-12 relative',
                        (isMissing || isDelayed) ? 'bg-red-500/50' : 'bg-nidaan-accent/40'
                      )}
                    >
                      {(isMissing || isDelayed) && (
                        <div className="absolute inset-0 bg-red-500 animate-pulse" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Evidence trail */}
      <div className="mt-8 border-t border-nidaan-border pt-6">
        <h3 className="text-sm font-semibold mb-3 text-gray-400">Event Evidence Trail</h3>
        <div className="space-y-2">
          {events.map((e, i) => (
            <div key={i} className="flex items-center gap-4 text-xs font-mono bg-white/5 rounded-lg px-3 py-2">
              <span className="text-gray-500 w-32">{formatTimestamp(e.timestamp)}</span>
              <span className="text-nidaan-accent w-40">{e.activity}</span>
              <span className="text-gray-400 w-32">{e.location}</span>
              <span className="text-gray-500">{e.operator}</span>
              <span className="ml-auto text-gray-600">{e.scan_type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}