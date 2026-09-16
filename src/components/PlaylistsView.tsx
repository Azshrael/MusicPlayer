import React, { useState, useRef } from 'react';
import { 
  ListMusic, 
  Plus, 
  FolderDown, 
  Download, 
  Play, 
  Trash2, 
  Music, 
  Share2, 
  Clock, 
  Check, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Playlist, Track, ThemeSettings } from '../types';
import { savePlaylist, deletePlaylist } from '../services/db';
import { parseM3U, downloadM3UFile } from '../services/m3uParser';

interface PlaylistsViewProps {
  playlists: Playlist[];
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  themeSettings: ThemeSettings;
  onRefreshPlaylists: () => void;
  onPlayPlaylist: (playlist: Playlist) => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists,
  tracks,
  onSelectTrack,
  currentTrack,
  isPlaying,
  themeSettings,
  onRefreshPlaylists,
  onPlayPlaylist,
}) => {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const m3uFileInputRef = useRef<HTMLInputElement | null>(null);

  const accent = themeSettings.accentColor;

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      name: newPlaylistName.trim(),
      description: newPlaylistDesc.trim(),
      trackIds: [],
      createdAt: Date.now(),
      coverArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    };

    await savePlaylist(newPl);
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setShowCreateModal(false);
    onRefreshPlaylists();
  };

  const handleM3UFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const entries = parseM3U(text);
    const plName = file.name.replace(/\.[^/.]+$/, '');

    // Map entries to track ids or create tracks
    const plTracks: Track[] = entries.map((entry, idx) => ({
      id: `m3u-track-${Date.now()}-${idx}`,
      title: entry.title,
      artist: entry.artist,
      album: plName,
      duration: entry.duration || 195,
      url: entry.uri.startsWith('http') ? entry.uri : 'https://cdn.freesound.org/previews/612/612610_5674468-lq.mp3',
      coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      source: 'local',
      format: (entry.format as any) || 'mp3',
      bitrate: '320 kbps',
      dateAdded: Date.now(),
      isFavorite: false,
    }));

    const newPl: Playlist = {
      id: `m3u-pl-${Date.now()}`,
      name: plName,
      description: `Импортировано из M3U списка (${entries.length} треков)`,
      trackIds: plTracks.map((t) => t.id),
      createdAt: Date.now(),
      isM3U: true,
      coverArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    };

    await savePlaylist(newPl);
    onRefreshPlaylists();
    if (m3uFileInputRef.current) m3uFileInputRef.current.value = '';
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    await deletePlaylist(playlistId);
    if (selectedPlaylist?.id === playlistId) {
      setSelectedPlaylist(null);
    }
    onRefreshPlaylists();
  };

  const handleExportM3U = (playlist: Playlist) => {
    const plTracks = tracks.filter((t) => playlist.trackIds.includes(t.id));
    downloadM3UFile(plTracks.length > 0 ? plTracks : tracks, playlist.name);
  };

  // Get tracks for active playlist view
  const activePlaylistTracks = selectedPlaylist
    ? tracks.filter((t) => selectedPlaylist.trackIds.includes(t.id))
    : [];

  return (
    <div className="space-y-4 pb-24">
      <input
        type="file"
        ref={m3uFileInputRef}
        onChange={handleM3UFileImport}
        accept=".m3u,.m3u8"
        className="hidden"
      />

      {/* Header Banner */}
      <div 
        id="playlists-banner"
        className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-white/10 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: accent }} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-black font-bold shadow-lg" style={{ backgroundColor: accent }}>
              <ListMusic className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Плейлисты и Списки M3U</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  M3U / M3U8
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Создание списков, экспорт в файл .m3u и импорт готовых коллекций
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-black flex items-center gap-1.5 shadow-md transition active:scale-95"
              style={{ backgroundColor: accent }}
            >
              <Plus className="w-3.5 h-3.5" />
              Новый плейлист
            </button>
            <button
              onClick={() => m3uFileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 flex items-center gap-1.5 transition"
            >
              <FolderDown className="w-3.5 h-3.5" />
              Импорт .M3U
            </button>
          </div>
        </div>
      </div>

      {/* Selected Playlist Modal/View */}
      {selectedPlaylist ? (
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedPlaylist(null)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              ← Все плейлисты
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportM3U(selectedPlaylist)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Экспорт в .M3U
              </button>
              <button
                onClick={() => onPlayPlaylist(selectedPlaylist)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-black flex items-center gap-1.5 shadow-md transition"
                style={{ backgroundColor: accent }}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Слушать всё
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <img
              src={selectedPlaylist.coverArt || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80'}
              alt={selectedPlaylist.name}
              className="w-16 h-16 rounded-2xl object-cover shadow-md"
            />
            <div>
              <h3 className="text-lg font-bold text-white">{selectedPlaylist.name}</h3>
              <p className="text-xs text-slate-400">{selectedPlaylist.description || `${selectedPlaylist.trackIds.length} треков`}</p>
              <span className="text-[10px] font-mono text-emerald-400 mt-1 block">
                Формат M3U совместим с любыми плеерами Android
              </span>
            </div>
          </div>

          {/* Tracks inside playlist */}
          <div className="space-y-1.5 pt-2">
            {activePlaylistTracks.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white/5 text-center text-slate-400 text-xs">
                В этом плейлисте пока нет добавленных треков. Вы можете добавлять песни из вкладки «Память».
              </div>
            ) : (
              activePlaylistTracks.map((t, idx) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTrack(t)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between cursor-pointer transition select-none"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xs font-mono text-slate-500 w-4">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{t.title}</div>
                      <div className="text-xs text-slate-400 truncate">{t.artist}</div>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    {Math.floor(t.duration / 60)}:{(t.duration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Playlists Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              className="p-4 rounded-3xl bg-slate-900/80 border border-white/5 hover:border-white/15 transition flex flex-col justify-between shadow-lg group relative overflow-hidden"
            >
              <div className="flex items-center gap-3.5">
                <img
                  src={pl.coverArt || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80'}
                  alt={pl.name}
                  className="w-14 h-14 rounded-2xl object-cover shrink-0 shadow-md group-hover:scale-105 transition"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition">
                      {pl.name}
                    </h3>
                    {pl.isM3U && (
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase bg-white/10 text-slate-300">
                        M3U
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {pl.description || `${pl.trackIds.length} треков`}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    {pl.trackIds.length} аудиофайлов
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                <button
                  onClick={() => setSelectedPlaylist(pl)}
                  className="text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  Открыть треки →
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleExportM3U(pl)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition"
                    title="Экспортировать в файл .M3U"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onPlayPlaylist(pl)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-black font-bold shadow transition active:scale-95"
                    style={{ backgroundColor: accent }}
                    title="Воспроизвести плейлист"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePlaylist(pl.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                    title="Удалить плейлист"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Создать новый плейлист</h3>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Название:</label>
              <input
                type="text"
                placeholder="Мой любимый рок, Hi-Res FLAC..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Описание (опционально):</label>
              <input
                type="text"
                placeholder="Для поездок в машине, тренировок..."
                value={newPlaylistDesc}
                onChange={(e) => setNewPlaylistDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-slate-300 hover:bg-white/15 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleCreatePlaylist}
                className="px-4 py-2 rounded-xl text-xs font-bold text-black shadow-md transition active:scale-95"
                style={{ backgroundColor: accent }}
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
