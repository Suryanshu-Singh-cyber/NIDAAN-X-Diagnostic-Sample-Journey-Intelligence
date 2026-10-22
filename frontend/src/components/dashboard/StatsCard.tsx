import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const accentMap = {
  accent: 'text-[#00E5A0] bg-[#00E5A0]/10 border-[#00E5A0]/20',
  warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  info: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

export default function StatsCard({ icon: Icon, label, value, accent = 'accent' }: {
  icon: LucideIcon; label: string; value: number; accent?: keyof typeof accentMap;
}) {
  return (
    <div className="bg-[#111]/70 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-[#111]/90 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-space text-[10px] text-gray-400 uppercase tracking-widest">{label}</p>
          <p className="font-bebas text-5xl mt-2 text-white group-hover:scale-105 transition-transform origin-left">
            {value}
          </p>
        </div>
        <div className={cn('p-3 rounded-xl border', accentMap[accent])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}