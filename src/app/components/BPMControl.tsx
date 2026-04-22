import { motion } from 'motion/react';
import { Minus, Plus } from 'lucide-react';

interface BPMControlProps {
  bpm: number;
  setBpm: (bpm: number) => void;
  isPlaying: boolean;
}

export default function BPMControl({ bpm, setBpm, isPlaying }: BPMControlProps) {
  const handleDecrease = () => {
    setBpm(Math.max(40, bpm - 5));
  };

  const handleIncrease = () => {
    setBpm(Math.min(240, bpm + 5));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBpm(Number(e.target.value));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="rounded-3xl p-6"
      style={{
        background: 'rgba(255, 0, 255, 0.05)',
        border: '1px solid rgba(255, 0, 255, 0.2)',
        boxShadow: '0 0 20px rgba(255, 0, 255, 0.1)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="opacity-70" style={{ color: 'var(--neon-cyan)' }}>
          템포
        </span>
        <motion.div
          animate={{
            scale: isPlaying ? [1, 1.05, 1] : 1,
          }}
          transition={{ duration: 60 / bpm, repeat: isPlaying ? Infinity : 0 }}
          className="text-4xl tabular-nums"
          style={{
            color: 'var(--neon-pink)',
            textShadow: '0 0 20px var(--neon-pink)',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          {bpm}
        </motion.div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleDecrease}
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255, 0, 255, 0.2)',
            border: '1px solid var(--neon-pink)',
          }}
        >
          <Minus className="w-5 h-5" style={{ color: 'var(--neon-pink)' }} />
        </motion.button>

        <input
          type="range"
          min="40"
          max="240"
          step="5"
          value={bpm}
          onChange={handleSliderChange}
          className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--neon-pink) 0%, var(--neon-pink) ${((bpm - 40) / 200) * 100}%, rgba(255, 0, 255, 0.2) ${((bpm - 40) / 200) * 100}%, rgba(255, 0, 255, 0.2) 100%)`,
          }}
        />

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleIncrease}
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(255, 0, 255, 0.2)',
            border: '1px solid var(--neon-pink)',
          }}
        >
          <Plus className="w-5 h-5" style={{ color: 'var(--neon-pink)' }} />
        </motion.button>
      </div>

      <div className="flex justify-between text-xs opacity-50" style={{ color: 'var(--neon-cyan)' }}>
        <span>느리게</span>
        <span>빠르게</span>
      </div>
    </motion.div>
  );
}
