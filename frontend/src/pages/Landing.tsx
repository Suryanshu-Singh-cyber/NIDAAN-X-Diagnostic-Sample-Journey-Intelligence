import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Activity, AlertTriangle, ShieldCheck, Microscope, TestTube } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    // Ensure z-10 so it sits ON TOP of the background. Use bg-transparent or bg-[#0a0a0a]/50 for glass effect
    <div className="min-h-screen bg-transparent relative z-10 selection:bg-[#00E5A0] selection:text-black">
      
      {/* Top Nav */}
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-50 mix-blend-difference">
        <div className="font-bebas text-2xl tracking-widest text-white">
          NIDAAN<span className="text-[#00E5A0]">-X</span>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="font-space text-xs tracking-widest border border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-all cursor-pointer"
        >
          LIVE DASHBOARD
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 h-screen flex flex-col justify-center px-10 lg:px-20">
        <div className="flex justify-between font-space text-xs text-gray-500 tracking-widest mb-20 uppercase">
          <span>Diagnostic Intelligence</span>
          <span>v3.0.0</span>
        </div>

        <h1 className="font-bebas text-[12vw] leading-[0.85] tracking-tight cursor-default">
          <span className="block">
            <span className="hover:text-[#00E5A0] transition-colors glitch-text" data-text="TRACK">TRACK</span> THE
          </span>
          <span className="block text-[#00E5A0] glitch-text" data-text="INVISIBLE">INVISIBLE</span>
          <span className="block">
            JOURNEY
          </span>
        </h1>

        <div className="mt-12 flex flex-col lg:flex-row justify-between items-end gap-10">
          <div className="max-w-xl">
            <p className="font-barlow text-lg text-gray-400 leading-relaxed">
              We built NIDAAN-X to solve the silent crisis of Indian healthcare: 
              lost diagnostic samples. We reconstruct the entire specimen journey using 
              AI, making the invisible visible and saving lives in the process.
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="mt-8 flex items-center gap-3 bg-[#00E5A0] text-black px-8 py-4 rounded-full font-bold hover:scale-105 hover:shadow-[0_0_40px_rgba(0,229,160,0.4)] transition-all group cursor-pointer"
            >
              ENTER LIVE DASHBOARD 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Marquee Ticker */}
      <div className="relative z-10 border-y border-white/10 py-4 bg-[#111]/80 backdrop-blur-md overflow-hidden flex">
        <div className="marquee-stripe">
          <span>ZERO HARDWARE ✦ REAL-TIME ANOMALY DETECTION ✦ PROCESS MINING ✦ EXPLAINABLE AI ✦ FHIR READY ✦ ZERO HARDWARE ✦ REAL-TIME ANOMALY DETECTION ✦ PROCESS MINING ✦ EXPLAINABLE AI ✦ FHIR READY ✦</span>
        </div>
      </div>

      {/* The Problem (With Medical Images) */}
      <section className="relative z-10 py-32 px-10 lg:px-20 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="font-space text-red-500 text-sm tracking-widest mb-4">// THE PROBLEM</div>
          <h2 className="font-bebas text-6xl lg:text-8xl mb-16 text-white">A BROKEN<br/>SYSTEM.</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="h-64 rounded-2xl overflow-hidden relative border border-white/10"
              >
                <img src="https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=800&auto=format&fit=crop" alt="Blood samples" className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-4 left-4 text-xs font-space bg-black/50 px-2 py-1 rounded text-white">Lost Samples</div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                className="h-64 rounded-2xl overflow-hidden relative border border-white/10 mt-8"
              >
                <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop" alt="Lab technician" className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-4 left-4 text-xs font-space bg-black/50 px-2 py-1 rounded text-white">Fragmented Data</div>
              </motion.div>
            </div>

            <div className="space-y-8 flex flex-col justify-center">
              <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl">
                <AlertTriangle className="w-8 h-8 text-red-500 mb-4" />
                <h3 className="font-barlow-condensed text-2xl font-bold mb-2 text-white">The Silent Bottleneck</h3>
                <p className="text-gray-400 text-sm">Every day, thousands of blood samples get stuck between lab reception and processing. Without visibility, patients wait days for critical reports.</p>
              </div>
              <div className="p-6 border border-red-500/20 bg-red-500/5 rounded-2xl">
                <Activity className="w-8 h-8 text-red-500 mb-4" />
                <h3 className="font-barlow-condensed text-2xl font-bold mb-2 text-white">No Audit Trail</h3>
                <p className="text-gray-400 text-sm">When a sample goes missing, hospitals have no way to find out *where* it was lost. Labs get blamed, and doctors are left in the dark.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-20 px-10 border-t border-white/10 text-center bg-[#0a0a0a]/90 backdrop-blur-xl">
        <h2 className="font-bebas text-4xl mb-6 text-white">READY TO SEE THE INVISIBLE?</h2>
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-white text-black font-bold px-10 py-4 rounded-full hover:bg-[#00E5A0] hover:scale-105 transition-all cursor-pointer"
        >
          ENTER THE DASHBOARD
        </button>
        <p className="font-space text-xs text-gray-600 mt-12">© 2026 NIDAAN-X · Built for Sheryians Hackathon</p>
      </footer>
    </div>
  );
}