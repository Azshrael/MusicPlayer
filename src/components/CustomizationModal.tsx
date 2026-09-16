import React from 'react';
import { X, Check, Palette, Type, Sliders, Sparkles, Play, SkipBack, SkipForward, Shuffle, Repeat } from 'lucide-react';
import { ThemeSettings, ThemeMode, FontFamily, ButtonStyle, ControlLayout, FontSizeScale } from '../types';

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeSettings: ThemeSettings;
  onUpdateTheme: (updated: Partial<ThemeSettings>) => void;
}

const COLOR_PRESETS = [
  { name: 'Электрик', color: '#38bdf8' },
  { name: 'Яндекс Золото', color: '#eab308' },
  { name: 'Кибер Маджента', color: '#ec4899' },
  { name: 'Изумруд', color: '#10b981' },
  { name: 'Огненный', color: '#f97316' },
  { name: 'Неоновый Фиолетовый', color: '#a855f7' },
  { name: 'Красный Рубин', color: '#ef4444' },
  { name: 'Мятный Лед', color: '#2dd4bf' },
];

const FONTS: Array<{ id: FontFamily; label: string; preview: string; sample: string }> = [
  { id: 'roboto', label: 'Roboto', preview: 'font-roboto', sample: 'Стандартный шрифт Android' },
  { id: 'montserrat', label: 'Montserrat', preview: 'font-montserrat', sample: 'Геометрический и современный' },
  { id: 'jetbrains', label: 'JetBrains Mono', preview: 'font-jetbrains', sample: 'Hi-Fi Audio & Code Monospace' },
  { id: 'orbitron', label: 'Orbitron', preview: 'font-orbitron', sample: 'CYBERPUNK SCI-FI DISPLAY' },
  { id: 'unbounded', label: 'Unbounded', preview: 'font-unbounded', sample: 'Мощный трендовый шрифт' },
  { id: 'playfair', label: 'Playfair Display', preview: 'font-playfair', sample: 'Премиальная классика' },
  { id: 'inter', label: 'Inter', preview: 'font-inter', sample: 'Чистый лаконичный интерфейс' },
];

