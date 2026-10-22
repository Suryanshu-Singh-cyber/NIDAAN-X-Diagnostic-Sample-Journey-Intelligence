import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Loader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState("Initializing...");

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setText("Ready!");
          setTimeout(onComplete, 500);
          return 100;
        }
        const next = prev + Math.random() * 3 + 1;
        if (next > 25 && next < 50) setText("Loading AI Engine...");
        else if (next > 50 && next < 75) setText("Connecting to LIS...");
        else if (next > 75 && next < 100) setText("Almost ready...");
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div 
      exit={{ opacity: 0, scale: 1.1 }} 
      transition={{ duration: 0.8 }} 
      className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-[9999]"
    >
      <h1 className="font-bebas text-6xl mb-10 tracking-wider">
        NIDAAN<span className="text-[#00E5A0]">-X</span>
      </h1>
      
      {/* Progress Bar */}
      <div className="w-[300px] h-1 bg-white/10 rounded-full overflow-hidden mb-5">
        <div 
          className="h-full bg-[#00E5A0] shadow-[0_0_20px_#00E5A0]" 
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="font-space text-xs tracking-widest text-white/60 mb-2">{text}</div>
      <div className="font-space text-2xl text-[#00E5A0]">{Math.floor(progress)}%</div>
    </motion.div>
  );
}