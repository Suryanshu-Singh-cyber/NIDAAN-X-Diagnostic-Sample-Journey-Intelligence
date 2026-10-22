import { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VoiceCommand() {
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase();
      console.log("Voice Command:", command);
      
      if (command.includes('analytics') || command.includes('bottleneck')) {
        navigate('/analytics');
      } else if (command.includes('dashboard') || command.includes('home')) {
        navigate('/');
      } else if (command.includes('simulate') || command.includes('scan')) {
        // Trigger simulate logic here (or emit an event)
        document.getElementById('simulate-btn')?.click();
      }
    };

    recognition.onend = () => setIsListening(false);

    if (isListening) {
      recognition.start();
    } else {
      recognition.stop();
    }
  }, [isListening, navigate]);

  return (
    <button
      onClick={() => setIsListening(!isListening)}
      className={`fixed bottom-6 left-6 p-4 rounded-full z-50 transition-all shadow-lg flex items-center justify-center ${
        isListening ? 'bg-red-500 animate-pulse text-white' : 'bg-nidaan-card border border-nidaan-border text-nidaan-accent'
      }`}
    >
      {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
    </button>
  );
}