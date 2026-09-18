import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Play, 
  Music, 
  ChevronRight, 
  FolderSearch, 
  HardDrive, 
  ChevronDown, 
  Sparkles,
  Disc3
} from 'lucide-react';
import { Track, ThemeSettings } from '../types';

interface ArtistsViewProps {
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPlayArtist: (artistTracks: Track[]) => void;
  themeSettings: ThemeSettings;
  onOpenScanner: () => void;
}

export const ArtistsView: React.FC<ArtistsViewProps> = ({
  tracks,
  onSelectTrack,
  currentTrack,
  isPlaying,
  onTogglePlay,
  onPlayArtist,
  themeSettings,
  onOpenScanner,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedArtist, setExpandedArtist] = useState<string | null>(null);

  const accent = themeSettings.accentColor;

  // Group tracks by artist
  const artistMap = React.useMemo(() => {
    const map = new Map<string, Track[]>();

    for (const t of tracks) {
      const artistName = (t.artist || 'Неизвестный исполнитель').trim();
      const existing = map.get(artistName) || [];
      existing.push(t);
      map.set(artistName, existing);
    }

    return map;
  }, [tracks]);

  // Sort artists alphabetically
  const artistList = React.useMemo(() => {
    const list = Array.from(artistMap.entries()).map(([artist, artistTracks]) => ({
      artist,
      tracks: artistTracks,
      trackCount: artistTracks.length,
      formats: Array.from(new Set(artistTracks.map((t) => t.format.toUpperCase()))),
    }));

    list.sort((a, b) => a.artist.localeCompare(b.artist, 'ru'));
    return list;
  }, [artistMap]);

  const filteredArtists = artistList.filter((item) =>
    item.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/50 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-black shadow-lg"
            style={{ backgroundColor: accent }}
          >
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white leading-tight">Исполнители</h2>
            <p className="text-xs text-slate-400">
              {artistList.length} артистов • автоматический парсинг из названий файлов
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск исполнителя..."
            className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>
      </div>

      {/* Empty State */}
      {artistList.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/30 rounded-3xl border border-white/5">
          <div 
            className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-black shadow-xl"
            style={{ backgroundColor: accent }}
          >
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Медиатека пуста</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
            В плеере пока нет музыки. Отсканируйте память устройства, чтобы автоматически сгруппировать треки по исполнителям.
          </p>
          <button
            onClick={onOpenScanner}
            className="px-6 py-3 rounded-2xl text-black font-bold text-xs inline-flex items-center gap-2 shadow-xl transition hover:scale-105 active:scale-95"
            style={{ backgroundColor: accent }}
          >
            <FolderSearch className="w-4 h-4" />
            <span>Сканировать память устройства</span>
          </button>
        </div>
      ) : filteredArtists.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs bg-slate-900/20 rounded-2xl border border-white/5">
          Исполнитель «{searchQuery}» не найден
        </div>
      ) : (
        /* Artist list */
        <div className="space-y-2.5">
          {filteredArtists.map((item) => {
            const isExpanded = expandedArtist === item.artist;
            const initials = item.artist.slice(0, 2).toUpperCase();

            return (
              <div
                key={item.artist}
                className="bg-slate-900/60 border border-white/5 hover:border-white/15 rounded-2xl overflow-hidden transition backdrop-blur-sm"
              >
                {/* Artist Header Row */}
                <div 
                  onClick={() => setExpandedArtist(isExpanded ? null : item.artist)}
                  className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar with initials or gradient */}
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-black shadow"
                      style={{ backgroundColor: accent }}
                    >
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate hover:underline">
                        {item.artist}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{item.trackCount} {item.trackCount === 1 ? 'трек' : item.trackCount < 5 ? 'трека' : 'треков'}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          {item.formats.map((f) => (
                            <span 
                              key={f} 
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Play All Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayArtist(item.tracks);
                      }}
                      className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                      title={`Включить все треки: ${item.artist}`}
                    >
                      <Play className="w-4 h-4 ml-0.5" />
                    </button>

                    <div className="text-slate-500">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Tracks List */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-slate-950/40 p-2 space-y-1">
                    {item.tracks.map((t, idx) => {
                      const isCurrent = currentTrack?.id === t.id;

                      return (
                        <div
                          key={t.id}
                          onClick={() => onSelectTrack(t)}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition text-xs ${
                            isCurrent
                              ? 'bg-white/10 text-white font-medium shadow-inner'
                              : 'text-slate-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 text-center text-[10px] font-mono text-slate-500">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className={`truncate ${isCurrent ? 'font-bold text-cyan-400' : ''}`}>
                                {t.title}
                              </div>
                              {t.filePath && (
                                <div className="text-[10px] text-slate-500 truncate font-mono">
                                  {t.filePath}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 uppercase">
                              {t.format}
                            </span>
                            <span className="font-mono text-slate-400">
                              {formatDuration(t.duration)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
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