const BUTTON_STYLES: Array<{ id: ButtonStyle; label: string; desc: string }> = [
  { id: 'rounded', label: 'Material You', desc: 'Классические круглые кнопки Android' },
  { id: 'neumorphic', label: 'Neumorphism 3D', desc: 'Объемные рельефные клавиши' },
  { id: 'cyber', label: 'Cyber Square', desc: 'Скошенные углы в стиле киберпанк' },
  { id: 'pill', label: 'Smooth Pill', desc: 'Вытянутые овальные элементы' },
  { id: 'outline', label: 'Minimal Outline', desc: 'Тонкий контур и чистые линии' },
  { id: 'neon', label: 'Electric Neon Glow', desc: 'Яркое неоновое свечение по краям' },
];

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  isOpen,
  onClose,
  themeSettings,
  onUpdateTheme,
}) => {
  const [activeTab, setActiveTab] = React.useState<'buttons' | 'colors' | 'fonts'>('buttons');

  if (!isOpen) return null;

  const accent = themeSettings.accentColor;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        id="customization-modal"
        className="w-full max-w-lg bg-slate-900/95 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-black" style={{ backgroundColor: accent }}>
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Кастомизация плеера</h2>
              <p className="text-xs text-slate-400">Настройте внешний вид, кнопки и шрифты под свой вкус</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="p-4 bg-slate-950/60 border-b border-white/5">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center justify-between">
            <span>Предпросмотр кнопок и шрифта</span>
            <span className="font-mono text-[10px]" style={{ color: accent }}>{themeSettings.buttonStyle} • {themeSettings.fontFamily}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-3">
            <div className={`text-center ${`font-${themeSettings.fontFamily}`}`}>
              <div className="text-sm font-bold text-white">Solar Drift — Aura Sound Labs</div>
              <div className="text-xs text-slate-400">FLAC 24-bit • Lossless Audio</div>
            </div>

            {/* Interactive button preview */}
            <div 
              className="flex items-center justify-center gap-3"
              style={{ transform: `scale(${themeSettings.buttonScale})` }}
            >
              {themeSettings.controlLayout === 'extended' && (
                <button className="w-8 h-8 flex items-center justify-center text-slate-400">
                  <Shuffle className="w-4 h-4" />
                </button>
              )}
              
              <button 
                className={`w-10 h-10 flex items-center justify-center text-white transition ${
                  themeSettings.buttonStyle === 'rounded' ? 'rounded-full bg-white/10' :
                  themeSettings.buttonStyle === 'neumorphic' ? 'rounded-2xl bg-slate-800 shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.1),inset_2px_2px_4px_rgba(0,0,0,0.6)]' :
                  themeSettings.buttonStyle === 'cyber' ? 'rounded-none border border-cyan-400/50 bg-cyan-950/40' :
                  themeSettings.buttonStyle === 'pill' ? 'rounded-full px-3 bg-white/10' :
                  themeSettings.buttonStyle === 'outline' ? 'rounded-full border border-white/30' :
                  'rounded-full bg-black/60 border border-current shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                }`}
                style={{ color: themeSettings.buttonStyle === 'neon' ? accent : undefined }}
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button 
                className={`w-13 h-13 flex items-center justify-center font-bold text-black shadow-lg transition active:scale-95 ${
                  themeSettings.buttonStyle === 'rounded' ? 'rounded-full' :
                  themeSettings.buttonStyle === 'neumorphic' ? 'rounded-2xl shadow-[4px_4px_10px_rgba(0,0,0,0.6),-3px_-3px_8px_rgba(255,255,255,0.15)]' :
                  themeSettings.buttonStyle === 'cyber' ? 'rounded-none shadow-[0_0_15px_rgba(6,182,212,0.6)]' :
                  themeSettings.buttonStyle === 'pill' ? 'rounded-full px-5' :
                  themeSettings.buttonStyle === 'outline' ? 'rounded-full border-2 border-white' :
                  'rounded-full shadow-[0_0_20px_currentColor]'
                }`}
                style={{
                  backgroundColor: themeSettings.buttonStyle === 'outline' ? 'transparent' : accent,
                  color: themeSettings.buttonStyle === 'outline' ? accent : '#000000',
                  borderColor: themeSettings.buttonStyle === 'outline' ? accent : undefined,
                }}
              >
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </button>

              <button 
                className={`w-10 h-10 flex items-center justify-center text-white transition ${
                  themeSettings.buttonStyle === 'rounded' ? 'rounded-full bg-white/10' :
                  themeSettings.buttonStyle === 'neumorphic' ? 'rounded-2xl bg-slate-800 shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.1),inset_2px_2px_4px_rgba(0,0,0,0.6)]' :
                  themeSettings.buttonStyle === 'cyber' ? 'rounded-none border border-cyan-400/50 bg-cyan-950/40' :
                  themeSettings.buttonStyle === 'pill' ? 'rounded-full px-3 bg-white/10' :
                  themeSettings.buttonStyle === 'outline' ? 'rounded-full border border-white/30' :
                  'rounded-full bg-black/60 border border-current shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                }`}
                style={{ color: themeSettings.buttonStyle === 'neon' ? accent : undefined }}
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {themeSettings.controlLayout === 'extended' && (
                <button className="w-8 h-8 flex items-center justify-center text-slate-400">
                  <Repeat className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-slate-900">
          <button
            onClick={() => setActiveTab('buttons')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'buttons' ? 'text-white border-current' : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
            style={{ borderColor: activeTab === 'buttons' ? accent : 'transparent' }}
          >
            <Sliders className="w-3.5 h-3.5" />
            Кнопки плеера
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'colors' ? 'text-white border-current' : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
            style={{ borderColor: activeTab === 'colors' ? accent : 'transparent' }}
          >
            <Palette className="w-3.5 h-3.5" />
            Цвета и темы
          </button>
          <button
            onClick={() => setActiveTab('fonts')}
            className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'fonts' ? 'text-white border-current' : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
            style={{ borderColor: activeTab === 'fonts' ? accent : 'transparent' }}
          >
            <Type className="w-3.5 h-3.5" />
            Шрифты
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: BUTTONS */}
          {activeTab === 'buttons' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Стиль кнопок воспроизведения
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {BUTTON_STYLES.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => onUpdateTheme({ buttonStyle: b.id })}
                      className={`p-3 rounded-2xl border text-left transition relative ${
                        themeSettings.buttonStyle === b.id
                          ? 'bg-white/10 border-white/40 shadow-md'
                          : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{b.label}</span>
                        {themeSettings.buttonStyle === b.id && (
                          <Check className="w-4 h-4" style={{ color: accent }} />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{b.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Расположение элементов управления
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'standard' as ControlLayout, label: 'Стандарт', desc: 'Назад, Play, Вперед' },
                    { id: 'extended' as ControlLayout, label: 'Расширенный', desc: '+ Shuffle и Повтор' },
                    { id: 'minimal' as ControlLayout, label: 'Минимал', desc: 'Только самое важное' },
                  ].map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => onUpdateTheme({ controlLayout: layout.id })}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        themeSettings.controlLayout === layout.id
                          ? 'bg-white/10 border-white/40'
                          : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xs font-semibold text-white block">{layout.label}</span>
                      <span className="text-[10px] text-slate-400">{layout.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Размер кнопок: {Math.round(themeSettings.buttonScale * 100)}%
                  </label>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={themeSettings.buttonScale}
                  onChange={(e) => onUpdateTheme({ buttonScale: parseFloat(e.target.value) })}
                  className="w-full cursor-pointer accent-white"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>80% (Компактно)</span>
                  <span>100% (Нормально)</span>
                  <span>130% (Крупно)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COLORS */}
          {activeTab === 'colors' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Тема интерфейса
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'amoled' as ThemeMode, name: 'AMOLED Black', bg: '#000000', border: '#222' },
                    { id: 'dark' as ThemeMode, name: 'Deep Space', bg: '#090d16', border: '#1e293b' },
                    { id: 'yandex' as ThemeMode, name: 'Яндекс Музыка', bg: '#1c1917', border: '#eab308' },
                    { id: 'cyberpunk' as ThemeMode, name: 'Киберпанк', bg: '#0f0826', border: '#06b6d4' },
                    { id: 'retro' as ThemeMode, name: 'Ретро Сансет', bg: '#1a0d1e', border: '#f43f5e' },
                    { id: 'light' as ThemeMode, name: 'Светлая', bg: '#f1f5f9', border: '#cbd5e1', light: true },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onUpdateTheme({ themeMode: t.id })}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between h-20 ${
                        themeSettings.themeMode === t.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''
                      }`}
                      style={{ backgroundColor: t.bg, borderColor: t.border }}
                    >
                      <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: t.border }} />
                      <span className={`text-xs font-semibold ${t.light ? 'text-slate-900' : 'text-white'}`}>
                        {t.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Акцентный цвет кнопок и подсветки
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.color}
                      onClick={() => onUpdateTheme({ accentColor: p.color })}
                      className="p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 flex items-center gap-2 transition"
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-[11px] font-medium text-slate-200 truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Эффект фона
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'album-blur' as const, label: 'Размытая обложка', desc: 'Живой фон из трека' },
                    { id: 'gradient' as const, label: 'Градиентная сетка', desc: 'Плавный перелив' },
                    { id: 'minimal' as const, label: 'Минимал', desc: 'Чистый монохром' },
                  ].map((eff) => (
                    <button
                      key={eff.id}
                      onClick={() => onUpdateTheme({ bgEffect: eff.id })}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        themeSettings.bgEffect === eff.id
                          ? 'bg-white/10 border-white/40'
                          : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xs font-semibold text-white block">{eff.label}</span>
                      <span className="text-[10px] text-slate-400">{eff.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FONTS */}
          {activeTab === 'fonts' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Выбор шрифта интерфейса
                </label>
                <div className="space-y-2">
                  {FONTS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => onUpdateTheme({ fontFamily: f.id })}
                      className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                        themeSettings.fontFamily === f.id
                          ? 'bg-white/10 border-white/40 shadow-sm'
                          : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <div className={`text-sm font-bold text-white ${f.preview}`}>
                          {f.label}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{f.sample}</div>
                      </div>
                      {themeSettings.fontFamily === f.id && (
                        <Check className="w-5 h-5 shrink-0" style={{ color: accent }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Масштаб текста
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'compact' as FontSizeScale, label: 'Компактный', desc: 'Больше треков на экране' },
                    { id: 'normal' as FontSizeScale, label: 'Стандартный', desc: 'Оптимальный баланс' },
                    { id: 'large' as FontSizeScale, label: 'Увеличенный', desc: 'Легче читать на ходу' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onUpdateTheme({ fontSizeScale: s.id })}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        themeSettings.fontSizeScale === s.id
                          ? 'bg-white/10 border-white/40'
                          : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xs font-semibold text-white block">{s.label}</span>
                      <span className="text-[10px] text-slate-400">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end gap-2 bg-slate-900">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-black text-sm shadow-lg transition active:scale-95"
            style={{ backgroundColor: accent }}
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
