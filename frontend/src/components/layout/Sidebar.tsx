import { NavLink, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, FlaskConical, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const navigate = useNavigate();
  const links = [
    { to: '/dashboard', icon: Activity, label: 'Live Dashboard' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <aside className="w-64 bg-[#0a0a0a]/80 backdrop-blur-xl border-r border-white/10 min-h-screen p-6 flex flex-col z-20 relative">
      <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-10 h-10 rounded-lg bg-[#00E5A0] flex items-center justify-center shadow-[0_0_20px_rgba(0,229,160,0.4)]">
          <FlaskConical className="w-6 h-6 text-black" />
        </div>
        <div>
          <h1 className="font-bebas text-xl tracking-wider text-white leading-tight">NIDAAN-X</h1>
          <p className="text-[10px] text-gray-400 font-space uppercase tracking-widest">Intelligence</p>
        </div>
      </div>

      <nav className="space-y-2 flex-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300',
                isActive
                  ? 'bg-[#00E5A0]/10 text-[#00E5A0] font-bold border border-[#00E5A0]/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              )
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Return to Landing Button */}
      <div className="border-t border-white/10 pt-4 mt-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all text-left"
        >
          <Home className="w-4 h-4" />
          Return to Home
        </button>
        <div className="flex items-center gap-2 mt-4 px-4 text-xs font-space text-gray-600">
          <span className="w-2 h-2 rounded-full bg-[#00E5A0] animate-pulse" />
          System Online
        </div>
      </div>
    </aside>
  );
}