import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Folder, 
  FileAudio, 
  Play, 
  Download, 
  Settings, 
  CheckCircle2, 
  RefreshCw, 
  ChevronRight, 
  FolderUp, 
  Wifi, 
  ShieldCheck, 
  Sliders, 
  ArrowLeft,
  HardDriveDownload,
  ListMusic
} from 'lucide-react';
import { NASConfig, NASDirectoryItem, Track, ThemeSettings } from '../types';
import { 
  DEFAULT_NAS_CONFIG, 
  NAS_PRESETS, 
  fetchNASDirectory, 
  convertNASItemToTrack 
} from '../services/nasService';
import { saveTrack } from '../services/db';

interface NasStorageViewProps {
  onSelectTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  themeSettings: ThemeSettings;
  onRefreshTracks: () => void;
}

export const NasStorageView: React.FC<NasStorageViewProps> = ({
  onSelectTrack,
  currentTrack,
  isPlaying,
  themeSettings,
  onRefreshTracks,
}) => {
  const [nasConfig, setNasConfig] = useState<NASConfig>(DEFAULT_NAS_CONFIG);
  const [currentPath, setCurrentPath] = useState<string>('/music');
  const [directoryItems, setDirectoryItems] = useState<NASDirectoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [downloadingItems, setDownloadingItems] = useState<Record<string, boolean>>({});

  const accent = themeSettings.accentColor;

  const loadDirectory = async (path: string) => {
    setIsLoading(true);
    try {
      const items = await fetchNASDirectory(path);
      setDirectoryItems(items);
      setCurrentPath(path);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDirectory(currentPath);
  }, []);

  const handleItemClick = (item: NASDirectoryItem) => {
    if (item.type === 'folder') {
      loadDirectory(item.path);
    } else {
      const track = convertNASItemToTrack(item, nasConfig);
      onSelectTrack(track);
    }
  };

  const handleGoUp = () => {
    if (currentPath === '/music' || currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const upPath = parts.length > 0 ? `/${parts.join('/')}` : '/music';
    loadDirectory(upPath);
  };

  const handleDownloadToPhone = async (item: NASDirectoryItem) => {
    setDownloadingItems((prev) => ({ ...prev, [item.path]: true }));
    const track = convertNASItemToTrack(item, nasConfig);
    // Store in offline IndexedDB
    await saveTrack({
      ...track,
      id: `nas-cached-${Date.now()}-${item.name}`,
      album: `${nasConfig.name} (Офлайн кэш)`,
      source: 'local',
      dateAdded: Date.now(),
    });
    setTimeout(() => {
      setDownloadingItems((prev) => ({ ...prev, [item.path]: false }));
      onRefreshTracks();
    }, 800);
  };

  const handleSyncAllFolder = async () => {
    setIsLoading(true);
    const audioFiles = directoryItems.filter((i) => i.type === 'file' && i.format !== undefined);
    for (const item of audioFiles) {
      const track = convertNASItemToTrack(item, nasConfig);
      await saveTrack({
        ...track,
        id: `nas-cached-${Date.now()}-${item.name}`,
        album: `${nasConfig.name} (Офлайн кэш)`,
        source: 'local',
        dateAdded: Date.now(),
      });
    }
    setIsLoading(false);
    onRefreshTracks();
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="space-y-4 pb-24">
      {/* NAS Connection Card */}
      <div 
        id="nas-header-card"
        className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-white/10 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: accent }} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-black font-bold shadow-lg" style={{ backgroundColor: accent }}>
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{nasConfig.name}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                  <Wifi className="w-3 h-3" />
                  WebDAV Online
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {nasConfig.protocol.toUpperCase()}://{nasConfig.host}:{nasConfig.port} • Пользователь: {nasConfig.username}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncAllFolder}
              className="px-3 py-2 rounded-xl text-xs font-bold text-black flex items-center gap-1.5 shadow-md transition active:scale-95"
              style={{ backgroundColor: accent }}
              title="Скачать все файлы этой папки в офлайн память телефона"
            >
              <HardDriveDownload className="w-3.5 h-3.5" />
              Синхронизировать всё
            </button>
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 flex items-center gap-1.5 transition"
            >
              <Settings className="w-3.5 h-3.5" />
              Настройки NAS
            </button>
          </div>
        </div>

        {/* Formats supported badge */}
        <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Сетевое хранилище: Hi-Res FLAC 24-bit, WAV PCM, MP3 320k, M3U</span>
          <span className="text-emerald-400">Прямое воспроизведение и кэширование</span>
        </div>
      </div>

      {/* Breadcrumb Path & Navigation Bar */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar font-mono text-slate-300">
          <button
            onClick={() => loadDirectory('/music')}
            className="hover:text-white flex items-center gap-1 text-slate-400"
          >
            <Server className="w-3.5 h-3.5" />
            <span>NAS</span>
          </button>
          {pathParts.map((part, index) => {
            const pathUntilNow = `/${pathParts.slice(0, index + 1).join('/')}`;
            const isLast = index === pathParts.length - 1;
            return (
              <React.Fragment key={pathUntilNow}>
                <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                <button
                  onClick={() => loadDirectory(pathUntilNow)}
                  className={`truncate max-w-[140px] hover:text-white ${isLast ? 'text-white font-bold' : 'text-slate-400'}`}
                >
                  {part}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {currentPath !== '/music' && currentPath !== '/' && (
            <button
              onClick={handleGoUp}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 transition"
              title="На уровень выше"
            >
              <FolderUp className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => loadDirectory(currentPath)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 transition"
            title="Обновить список"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Directory Content List */}
      <div className="space-y-1.5">
        {directoryItems.map((item) => {
          const isFolder = item.type === 'folder';
          const isDownloading = downloadingItems[item.path];
          const isCurrent = currentTrack?.nasPath === item.path;

          return (
            <div
              key={item.path}
              className={`p-3 rounded-2xl border transition flex items-center justify-between select-none ${
                isFolder
                  ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15 cursor-pointer'
                  : isCurrent
                  ? 'bg-white/15 border-white/30 shadow-lg'
                  : 'bg-white/5 border-white/5 hover:bg-white/8 hover:border-white/10'
              }`}
            >
              <div 
                onClick={() => handleItemClick(item)}
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              >
                <div 
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isFolder ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'
                  }`}
                >
                  {isFolder ? (
                    <Folder className="w-5 h-5 fill-current" />
                  ) : item.name.endsWith('.m3u') || item.name.endsWith('.m3u8') ? (
                    <ListMusic className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <FileAudio className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold truncate text-white leading-tight">
                      {item.name}
                    </h4>
                    {item.format && (
                      <span
                        className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider shrink-0"
                        style={{
                          backgroundColor: item.format === 'flac' ? 'rgba(56, 189, 248, 0.2)' : item.format === 'wav' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                          color: item.format === 'flac' ? '#38bdf8' : item.format === 'wav' ? '#ec4899' : '#cbd5e1',
                        }}
                      >
                        {item.format}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">
                    {isFolder ? 'Папка с аудио' : item.size ? `${(item.size / (1024 * 1024)).toFixed(1)} MB` : 'Аудиофайл NAS'}
                    {item.duration ? ` • ${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}` : ''}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              {!isFolder && (
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <button
                    onClick={() => handleItemClick(item)}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                    title="Слушать с NAS"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>

                  <button
                    onClick={() => handleDownloadToPhone(item)}
                    disabled={isDownloading}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 flex items-center gap-1.5 transition active:scale-95"
                    title="Сохранить в офлайн-память телефона"
                  >
                    <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce text-emerald-400' : ''}`} />
                    <span className="hidden sm:inline">{isDownloading ? 'Загрузка...' : 'В память'}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* NAS Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-black font-bold" style={{ backgroundColor: accent }}>
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Параметры NAS хранилища</h3>
                <p className="text-xs text-slate-400">Настройка подключения к домашнему серверу</p>
              </div>
            </div>

            {/* Presets */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Быстрые шаблоны серверов:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {NAS_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setNasConfig({
                        ...nasConfig,
                        name: preset.name,
                        port: preset.port,
                        protocol: preset.protocol,
                        basePath: preset.basePath,
                      });
                    }}
                    className="p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-left text-xs transition"
                  >
                    <div className="font-semibold text-white">{preset.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{preset.protocol.toUpperCase()} : {preset.port}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Название NAS:</label>
                <input
                  type="text"
                  value={nasConfig.name}
                  onChange={(e) => setNasConfig({ ...nasConfig, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Хост / IP:</label>
                  <input
                    type="text"
                    value={nasConfig.host}
                    onChange={(e) => setNasConfig({ ...nasConfig, host: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Порт:</label>
                  <input
                    type="number"
                    value={nasConfig.port}
                    onChange={(e) => setNasConfig({ ...nasConfig, port: parseInt(e.target.value, 10) || 5005 })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Логин:</label>
                  <input
                    type="text"
                    value={nasConfig.username}
                    onChange={(e) => setNasConfig({ ...nasConfig, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Пароль:</label>
                  <input
                    type="password"
                    value={nasConfig.password || ''}
                    onChange={(e) => setNasConfig({ ...nasConfig, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-slate-300 hover:bg-white/15 transition"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  loadDirectory(nasConfig.basePath);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-black shadow-md transition active:scale-95"
                style={{ backgroundColor: accent }}
              >
                Сохранить и подключиться
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
