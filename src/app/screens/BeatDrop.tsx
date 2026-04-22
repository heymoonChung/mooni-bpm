import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Repeat, Loader2 } from 'lucide-react';
import { useTrack } from '../context/TrackContext';
import { useNavigate } from 'react-router';

interface Note {
  id: string;
  lane: number;
  time: number;
}

const LANES = [
  { id: 0, name: 'Hi-Hat', color: 'var(--neon-cyan)', symbol: 'HH' },
  { id: 1, name: 'Snare', color: 'var(--neon-pink)', symbol: 'SN' },
  { id: 2, name: 'Kick', color: 'var(--neon-orange)', symbol: 'KK' },
  { id: 3, name: 'Cymbal', color: 'var(--neon-green)', symbol: 'CY' },
];

const generatePattern = (): Note[] => {
  const pattern: Note[] = [];
  let noteId = 0;

  for (let bar = 0; bar < 8; bar++) {
    for (let beat = 0; beat < 16; beat++) {
      const time = bar * 16 + beat;

      if (beat % 2 === 0) {
        pattern.push({ id: `note-${noteId++}`, lane: 0, time });
      }

      if (beat % 4 === 2) {
        pattern.push({ id: `note-${noteId++}`, lane: 1, time });
      }

      if (beat % 4 === 0 || beat % 8 === 6) {
        pattern.push({ id: `note-${noteId++}`, lane: 2, time });
      }

      if (beat === 0 || beat === 12) {
        pattern.push({ id: `note-${noteId++}`, lane: 3, time });
      }
    }
  }

  return pattern;
};

