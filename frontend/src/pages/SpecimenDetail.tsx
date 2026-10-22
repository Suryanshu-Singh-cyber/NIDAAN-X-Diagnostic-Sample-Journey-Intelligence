import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { apiClient } from '@/api/client';
import type { Journey, Anomaly } from '@/types';
import JourneyTimeline from '@/components/timeline/JourneyTimeline';
import AnomalyPanel from '@/components/anomalies/AnomalyPanel';

export default function SpecimenDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      apiClient.getJourney(id),
      apiClient.getSpecimenAnomalies(id),
    ]).then(([j, a]) => {
      setJourney(j);
      setAnomalies(a.anomalies);
    });
  }, [id]);

  if (!journey) return <div className="text-gray-500">Loading journey...</div>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-mono">{journey.specimen_id}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {journey.conforms ? '✓ Follows expected path' : `⚠ ${journey.missing_stages.length} missing stage(s)`}
          </p>
        </div>
        <div className="flex gap-2">
          {journey.missing_stages.map(s => (
            <span key={s} className="badge badge-critical">Missing: {s}</span>
          ))}
        </div>
      </div>

      <JourneyTimeline journey={journey} anomalies={anomalies} />

      <AnomalyPanel anomalies={anomalies} />
    </div>
  );
}