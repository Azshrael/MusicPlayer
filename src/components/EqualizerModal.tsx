import React, { useEffect, useRef } from 'react';
import { X, Sliders, RotateCcw, Volume2, Waves, Radio, Activity } from 'lucide-react';
import { EqualizerState, ThemeSettings } from '../types';
import { EQ_FREQUENCIES, EQ_PRESETS, audioEngine } from '../services/audioEngine';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  eqState: EqualizerState;
  onUpdateEQ: (state: EqualizerState) => void;
  themeSettings: ThemeSettings;
  isPlaying: boolean;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  eqState,
  onUpdateEQ,
  themeSettings,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Real-time canvas visualizer loop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const data = audioEngine.getVisualizerData();
      if (data && isPlaying) {
        const barCount = 32;
        const barWidth = width / barCount - 2;
        const step = Math.floor(data.length / barCount);

        for (let i = 0; i < barCount; i++) {
          const val = data[i * step] || 0;
          const barHeight = (val / 255) * (height - 8);
          const x = i * (barWidth + 2);
          const y = height - barHeight;

          // Gradient color from accent
          ctx.fillStyle = themeSettings.accentColor;
          ctx.fillRect(x, y, barWidth, barHeight);

          // Peak cap
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, Math.max(0, y - 2), barWidth, 2);
        }
      } else {
        // Idle gentle wave
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const time = Date.now() / 800;
        for (let x = 0; x < width; x += 4) {
          const y = height / 2 + Math.sin(x * 0.05 + time) * 6;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, isPlaying, themeSettings.accentColor]);

  if (!isOpen) return null;

  const accent = themeSettings.accentColor;

  const handleBandChange = (index: number, val: number) => {
    const newBands = [...eqState.bands];
    newBands[index] = val;
    const updated = { ...eqState, bands: newBands, preset: 'Пользовательский' };
    onUpdateEQ(updated);
    audioEngine.applyEqualizerState(updated);
  };

  const handlePresetSelect = (presetName: string) => {
    const presetBands = EQ_PRESETS[presetName] || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const updated = { ...eqState, bands: presetBands, preset: presetName };
    onUpdateEQ(updated);
    audioEngine.applyEqualizerState(updated);
  };

  const handleBassBoost = (val: number) => {
    const updated = { ...eqState, bassBoost: val };
    onUpdateEQ(updated);
    audioEngine.applyEqualizerState(updated);
  };

  const handleVirtualizer = (val: number) => {
    const updated = { ...eqState, virtualizer: val };
    onUpdateEQ(updated);
    audioEngine.applyEqualizerState(updated);
  };

  const handlePreamp = (val: number) => {
    const updated = { ...eqState, preamp: val };
    onUpdateEQ(updated);
    audioEngine.applyEqualizerState(updated);
  };

  const handleToggleEnable = () => {
    const updated = { ...eqState, enabled: !eqState.enabled };
    onUpdateEQ(updated);
    audioEngine.applyEqualizerState(updated);
  };

  const handleReset = () => {
    handlePresetSelect('Flat');
    handleBassBoost(0);
    handleVirtualizer(0);
    handlePreamp(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        id="equalizer-modal"
        className="w-full max-w-xl bg-slate-900/95 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-black" style={{ backgroundColor: accent }}>
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white leading-tight">10-полосный эквалайзер</h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  Hi-Res DSP
                </span>
              </div>
              <p className="text-xs text-slate-400">Точная калибровка частот и басов Web Audio API</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Master Toggle */}
            <button
              onClick={handleToggleEnable}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                eqState.enabled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/10 text-slate-400 border border-white/10'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              {eqState.enabled ? 'ВКЛ' : 'ВЫКЛ'}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visualizer Canvas Bar */}
        <div className="px-5 py-3 bg-slate-950/70 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Radio className="w-3.5 h-3.5 animate-pulse" style={{ color: accent }} />
            <span>Спектральный анализатор</span>
          </div>
          <canvas
            ref={canvasRef}
            width={280}
            height={44}
            className="w-64 h-9 rounded-lg bg-black/40 border border-white/5"
          />
        </div>

        {/* Preset Selector */}
        <div className="p-4 border-b border-white/10 bg-slate-900/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Пресеты звучания
            </span>
            <button
              onClick={handleReset}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              Сброс
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {Object.keys(EQ_PRESETS).map((p) => (
              <button
                key={p}
                onClick={() => handlePresetSelect(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition ${
                  eqState.preset === p
                    ? 'text-black font-bold shadow-md'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                }`}
                style={{
                  backgroundColor: eqState.preset === p ? accent : undefined,
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* 10 Band Sliders */}
        <div className="p-4 sm:p-5 overflow-x-auto">
          <div className="min-w-[480px]">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mb-2 px-1">
              <span>+12 dB</span>
              <span className="text-slate-500">0 dB (FLAT)</span>
              <span>-12 dB</span>
            </div>

            <div className="grid grid-cols-10 gap-2 items-center bg-slate-950/40 p-3 rounded-2xl border border-white/5">
              {EQ_FREQUENCIES.map((freq, idx) => {
                const gain = eqState.bands[idx] ?? 0;
                const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
                return (
                  <div key={freq} className="flex flex-col items-center">
                    <span 
                      className="text-[10px] font-mono font-bold mb-2 h-4"
                      style={{ color: gain !== 0 ? accent : '#94a3b8' }}
                    >
                      {gain > 0 ? `+${gain}` : gain}
                    </span>

                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      disabled={!eqState.enabled}
                      value={gain}
                      onChange={(e) => handleBandChange(idx, parseInt(e.target.value, 10))}
                      className="eq-slider accent-current disabled:opacity-40"
                      style={{ color: accent }}
                    />

                    <span className="text-[10px] font-mono font-semibold text-slate-400 mt-2">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Extra DSP Knobs / Sliders: Bass Boost, 3D Virtualizer, Preamp */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-900/60 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Bass Boost */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" style={{ color: accent }} />
                Bass Boost
              </span>
              <span className="text-xs font-mono font-bold" style={{ color: accent }}>
                {eqState.bassBoost}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              disabled={!eqState.enabled}
              value={eqState.bassBoost}
              onChange={(e) => handleBassBoost(parseInt(e.target.value, 10))}
              className="w-full accent-current disabled:opacity-40"
              style={{ color: accent }}
            />
            <p className="text-[10px] text-slate-400 mt-1">Усиление глубоких саб-басов (80 Hz)</p>
          </div>

          {/* 3D Spatial Virtualizer */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5" style={{ color: accent }} />
                3D Virtualizer
              </span>
              <span className="text-xs font-mono font-bold" style={{ color: accent }}>
                {eqState.virtualizer}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              disabled={!eqState.enabled}
              value={eqState.virtualizer}
              onChange={(e) => handleVirtualizer(parseInt(e.target.value, 10))}
              className="w-full accent-current disabled:opacity-40"
              style={{ color: accent }}
            />
            <p className="text-[10px] text-slate-400 mt-1">Пространственное 3D расширение сцены</p>
          </div>

          {/* Preamp */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" style={{ color: accent }} />
                Предусилитель
              </span>
              <span className="text-xs font-mono font-bold" style={{ color: accent }}>
                {eqState.preamp > 0 ? `+${eqState.preamp}` : eqState.preamp} dB
              </span>
            </div>
            <input
              type="range"
              min="-6"
              max="6"
              step="0.5"
              disabled={!eqState.enabled}
              value={eqState.preamp}
              onChange={(e) => handlePreamp(parseFloat(e.target.value))}
              className="w-full accent-current disabled:opacity-40"
              style={{ color: accent }}
            />
            <p className="text-[10px] text-slate-400 mt-1">Общий уровень входного гейна</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end gap-2 bg-slate-900">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-black text-sm shadow-lg transition active:scale-95"
            style={{ backgroundColor: accent }}
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
};
