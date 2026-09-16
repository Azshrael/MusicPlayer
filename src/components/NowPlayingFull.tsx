import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, 
  Heart, 
  Sliders, 
  Shuffle, 
  Repeat, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Disc3, 
  Image as ImageIcon,
  Sparkles,
  Info,
  Radio
} from 'lucide-react';
import { Track, ThemeSettings, EqualizerState } from '../types';
import { audioEngine } from '../services/audioEngine';

interface NowPlayingFullProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: 'off' | 'all' | 'one';
  onToggleRepeat: () => void;
  onToggleFavorite: (trackId: string) => void;
  onOpenEqualizer: () => void;
  themeSettings: ThemeSettings;
}

export const NowPlayingFull: React.FC<NowPlayingFullProps> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  volume,
  onVolumeChange,
  isShuffle,
  onToggleShuffle,
  repeatMode,
  onToggleRepeat,
  onToggleFavorite,
  onOpenEqualizer,
  themeSettings,
}) => {
  const [viewMode, setViewMode] = useState<'cover' | 'vinyl'>('cover');
  const [showTrackInfo, setShowTrackInfo] = useState(false);
  const visualizerCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const accent = themeSettings.accentColor;

  // Realtime mini visualizer loop for the player screen
  useEffect(() => {
    if (!isOpen) return;

    const canvas = visualizerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const freqData = audioEngine.getVisualizerData();
      if (freqData && isPlaying) {
        const bars = 24;
        const barWidth = width / bars - 2;
        const step = Math.floor(freqData.length / bars);

        for (let i = 0; i < bars; i++) {
          const val = freqData[i * step] || 0;
          const barHeight = (val / 255) * height;
          const x = i * (barWidth + 2);
          const y = height - barHeight;

          ctx.fillStyle = accent;
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      } else {
        // Flat calm line
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, height - 2, width, 2);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [isOpen, isPlaying, accent]);

  if (!isOpen || !currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Button styling generator
  const getSecondaryBtnClass = () => {
    switch (themeSettings.buttonStyle) {
      case 'rounded':
        return 'rounded-full bg-white/10 hover:bg-white/20 text-white';
      case 'neumorphic':
        return 'rounded-2xl bg-slate-800 shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.08),inset_2px_2px_4px_rgba(0,0,0,0.7)] text-white';
      case 'cyber':
        return 'rounded-none border border-cyan-500/40 bg-cyan-950/30 text-white';
      case 'pill':
        return 'rounded-full px-3 bg-white/10 text-white';
      case 'outline':
        return 'rounded-full border border-white/20 text-white';
      case 'neon':
        return 'rounded-full bg-black/60 border border-current shadow-[0_0_12px_rgba(56,189,248,0.4)]';
      default:
        return 'rounded-full bg-white/10 text-white';
    }
  };

  const getMainPlayBtnClass = () => {
    switch (themeSettings.buttonStyle) {
      case 'rounded':
        return 'rounded-full';
      case 'neumorphic':
        return 'rounded-2xl shadow-[5px_5px_12px_rgba(0,0,0,0.7),-3px_-3px_8px_rgba(255,255,255,0.15)]';
      case 'cyber':
        return 'rounded-none shadow-[0_0_20px_rgba(6,182,212,0.7)] border-2 border-white/40';
      case 'pill':
        return 'rounded-full px-8';
      case 'outline':
        return 'rounded-full border-2 border-white';
      case 'neon':
        return 'rounded-full shadow-[0_0_25px_currentColor]';
      default:
        return 'rounded-full';
    }
  };

  return (
    <div 
      id="now-playing-fullscreen"
      className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none animate-slide-up"
    >
      {/* Dynamic blurred album background */}
      {themeSettings.bgEffect === 'album-blur' && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
          <img
            src={currentTrack.coverArt}
            alt=""
            className="w-full h-full object-cover blur-3xl scale-125"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-slate-950/70" />
        </div>
      )}

      {/* Top Bar Navigation */}
      <div className="relative z-10 flex items-center justify-between">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
          aria-label="Свернуть плеер"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono block">
            СЕЙЧАС ИГРАЕТ • {currentTrack.source.toUpperCase()}
          </span>
          <span className="text-xs font-semibold text-slate-200 truncate max-w-[200px] block">
            {currentTrack.album || 'Aura Sound Player'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenEqualizer}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
            title="Открыть эквалайзер"
          >
            <Sliders className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowTrackInfo(!showTrackInfo)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
            title="Информация о файле"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Centerpiece: Vinyl or Album Artwork */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-2 max-w-sm mx-auto w-full">
        {/* Toggle between Vinyl record and square cover */}
        <div className="mb-2 flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-full">
          <button
            onClick={() => setViewMode('cover')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition ${
              viewMode === 'cover' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            Обложка
          </button>
          <button
            onClick={() => setViewMode('vinyl')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 transition ${
              viewMode === 'vinyl' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Disc3 className="w-3 h-3" />
            Винил
          </button>
        </div>

        {viewMode === 'cover' ? (
          /* Square Album Art with glowing reflection */
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden shadow-2xl border border-white/15 group">
            <img
              src={currentTrack.coverArt}
              alt={currentTrack.title}
              className={`w-full h-full object-cover transition duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
              referrerPolicy="no-referrer"
            />
            {/* Hi-Res format badge */}
            <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold tracking-wider" style={{ color: accent }}>
              {currentTrack.format.toUpperCase()} {currentTrack.bitrate ? `• ${currentTrack.bitrate}` : ''}
            </div>
          </div>
        ) : (
          /* Spinning Vinyl Record */
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            {/* Vinyl Body */}
            <div 
              className={`w-full h-full rounded-full bg-neutral-950 border-4 border-neutral-800 shadow-2xl relative flex items-center justify-center ${
                isPlaying ? 'animate-spin-slow' : ''
              }`}
            >
              {/* Vinyl Grooves */}
              <div className="absolute inset-4 rounded-full border border-neutral-800 opacity-60" />
              <div className="absolute inset-8 rounded-full border border-neutral-800 opacity-70" />
              <div className="absolute inset-12 rounded-full border border-neutral-800 opacity-80" />
              <div className="absolute inset-16 rounded-full border border-neutral-800 opacity-90" />
              <div className="absolute inset-20 rounded-full border border-neutral-700 opacity-50" />

              {/* Center Label */}
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 relative shadow-inner">
                <img
                  src={currentTrack.coverArt}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-slate-900 border border-white/40" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Realtime Canvas Visualizer Line */}
        <canvas
          ref={visualizerCanvasRef}
          width={240}
          height={20}
          className="w-56 h-5 mt-3 opacity-75"
        />

        {/* Track Details Overlay if toggled */}
        {showTrackInfo && (
          <div className="mt-2 p-3 rounded-2xl bg-black/80 border border-white/10 text-center text-xs text-slate-300 font-mono space-y-0.5 animate-fade-in w-full max-w-xs">
            <div>Формат: <span className="text-white font-bold">{currentTrack.format.toUpperCase()}</span></div>
            <div>Битрейт: <span className="text-white">{currentTrack.bitrate || 'Lossless'}</span></div>
            <div>Размер: <span className="text-white">{currentTrack.fileSize || 'Память'}</span></div>
            <div>Источник: <span className="text-emerald-400 font-semibold">{currentTrack.source}</span></div>
          </div>
        )}
      </div>

      {/* Track Metadata & Controls Section */}
      <div className="relative z-10 max-w-sm mx-auto w-full space-y-4">
        {/* Title, Artist, Favorite */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-3">
            <h2 className="text-xl font-bold text-white truncate leading-tight">
              {currentTrack.title}
            </h2>
            <p className="text-sm text-slate-400 truncate mt-0.5">
              {currentTrack.artist}
            </p>
          </div>

          <button
            onClick={() => onToggleFavorite(currentTrack.id)}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 hover:text-rose-400 transition"
            title="Избранное"
          >
            <Heart className={`w-6 h-6 ${currentTrack.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        {/* Scrubbable Seekbar */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.5"
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full cursor-pointer accent-white"
            style={{ color: accent }}
          />
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Custom Playback Buttons applying selected ButtonStyle and buttonScale */}
        <div 
          className="flex items-center justify-between"
          style={{ transform: `scale(${themeSettings.buttonScale})` }}
        >
          <button
            onClick={onToggleShuffle}
            className={`w-10 h-10 flex items-center justify-center transition ${
              isShuffle ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
            style={{ color: isShuffle ? accent : undefined }}
            title="Случайный порядок"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={onPrev}
            className={`w-12 h-12 flex items-center justify-center transition active:scale-95 ${getSecondaryBtnClass()}`}
            style={{ color: themeSettings.buttonStyle === 'neon' ? accent : undefined }}
            title="Предыдущий трек"
          >
            <SkipBack className="w-5 h-5 fill-current opacity-90" />
          </button>

          {/* Master Play/Pause button */}
          <button
            onClick={onTogglePlay}
            className={`w-16 h-16 flex items-center justify-center font-bold text-black shadow-2xl transition active:scale-90 ${getMainPlayBtnClass()}`}
            style={{
              backgroundColor: themeSettings.buttonStyle === 'outline' ? 'transparent' : accent,
              color: themeSettings.buttonStyle === 'outline' ? accent : '#000000',
              borderColor: themeSettings.buttonStyle === 'outline' ? accent : undefined,
            }}
            title={isPlaying ? 'Пауза' : 'Воспроизведение'}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>

          <button
            onClick={onNext}
            className={`w-12 h-12 flex items-center justify-center transition active:scale-95 ${getSecondaryBtnClass()}`}
            style={{ color: themeSettings.buttonStyle === 'neon' ? accent : undefined }}
            title="Следующий трек"
          >
            <SkipForward className="w-5 h-5 fill-current opacity-90" />
          </button>

          <button
            onClick={onToggleRepeat}
            className={`w-10 h-10 flex items-center justify-center transition relative ${
              repeatMode !== 'off' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
            style={{ color: repeatMode !== 'off' ? accent : undefined }}
            title={`Повтор: ${repeatMode}`}
          >
            <Repeat className="w-5 h-5" />
            {repeatMode === 'one' && (
              <span className="absolute text-[9px] font-bold font-mono -top-0.5 right-1">1</span>
            )}
          </button>
        </div>

        {/* Volume Slider Bar */}
        <div className="flex items-center gap-3 pt-2 px-1">
          <button
            onClick={() => onVolumeChange(volume === 0 ? 0.8 : 0)}
            className="text-slate-400 hover:text-white transition"
          >
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="flex-1 cursor-pointer accent-white"
            style={{ color: accent }}
          />
        </div>
      </div>
    </div>
  );
};
