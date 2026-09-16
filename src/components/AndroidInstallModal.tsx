import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  ExternalLink, 
  Check, 
  Copy, 
  ShieldCheck, 
  Terminal, 
  Layers, 
  Sparkles,
  WifiOff,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { ThemeSettings } from '../types';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeSettings: ThemeSettings;
  isInstallable: boolean;
  onInstallPWA: () => Promise<boolean>;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
  themeSettings,
  isInstallable,
  onInstallPWA,
}) => {
  const [copied, setCopied] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'apk' | 'capacitor'>('quick');

  if (!isOpen) return null;

  const currentUrl = window.location.origin;
  const pwaBuilderUrl = `https://www.pwabuilder.com/?url=${encodeURIComponent(currentUrl)}`;
  const accent = themeSettings.accentColor;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleQuickInstall = async () => {
    setInstalling(true);
    try {
      await onInstallPWA();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        id="android-install-modal"
        className="w-full max-w-lg bg-slate-900/95 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-black shadow-lg"
              style={{ backgroundColor: accent }}
            >
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                  Установка на Android (.APK)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Релиз
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Способы установки плеера на ваш телефон
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-slate-950/40 p-1.5 gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'quick'
                ? 'bg-white/10 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>WebAPK (Быстро)</span>
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'apk'
                ? 'bg-white/10 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Скачать .APK</span>
          </button>
          <button
            onClick={() => setActiveTab('capacitor')}
            className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'capacitor'
                ? 'bg-white/10 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Capacitor</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-300 text-sm">
          {activeTab === 'quick' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-white text-sm">
                    Нативная установка WebAPK без компиляции
                  </div>
                  <p>
                    Android автоматически компилирует и устанавливает приложение как нативный APK-пакет прямо через Chrome, Яндекс Браузер или Samsung Internet.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[11px]">1</div>
                  <span>Откройте ссылку приложения в <b>Google Chrome</b> или <b>Яндекс Браузере</b> на вашем телефоне.</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[11px]">2</div>
                  <span>Нажмите кнопку <b>«Установить приложение»</b> ниже или в меню браузера (три точки → «Установить на телефон»).</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[11px]">3</div>
                  <span>Иконка появится на рабочем столе и в списке всех программ. Плеер работает автономно без интернета!</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                {isInstallable ? (
                  <button
                    onClick={handleQuickInstall}
                    disabled={installing}
                    className="flex-1 py-3 px-4 rounded-2xl text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-98"
                    style={{ backgroundColor: accent }}
                  >
                    <Download className="w-4 h-4" />
                    <span>{installing ? 'Установка...' : 'Установить на телефон сейчас'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 py-3 px-4 rounded-2xl text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-98"
                    style={{ backgroundColor: accent }}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Ссылка скопирована!' : 'Скопировать ссылку для телефона'}</span>
                  </button>
                )}
                
                <button
                  onClick={handleCopyLink}
                  className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Скопировано' : 'Копировать адрес'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-white text-sm">
                    Генерация автономного .APK файла через PWABuilder
                  </div>
                  <p>
                    Сервис от Microsoft автоматически упаковывает готовое PWA в подписанный файл <b>AuraSound.apk</b>, который можно пересылать и устанавливать через файловый менеджер Android.
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-slate-400">
                  Адрес вашего приложения уже проверен и готов к сборке:
                </p>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-white/10 font-mono text-[11px] text-cyan-400 break-all select-all">
                  {currentUrl}
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-2xl text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition hover:brightness-110 active:scale-98"
                  style={{ backgroundColor: accent }}
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Открыть PWABuilder & Скачать .APK</span>
                </a>

                <p className="text-[11px] text-slate-400 text-center">
                  Нажмите кнопку выше → нажмите «Generate Package» → выберите «Android APK» → скачайте установочный файл на телефон.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'capacitor' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                В проект уже добавлен конфигурационный файл <code>capacitor.config.json</code> и пакеты <code>@capacitor/core</code>. Для самостоятельной сборки в Android Studio:
              </p>

              <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 font-mono text-xs text-slate-300 space-y-2 overflow-x-auto">
                <div className="text-slate-500"># 1. Собрать продакшен-бандл:</div>
                <div className="text-emerald-400">npm run build</div>
                <div className="text-slate-500"># 2. Добавить платформу Android:</div>
                <div className="text-emerald-400">npx cap add android</div>
                <div className="text-slate-500"># 3. Синхронизировать файлы:</div>
                <div className="text-emerald-400">npx cap sync android</div>
                <div className="text-slate-500"># 4. Собрать APK через Android Studio:</div>
                <div className="text-emerald-400">npx cap open android</div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>Package ID: <b className="text-slate-200">com.aurasound.player</b></span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <WifiOff className="w-4 h-4 text-emerald-400" />
            <span>100% офлайн поддержка памяти</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
