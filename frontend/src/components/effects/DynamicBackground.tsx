import { motion } from 'framer-motion';

export default function DynamicBackground() {
  // Generate 50 random stars
  const stars = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 5,
  }));

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#030305] pointer-events-none">
      
      {/* LAYER 1: Moving Aurora Blobs */}
      <motion.div
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -100, 50, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#00E5A0] rounded-full mix-blend-screen filter blur-[120px] opacity-20"
      />
      <motion.div
        animate={{
          x: [0, -80, 60, 0],
          y: [0, 120, -80, 0],
          scale: [1, 0.8, 1.3, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#0066FF] rounded-full mix-blend-screen filter blur-[120px] opacity-20"
      />
      <motion.div
        animate={{
          x: [0, 50, -50, 0],
          y: [0, 50, -50, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] bg-[#FF0055] rounded-full mix-blend-screen filter blur-[120px] opacity-10"
      />

      {/* LAYER 2: 3D Moving Cyber Grid */}
      <div 
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 229, 160, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 160, 0.4) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          transform: 'perspective(600px) rotateX(60deg) scale(2.5) translateY(-10%)',
          transformOrigin: 'top center',
          animation: 'gridMove 4s linear infinite'
        }}
      />
      
      {/* Inline CSS for the grid animation */}
      <style>{`
        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 0 50px; }
        }
      `}</style>

      {/* LAYER 3: Twinkling Stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute bg-white rounded-full animate-pulse"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
            boxShadow: '0 0 10px 1px rgba(255, 255, 255, 0.3)'
          }}
        />
      ))}

      {/* LAYER 4: Film Grain / Noise Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
      ></div>

      {/* LAYER 5: Vignette (Darkens edges to focus center) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030305_90%)] pointer-events-none" />
    </div>
  );
}