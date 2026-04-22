import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Play, Clock, Award } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTrack } from '../context/TrackContext';

const CHEERING_MESSAGES = [
  "유니야, 오늘도 즐겁게 연주해봐! 🥁",
  "우리 딸 멋지다! 오늘도 파이팅! ✨",
  "틀려도 괜찮아, 즐기는 게 중요해! 💖",
  "유니의 드럼 소리 엄마가 제일 좋아해! 🎵",
  "오늘도 한 뼘 더 성장하는 하루! 🌱"
];

export default function Home() {
  const navigate = useNavigate();
  const { currentTrack } = useTrack();
  const [dailyMessage, setDailyMessage] = useState("");

  useEffect(() => {
    // Select message based on current date to keep it consistent for the day
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const messageIndex = dayOfYear % CHEERING_MESSAGES.length;
    setDailyMessage(CHEERING_MESSAGES[messageIndex]);
  }, []);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="landscape:grid landscape:grid-cols-2 landscape:gap-8 items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 landscape:mb-0 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="w-10 h-10" style={{ color: 'var(--neon-pink)' }} fill="var(--neon-pink)" />
            <h1 className="text-5xl tracking-wider" style={{
              color: 'var(--neon-pink)',
              textShadow: '0 0 20px var(--neon-pink), 0 0 40px var(--neon-pink)',
              fontWeight: 'var(--font-weight-medium)',
            }}>
              YUNI.BPM
            </h1>
          </div>
          <p
            className="text-lg mb-2"
            style={{
              color: 'var(--neon-cyan)',
              textShadow: '0 0 10px var(--neon-cyan)'
            }}
          >
            {dailyMessage || "유니의 드럼 연습 파트너 ✨"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="space-y-6"
        >
        <h3
          className="text-sm opacity-70"
          style={{ color: 'var(--neon-cyan)' }}
        >
          최근 연습한 곡
        </h3>

        <div
          className="rounded-3xl p-6"
          style={{
            background: 'rgba(255, 0, 255, 0.05)',
            border: '2px solid rgba(255, 0, 255, 0.3)',
            boxShadow: '0 0 30px rgba(255, 0, 255, 0.1)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs opacity-60 mb-1" style={{ color: 'var(--neon-green)' }}>
                Last Practice
              </div>
              <div
                className="text-xl"
                style={{
                  color: 'var(--neon-pink)',
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                {currentTrack ? currentTrack.title : 'Superstition'}
              </div>
              <div className="text-sm opacity-70 mt-1" style={{ color: 'var(--foreground)' }}>
                {currentTrack ? currentTrack.artist : 'Stevie Wonder'}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" style={{ color: 'var(--neon-cyan)' }} />
                <span className="text-sm" style={{ color: 'var(--neon-cyan)' }}>
                  45min
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4" style={{ color: 'var(--neon-orange)' }} />
                <span className="text-sm" style={{ color: 'var(--neon-orange)' }}>
                  95%
                </span>
              </div>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/beat-drop')}
            className="w-full h-16 rounded-2xl flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, var(--neon-pink), var(--neon-cyan))',
              boxShadow: '0 0 20px var(--neon-pink)',
            }}
          >
            <Play className="w-5 h-5 text-white" fill="white" />
            <span className="text-lg text-white" style={{ fontWeight: 'var(--font-weight-medium)' }}>
              이어서 연습하기
            </span>
          </motion.button>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/beat-drop')}
          className="w-full h-16 rounded-2xl flex items-center justify-center gap-2"
          style={{
            background: 'rgba(0, 255, 255, 0.1)',
            border: '2px solid var(--neon-cyan)',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.1)',
          }}
        >
          <span
            className="text-lg"
            style={{
              color: 'var(--neon-cyan)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            새로운 악보 만들기
          </span>
        </motion.button>
      </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 grid grid-cols-2 gap-4"
      >
        <div
          className="rounded-3xl p-6 text-center"
          style={{
            background: 'rgba(0, 255, 136, 0.05)',
            border: '2px solid rgba(0, 255, 136, 0.2)',
          }}
        >
          <div
            className="text-3xl mb-2"
            style={{
              color: 'var(--neon-green)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            12
          </div>
          <div className="text-xs opacity-70" style={{ color: 'var(--neon-green)' }}>
            Days Streak
          </div>
        </div>

        <div
          className="rounded-3xl p-6 text-center"
          style={{
            background: 'rgba(255, 170, 0, 0.05)',
            border: '2px solid rgba(255, 170, 0, 0.2)',
          }}
        >
          <div
            className="text-3xl mb-2"
            style={{
              color: 'var(--neon-orange)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            847
          </div>
          <div className="text-xs opacity-70" style={{ color: 'var(--neon-orange)' }}>
            Total Minutes
          </div>
        </div>
      </motion.div>
    </div>
  );
}
