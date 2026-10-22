import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import type { Anomaly } from '@/types';
import { cn } from '@/lib/utils';

export default function AnomalyFeed({ anomalies }: { anomalies: Anomaly[] }) {
  const navigate = useNavigate();

  return (
    <div className="card h-full">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-yellow-400" />
        <h2 className="font-semibold">Active Anomalies</h2>
        <span className="ml-auto text-xs text-gray-500">{anomalies.length}</span>
      </div>
      <div className="space-y-2 max-h-[600px] overflow-auto pr-1">
        {anomalies.map((a, i) => (
          <button
            key={i}
            onClick={() => navigate(`/specimen/${a.specimen_id}`)}
            className={cn(
              'w-full text-left p-3 rounded-lg border transition-all hover:scale-[1.02]',
              a.severity === 'critical' && 'bg-red-500/5 border-red-500/20 hover:border-red-500/50',
              a.severity === 'high' && 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/50',
              a.severity === 'low' && 'bg-blue-500/5 border-blue-500/20 hover:border-blue-500/50',
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs font-semibold">{a.specimen_id}</span>
              <span className={cn('badge', `badge-${a.severity}`)}>{a.severity}</span>
            </div>
            <p className="text-xs text-gray-400 line-clamp-2">{a.message}</p>
          </button>
        ))}
      </div>
    </div>
  );
}