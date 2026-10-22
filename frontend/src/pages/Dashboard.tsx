import { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, FlaskConical, Clock, Zap, Loader2, Search, Upload } from 'lucide-react';
import { apiClient } from '@/api/client';
import type { Overview, Anomaly, Specimen } from '@/types';
import StatsCard from '@/components/dashboard/StatsCard';
import SpecimenList from '@/components/dashboard/SpecimenList';
import AnomalyFeed from '@/components/dashboard/AnomalyFeed';
import MagneticButton from '@/components/ui/MagneticButton';
import AnimatedText from '@/components/ui/AnimatedText';

// Animation variants for the staggered stats grid
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [specimens, setSpecimens] = useState<Specimen[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [ov, sp, an] = await Promise.all([
        apiClient.getOverview(),
        apiClient.getSpecimens(),
        apiClient.getAnomalies(),
      ]);
      setOverview(ov);
      setSpecimens(sp.specimens);
      setAnomalies(an.anomalies);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => { fetchData(true); }, []);

  // Filter specimens based on search query
  const filteredSpecimens = useMemo(() => {
    if (!debouncedQuery) return specimens;
    const q = debouncedQuery.toLowerCase();
    return specimens.filter(s => 
      s.id.toLowerCase().includes(q) || 
      (s.patient_id && s.patient_id.toLowerCase().includes(q))
    );
  }, [specimens, debouncedQuery]);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      await apiClient.simulateSpecimen();
      await fetchData();
    } finally {
      setSimulating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSimulating(true);
    try {
      await apiClient.uploadCsv(file);
      await fetchData();
      alert("✅ Successfully imported real hospital data!");
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || "Unknown error";
      alert(`❌ Upload Failed: ${errorMsg}`);
    } finally {
      setSimulating(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96 relative z-10">
      <Loader2 className="animate-spin text-[#00E5A0] w-10 h-10" />
    </div>
  );

  return (
    <div className="space-y-8 relative z-10">
      
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="font-space text-[#00E5A0] text-xs tracking-widest mb-2"
          >
            // COMMAND CENTER
          </motion.div>
          
          <div className="font-bebas text-5xl md:text-6xl tracking-wide text-white flex gap-3">
            <AnimatedText text="LIVE SAMPLE" />
            <AnimatedText text="DASHBOARD" className="text-[#00E5A0]" />
          </div>

          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="text-gray-400 font-barlow mt-2 text-sm"
          >
            Tracking <span className="text-white font-bold">{overview?.total_specimens}</span> diagnostic samples in real-time.
          </motion.p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#00E5A0] transition-colors" />
            <input
              type="text"
              placeholder="Search ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#111]/80 backdrop-blur-md border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5A0] focus:ring-1 focus:ring-[#00E5A0] w-48 lg:w-64 transition-all"
            />
          </div>
          
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          
          <MagneticButton onClick={() => fileInputRef.current?.click()} disabled={simulating} className="flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-white/10 transition-all cursor-pointer">
            <Upload className="w-4 h-4" /> <span className="hidden lg:inline">Import CSV</span>
          </MagneticButton>

          <MagneticButton onClick={handleSimulate} disabled={simulating} className="flex items-center gap-2 bg-[#00E5A0] text-black px-5 py-2.5 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(0,229,160,0.4)] transition-all cursor-pointer">
            {simulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} 
            <span className="hidden lg:inline">Simulate Scan</span>
          </MagneticButton>
        </div>
      </div>

      {/* Stats Grid (Glassmorphism) */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}><StatsCard icon={FlaskConical} label="Total Specimens" value={overview?.total_specimens ?? 0} accent="info" /></motion.div>
        <motion.div variants={item}><StatsCard icon={AlertTriangle} label="Flagged" value={overview?.flagged_specimens ?? 0} accent="warning" /></motion.div>
        <motion.div variants={item}><StatsCard icon={Activity} label="Critical Anomalies" value={overview?.critical_anomalies ?? 0} accent="critical" /></motion.div>
        <motion.div variants={item}><StatsCard icon={Clock} label="Avg TAT (min)" value={overview?.avg_tat_minutes ?? 0} accent="accent" /></motion.div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle internal glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E5A0] opacity-5 blur-[100px] pointer-events-none" />
          
          <SpecimenList specimens={filteredSpecimens} />
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle internal glow */}
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500 opacity-5 blur-[100px] pointer-events-none" />

          <AnomalyFeed anomalies={anomalies} />
        </motion.div>
      </div>
    </div>
  );
}