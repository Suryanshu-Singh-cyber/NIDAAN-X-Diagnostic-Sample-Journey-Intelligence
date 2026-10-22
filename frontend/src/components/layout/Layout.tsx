import Sidebar from './Sidebar';
import { Bell, Search } from 'lucide-react';
import ChatBot from '@/components/chat/ChatBot';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    // Add relative z-10 and backdrop-blur here
    <div className="flex min-h-screen bg-[#0a0a0a]/80 backdrop-blur-md relative z-10">
      <Sidebar />
      
      <div className="flex-1 flex flex-col relative">
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a]/50 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-3 bg-[#111]/80 border border-white/10 rounded-lg px-3 py-2 w-96">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              placeholder="Global search..."
              className="bg-transparent outline-none text-sm w-full placeholder:text-gray-600 text-white"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>
            <div className="w-9 h-9 rounded-full bg-[#00E5A0]/20 border border-[#00E5A0]/40 flex items-center justify-center text-sm font-semibold text-[#00E5A0]">
              DR
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      <ChatBot />
    </div>
  );
}