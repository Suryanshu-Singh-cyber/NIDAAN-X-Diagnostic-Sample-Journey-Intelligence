import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Loader from '@/components/effects/Loader';
import CustomCursor from '@/components/effects/CustomCursor';
import DynamicBackground from '@/components/effects/DynamicBackground';
import Landing from '@/pages/Landing';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import SpecimenDetail from '@/pages/SpecimenDetail';
import Analytics from '@/pages/Analytics';
import VoiceCommand from '@/components/effects/VoiceCommand';

export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    // The root wrapper must be relative so z-index works properly
    <div className="relative min-h-screen bg-transparent text-white overflow-hidden">
      
      {/* 1. The Animated Background (z-0) */}
      <DynamicBackground />

      {/* 2. Custom Cursor */}
      <CustomCursor />

      {/* 3. Cinematic Loader */}
      {loading && <Loader onComplete={() => setLoading(false)} />}

      {/* 4. Main App Content (Must be relative z-10 to sit on top of bg) */}
      {!loading && (
        <div className="relative z-10 h-full">
          <VoiceCommand />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/specimen/:id" element={<Layout><SpecimenDetail /></Layout>} />
            <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
          </Routes>
        </div>
      )}
    </div>
  );
}