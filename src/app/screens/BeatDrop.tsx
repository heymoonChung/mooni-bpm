import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Loader2, Volume2, VolumeX, Link, Music, ArrowRight, Search, Youtube } from 'lucide-react';
import { useTrack } from '../context/TrackContext';
import { useNavigate, useLocation } from 'react-router';

// ── Types ──────────────────────────────────────────────────────────────────
interface Note {
  id: string;
  lane: number;
  time: number;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// ── Constants ──────────────────────────────────────────────────────────────
const LANES = [
  { id: 0, name: 'Hi-Hat', color: 'var(--neon-cyan)', symbol: 'HH' },
  { id: 1, name: 'Snare',  color: 'var(--neon-pink)', symbol: 'SN' },
  { id: 2, name: 'Kick',   color: 'var(--neon-orange)', symbol: 'KK' },
  { id: 3, name: 'Cymbal', color: 'var(--neon-green)', symbol: 'CY' },
];

const RANDOM_SONGS = [
  { id: 'G8VFOIzkg-M', title: 'Tower of Power - What is Hip? (Live Funk)' },
  { id: 'BKSiGA7fv9M', title: 'Toto - Rosanna (Live Shuffle)' },
  { id: 'r7jkrDBkMGI', title: 'Casiopea - Asayake (Live Classic)' },
  { id: 'Py0FdS-e960', title: 'Steely Dan - Aja (Steve Gadd Session)' },
  { id: 'Nq5LMGtBmis', title: 'Vulfpeck - It Gets Funkier (Louis Cole)' },
  { id: '5jDVZPzfS1c', title: 'Dave Weckl - Festival de Ritmos (Technical)' },
  { id: 'aYYFmp9NBTk', title: 'Dirty Loops - Coffee Break (Modern Funk)' },
  { id: 'Let9P-85z3U', title: 'Harry Styles - Sign of the Times (Drum Cover)' }
];

// ── YouTube Helpers ────────────────────────────────────────────────────────
function extractVideoId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    const data = await res.json();
    return data.title || '알 수 없는 곡';
  } catch { return '알 수 없는 곡'; }
}

// ── Beat Pattern ───────────────────────────────────────────────────────────
function generatePattern(): Note[] {
  const pattern: Note[] = [];
  let id = 0;
  for (let bar = 0; bar < 16; bar++) {
    for (let beat = 0; beat < 16; beat++) {
      const time = bar * 16 + beat;
      if (beat % 2 === 0)                              pattern.push({ id: `n${id++}`, lane: 0, time });
      if (beat % 4 === 2)                              pattern.push({ id: `n${id++}`, lane: 1, time });
      if (beat % 4 === 0 || (beat % 8 === 6 && bar % 2)) pattern.push({ id: `n${id++}`, lane: 2, time });
      if (beat === 0 && bar % 4 === 0)                 pattern.push({ id: `n${id++}`, lane: 3, time });
    }
  }
  return pattern;
}

// ── Drum Synth ─────────────────────────────────────────────────────────────
class DrumSynth {
  ctx: AudioContext | null = null;
  unlock() {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const g = this.ctx.createGain(); g.gain.value = 0.0001;
    const o = this.ctx.createOscillator();
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + 0.01);
  }
  private osc(freq: number, type: OscillatorType, dur: number, vol: number) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + dur);
  }
  private noise(dur: number, vol: number, hp = 2000) {
    if (!this.ctx) return;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    src.connect(f); f.connect(g); g.connect(this.ctx.destination); src.start();
  }
  kick()   { this.osc(160, 'sine', 0.25, 1.0); }
  snare()  { this.osc(280, 'triangle', 0.12, 0.6); this.noise(0.18, 0.45, 1200); }
  hihat()  { this.noise(0.06, 0.35, 5500); }
  cymbal() { this.noise(0.9, 0.25, 3500); }
}
const synth = new DrumSynth();

