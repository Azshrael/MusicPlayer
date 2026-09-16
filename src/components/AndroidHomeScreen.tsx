import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Smartphone, 
  Layers, 
  Image as ImageIcon, 
  ExternalLink, 
  Camera, 
  Phone, 
  MessageSquare, 
  Chrome, 
  Settings as SettingsIcon,
  Folder,
  Music,
  Check,
  Pin
} from 'lucide-react';
import { Track, ThemeSettings, WidgetSettings, WidgetStyle } from '../types';
import { AndroidWidget } from './AndroidWidget';

interface AndroidHomeScreenProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleFavorite: (trackId: string) => void;
  themeSettings: ThemeSettings;
  widgetSettings: WidgetSettings;
  onUpdateWidgetSettings: (settings: WidgetSettings) => void;
  onReturnToPlayer: () => void;
}

const WALLPAPERS = [
  { id: 'amoled', name: 'AMOLED Black', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1080&q=80' },
  { id: 'space', name: 'Deep Space', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1080&q=80' },
  { id: 'cyber', name: 'Cyber Neon', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1080&q=80' },
  { id: 'sunset', name: 'Mountain Sunset', url: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&w=1080&q=80' },
];

export const AndroidHomeScreen: React.FC<AndroidHomeScreenProps> = ({
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
  onUpdateWidgetSettings,
  onReturnToPlayer,
}) => {
  const [activeWallpaper, setActiveWallpaper] = useState(WALLPAPERS[0].url);
  const [showConfig, setShowConfig] = useState(false);

  const accent = themeSettings.accentColor;

  return (
    <div className="relative min-h-[680px] w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-between select-none">
      {/* Wallpaper Image */}
      <img
        src={activeWallpaper}
        alt="Android Wallpaper"
        className="absolute inset-0 w-full h-full object-cover z-0 transition-all duration-700 brightness-[0.75]"
      />

      {/* Top Android Status Bar */}
      <div className="relative z-10 p-3 pt-4 flex items-center justify-between text-xs text-white/90 font-medium px-5">
        <span className="font-semibold tracking-wider">12:45</span>
        <div className="flex items-center gap-2">
          {/* Controls toggle */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-[10px] text-white flex items-center gap-1 hover:bg-black/70 transition"
          >
            <Layers className="w-3 h-3 text-cyan-400" />
            Стиль виджета: {widgetSettings.style}
          </button>

          <button
            onClick={onReturnToPlayer}
            className="px-3 py-1 rounded-full text-black font-bold text-xs flex items-center gap-1 shadow-lg transition active:scale-95"
            style={{ backgroundColor: accent }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            В плеер
          </button>
        </div>
      </div>

      {/* Config Overlay if opened */}
      {showConfig && (
        <div className="relative z-20 mx-4 p-4 rounded-3xl bg-slate-950/90 border border-white/15 backdrop-blur-xl shadow-2xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Настройки виджета на рабочий стол
            </span>
            <button
              onClick={() => setShowConfig(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div>
            <label className="text-[11px] text-slate-300 font-semibold block mb-1">Размер виджета:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '4x2' as WidgetStyle, label: '4x2 Большой', desc: 'Обложка + волны + управление' },
                { id: '4x1' as WidgetStyle, label: '4x1 Полоса', desc: 'Компактная горизонталь' },
                { id: '2x2' as WidgetStyle, label: '2x2 Квадрат', desc: 'Стеклянный квадрат' },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => onUpdateWidgetSettings({ ...widgetSettings, style: style.id })}
                  className={`p-2 rounded-xl border text-center transition ${
                    widgetSettings.style === style.id
                      ? 'bg-white/15 border-white/40 shadow-sm'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="text-xs font-bold text-white block">{style.label}</span>
                  <span className="text-[9px] text-slate-400 leading-tight">{style.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-300 font-semibold block mb-1">Обои рабочего стола:</label>
            <div className="grid grid-cols-4 gap-1.5">
              {WALLPAPERS.map((wp) => (
                <button
                  key={wp.id}
                  onClick={() => setActiveWallpaper(wp.url)}
                  className={`relative h-12 rounded-xl overflow-hidden border transition ${
                    activeWallpaper === wp.url ? 'border-white ring-2 ring-cyan-400' : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={wp.url} alt={wp.name} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center py-0.5 truncate">
                    {wp.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Android Desktop Body: Clock & Widget */}
      <div className="relative z-10 px-4 py-2 space-y-4 flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        {/* Android Clock & Date */}
        <div className="text-center text-white drop-shadow-lg">
          <div className="text-5xl font-light tracking-tight font-roboto">12:45</div>
          <div className="text-xs font-medium text-white/80 mt-1 uppercase tracking-wider">
            Среда, 16 сентября • 22°C Ясно
          </div>
        </div>

        {/* The Working Interactive Widget on Desktop! */}
        <div className="w-full flex justify-center">
          <AndroidWidget
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onTogglePlay={onTogglePlay}
            onNext={onNext}
            onPrev={onPrev}
            onToggleFavorite={onToggleFavorite}
            themeSettings={themeSettings}
            widgetSettings={widgetSettings}
            onOpenPlayer={onReturnToPlayer}
          />
        </div>

        {/* Real Android Installation Info Tip */}
        <div className="p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-center text-[11px] text-slate-300 space-y-1">
          <div className="flex items-center justify-center gap-1.5 font-bold text-white">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Установка виджета на ваш настоящий телефон:</span>
          </div>
          <p className="text-slate-400 text-[10px]">
            Нажмите «Установить PWA» в меню браузера Chrome/Яндекс на Android («Добавить на главный экран»). 
            Виджет управления музыкой также автоматически появляется в шторке уведомлений и на экране блокировки Android через MediaSession API!
          </p>
        </div>
      </div>

      {/* Bottom Android Dock App Icons */}
      <div className="relative z-10 p-4 pb-6 backdrop-blur-md bg-black/30 border-t border-white/5">
        <div className="flex items-center justify-around max-w-xs mx-auto">
          {/* Phone */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <Phone className="w-6 h-6 fill-current" />
            </div>
            <span className="text-[10px] text-white/90">Телефон</span>
          </div>

          {/* Chrome */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
              <Chrome className="w-6 h-6" />
            </div>
            <span className="text-[10px] text-white/90">Chrome</span>
          </div>

          {/* Aura Sound App Icon */}
          <div 
            onClick={onReturnToPlayer}
            className="flex flex-col items-center gap-1 cursor-pointer group"
          >
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-black font-black text-xl shadow-xl transition group-hover:scale-105 active:scale-95"
              style={{ backgroundColor: accent }}
            >
              <Music className="w-6 h-6" />
            </div>
            <span className="text-[10px] text-white font-bold group-hover:underline">Aura Sound</span>
          </div>

          {/* Camera */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Camera className="w-6 h-6" />
            </div>
            <span className="text-[10px] text-white/90">Камера</span>
          </div>
        </div>

        {/* Android Gesture Bar */}
        <div className="w-32 h-1 bg-white/40 rounded-full mx-auto mt-4" />
      </div>
    </div>
  );
};
