import React, { useState } from 'react';
import { X, Plus, Check, ListMusic } from 'lucide-react';
import { Playlist, Track, ThemeSettings } from '../types';
import { savePlaylist } from '../services/db';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  playlists: Playlist[];
  onRefreshPlaylists: () => void;
  themeSettings: ThemeSettings;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  track,
  playlists,
  onRefreshPlaylists,
  themeSettings,
}) => {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addedPlaylistId, setAddedPlaylistId] = useState<string | null>(null);

  if (!isOpen || !track) return null;

  const accent = themeSettings.accentColor;

  const handleToggleTrackInPlaylist = async (playlist: Playlist) => {
    let updatedTrackIds: string[];
    if (playlist.trackIds.includes(track.id)) {
      updatedTrackIds = playlist.trackIds.filter((id) => id !== track.id);
    } else {
      updatedTrackIds = [...playlist.trackIds, track.id];
    }

    const updatedPl: Playlist = {
      ...playlist,
      trackIds: updatedTrackIds,
    };

    await savePlaylist(updatedPl);
    setAddedPlaylistId(playlist.id);
    setTimeout(() => setAddedPlaylistId(null), 1500);
    onRefreshPlaylists();
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) return;

    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      name: newPlaylistName.trim(),
      trackIds: [track.id],
      createdAt: Date.now(),
      coverArt: track.coverArt,
    };

    await savePlaylist(newPl);
    setNewPlaylistName('');
    setAddedPlaylistId(newPl.id);
    setTimeout(() => {
      setAddedPlaylistId(null);
      onClose();
    }, 1000);
    onRefreshPlaylists();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5" style={{ color: accent }} />
            <h3 className="text-base font-bold text-white">Добавить в плейлист</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected track preview */}
        <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
          <img
            src={track.coverArt}
            alt={track.title}
            className="w-10 h-10 rounded-xl object-cover shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-white truncate">{track.title}</h4>
            <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
          </div>
        </div>

        {/* Playlists list */}
        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
          {playlists.map((pl) => {
            const hasTrack = pl.trackIds.includes(track.id);
            const isJustAdded = addedPlaylistId === pl.id;

            return (
              <button
                key={pl.id}
                onClick={() => handleToggleTrackInPlaylist(pl)}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                  hasTrack
                    ? 'bg-white/10 border-white/30 text-white'
                    : 'bg-white/5 border-white/5 hover:bg-white/8 text-slate-300'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="text-xs font-semibold truncate">{pl.name}</div>
                  <div className="text-[10px] text-slate-400">{pl.trackIds.length} треков</div>
                </div>
                {hasTrack && (
                  <Check className="w-4 h-4 shrink-0" style={{ color: accent }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Quick create new */}
        <div className="pt-2 border-t border-white/10">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Создать новый плейлист..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
            />
            <button
              onClick={handleCreateAndAdd}
              className="px-3 py-2 rounded-xl text-xs font-bold text-black flex items-center gap-1 shadow transition active:scale-95"
              style={{ backgroundColor: accent }}
            >
              <Plus className="w-3.5 h-3.5" />
              Добавить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
