import React from 'react';
import { Play, Pause, SkipForward, Music } from 'lucide-react';
import { Track, ThemeSettings } from '../types';

interface MiniPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onOpenFull: () => void;
  themeSettings: ThemeSettings;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onNext,
  onOpenFull,
  themeSettings,
}) => {
  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const accent = themeSettings.accentColor;

  return (
    <div
      id="android-mini-player"
      className="fixed bottom-16 left-0 right-0 z-40 max-w-lg mx-auto px-3 select-none"
    >
      <div 
        className="w-full rounded-2xl backdrop-blur-2xl bg-slate-900/95 border border-white/10 shadow-2xl overflow-hidden cursor-pointer group transition hover:border-white/20"
      >
        {/* Progress Bar line on top */}
        <div className="w-full bg-white/10 h-1">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${progressPercent}%`, backgroundColor: accent }}
          />
        </div>

        <div className="p-2 sm:p-2.5 flex items-center justify-between gap-3">
          {/* Cover & Title */}
          <div 
            onClick={onOpenFull}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow">
              <img
                src={currentTrack.coverArt}
                alt={currentTrack.title}
                className={`w-full h-full object-cover transition ${isPlaying ? 'scale-105' : ''}`}
                referrerPolicy="no-referrer"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <span className="flex gap-0.5 items-end h-2.5">
                    <span className="w-0.5 h-2 bg-white animate-pulse" />
                    <span className="w-0.5 h-3 bg-white animate-pulse delay-75" />
                    <span className="w-0.5 h-1.5 bg-white animate-pulse delay-150" />
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold truncate text-white leading-tight">
                {currentTrack.title}
              </h4>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {currentTrack.artist} • <span className="uppercase text-[9px] font-mono" style={{ color: accent }}>{currentTrack.format}</span>
              </p>
            </div>
          </div>

          {/* Quick Play & Next */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePlay();
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-black font-bold shadow-lg transition active:scale-95"
              style={{ backgroundColor: accent }}
              aria-label={isPlaying ? 'Пауза' : 'Воспроизведение'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition"
              aria-label="Следующий"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
