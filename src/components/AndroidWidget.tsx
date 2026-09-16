import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Heart, Shuffle, Repeat, Music, Sparkles } from 'lucide-react';
import { Track, ThemeSettings, WidgetSettings } from '../types';

interface AndroidWidgetProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleFavorite?: (trackId: string) => void;
  themeSettings: ThemeSettings;
  widgetSettings: WidgetSettings;
  onOpenPlayer: () => void;
  isFloating?: boolean;
}

export const AndroidWidget: React.FC<AndroidWidgetProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onNext,
  onPrev,
  onToggleFavorite,
  themeSettings,
  widgetSettings,
  onOpenPlayer,
  isFloating = false,
}) => {
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const accent = themeSettings.accentColor;

  if (!currentTrack) {
    return (
      <div 
        id="android-widget-empty"
        onClick={onOpenPlayer}
        className="w-full p-4 rounded-3xl backdrop-blur-xl bg-slate-900/80 border border-white/10 text-center cursor-pointer shadow-2xl transition hover:scale-[1.01]"
      >
        <div className="flex items-center justify-center gap-3 text-slate-300">
          <Music className="w-6 h-6 text-indigo-400 animate-pulse" />
          <span className="text-sm font-medium">Aura Sound • Нажмите для запуска музыки</span>
        </div>
      </div>
    );
  }

  // 4x1 Minimal Horizontal Widget
  if (widgetSettings.style === '4x1') {
    return (
      <div
        id="android-widget-4x1"
        className={`w-full p-3 rounded-2xl backdrop-blur-2xl border border-white/10 shadow-2xl transition select-none ${
          isFloating ? 'bg-slate-950/90 shadow-cyan-950/40' : 'bg-slate-900/80'
        }`}
      >
        <div className="flex items-center gap-3">
          <div 
            onClick={onOpenPlayer}
            className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 cursor-pointer shadow-md group"
          >
            <img
              src={currentTrack.coverArt}
              alt={currentTrack.title}
              className={`w-full h-full object-cover transition ${isPlaying ? 'scale-105' : 'scale-100'}`}
              referrerPolicy="no-referrer"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="flex gap-0.5 items-end h-3">
                  <span className="w-0.5 h-3 bg-white animate-pulse" />
                  <span className="w-0.5 h-2 bg-white animate-pulse delay-75" />
                  <span className="w-0.5 h-3.5 bg-white animate-pulse delay-150" />
                </span>
              </div>
            )}
          </div>

          <div 
            onClick={onOpenPlayer}
            className="flex-1 min-w-0 cursor-pointer"
          >
            <h4 className="text-sm font-semibold truncate text-white leading-tight">
              {currentTrack.title}
            </h4>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {currentTrack.artist} • <span className="uppercase text-[10px] tracking-wider font-mono opacity-80" style={{ color: accent }}>{currentTrack.format}</span>
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              id="widget-btn-prev"
              onClick={onPrev}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition"
              aria-label="Previous Track"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              id="widget-btn-play"
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-full flex items-center justify-center text-black font-bold shadow-lg transition active:scale-95"
              style={{ backgroundColor: accent }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <button
              id="widget-btn-next"
              onClick={onNext}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition"
              aria-label="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar line */}
        <div className="w-full bg-white/10 h-1 rounded-full mt-2.5 overflow-hidden">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%`, backgroundColor: accent }}
          />
        </div>
      </div>
    );
  }

  // 2x2 Square Widget
  if (widgetSettings.style === '2x2') {
    return (
      <div
        id="android-widget-2x2"
        className="w-48 h-48 rounded-3xl p-3.5 backdrop-blur-2xl bg-slate-900/85 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col justify-between select-none"
      >
        <div 
          onClick={onOpenPlayer}
          className="absolute inset-0 z-0 opacity-25"
        >
          <img
            src={currentTrack.coverArt}
            alt=""
            className="w-full h-full object-cover blur-md"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-slate-950/70" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/90">
            Aura Widget
          </span>
          <button
            onClick={() => onToggleFavorite?.(currentTrack.id)}
            className="text-slate-300 hover:text-rose-400 transition"
          >
            <Heart className={`w-4 h-4 ${currentTrack.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        <div 
          onClick={onOpenPlayer}
          className="relative z-10 text-center cursor-pointer my-1"
        >
          <h4 className="text-sm font-bold text-white truncate drop-shadow">
            {currentTrack.title}
          </h4>
          <p className="text-xs text-slate-300 truncate mt-0.5">
            {currentTrack.artist}
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-center gap-2">
          <button
            onClick={onPrev}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20 transition"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={onTogglePlay}
            className="w-11 h-11 rounded-full flex items-center justify-center text-black font-bold shadow-lg transition active:scale-95"
            style={{ backgroundColor: accent }}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
          <button
            onClick={onNext}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20 transition"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="relative z-10 w-full bg-white/15 h-1 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%`, backgroundColor: accent }}
          />
        </div>
      </div>
    );
  }

  // 4x2 Default Large Android Widget
  return (
    <div
      id="android-widget-4x2"
      className="w-full p-4 rounded-3xl backdrop-blur-2xl bg-slate-900/80 border border-white/10 shadow-2xl relative overflow-hidden select-none transition"
    >
      {/* Subtle cover art ambient reflection */}
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ backgroundColor: accent }} />

      <div className="flex gap-4 items-center">
        {/* Album Art with Vinyl Edge */}
        <div 
          onClick={onOpenPlayer}
          className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 cursor-pointer shadow-lg group"
        >
          <img
            src={currentTrack.coverArt}
            alt={currentTrack.title}
            className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
          <span 
            className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-black/70"
            style={{ color: accent }}
          >
            {currentTrack.format}
          </span>
        </div>

        {/* Track Info & Visual Waveform */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" style={{ color: accent }} />
              Aura Music Widget
            </span>
            <button
              onClick={() => onToggleFavorite?.(currentTrack.id)}
              className="text-slate-400 hover:text-rose-400 transition"
              title="В избранное"
            >
              <Heart className={`w-4 h-4 ${currentTrack.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>

          <div onClick={onOpenPlayer} className="cursor-pointer mt-1">
            <h3 className="text-base font-bold text-white truncate leading-tight group-hover:underline">
              {currentTrack.title}
            </h3>
            <p className="text-xs text-slate-400 truncate mt-0.5 font-medium">
              {currentTrack.artist} {currentTrack.album ? `— ${currentTrack.album}` : ''}
            </p>
          </div>

          {/* Equalizer animation bars if playing */}
          {isPlaying && (
            <div className="flex items-end gap-1 h-3 mt-1.5 opacity-80">
              {[40, 90, 60, 100, 75, 45, 80, 50].map((h, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    backgroundColor: accent,
                    animationDuration: `${0.4 + (i % 4) * 0.2}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Seekbar */}
      <div className="mt-3.5">
        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden relative">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%`, backgroundColor: accent }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono text-slate-400">
            {currentTrack.bitrate || 'Hi-Res Lossless'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="widget-large-prev"
            onClick={onPrev}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition active:scale-95"
            aria-label="Previous"
          >
            <SkipBack className="w-4 h-4 fill-current opacity-80" />
          </button>
          <button
            id="widget-large-play"
            onClick={onTogglePlay}
            className="w-11 h-11 rounded-full flex items-center justify-center text-black font-bold shadow-xl transition active:scale-90"
            style={{ backgroundColor: accent }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
          <button
            id="widget-large-next"
            onClick={onNext}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition active:scale-95"
            aria-label="Next"
          >
            <SkipForward className="w-4 h-4 fill-current opacity-80" />
          </button>
        </div>

        <button
          onClick={onOpenPlayer}
          className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 transition"
        >
          Открыть плеер
        </button>
      </div>
    </div>
  );
};
