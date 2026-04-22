import { motion } from 'motion/react';

interface BeatVisualizerProps {
  currentBeat: number;
  beatsPerBar: number;
  isPlaying: boolean;
}

export default function BeatVisualizer({ currentBeat, beatsPerBar, isPlaying }: BeatVisualizerProps) {
  return (
    <div className="relative w-full aspect-square flex items-center justify-center">
      <motion.div
        key={currentBeat}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: isPlaying ? [0.8, 1.2, 1] : 1,
          opacity: isPlaying ? [0, 1, 0.3] : 0.3
        }}
        transition={{ duration: 0.3 }}
        className="absolute w-64 h-64 rounded-full"
        style={{
          background: currentBeat === 0
            ? 'radial-gradient(circle, var(--neon-pink), transparent 70%)'
            : 'radial-gradient(circle, var(--neon-cyan), transparent 70%)',
          boxShadow: isPlaying
            ? currentBeat === 0
              ? '0 0 80px var(--neon-pink), 0 0 120px var(--neon-pink)'
              : '0 0 60px var(--neon-cyan), 0 0 100px var(--neon-cyan)'
            : 'none',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="flex gap-4">
          {Array.from({ length: beatsPerBar }).map((_, index) => (
            <motion.div
              key={index}
              animate={{
                scale: isPlaying && currentBeat === index ? 1.3 : 1,
                opacity: isPlaying && currentBeat === index ? 1 : 0.4,
              }}
              transition={{ duration: 0.1 }}
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: index === 0 ? 'var(--neon-pink)' : 'var(--neon-cyan)',
                boxShadow: isPlaying && currentBeat === index
                  ? index === 0
                    ? '0 0 20px var(--neon-pink)'
                    : '0 0 20px var(--neon-cyan)'
                  : 'none',
              }}
            />
          ))}
        </div>

        <motion.div
          animate={{
            scale: isPlaying ? [1, 1.05, 1] : 1,
          }}
          transition={{ duration: 0.5, repeat: isPlaying ? Infinity : 0 }}
          className="text-8xl tabular-nums"
          style={{
            color: currentBeat === 0 ? 'var(--neon-pink)' : 'var(--neon-cyan)',
            textShadow: isPlaying
              ? currentBeat === 0
                ? '0 0 30px var(--neon-pink), 0 0 50px var(--neon-pink)'
                : '0 0 30px var(--neon-cyan), 0 0 50px var(--neon-cyan)'
              : 'none',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          {currentBeat + 1}
        </motion.div>

        <div
          className="text-sm tracking-widest opacity-60"
          style={{ color: 'var(--neon-green)' }}
        >
          {isPlaying ? '박자를 느껴봐!' : '준비됐어?'}
        </div>
      </div>
    </div>
  );
}
