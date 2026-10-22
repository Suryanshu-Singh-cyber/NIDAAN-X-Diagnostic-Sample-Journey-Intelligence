import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Bottleneck } from '@/types';

export default function BottleneckChart({ bottlenecks }: { bottlenecks: Bottleneck[] }) {
  const data = bottlenecks.map(b => ({
    name: b.transition.replace(' → ', '→'),
    actual: b.actual_median,
    expected: b.expected_median,
    severity: b.severity,
  }));

  return (
    <div className="w-full h-full min-h-[350px]">
      <h2 className="font-bebas text-2xl mb-6 text-white tracking-wide">
        Actual vs Expected Turnaround Time
      </h2>
      
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
          <XAxis 
            dataKey="name" 
            stroke="#4B5563" 
            fontSize={11} 
            tick={{ fill: '#9CA3AF', fontFamily: 'Space Mono' }} 
            angle={-25} 
            textAnchor="end" 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            stroke="#4B5563" 
            fontSize={11} 
            tick={{ fill: '#9CA3AF', fontFamily: 'Space Mono' }}
            axisLine={false}
            tickLine={false}
            label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 12, fontFamily: 'Space Mono' }} 
          />
          
          {/* Custom Glassmorphic Tooltip */}
          <Tooltip
            contentStyle={{ 
              background: 'rgba(10, 10, 10, 0.9)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: 12, 
              fontSize: 12,
              fontFamily: 'Space Mono',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              color: '#fff'
            }}
            itemStyle={{ color: '#00E5A0' }}
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          />
          
          {/* Expected Baseline Bars */}
          <Bar dataKey="expected" fill="#1F2937" radius={[4, 4, 0, 0]} />
          
          {/* Actual Bars (Color-coded by severity) */}
          <Bar dataKey="actual" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell 
                key={i} 
                fill={
                  d.severity === 'critical' ? '#EF4444' :
                  d.severity === 'high' ? '#F59E0B' : 
                  '#00E5A0'
                } 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 text-xs font-space text-gray-500 justify-center">
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[#1F2937]" /> Expected</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[#00E5A0]" /> Normal</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[#F59E0B]" /> High</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[#EF4444]" /> Critical</span>
      </div>
    </div>
  );
}