import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '@/api/client';
import type { Bottleneck } from '@/types';
import BottleneckChart from '@/components/analytics/BottleneckChart';
import AnimatedText from '@/components/ui/AnimatedText';
import { AlertTriangle, TrendingUp, Clock } from 'lucide-react';

export default function Analytics() {
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);

  useEffect(() => {
    apiClient.getBottlenecks().then(d => setBottlenecks(d.bottlenecks));
  }, []);

  const avgDelay = bottlenecks.reduce((acc, curr) => acc + (curr.actual_median - curr.expected_median), 0) / bottlenecks.length || 0;
  const worstBottleneck = bottlenecks[0];

  return (
    <div className="space-y-8 relative z-10">
      
      {/* Header */}
      <div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-space text-[#00E5A0] text-xs tracking-widest mb-2">
          // PERFORMANCE INTELLIGENCE
        </motion.div>
        <h1 className="font-bebas text-5xl md:text-7xl tracking-wide text-white">
          <AnimatedText text="BOTTLENECK" /> <AnimatedText text="ANALYTICS" className="text-[#00E5A0]" />
        </h1>
      </div>

      {/* KPI Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="font-space text-xs text-gray-400 tracking-wider">AVG DELAY OVER BASELINE</h3>
          </div>
          <p className="font-bebas text-5xl text-white">+{avgDelay.toFixed(1)}<span className="text-xl text-gray-500 ml-2">min</span></p>
        </div>
        
        <div className="bg-[#111]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="font-space text-xs text-gray-400 tracking-wider">WORST BOTTLENECK</h3>
          </div>
          <p className="font-bebas text-4xl text-white truncate">{worstBottleneck?.transition || 'N/A'}</p>
        </div>

        <div className="bg-[#111]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-[#00E5A0]" />
            <h3 className="font-space text-xs text-gray-400 tracking-wider">CRITICAL RATIO</h3>
          </div>
          <p className="font-bebas text-5xl text-[#00E5A0]">{worstBottleneck?.ratio.toFixed(2) || '0'}x</p>
        </div>
      </motion.div>

      {/* Main Chart */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <BottleneckChart bottlenecks={bottlenecks} />
      </motion.div>

      {/* Detailed Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <h2 className="font-bebas text-3xl mb-6">TRANSITION ANALYSIS</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-space">
            <thead>
              <tr className="text-left text-gray-500 border-b border-white/10">
                <th className="pb-4 font-normal">TRANSITION</th>
                <th className="pb-4 font-normal text-right">ACTUAL MED</th>
                <th className="pb-4 font-normal text-right">EXPECTED</th>
                <th className="pb-4 font-normal text-right">RATIO</th>
                <th className="pb-4 font-normal text-right">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {bottlenecks.map((b, i) => (
                <motion.tr 
                  key={b.transition}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + (i * 0.05) }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 font-bold text-white">{b.transition}</td>
                  <td className="py-4 text-right text-gray-300">{b.actual_median.toFixed(0)}m</td>
                  <td className="py-4 text-right text-gray-500">{b.expected_median.toFixed(0)}m</td>
                  <td className="py-4 text-right font-bold text-[#00E5A0]">{b.ratio.toFixed(2)}x</td>
                  <td className="py-4 text-right">
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider ${
                      b.severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      b.severity === 'high' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      'bg-[#00E5A0]/20 text-[#00E5A0] border border-[#00E5A0]/30'
                    }`}>
                      {b.severity}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}