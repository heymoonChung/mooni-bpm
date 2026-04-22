import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Loader2, Volume2, VolumeX, Play, Pause, Youtube, Link as LinkIcon } from 'lucide-react';
import { useTrack } from '../context/TrackContext';

interface AudioStem {
  id: string;
  name: string;
  color: string;
  icon: string;
  muted: boolean;
  solo: boolean;
  volume: number;
}

export default function MinusOne() {
  const { currentTrack, setCurrentTrack } = useTrack();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasFile, setHasFile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  
  const [stems, setStems] = useState<AudioStem[]>([
    { id: 'drums', name: 'Drums', color: 'var(--neon-pink)', icon: '🥁', muted: true, solo: false, volume: 100 },
    { id: 'bass', name: 'Bass', color: 'var(--neon-cyan)', icon: '🎸', muted: false, solo: false, volume: 80 },
    { id: 'vocals', name: 'Vocals', color: 'var(--neon-green)', icon: '🎤', muted: false, solo: false, volume: 90 },
    { id: 'other', name: 'Others', color: 'var(--neon-orange)', icon: '🎹', muted: false, solo: false, volume: 70 },
  ]);

  // Audio elements refs (simulated for now, would be populated after fetch)
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  useEffect(() => {
    // Initialize audio elements for each stem (placeholder)
    stems.forEach(stem => {
      if (!audioRefs.current[stem.id]) {
        audioRefs.current[stem.id] = new Audio(); // Placeholder path
      }
    });

    return () => {
      // Cleanup audio
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, []);

  useEffect(() => {
    // Sync UI play state with audio elements
    Object.values(audioRefs.current).forEach(audio => {
      if (!audio) return;
      if (isPlaying) {
        audio.play().catch(e => console.log("Audio play simulated"));
      } else {
        audio.pause();
      }
    });
  }, [isPlaying]);

  useEffect(() => {
    // Apply mute and volume settings to audio elements
    stems.forEach(stem => {
      const audio = audioRefs.current[stem.id];
      if (audio) {
        audio.muted = stem.muted || (stems.some(s => s.solo) && !stem.solo);
        audio.volume = stem.volume / 100;
      }
    });
  }, [stems]);

  const extractYoutube = async () => {
    if (!youtubeUrl) return;
    setIsExtracting(true);
    setUploadProgress(0);

    // UX: progress simulation while backend works
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => (prev < 90 ? prev + 1 : prev));
    }, 15); // Faster for beta demo

    // Mock API delay for Beta mode
    setTimeout(() => {
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setIsExtracting(false);
        setShowSkeleton(true);
        setShowToast(true);
        
        // Hide toast after 3s
        setTimeout(() => setShowToast(false), 3000);
      }, 500);
    }, 1500);
  };

  const handleFileUpload = () => {
    setIsExtracting(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExtracting(false);
          setHasFile(true);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const toggleMute = (id: string) => {
    setStems((prev) =>
      prev.map((stem) =>
        stem.id === id ? { ...stem, muted: !stem.muted } : stem
      )
    );
  };

  const toggleSolo = (id: string) => {
    setStems((prev) =>
      prev.map((stem) =>
        stem.id === id ? { ...stem, solo: !stem.solo } : stem
      )
    );
  };

  const updateVolume = (id: string, volume: number) => {
    setStems((prev) =>
      prev.map((stem) =>
        stem.id === id ? { ...stem, volume } : stem
      )
    );
  };

  return (
    <div className="min-h-screen px-4 py-8 relative">
      {/* BETA Badge */}
      <div className="absolute top-6 right-6">
        <span 
          className="px-2 py-1 rounded text-[10px] font-bold tracking-tighter"
          style={{ 
            color: 'var(--neon-cyan)',
            border: '1px solid var(--neon-cyan)',
            boxShadow: '0 0 10px var(--neon-cyan)',
            background: 'rgba(95, 251, 241, 0.1)'
          }}
        >
          BETA
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2
          className="text-3xl mb-2"
          style={{
            color: 'var(--neon-cyan)',
            fontWeight: 'var(--font-weight-medium)',
            textShadow: '0 0 10px var(--neon-cyan)',
          }}
        >
          Yuni's Minus-One
        </h2>
        <p className="text-sm opacity-70" style={{ color: 'var(--foreground)' }}>
          드럼 트랙을 제거하고 연습해보세요
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!hasFile && !showSkeleton ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="space-y-4">
              <motion.div
                className="w-full rounded-3xl p-6 text-center"
                style={{
                  background: 'rgba(95, 251, 241, 0.05)',
                  border: '2px dashed var(--neon-cyan)',
                }}
              >
                {isExtracting ? (
                  <div className="space-y-6 py-6">
                    <Loader2
                      className="w-16 h-16 mx-auto animate-spin"
                      style={{ color: 'var(--neon-cyan)' }}
                    />
                    <div>
                      <div
                        className="text-xl mb-3"
                        style={{
                          color: 'var(--neon-cyan)',
                          fontWeight: 'var(--font-weight-medium)',
                        }}
                      >
                        유니를 위해 드럼 소리를 없애는 중이야... <br />
                        🥁 조금만 기다려!
                      </div>
                      <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(0, 255, 255, 0.1)' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          className="h-full rounded-full"
                          style={{
                            background: 'linear-gradient(90deg, var(--neon-pink), var(--neon-cyan))',
                            boxShadow: '0 0 15px var(--neon-pink)',
                          }}
                        />
                      </div>
                      <div className="text-sm mt-2 opacity-60" style={{ color: 'var(--neon-cyan)' }}>
                        {uploadProgress}%
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Youtube className="w-16 h-16 mx-auto" style={{ color: 'var(--neon-pink)' }} />
                      <div className="text-xl" style={{ color: 'var(--neon-pink)', fontWeight: 'var(--font-weight-medium)' }}>
                        YouTube URL 입력
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" style={{ color: 'var(--neon-cyan)' }} />
                          <input 
                            type="text" 
                            placeholder="https://youtube.com/watch?v=..."
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            className="w-full bg-transparent border rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-1"
                            style={{ 
                              borderColor: 'var(--neon-cyan)',
                              color: 'var(--foreground)'
                            }}
                          />
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={extractYoutube}
                          className="px-6 rounded-xl text-white whitespace-nowrap"
                          style={{
                            background: 'linear-gradient(135deg, var(--neon-pink), var(--neon-cyan))',
                            fontWeight: 'var(--font-weight-medium)'
                          }}
                        >
                          추출
                        </motion.button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                      <span className="text-xs opacity-50">OR</span>
                      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleFileUpload}
                      className="w-full py-4 rounded-xl flex items-center justify-center gap-2"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <Upload className="w-5 h-5" />
                      <span>내 기기에서 파일 선택</span>
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        ) : showSkeleton ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="text-center p-8 rounded-3xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-lg opacity-80 mb-2">AI 분석 준비 완료!</div>
              <div className="text-sm opacity-50">AI가 이 자리에 유니의 드럼 악보를 준비할 예정이에요! ✨</div>
            </div>

            <div className="grid grid-cols-1 gap-4 landscape:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i}
                  className="h-32 rounded-3xl animate-pulse"
                  style={{ 
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    boxShadow: '0 0 20px rgba(0,0,0,0.2)'
                  }}
                />
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowSkeleton(false)}
              className="w-full h-12 rounded-xl text-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--foreground)',
              }}
            >
              다시 시도하기
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="player"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div
              className="rounded-3xl p-6"
              style={{
                background: 'rgba(255, 0, 255, 0.05)',
                border: '1px solid rgba(255, 0, 255, 0.2)',
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div
                    className="text-xl mb-1"
                    style={{
                      color: 'var(--neon-pink)',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    {currentTrack?.title || 'Superstition'}
                  </div>
                  <div className="text-sm opacity-70" style={{ color: 'var(--foreground)' }}>
                    {currentTrack?.artist || 'Stevie Wonder'}
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: isPlaying
                      ? 'linear-gradient(135deg, var(--neon-pink), var(--neon-cyan))'
                      : 'rgba(255, 0, 255, 0.2)',
                    border: '2px solid var(--neon-pink)',
                    boxShadow: isPlaying ? '0 0 20px var(--neon-pink)' : 'none',
                  }}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white" />
                  )}
                </motion.button>
              </div>

              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255, 0, 255, 0.1)' }}>
                <motion.div
                  animate={{ width: isPlaying ? '100%' : '0%' }}
                  transition={{ duration: isPlaying ? 180 : 0, ease: 'linear' }}
                  className="h-full"
                  style={{
                    background: 'linear-gradient(90deg, var(--neon-pink), var(--neon-cyan))',
                    boxShadow: '0 0 15px var(--neon-pink)',
                  }}
                />
              </div>
            </div>

            <div className="space-y-3 landscape:grid landscape:grid-cols-2 landscape:gap-4 landscape:space-y-0">
              <h3
                className="text-sm opacity-70 mb-3 landscape:col-span-2 landscape:mb-0"
                style={{ color: 'var(--neon-green)' }}
              >
                AUDIO STEMS
              </h3>

              {stems.map((stem) => (
                <motion.div
                  key={stem.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-2xl p-4"
                  style={{
                    background: `${stem.color}10`,
                    border: `1px solid ${stem.color}30`,
                    opacity: stem.muted ? 0.5 : 1,
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">{stem.icon}</div>
                    <div className="flex-1">
                      <div
                        className="text-base"
                        style={{
                          color: stem.color,
                          fontWeight: 'var(--font-weight-medium)',
                        }}
                      >
                        {stem.name}
                      </div>
                      {stem.id === 'drums' && (
                        <div className="text-xs opacity-70 mt-1" style={{ color: stem.color }}>
                          연습을 위해 뮤트됨
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleSolo(stem.id)}
                        className="px-3 py-1 rounded-lg text-xs"
                        style={{
                          background: stem.solo ? stem.color : `${stem.color}20`,
                          color: stem.solo ? 'white' : stem.color,
                          fontWeight: 'var(--font-weight-medium)',
                        }}
                      >
                        S
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleMute(stem.id)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{
                          background: stem.muted ? stem.color : `${stem.color}20`,
                          border: `1px solid ${stem.color}`,
                        }}
                      >
                        {stem.muted ? (
                          <VolumeX className="w-4 h-4" style={{ color: 'white' }} />
                        ) : (
                          <Volume2 className="w-4 h-4" style={{ color: stem.color }} />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4" style={{ color: stem.color }} strokeWidth={1.5} />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stem.volume}
                      onChange={(e) => updateVolume(stem.id, Number(e.target.value))}
                      disabled={stem.muted}
                      className="flex-1 h-1"
                      style={{
                        background: `linear-gradient(to right, ${stem.color} 0%, ${stem.color} ${stem.volume}%, ${stem.color}20 ${stem.volume}%, ${stem.color}20 100%)`,
                      }}
                    />
                    <span
                      className="text-xs w-8 text-right"
                      style={{ color: stem.color }}
                    >
                      {stem.volume}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setHasFile(false)}
              className="w-full h-12 rounded-xl text-sm"
              style={{
                background: 'rgba(255, 0, 255, 0.1)',
                border: '1px solid var(--neon-pink)',
                color: 'var(--neon-pink)',
              }}
            >
              Upload New Song
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-28 left-4 right-4 z-50 p-4 rounded-2xl text-center"
            style={{ 
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--neon-pink)',
              boxShadow: '0 0 20px rgba(255, 0, 255, 0.3)'
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: 'white' }}>
              현재 베타 테스트 준비 중입니다. <br />
              <span style={{ color: 'var(--neon-pink)' }}>유니의 입시를 응원하며</span> 엄마가 열심히 기능을 만들고 있어요! 🥁✨
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
