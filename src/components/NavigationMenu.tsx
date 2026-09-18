import React from 'react';
import { 
  X, 
  HardDrive, 
  Radio, 
  Server, 
  Sliders, 
  Palette, 
  FolderSearch, 
  Trash2, 
  Smartphone, 
  Disc3, 
  ChevronRight,
  ShieldCheck,
  Music2
} from 'lucide-react';
import { ThemeSettings } from '../types';

export type MusicSource = 'local' | 'yandex' | 'nas' | 'widget';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeSource: MusicSource;
  onSelectSource: (source: MusicSource) => void;
  onOpenEqualizer: () => void;
  onOpenCustomization: () => void;
  onOpenScanner: () => void;
  onVerifyPaths: () => void;
  themeSettings: ThemeSettings;
  tracksCount: number;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  isOpen,
  onClose,
  activeSource,
  onSelectSource,
  onOpenEqualizer,
  onOpenCustomization,
  onOpenScanner,
  onVerifyPaths,
  themeSettings,
  tracksCount,
}) => {
  if (!isOpen) return null;

  const accent = themeSettings.accentColor;

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-80 max-w-[85vw] bg-slate-900/95 border-r border-white/10 shadow-2xl h-full flex flex-col z-10 animate-slide-right backdrop-blur-xl">
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-black font-extrabold shadow-lg"
              style={{ backgroundColor: accent }}
            >
              <Disc3 className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-wide">Aura Sound</h1>
              <p className="text-[11px] text-slate-400">Hi-Res Аудиоплеер</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
          {/* Section: Источники музыки */}
          <div className="space-y-1.5">
            <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Источники музыки
            </div>

            {/* Внутренняя память (Main) */}
            <button
              onClick={() => {
                onSelectSource('local');
                onClose();
              }}
              className={`w-full p-3 rounded-2xl flex items-center justify-between transition ${
                activeSource === 'local'
                  ? 'bg-white/15 text-white font-bold shadow-md'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <HardDrive 
                  className="w-4 h-4" 
                  style={{ color: activeSource === 'local' ? accent : '#94a3b8' }} 
                />
                <div className="text-left">
                  <div className="font-semibold text-xs">Внутренняя память</div>
                  <div className="text-[10px] text-slate-400">
                    {tracksCount} {tracksCount === 1 ? 'трек' : tracksCount < 5 ? 'трека' : 'треков'} на устройстве
                  </div>
                </div>
              </div>
              {activeSource === 'local' && (
                <div 
                  className="w-2 h-2 rounded-full shadow-glow" 
                  style={{ backgroundColor: accent }} 
                />
              )}
            </button>

            {/* Яндекс Музыка */}
            <button
              onClick={() => {
                onSelectSource('yandex');
                onClose();
              }}
              className={`w-full p-3 rounded-2xl flex items-center justify-between transition ${
                activeSource === 'yandex'
                  ? 'bg-white/15 text-white font-bold shadow-md'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Radio 
                  className="w-4 h-4" 
                  style={{ color: activeSource === 'yandex' ? '#fbbf24' : '#94a3b8' }} 
                />
                <div className="text-left">
                  <div className="font-semibold text-xs">Яндекс Музыка</div>
                  <div className="text-[10px] text-slate-400">Стриминг и кэш</div>
                </div>
              </div>
              {activeSource === 'yandex' && (
                <div className="w-2 h-2 rounded-full bg-amber-400 shadow-glow" />
              )}
            </button>

            {/* NAS Хранилище */}
            <button
              onClick={() => {
                onSelectSource('nas');
                onClose();
              }}
              className={`w-full p-3 rounded-2xl flex items-center justify-between transition ${
                activeSource === 'nas'
                  ? 'bg-white/15 text-white font-bold shadow-md'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Server 
                  className="w-4 h-4" 
                  style={{ color: activeSource === 'nas' ? '#38bdf8' : '#94a3b8' }} 
                />
                <div className="text-left">
                  <div className="font-semibold text-xs">NAS-хранилище</div>
                  <div className="text-[10px] text-slate-400">DLNA / WebDAV / SMB</div>
                </div>
              </div>
              {activeSource === 'nas' && (
                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-glow" />
              )}
            </button>

            {/* Виджет экрана */}
            <button
              onClick={() => {
                onSelectSource('widget');
                onClose();
              }}
              className={`w-full p-3 rounded-2xl flex items-center justify-between transition ${
                activeSource === 'widget'
                  ? 'bg-white/15 text-white font-bold shadow-md'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Smartphone 
                  className="w-4 h-4" 
                  style={{ color: activeSource === 'widget' ? accent : '#94a3b8' }} 
                />
                <div className="text-left">
                  <div className="font-semibold text-xs">Виджет рабочего стола</div>
                  <div className="text-[10px] text-slate-400">Android виджет 4x2</div>
                </div>
              </div>
              {activeSource === 'widget' && (
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: accent }} 
                />
              )}
            </button>
          </div>

          {/* Section: Управление и Звук */}
          <div className="space-y-1.5 pt-4 border-t border-white/5">
            <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Звук и Настройки
            </div>

            {/* Эквалайзер */}
            <button
              onClick={() => {
                onClose();
                onOpenEqualizer();
              }}
              className="w-full p-3 rounded-2xl flex items-center justify-between text-slate-300 hover:bg-white/5 hover:text-white transition group"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-black"
                  style={{ backgroundColor: accent }}
                >
                  <Sliders className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-xs text-white">10-полосный эквалайзер</div>
                  <div className="text-[10px] text-slate-400">Preamp, Bass Boost, 3D Stereo</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
            </button>

            {/* Персонализация */}
            <button
              onClick={() => {
                onClose();
                onOpenCustomization();
              }}
              className="w-full p-3 rounded-2xl flex items-center justify-between text-slate-300 hover:bg-white/5 hover:text-white transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                  <Palette className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-xs text-white">Персонализация</div>
                  <div className="text-[10px] text-slate-400">Темы, шрифты, стили кнопок</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
            </button>

            {/* Сканировать память */}
            <button
              onClick={() => {
                onClose();
                onOpenScanner();
              }}
              className="w-full p-3 rounded-2xl flex items-center justify-between text-slate-300 hover:bg-white/5 hover:text-white transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                  <FolderSearch className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-xs text-white">Сканировать память</div>
                  <div className="text-[10px] text-slate-400">Поиск треков и M3U плейлистов</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
            </button>

            {/* Проверить и удалить неактуальные пути (Requirement 4) */}
            <button
              onClick={() => {
                onClose();
                onVerifyPaths();
              }}
              className="w-full p-3 rounded-2xl flex items-center justify-between text-slate-300 hover:bg-rose-500/10 hover:text-rose-200 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-xs text-rose-200">Очистить неактуальные пути</div>
                  <div className="text-[10px] text-slate-400">Удалить перемещенные файлы</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-rose-200 transition" />
            </button>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Aura Sound Hi-Res Engine</span>
          <span>v2.4.0</span>
        </div>
      </div>
    </div>
  );
};
