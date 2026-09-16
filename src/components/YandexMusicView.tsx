import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Play, 
  Pause, 
  Download, 
  Radio, 
  Flame, 
  Music, 
  Key, 
  CheckCircle2, 
  Heart,
  TrendingUp,
  Disc3,
  ExternalLink
} from 'lucide-react';
import { Track, ThemeSettings, YandexSettings } from '../types';
import { YANDEX_CHARTS, YANDEX_CATEGORIES, searchYandexMusic } from '../services/yandexMusic';
import { saveTrack } from '../services/db';

interface YandexMusicViewProps {
  onSelectTrack: (track: Track) => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  themeSettings: ThemeSettings;
  yandexSettings: YandexSettings;
  onUpdateYandexSettings: (settings: YandexSettings) => void;
  onRefreshTracks: () => void;
  onToggleFavorite: (trackId: string) => void;
}

export const YandexMusicView: React.FC<YandexMusicViewProps> = ({
  onSelectTrack,
  currentTrack,
  isPlaying,
  themeSettings,
  yandexSettings,
  onUpdateYandexSettings,
  onRefreshTracks,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState(yandexSettings.token);
  const [savedSuccessTrackId, setSavedSuccessTrackId] = useState<string | null>(null);

  const ymYellow = '#eab308'; // Yandex signature amber

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults(null);
      return;
    }
    const results = await searchYandexMusic(q);
    setSearchResults(results);
  };

  const handleSaveToDeviceMemory = async (track: Track) => {
    // Clone track to local source
    const localCopy: Track = {
      ...track,
      id: `saved-ym-${Date.now()}-${track.id}`,
      source: 'local',
      album: `${track.album} (Яндекс Музыка)`,
      dateAdded: Date.now(),
    };
    await saveTrack(localCopy);
    setSavedSuccessTrackId(track.id);
    setTimeout(() => setSavedSuccessTrackId(null), 2500);
    onRefreshTracks();
  };

  const handleConnectToken = () => {
    onUpdateYandexSettings({
      ...yandexSettings,
      token: tokenInput,
      isConnected: true,
      username: 'yandex_user_audio',
    });
    setShowTokenModal(false);
  };

  const tracksToDisplay = searchResults !== null 
    ? searchResults 
    : selectedCategory === 'all' 
      ? YANDEX_CHARTS 
      : YANDEX_CATEGORIES.find(c => c.id === selectedCategory)?.tracks || YANDEX_CHARTS;

  return (
    <div className="space-y-4 pb-24">
      {/* Yandex Music Header Banner */}
      <div 
        id="yandex-header-card"
        className="p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-950/80 via-slate-900 to-black border border-amber-500/20 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-amber-500 flex items-center justify-center text-black font-black text-2xl shadow-lg shadow-amber-500/30">
              Я
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">Яндекс Музыка</h2>
                {yandexSettings.isConnected ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    Подключено HQ
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                    Демо-каталог
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Потоковое вещание, чарты, «Моя волна» и загрузка в офлайн-память телефона
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTokenModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition active:scale-95"
            >
              <Key className="w-3.5 h-3.5" />
              {yandexSettings.isConnected ? 'Аккаунт Яндекса' : 'Подключить токен'}
            </button>
          </div>
        </div>

        {/* «Моя Волна» Interactive Card */}
        <div 
          onClick={() => onSelectTrack(YANDEX_CHARTS[1])}
          className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-white/10 flex items-center justify-between cursor-pointer hover:border-amber-400/40 transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-pink-500 flex items-center justify-center text-white shadow-lg animate-pulse">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                  Запустить «Мою волну»
                </span>
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500 text-black font-extrabold">
                  AI Vibe
                </span>
              </div>
              <p className="text-xs text-slate-300">Умный поток музыки, подстраивающийся под ваши предпочтения</p>
            </div>
          </div>

          <div className="w-9 h-9 rounded-full bg-white/10 group-hover:bg-amber-400 group-hover:text-black flex items-center justify-center transition">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Искать треки, альбомы и артистов в Яндекс Музыке..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400/50 transition"
        />
      </div>

      {/* Categories Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition ${
            selectedCategory === 'all'
              ? 'bg-amber-400 text-black font-bold shadow-md'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
          }`}
        >
          Все треки
        </button>
        {YANDEX_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition ${
              selectedCategory === c.id
                ? 'bg-amber-400 text-black font-bold shadow-md'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            {c.title}
          </button>
        ))}
      </div>

      {/* Tracks Grid/List */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 py-1 font-semibold uppercase tracking-wider">
          <span>{searchResults ? `Результаты поиска (${tracksToDisplay.length})` : 'Популярное в Яндекс Музыке'}</span>
          <span>Качество: 320 kbps HQ</span>
        </div>

        {tracksToDisplay.map((track) => {
          const isCurrent = currentTrack?.id === track.id;
          const isPlayingThis = isCurrent && isPlaying;
          const isSaved = savedSuccessTrackId === track.id;

          return (
            <div
              key={track.id}
              className={`group p-2.5 sm:p-3 rounded-2xl border transition flex items-center gap-3 select-none ${
                isCurrent
                  ? 'bg-amber-500/15 border-amber-500/40 shadow-lg'
                  : 'bg-white/5 border-white/5 hover:bg-white/8 hover:border-white/10'
              }`}
            >
              {/* Cover Art */}
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

              {/* Info */}
              <div 
                onClick={() => onSelectTrack(track)}
                className="flex-1 min-w-0 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <h4 className={`text-sm font-semibold truncate leading-tight ${isCurrent ? 'text-amber-300 font-bold' : 'text-slate-100'}`}>
                    {track.title}
                  </h4>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300">
                    YM HQ
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {track.artist} • {track.album}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                  <span>• {track.bitrate}</span>
                  <span>• {track.format.toUpperCase()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onToggleFavorite(track.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-400 transition"
                  title="В избранное"
                >
                  <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>

                {/* Save to Phone Memory button */}
                <button
                  onClick={() => handleSaveToDeviceMemory(track)}
                  disabled={isSaved}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                    isSaved
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/10 hover:bg-amber-400 hover:text-black text-slate-200'
                  }`}
                  title="Сохранить в память телефона для офлайн прослушивания"
                >
                  {isSaved ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>В памяти</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">В память</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Yandex Token Auth Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-black font-black text-xl">
                Я
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Интеграция с Яндекс Музыкой</h3>
                <p className="text-xs text-slate-400">Подключение официального аккаунта</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-white">Как получить OAuth токен Яндекс Музыки:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
                <li>Войдите в свой аккаунт на <code className="text-amber-300">music.yandex.ru</code>.</li>
                <li>Получите токен доступа приложения через Яндекс OAuth API.</li>
                <li>Вставьте токен ниже для синхронизации вашей фонотеки и плейлистов.</li>
              </ol>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                OAuth токен (Yandex Music Token):
              </label>
              <input
                type="text"
                placeholder="y0_AgAAAA..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowTokenModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 text-slate-300 hover:bg-white/15 transition"
              >
                Отмена
              </button>
              <button
                onClick={handleConnectToken}
                className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 shadow-lg shadow-amber-500/20 transition active:scale-95"
              >
                Сохранить и подключить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
