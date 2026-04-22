import { motion } from 'motion/react';

interface TimeSignatureSelectorProps {
  beatsPerBar: number;
  setBeatsPerBar: (beats: number) => void;
  isPlaying: boolean;
}

const timeSignatures = [
  { beats: 3, label: '3/4' },
  { beats: 4, label: '4/4' },
  { beats: 5, label: '5/4' },
  { beats: 6, label: '6/8' },
];

export default function TimeSignatureSelector({
  beatsPerBar,
  setBeatsPerBar,
  isPlaying
}: TimeSignatureSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="rounded-3xl p-6"
      style={{
        background: 'rgba(0, 255, 255, 0.05)',
        border: '1px solid rgba(0, 255, 255, 0.2)',
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.1)',
      }}
    >
      <div className="mb-4 opacity-70" style={{ color: 'var(--neon-pink)' }}>
        박자
      </div>

      <div className="grid grid-cols-4 gap-3">
        {timeSignatures.map((sig) => (
          <motion.button
            key={sig.beats}
            whileTap={{ scale: 0.95 }}
            onClick={() => !isPlaying && setBeatsPerBar(sig.beats)}
            disabled={isPlaying}
            className="h-16 rounded-2xl transition-all duration-300"
            style={{
              background: beatsPerBar === sig.beats
                ? 'linear-gradient(135deg, var(--neon-cyan), var(--neon-green))'
                : 'rgba(0, 255, 255, 0.1)',
              border: `2px solid ${beatsPerBar === sig.beats ? 'var(--neon-cyan)' : 'rgba(0, 255, 255, 0.3)'}`,
              boxShadow: beatsPerBar === sig.beats
                ? '0 0 20px var(--neon-cyan)'
                : 'none',
              opacity: isPlaying && beatsPerBar !== sig.beats ? 0.4 : 1,
              cursor: isPlaying ? 'not-allowed' : 'pointer',
            }}
          >
            <div
              className="text-xl"
              style={{
                color: beatsPerBar === sig.beats ? 'white' : 'var(--neon-cyan)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              {sig.label}
            </div>
          </motion.button>
        ))}
      </div>

      {isPlaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-xs text-center opacity-60"
          style={{ color: 'var(--neon-orange)' }}
        >
          재생 중에는 박자를 변경할 수 없어요
        </motion.div>
      )}
    </motion.div>
  );
}