export default function BeatDrop() {
  const { currentTrack } = useTrack();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(currentTrack?.bpm || 120);
  const [currentTime, setCurrentTime] = useState(0);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  
  // Finish Modal State
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishMood, setFinishMood] = useState<string | null>(null);

  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const handleFinishPractice = () => {
    if (!finishMood) return;
    
    // Calculate practice duration (simulation)
    const duration = Math.floor(Math.random() * 30) + 15; // 15-45 minutes
    
    const todayStr = new Date().toISOString().split('T')[0];
    const newLog = {
      date: todayStr,
      mood: finishMood,
      duration,
      notes: `${currentTrack?.title || 'Superstition'} 템포 ${bpm}에서 연습 완료!`,
      hasVoiceNote: false
    };

    // Save to localStorage
    const existingLogs = JSON.parse(localStorage.getItem('yuni_practice_logs') || '[]');
    // Replace if same date exists or append
    const updatedLogs = existingLogs.filter((log: any) => log.date !== todayStr);
    updatedLogs.push(newLog);
    localStorage.setItem('yuni_practice_logs', JSON.stringify(updatedLogs));

    setShowFinishModal(false);
    navigate('/progress');
  };

  useEffect(() => {
    // Simulate fetching BPM and Onset data from server
    const fetchOnsetSimulation = async () => {
      setIsAnalyzing(true);
      /*
      // Real implementation would look like:
      const res = await fetch(`https://api.yunibpm.com/analyze?title=${currentTrack?.title}`);
      const data = await res.json();
      setNotes(data.notes);
      setBpm(data.bpm);
      */
      
      // Simulation delay
      setTimeout(() => {
        setNotes(generatePattern());
        setBpm(currentTrack?.bpm || 120);
        setIsAnalyzing(false);
      }, 1500);
    };

    fetchOnsetSimulation();
  }, [currentTrack]);

  useEffect(() => {
    if (isPlaying) {
      const animate = (timestamp: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const deltaTime = timestamp - lastTimeRef.current;

        const beatsPerSecond = bpm / 60;
        const increment = (deltaTime / 1000) * beatsPerSecond * 4;

        setCurrentTime((prev) => {
          const newTime = prev + increment;
          if (newTime >= 128) {
            return loopEnabled ? 0 : 128;
          }
          return newTime;
        });

        lastTimeRef.current = timestamp;
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      lastTimeRef.current = 0;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, bpm, loopEnabled]);

  const handleReset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const getVisibleNotes = () => {
    const windowSize = 32;
    return notes.filter(
      (note) => note.time >= currentTime && note.time < currentTime + windowSize
    );
  };

  const hitLinePosition = 85;

  if (isAnalyzing) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-6">
        <Loader2 className="w-16 h-16 animate-spin" style={{ color: 'var(--neon-pink)' }} />
        <div className="text-xl" style={{ color: 'var(--neon-pink)', fontWeight: 'var(--font-weight-medium)' }}>
          오디오 비트 및 온셋(Onset) 분석 중...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col landscape:flex-row">
      <div className="px-4 py-6 flex-shrink-0 landscape:w-1/3 landscape:flex landscape:flex-col landscape:justify-center">
        <h2
          className="text-2xl mb-2"
          style={{
            color: 'var(--neon-pink)',
            fontWeight: 'var(--font-weight-medium)',
            textShadow: '0 0 10px var(--neon-pink)',
          }}
        >
          Beat Drop
        </h2>
        <div className="flex items-center justify-between">
          <div className="text-sm opacity-70" style={{ color: 'var(--neon-cyan)' }}>
            {currentTrack?.title || 'Superstition'} - {currentTrack?.artist || 'Stevie Wonder'}
          </div>
          <div
            className="text-sm px-3 py-1 rounded-full"
            style={{
              background: 'rgba(255, 0, 255, 0.2)',
              color: 'var(--neon-pink)',
            }}
          >
            {bpm} BPM
          </div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden" style={{ background: 'var(--dark-surface)' }}>
        <div className="absolute inset-0 grid grid-cols-4 gap-px">
          {LANES.map((lane) => (
            <div
              key={lane.id}
              className="relative"
              style={{
                background: `linear-gradient(180deg, transparent, ${lane.color}05)`,
                borderLeft: `1px solid ${lane.color}20`,
              }}
            >
              <div
                className="absolute top-4 left-1/2 -translate-x-1/2 text-xs px-2 py-1 rounded-lg"
                style={{
                  background: `${lane.color}30`,
                  color: lane.color,
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                {lane.symbol}
              </div>

              <AnimatePresence>
                {getVisibleNotes()
                  .filter((note) => note.lane === lane.id)
                  .map((note) => {
                    const progress = ((note.time - currentTime) / 32) * 100;
                    const yPosition = hitLinePosition - progress;

                    return (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-1/2 -translate-x-1/2 w-12 h-6 rounded-lg"
                        style={{
                          top: `${yPosition}%`,
                          background: lane.color,
                          boxShadow: `0 0 15px ${lane.color}`,
                          border: `2px solid white`,
                        }}
                      />
                    );
                  })}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div
          className="absolute left-0 right-0 h-1"
          style={{
            top: `${hitLinePosition}%`,
            background: 'linear-gradient(90deg, transparent, white, transparent)',
            boxShadow: '0 0 20px white, 0 0 40px var(--neon-pink)',
            zIndex: 10,
          }}
        />

        <div
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, var(--dark-surface), transparent)',
          }}
        />
      </div>

      <div className="px-4 py-6 flex-shrink-0 space-y-4">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: isPlaying
                ? 'linear-gradient(135deg, var(--neon-pink), var(--neon-cyan))'
                : 'rgba(255, 61, 143, 0.2)',
              border: '2px solid var(--neon-pink)',
              boxShadow: isPlaying ? '0 0 20px var(--neon-pink)' : 'none',
            }}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 text-white" />
            ) : (
              <Play className="w-7 h-7 text-white" />
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(95, 251, 241, 0.1)',
              border: '2px solid var(--neon-cyan)',
            }}
          >
            <RotateCcw className="w-6 h-6" style={{ color: 'var(--neon-cyan)' }} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setLoopEnabled(!loopEnabled)}
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: loopEnabled
                ? 'rgba(0, 255, 136, 0.2)'
                : 'rgba(0, 255, 136, 0.05)',
              border: `2px solid ${loopEnabled ? 'var(--neon-green)' : 'rgba(0, 255, 136, 0.3)'}`,
              boxShadow: loopEnabled ? '0 0 15px var(--neon-green)' : 'none',
            }}
          >
            <Repeat className="w-6 h-6" style={{ color: 'var(--neon-green)' }} />
          </motion.button>

          <div className="flex-1 text-right">
            <div className="text-xs opacity-60 mb-1" style={{ color: 'var(--neon-cyan)' }}>
              Tempo
            </div>
            <input
              type="range"
              min="60"
              max="180"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full h-1"
              style={{
                background: `linear-gradient(to right, var(--neon-pink) 0%, var(--neon-pink) ${((bpm - 60) / 120) * 100}%, rgba(255, 0, 255, 0.2) ${((bpm - 60) / 120) * 100}%, rgba(255, 0, 255, 0.2) 100%)`,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {LANES.map((lane) => (
            <div
              key={lane.id}
              className="text-center py-2 rounded-lg text-xs"
              style={{
                background: `${lane.color}10`,
                color: lane.color,
                border: `1px solid ${lane.color}30`,
              }}
            >
              {lane.name}
            </div>
          ))}
        </div>
        
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowFinishModal(true)}
          className="w-full py-4 rounded-xl text-white font-medium"
          style={{
            background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-green))',
            boxShadow: '0 0 15px rgba(0, 255, 136, 0.4)'
          }}
        >
          연습 종료 및 기록하기
        </motion.button>
      </div>

      <AnimatePresence>
        {showFinishModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-3xl p-6 space-y-6"
              style={{ background: 'var(--dark-bg)', border: '1px solid var(--neon-pink)', boxShadow: '0 0 30px rgba(255, 0, 255, 0.2)' }}
            >
              <h3 className="text-2xl font-medium text-center" style={{ color: 'var(--neon-pink)' }}>오늘 연습 어땠어?</h3>
              
              <div className="flex justify-center gap-3 text-3xl">
                {['😊', '😎', '🔥', '😅'].map(mood => (
                  <button 
                    key={mood}
                    onClick={() => setFinishMood(mood)}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    style={{ background: finishMood === mood ? 'rgba(255, 0, 255, 0.3)' : 'transparent' }}
                  >
                    {mood}
                  </button>
                ))}
              </div>

              <button
                onClick={handleFinishPractice}
                disabled={!finishMood}
                className="w-full py-3 rounded-xl text-white font-medium disabled:opacity-50"
                style={{ background: 'var(--neon-pink)' }}
              >
                저장하기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
