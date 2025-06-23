import { Mic, MicOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface MicrophoneProps {
  onDictate: (text: string) => void;
  disabled?: boolean;
}

const Microphone = ({ onDictate, disabled }: MicrophoneProps) => {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onDictate(transcript);
        setListening(false);
      };
      recognitionRef.current.onerror = (event: any) => {
        setError(event.error);
        setListening(false);
      };
      recognitionRef.current.onend = () => {
        setListening(false);
      };
    }
  }, [onDictate]);

  const handleMicClick = () => {
    setError(null);
    if (!listening) {
      try {
        recognitionRef.current?.start();
        setListening(true);
      } catch (e) {
        setError('Speech recognition not available.');
      }
    } else {
      recognitionRef.current?.stop();
      setListening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleMicClick}
      disabled={disabled}
      className={`p-2 rounded-full transition duration-100 ${listening ? 'bg-red-100 dark:bg-red-900' : 'hover:bg-light-secondary dark:hover:bg-dark-secondary'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={listening ? 'Stop dictation' : 'Start dictation'}
    >
      {listening ? <MicOff className="text-red-500" size={18} /> : <Mic size={18} />}
      <span className="sr-only">{listening ? 'Stop dictation' : 'Start dictation'}</span>
      {error && (
        <span className="text-xs text-red-500 ml-2">{error}</span>
      )}
    </button>
  );
};

export default Microphone; 