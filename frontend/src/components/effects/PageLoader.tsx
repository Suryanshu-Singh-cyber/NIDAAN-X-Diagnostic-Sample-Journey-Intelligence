import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PageLoader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500); // Wait 0.5s before revealing app
          return 100;
        }
        return prev + Math.random() * 4 + 1;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [onComplete]);

  const textMap = ["Initializing Engine...", "Loading Neural Networks...", "Connecting to LIS...", "Almost ready...", "Welcome!"];

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-[10000] flex flex-col items-center justify-center">
      <div className="relative w-48 h-48 mb-8">
        {/* SVG Circular Progress */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
          <motion.circle
            cx="50" cy="50" r="40"
            stroke="#00E5A0" // NIDAAN Accent
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: progress / 100 }}
            transition={{ duration: 0.1 }}
            style={{ filter: 'drop-shadow(0 0 10px #00E5A0)' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-3xl font-mono text-[#00E5A0]">
          {Math.round(progress)}%
        </div>
      </div>
      
      <div className="text-gray-400 font-mono text-sm tracking-widest">
        {textMap[Math.min(Math.floor(progress / 20), 4)]}
      </div>
    </div>
  );
}