import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { Specimen } from '@/types';
import { STAGE_LABELS } from '@/lib/utils';

export default function SpecimenList({ specimens }: { specimens: Specimen[] }) {
  const navigate = useNavigate();

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Specimen Journeys</h2>
        <span className="text-xs text-gray-500">{specimens.length} tracked</span>
      </div>
      <div className="space-y-2 max-h-[600px] overflow-auto pr-1">
        {specimens.map((s) => (
          <button
            key={s.id}
            onClick={() => navigate(`/specimen/${s.id}`)}
            className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-nidaan-accent/30 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{s.id}</span>
                  {s.priority === 'urgent' && (
                    <span className="badge badge-high">URGENT</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>{s.sample_type}</span>
                  <span>·</span>
                  <span>{s.test_type}</span>
                  <span>·</span>
                  <span>{s.location}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Current</p>
                  <p className="text-xs font-medium">{STAGE_LABELS[s.current_stage] || s.current_stage}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-nidaan-accent transition-colors" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}