import React, { useRef, useState } from 'react';
import { 
  FolderDown, 
  FolderPlus, 
  Search, 
  HardDrive, 
  FileAudio, 
  Play, 
  Pause, 
  Heart, 
  MoreVertical, 
  Sparkles, 
  CheckCircle2, 
  Upload, 
  Download,
  Trash2,
  Music2,
  ListPlus
} from 'lucide-react';
import { Track, ThemeSettings } from '../types';
import { saveTrack, deleteTrack } from '../services/db';
import { parseM3U, downloadM3UFile } from '../services/m3uParser';
import { parseTrackFilename } from '../utils/filenameParser';

interface LibraryViewProps {
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRefreshTracks: () => void;
  themeSettings: ThemeSettings;
  onToggleFavorite: (trackId: string) => void;
  onAddToPlaylistModal: (track: Track) => void;
  onOpenScanner?: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  tracks,
  onSelectTrack,
  currentTrack,
  isPlaying,
  onTogglePlay,
  onRefreshTracks,
  themeSettings,
  onToggleFavorite,
  onAddToPlaylistModal,
  onOpenScanner,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'all' | 'flac' | 'wav' | 'mp3' | 'favorites'>('all');
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const m3uInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const accent = themeSettings.accentColor;

  // Filtered tracks
  const filteredTracks = tracks.filter((t) => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.album.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFormat === 'favorites') return !!t.isFavorite;
    if (selectedFormat === 'flac') return t.format === 'flac';
    if (selectedFormat === 'wav') return t.format === 'wav';
    if (selectedFormat === 'mp3') return t.format === 'mp3';
    return true;
  });

  // Calculate local offline tracks & estimated memory
  const localTracks = tracks.filter(t => t.source === 'local' || t.blobKey);
  const totalDuration = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const hours = Math.floor(totalDuration / 3600);
  const mins = Math.floor((totalDuration % 3600) / 60);

  // File upload handler (from phone storage)
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const name = file.name;
      const ext = name.split('.').pop()?.toLowerCase();

      // Check format
      if (!['mp3', 'flac', 'wav', 'aac', 'ogg', 'm4a'].includes(ext || '')) {
        continue;
      }

      // Parse title / artist from filename according to schemes
      const { artist, title } = parseTrackFilename(name);
      const filePath = file.webkitRelativePath || name;

      const blobUrl = URL.createObjectURL(file);
      const sizeMb = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      // Get real audio duration
      const duration = await new Promise<number>((resolve) => {
        const tempAudio = new Audio();
        tempAudio.src = blobUrl;
        tempAudio.onloadedmetadata = () => resolve(tempAudio.duration || 180);
        tempAudio.onerror = () => resolve(180);
      });

      const trackId = `local-${Date.now()}-${i}`;
      const newTrack: Track = {
        id: trackId,
        title,
        artist,
        album: 'Память телефона',
        duration,
        url: blobUrl,
        coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
        source: 'local',
        format: (ext as any) || 'mp3',
        fileSize: sizeMb,
        bitrate: ext === 'flac' ? '1411 kbps Hi-Res' : ext === 'wav' ? '1536 kbps PCM' : '320 kbps',
        dateAdded: Date.now(),
        blobKey: trackId,
        filePath,
        fileName: name,
        isFavorite: false,
      };

      // Save to IndexedDB so it's stored for offline use!
      await saveTrack(newTrack, file);
    }

    setIsImporting(false);
    onRefreshTracks();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  // M3U Playlist file import handler
  const handleM3UImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const text = await file.text();
    const parsedEntries = parseM3U(text);

    for (let i = 0; i < parsedEntries.length; i++) {
      const entry = parsedEntries[i];
      const trackId = `m3u-${Date.now()}-${i}`;
      const newTrack: Track = {
        id: trackId,
        title: entry.title,
        artist: entry.artist,
        album: file.name.replace(/\.[^/.]+$/, ''),
        duration: entry.duration || 210,
        url: entry.uri.startsWith('http') ? entry.uri : 'https://cdn.freesound.org/previews/612/612610_5674468-lq.mp3',
        coverArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
        source: 'local',
        format: (entry.format as any) || 'mp3',
        bitrate: '320 kbps',
        fileSize: '7.8 MB',
        dateAdded: Date.now(),
        isFavorite: false,
      };
      await saveTrack(newTrack);
    }

    setIsImporting(false);
    onRefreshTracks();
    if (m3uInputRef.current) m3uInputRef.current.value = '';
  };

  const handleDelete = async (trackId: string) => {
    await deleteTrack(trackId);
    onRefreshTracks();
    setActiveMenuTrackId(null);
  };

  const handleExportLibraryM3U = () => {
    downloadM3UFile(tracks, 'Aura_Phone_Library');
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFilesSelected}
        multiple
        accept="audio/*,.mp3,.flac,.wav,.aac,.ogg,.m4a"
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFilesSelected}
        multiple
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        className="hidden"
      />
      <input
        type="file"
        ref={m3uInputRef}
        onChange={handleM3UImport}
        accept=".m3u,.m3u8"
        className="hidden"
      />

      {/* Storage & Device Info Banner */}
      <div 
        id="storage-banner"
        className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-white/10 relative overflow-hidden shadow-xl"
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: accent }} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-black font-bold shadow-lg" style={{ backgroundColor: accent }}>
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Память Android телефона</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  100% Офлайн
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {tracks.length} треков • {hours > 0 ? `${hours} ч ` : ''}{mins} мин • Поддержка MP3, FLAC, WAV
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenScanner && (
              <button
                id="btn-scan-memory"
                onClick={onOpenScanner}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-black flex items-center gap-1.5 shadow-md transition active:scale-95 hover:opacity-90"
                style={{ backgroundColor: accent }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Сканировать память
              </button>
            )}
            <button
              id="btn-add-music"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white flex items-center gap-1.5 transition active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              Файлы
            </button>
            <button
              onClick={() => folderInputRef.current?.click()}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 flex items-center gap-1.5 transition"
              title="Выбрать целую папку с музыкой"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              Папка
            </button>
            <button
              onClick={() => m3uInputRef.current?.click()}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 flex items-center gap-1.5 transition"
              title="Импортировать список M3U"
            >
              <FolderDown className="w-3.5 h-3.5" />
              Импорт M3U
            </button>
            <button
              onClick={handleExportLibraryM3U}
              className="px-2.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 flex items-center gap-1 transition"
              title="Экспортировать текущую библиотеку в файл .m3u"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Offline cache notification badge */}
        <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Sparkles className="w-3.5 h-3.5" style={{ color: accent }} />
            IndexedDB хранилище: песни сохраняются в кэше и играют без интернета
          </span>
          <span>FLAC • WAV • MP3</span>
        </div>
      </div>

      {/* Search & Format Filter Pills */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по названию, артисту или альбому..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-white/30 transition"
          />
        </div>

        {/* Format tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'all', label: `Все (${tracks.length})` },
            { id: 'flac', label: `FLAC Hi-Res (${tracks.filter(t => t.format === 'flac').length})` },
            { id: 'wav', label: `WAV Lossless (${tracks.filter(t => t.format === 'wav').length})` },
            { id: 'mp3', label: `MP3 (${tracks.filter(t => t.format === 'mp3').length})` },
            { id: 'favorites', label: `Избранное (${tracks.filter(t => t.isFavorite).length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFormat(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition ${
                selectedFormat === tab.id
                  ? 'text-black font-bold shadow-md'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
              }`}
              style={{
                backgroundColor: selectedFormat === tab.id ? accent : undefined,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state indicator */}
      {isImporting && (
        <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 text-center text-xs text-indigo-200 animate-pulse flex items-center justify-center gap-2">
          <Upload className="w-4 h-4 animate-bounce" />
          <span>Импортируем и кэшируем аудиофайлы в память телефона...</span>
        </div>
      )}

      {/* Track List */}
      {filteredTracks.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/40 border border-white/5 text-center text-slate-400 space-y-4">
          <div 
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-black font-bold shadow-lg"
            style={{ backgroundColor: accent }}
          >
            <Music2 className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-white">Список треков пуст</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Запустите автоматическое сканирование памяти телефона или выберите папку/файлы с музыкой.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {onOpenScanner && (
              <button
                onClick={onOpenScanner}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-black shadow-lg inline-flex items-center gap-2 transition hover:scale-105 active:scale-95"
                style={{ backgroundColor: accent }}
              >
                <Sparkles className="w-4 h-4" />
                Сканировать память устройства
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white inline-flex items-center gap-1.5 transition active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              Выбрать файлы
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredTracks.map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            const isPlayingThis = isCurrent && isPlaying;

            return (
              <div
                key={track.id}
                id={`track-${track.id}`}
                className={`group p-2.5 sm:p-3 rounded-2xl border transition flex items-center gap-3 relative select-none ${
                  isCurrent
                    ? 'bg-white/10 border-white/30 shadow-lg'
                    : 'bg-white/5 border-white/5 hover:bg-white/8 hover:border-white/10'
                }`}
              >
                {/* Cover Art / Play Overlay */}
                <div
                  onClick={() => onSelectTrack(track)}
                  className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 cursor-pointer shadow group/cover"
                >
                  <img
                    src={track.coverArt}
                    alt={track.title}
                    className={`w-full h-full object-cover transition-transform duration-500 ${
                      isPlayingThis ? 'scale-110' : 'group-hover/cover:scale-105'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition ${
                      isPlayingThis ? 'bg-black/50 opacity-100' : 'bg-black/40 opacity-0 group-hover/cover:opacity-100'
                    }`}
                  >
                    {isPlayingThis ? (
                      <Pause className="w-5 h-5 text-white fill-current" />
                    ) : (
                      <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                    )}
                  </div>
                </div>

                {/* Track Details */}
                <div 
                  onClick={() => onSelectTrack(track)}
                  className="flex-1 min-w-0 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-semibold truncate leading-tight ${isCurrent ? 'text-white font-bold' : 'text-slate-100'}`}>
                      {track.title}
                    </h4>
                    {/* Format Badge */}
                    <span
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider shrink-0"
                      style={{
                        backgroundColor: track.format === 'flac' ? 'rgba(56, 189, 248, 0.2)' : track.format === 'wav' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        color: track.format === 'flac' ? '#38bdf8' : track.format === 'wav' ? '#ec4899' : '#cbd5e1',
                      }}
                    >
                      {track.format}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {track.artist} {track.album ? `• ${track.album}` : ''}
                  </p>

                  {/* File Path if stored */}
                  {track.filePath && (
                    <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5" title={track.filePath}>
                      📁 {track.filePath}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                    <span>{formatTime(track.duration)}</span>
                    {track.bitrate && <span>• {track.bitrate}</span>}
                    {track.fileSize && <span>• {track.fileSize}</span>}
                    <span className="text-emerald-400/80 flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Офлайн
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onToggleFavorite(track.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-400 transition"
                    title={track.isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
                  >
                    <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  <button
                    onClick={() => setActiveMenuTrackId(activeMenuTrackId === track.id ? null : track.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* 3-dots Context Menu */}
                {activeMenuTrackId === track.id && (
                  <div className="absolute right-3 top-12 z-30 w-48 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-1.5 animate-fade-in text-xs space-y-0.5">
                    <button
                      onClick={() => {
                        onAddToPlaylistModal(track);
                        setActiveMenuTrackId(null);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-slate-200 flex items-center gap-2 transition"
                    >
                      <ListPlus className="w-3.5 h-3.5" />
                      Добавить в плейлист
                    </button>
                    <button
                      onClick={() => {
                        downloadM3UFile([track], `${track.artist} - ${track.title}`);
                        setActiveMenuTrackId(null);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-slate-200 flex items-center gap-2 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Экспорт в .M3U
                    </button>
                    <button
                      onClick={() => handleDelete(track.id)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-400 flex items-center gap-2 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Удалить из памяти
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
