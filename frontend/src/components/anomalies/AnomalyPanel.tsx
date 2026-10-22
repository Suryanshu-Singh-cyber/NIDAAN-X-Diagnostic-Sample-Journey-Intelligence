import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { Anomaly } from '@/types';
import { cn } from '@/lib/utils';

export default function AnomalyPanel({ anomalies }: { anomalies: Anomaly[] }) {
  if (anomalies.length === 0) {
    return (
      <div className="card flex items-center gap-3 text-nidaan-accent">
        <CheckCircle className="w-5 h-5" />
        <p className="text-sm">No anomalies detected. Journey follows expected path.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-400" />
        Detected Anomalies ({anomalies.length})
      </h2>
      <div className="space-y-3">
        {anomalies.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              'p-4 rounded-lg border',
              a.severity === 'critical' && 'bg-red-500/5 border-red-500/30',
              a.severity === 'high' && 'bg-orange-500/5 border-orange-500/30',
              a.severity === 'low' && 'bg-blue-500/5 border-blue-500/30',
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
                {a.anomaly_type.replace('_', ' ')}
              </span>
              <span className={cn('badge', `badge-${a.severity}`)}>{a.severity}</span>
            </div>
            <p className="text-sm">{a.message}</p>
            {a.expected_value && a.actual_value && (
              <div className="flex gap-6 mt-3 text-xs font-mono">
                <div>
                  <span className="text-gray-500">Expected: </span>
                  <span className="text-nidaan-accent">{a.expected_value.toFixed(0)}m</span>
                </div>
                <div>
                  <span className="text-gray-500">Actual: </span>
                  <span className="text-red-400">{a.actual_value.toFixed(0)}m</span>
                </div>
                {a.deviation_pct && (
                  <div>
                    <span className="text-gray-500">Deviation: </span>
                    <span className="text-orange-400">+{a.deviation_pct.toFixed(0)}%</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}