// ══════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════
export default function BeatDrop() {
  const { currentTrack, setCurrentTrack } = useTrack();
  const navigate = useNavigate();
  const location = useLocation();

  // ── States ──
  const [screen, setScreen] = useState<'input' | 'player'>('input');
  const [inputMode, setInputMode] = useState<'link' | 'search'>('search');
  const [urlInput, setUrlInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{id: string, title: string, artist: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [urlError, setUrlError] = useState('');
  const [loadingTitle, setLoadingTitle] = useState(false);
  const [ytReady, setYtReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentTime, setCurrentTime] = useState(0);
  const [notes] = useState<Note[]>(generatePattern);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishMood, setFinishMood] = useState<string | null>(null);

  // ── Refs ──
  const ytPlayerRef = useRef<any>(null);
  const ytPlayerContainerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>();
  const lastTRef = useRef<number>(0);
  const playedRef = useRef<Set<string>>(new Set());

  // ── Auto-load if continuing practice ──────────────────────────────────
  useEffect(() => {
    if (location.state?.continue && currentTrack?.videoId) {
      setVideoId(currentTrack.videoId);
      setVideoTitle(currentTrack.title);
      setBpm(currentTrack.bpm);
      setScreen('player');
    }
  }, [location.state, currentTrack]);

  // ── YouTube API ────────────────────────────────────────────────────────
  useEffect(() => {
    if (window.YT && window.YT.Player) { setYtReady(true); return; }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => setYtReady(true);
  }, []);

  useEffect(() => {
    if (!ytReady || !videoId || screen !== 'player' || !ytPlayerContainerRef.current) return;
    if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy(); } catch {} ytPlayerRef.current = null; }
    
    ytPlayerContainerRef.current.innerHTML = '';
    const playerDiv = document.createElement('div');
    playerDiv.style.width = '100%'; playerDiv.style.height = '180px';
    ytPlayerContainerRef.current.appendChild(playerDiv);

    ytPlayerRef.current = new window.YT.Player(playerDiv, {
      videoId,
      playerVars: { autoplay: 1, controls: 1, playsinline: 1, rel: 0, modestbranding: 1 },
      events: { onStateChange: (e: any) => { setPlaying(e.data === 1); } }
    });
    return () => { if (ytPlayerRef.current) try { ytPlayerRef.current.destroy(); } catch {} };
  }, [ytReady, videoId, screen]);

  // ── Drum animation ─────────────────────────────────────────────────────
  useEffect(() => {
    if (playing) {
      const animate = (ts: number) => {
        if (!lastTRef.current) lastTRef.current = ts;
        const delta = ts - lastTRef.current;
        const inc = (delta / 1000) * (bpm / 60) * 4;
        setCurrentTime(prev => {
          const next = prev + inc;
          if (!isMuted) {
            notes.forEach(n => {
              if (n.time <= next && !playedRef.current.has(n.id)) {
                playedRef.current.add(n.id);
                if (n.lane === 0) synth.hihat();
                if (n.lane === 1) synth.snare();
                if (n.lane === 2) synth.kick();
                if (n.lane === 3) synth.cymbal();
              }
            });
          }
          if (next >= 256) { playedRef.current.clear(); return 0; }
          return next;
        });
        lastTRef.current = ts;
        animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
    } else { if (animRef.current) cancelAnimationFrame(animRef.current); lastTRef.current = 0; }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [playing, bpm, isMuted, notes]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const togglePlay = () => {
    synth.unlock();
    if (playing) {
      if (ytPlayerRef.current) ytPlayerRef.current.pauseVideo();
      setPlaying(false);
    } else {
      if (ytPlayerRef.current) ytPlayerRef.current.playVideo();
      setPlaying(true);
    }
  };

  const handleSelectSearchResult = (song: {id: string, title: string, artist: string}) => {
    synth.unlock();
    setVideoId(song.id);
    setVideoTitle(song.title);
    setCurrentTrack({ title: song.title, artist: song.artist, bpm, videoId: song.id });
    setScreen('player');
    setPlaying(true);
  };

  const handleSubmitUrl = useCallback(async () => {
    synth.unlock();
    const id = extractVideoId(urlInput.trim());
    if (!id) { setUrlError('올바른 유튜브 링크를 붙여넣어 주세요!'); return; }
    setUrlError(''); setLoadingTitle(true);
    const title = await fetchVideoTitle(id);
    setVideoTitle(title); setVideoId(id);
    setCurrentTrack({ title, artist: 'YouTube', bpm, videoId: id });
    setLoadingTitle(false); setScreen('player'); setPlaying(true);
  }, [urlInput, bpm, setCurrentTrack]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true); setUrlError('');
    const query = encodeURIComponent(searchQuery);

    // 1. Try local backend
    try {
      const res = await fetch(`http://localhost:8000/api/search?q=${query}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) { setSearchResults(data.slice(0, 8)); setIsSearching(false); return; }
      }
    } catch {}

    // 2. Try proxy fallbacks
    const proxies = ['https://api.piped.private.coffee', 'https://pipedapi.kavin.rocks', 'https://piped-api.garudalinux.org'];
    for (const apiBase of proxies) {
      try {
        const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`${apiBase}/search?q=${query}&filter=all`)}`);
        if (res.ok) {
          const wrapper = await res.json();
          const data = JSON.parse(wrapper.contents);
          const results = (data.items || []).filter((i: any) => i.type === 'stream').slice(0, 8).map((i: any) => ({
            id: i.url.split('v=')[1]?.split('&')[0] || i.url.split('/').pop(),
            title: i.title, artist: i.uploaderName || 'YouTube'
          })).filter((r: any) => r.id && r.id.length === 11);
          if (results.length > 0) { setSearchResults(results); setIsSearching(false); return; }
        }
      } catch {}
    }
    setUrlError('검색 결과를 가져오지 못했습니다. 파이썬 서버가 켜져 있는지 확인해 주세요.');
    setIsSearching(false);
  };

  const handleRandomPlay = () => {
    synth.unlock();
    const song = RANDOM_SONGS[Math.floor(Math.random() * RANDOM_SONGS.length)];
    setVideoId(song.id); setVideoTitle(song.title);
    setCurrentTrack({ title: song.title, artist: 'YouTube', bpm, videoId: song.id });
    setScreen('player'); setPlaying(true);
  };

  const handleReset = () => {
    setCurrentTime(0); setPlaying(false); playedRef.current.clear();
    if (ytPlayerRef.current) try { ytPlayerRef.current.seekTo(0); ytPlayerRef.current.pauseVideo(); } catch {}
  };

  const handleFinish = () => {
    if (!finishMood) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const log = { date: todayStr, mood: finishMood, duration: 15, notes: `${videoTitle} 연습 완료!`, hasVoiceNote: false };
    const existing = JSON.parse(localStorage.getItem('yuni_practice_logs') || '[]');
    localStorage.setItem('yuni_practice_logs', JSON.stringify([...existing.filter((l: any) => l.date !== todayStr), log]));
    setShowFinishModal(false); navigate('/progress');
  };

  const hitLine = 82;

  // ══════════════════════════════════════════════════════════════════════
  // UI: Input Screen
  // ══════════════════════════════════════════════════════════════════════
  if (screen === 'input') {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 gap-6 overflow-y-auto">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'linear-gradient(135deg, var(--neon-pink), var(--neon-cyan))', boxShadow: '0 0 30px var(--neon-pink)' }}>
            <Music className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--neon-pink)', textShadow: '0 0 15px var(--neon-pink)' }}>Beat Drop</h1>
          <p className="text-sm opacity-60 text-white">원하는 곡에 맞춰 드럼을 연습해보세요!</p>
        </div>

        <div className="w-full max-w-sm space-y-4 pb-10">
          <div className="flex gap-2 p-1 rounded-xl bg-white/5">
            <button className="flex-1 py-2 text-sm rounded-lg transition-all" onClick={() => setInputMode('search')}
              style={{ background: inputMode === 'search' ? 'white/10' : 'transparent', color: inputMode === 'search' ? 'var(--neon-cyan)' : 'white/50' }}>유튜브 검색</button>
            <button className="flex-1 py-2 text-sm rounded-lg transition-all" onClick={() => setInputMode('link')}
              style={{ background: inputMode === 'link' ? 'white/10' : 'transparent', color: inputMode === 'link' ? 'var(--neon-pink)' : 'white/50' }}>링크 붙여넣기</button>
          </div>

          {inputMode === 'link' ? (
            <div className="relative">
              <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40 text-white" />
              <input type="text" value={urlInput} onChange={e => setUrlInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmitUrl()}
                placeholder="https://youtu.be/..." className="w-full pl-12 pr-4 py-4 rounded-2xl text-base outline-none bg-white/5 text-white border border-white/10" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40 text-white" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="곡명, 아티스트 검색" className="w-full pl-12 pr-4 py-4 rounded-2xl text-base outline-none bg-white/5 text-white border border-white/10" />
                </div>
                <button onClick={handleSearch} className="px-4 rounded-2xl border border-cyan-400 bg-cyan-400/10 text-cyan-400">
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {searchResults.map(res => (
                    <button key={res.id} onClick={() => handleSelectSearchResult(res)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-left hover:bg-white/10">
                      <Youtube className="w-5 h-5 text-pink-500" />
                      <div className="flex-1 overflow-hidden"><div className="text-sm font-medium truncate text-white">{res.title}</div><div className="text-xs opacity-50 truncate text-white">{res.artist}</div></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {urlError && <p className="text-sm text-pink-500">⚠️ {urlError}</p>}
          <div className="space-y-2">
            <div className="flex justify-between text-xs opacity-60 text-white"><span>BPM</span><span className="text-pink-500">{bpm}</span></div>
            <input type="range" min="60" max="200" value={bpm} onChange={e => setBpm(Number(e.target.value))} className="w-full h-1" />
          </div>
          <button onClick={inputMode === 'link' ? handleSubmitUrl : handleSearch} className="w-full py-4 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, var(--neon-pink), var(--neon-cyan))', boxShadow: '0 0 20px rgba(255,0,255,0.4)' }}>
            {loadingTitle ? <Loader2 className="w-5 h-5 animate-spin" /> : <>시작하기 <ArrowRight className="w-5 h-5" /></>}
          </button>
          <p className="text-center text-xs opacity-40 text-white pt-2">어떤 곡을 칠지 모르겠다면? <button className="underline" onClick={handleRandomPlay}>랜덤 재생</button></p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // UI: Player Screen
  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="h-screen flex flex-col bg-[#0A0A0A] text-white">
      <div className="p-4 flex-shrink-0">
        <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/10">
          <div ref={ytPlayerContainerRef} style={{ width: '100%', height: '180px' }} />
          <div className="absolute top-2 left-2 flex gap-2">
            <button onClick={() => { setScreen('input'); setPlaying(false); }} className="text-xs px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm opacity-80">← 뒤로</button>
            <div className="text-xs px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-cyan-400">{bpm} BPM</div>
          </div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden mx-4 rounded-2xl bg-black/20 border border-white/5">
        <div className="absolute inset-0 grid grid-cols-4">
          {LANES.map(lane => (
            <div key={lane.id} className="relative flex flex-col border-l border-white/5">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full z-10" style={{ background: `${lane.color}25`, color: lane.color }}>{lane.symbol}</div>
              <AnimatePresence>
                {notes.filter(n => n.lane === lane.id && n.time >= currentTime && n.time < currentTime + 32).map(note => {
                  const pct = ((note.time - currentTime) / 32) * 100;
                  return (
                    <motion.div key={note.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="absolute left-1/2 -translate-x-1/2 rounded-xl"
                      style={{ top: `${hitLine - pct}%`, width: 40, height: 22, background: lane.color, boxShadow: `0 0 15px ${lane.color}` }} />
                  );
                })}
              </AnimatePresence>
            </div>
          ))}
        </div>
        <div className="absolute left-0 right-0 h-[2px] bg-white/80 z-10" style={{ top: `${hitLine}%`, boxShadow: '0 0 15px white' }} />
        <div className="absolute bottom-0 left-0 right-0 grid grid-cols-4 px-1 pb-2">
          {LANES.map(lane => (<div key={lane.id} className="text-center text-[10px] opacity-40" style={{ color: lane.color }}>{lane.name}</div>))}
        </div>
      </div>

      <div className="p-6 flex-shrink-0 space-y-6">
        <div className="flex items-center justify-center gap-10">
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleReset} className="w-14 h-14 rounded-full flex items-center justify-center bg-white/5 border border-white/10 opacity-60"><RotateCcw className="w-7 h-7" /></motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={togglePlay} className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ background: 'var(--neon-pink)', boxShadow: '0 0 30px var(--neon-pink)' }}>
            {playing ? <Pause className="w-12 h-12 text-white" /> : <Play className="w-12 h-12 text-white pl-1" />}
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsMuted(p => !p)} className="w-14 h-14 rounded-full flex items-center justify-center bg-white/5 border border-white/10 opacity-60">
            {isMuted ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7 text-cyan-400" />}
          </motion.button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1"><input type="range" min="60" max="200" value={bpm} onChange={e => setBpm(Number(e.target.value))} className="w-full h-1" /></div>
          <div className="text-xs font-bold text-pink-500 w-16">{bpm} BPM</div>
        </div>
        <button onClick={() => setShowFinishModal(true)} className="w-full py-4 rounded-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-green))' }}>연습 종료 및 기록하기</button>
      </div>

      <AnimatePresence>
        {showFinishModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-sm rounded-3xl p-8 space-y-6 bg-[#1A1A1A] border border-pink-500/30">
              <h3 className="text-2xl font-bold text-center text-pink-500">오늘 연습 어땠어?</h3>
              <div className="flex justify-center gap-4 text-4xl">
                {['😊', '😎', '🔥', '😅'].map(m => (<button key={m} onClick={() => setFinishMood(m)} className="active:scale-90" style={{ filter: finishMood === m ? 'none' : 'grayscale(100%) opacity(50%)' }}>{m}</button>))}
              </div>
              <button onClick={handleFinish} disabled={!finishMood} className="w-full py-4 rounded-xl font-bold text-white disabled:opacity-40" style={{ background: 'var(--neon-pink)' }}>기록 저장하기</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
