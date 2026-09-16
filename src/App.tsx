import React, { useState, useEffect, useRef } from 'react';
import { 
  HardDrive, 
  Radio, 
  Server, 
  ListMusic, 
  Smartphone, 
  Sliders, 
  Palette, 
  Download, 
  Music, 
  Volume2, 
  CheckCircle2, 
  Share2 
} from 'lucide-react';
import { 
  Track, 
  Playlist, 
  EqualizerState, 
  ThemeSettings, 
  WidgetSettings, 
  YandexSettings 
} from './types';
import { 
  getAllTracks, 
  saveTrack, 
  getAllPlaylists, 
  savePlaylist, 
  getSetting, 
  saveSetting 
} from './services/db';
import { INITIAL_SAMPLE_TRACKS } from './services/sampleTracks';
import { audioEngine, DEFAULT_EQ_STATE } from './services/audioEngine';
import { usePWAInstall } from './hooks/usePWAInstall';

// Views and Modals
import { LibraryView } from './components/LibraryView';
import { YandexMusicView } from './components/YandexMusicView';
import { NasStorageView } from './components/NasStorageView';
import { PlaylistsView } from './components/PlaylistsView';
import { AndroidHomeScreen } from './components/AndroidHomeScreen';
import { MiniPlayer } from './components/MiniPlayer';
import { NowPlayingFull } from './components/NowPlayingFull';
import { EqualizerModal } from './components/EqualizerModal';
import { CustomizationModal } from './components/CustomizationModal';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';

type ActiveTab = 'library' | 'yandex' | 'nas' | 'playlists' | 'widget';

const DEFAULT_THEME: ThemeSettings = {
  themeMode: 'amoled',
  accentColor: '#38bdf8',
  fontFamily: 'roboto',
  fontSizeScale: 'normal',
  buttonStyle: 'rounded',
  controlLayout: 'standard',
  bgEffect: 'album-blur',
  buttonScale: 1,
};

const DEFAULT_WIDGET: WidgetSettings = {
  style: '4x2',
  transparency: 85,
  showWave: true,
  showCover: true,
};

const DEFAULT_YANDEX: YandexSettings = {
  isConnected: false,
  token: '',
  username: '',
  highQuality: true,
};

export default function App() {
  // Navigation & State
  const [activeTab, setActiveTab] = useState<ActiveTab>('library');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');

  // Modals
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);

  // Settings
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(DEFAULT_THEME);
  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings>(DEFAULT_WIDGET);
  const [eqState, setEqState] = useState<EqualizerState>(DEFAULT_EQ_STATE);
  const [yandexSettings, setYandexSettings] = useState<YandexSettings>(DEFAULT_YANDEX);

  // PWA Install prompt hook
  const { isInstallable, install } = usePWAInstall();

  // Load Initial Data from IndexedDB
  const refreshLibrary = async () => {
    let dbTracks = await getAllTracks();
    if (dbTracks.length === 0) {
      // Seed with initial high-res sample tracks (FLAC, WAV, MP3)
      for (const t of INITIAL_SAMPLE_TRACKS) {
        await saveTrack(t);
      }
      dbTracks = await getAllTracks();
    }
    setTracks(dbTracks);

    // Initial playlists
    let dbPlaylists = await getAllPlaylists();
    if (dbPlaylists.length === 0) {
      const defaultPlaylists: Playlist[] = [
        {
          id: 'pl-favorites',
          name: 'Избранное',
          description: 'Любимые треки из памяти и стриминга',
          trackIds: dbTracks.filter((t) => t.isFavorite).map((t) => t.id),
          createdAt: Date.now(),
          coverArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
        },
        {
          id: 'pl-hires',
          name: 'Hi-Res Lossless Collection',
          description: 'Студийные треки в форматах FLAC и WAV',
          trackIds: dbTracks.filter((t) => t.format === 'flac' || t.format === 'wav').map((t) => t.id),
          createdAt: Date.now(),
          isM3U: true,
          coverArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
        },
      ];
      for (const p of defaultPlaylists) {
        await savePlaylist(p);
      }
      dbPlaylists = await getAllPlaylists();
    }
    setPlaylists(dbPlaylists);

    // Initial track if none selected
    if (!currentTrack && dbTracks.length > 0) {
      setCurrentTrack(dbTracks[0]);
    }
  };

  useEffect(() => {
    // Load persisted settings
    (async () => {
      const savedTheme = await getSetting('themeSettings', DEFAULT_THEME);
      setThemeSettings(savedTheme);

      const savedWidget = await getSetting('widgetSettings', DEFAULT_WIDGET);
      setWidgetSettings(savedWidget);

      const savedEQ = await getSetting('eqState', DEFAULT_EQ_STATE);
      setEqState(savedEQ);
      audioEngine.applyEqualizerState(savedEQ);

      const savedYM = await getSetting('yandexSettings', DEFAULT_YANDEX);
      setYandexSettings(savedYM);

      await refreshLibrary();
    })();
  }, []);

  // Sync Audio Engine callbacks
  useEffect(() => {
    audioEngine.setOnTimeUpdate((time, dur) => {
      setCurrentTime(time);
      setDuration(dur);
    });

    audioEngine.setOnTrackEnded(() => {
      handleNextTrack();
    });
  }, [tracks, currentTrack, isShuffle, repeatMode]);

  // Android MediaSession API (Lockscreen & Notification controls)
  useEffect(() => {
    if (!currentTrack || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album || 'Aura Sound Android',
      artwork: [
        { src: currentTrack.coverArt, sizes: '96x96', type: 'image/png' },
        { src: currentTrack.coverArt, sizes: '256x256', type: 'image/png' },
        { src: currentTrack.coverArt, sizes: '512x512', type: 'image/png' },
      ],
    });

    navigator.mediaSession.setActionHandler('play', () => handleTogglePlay());
    navigator.mediaSession.setActionHandler('pause', () => handleTogglePlay());
    navigator.mediaSession.setActionHandler('previoustrack', () => handlePrevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => handleNextTrack());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        handleSeek(details.seekTime);
      }
    });
  }, [currentTrack]);

  // Playback Control Handlers
  const handleSelectTrack = async (track: Track) => {
    if (currentTrack?.id === track.id) {
      handleTogglePlay();
      return;
    }

    setCurrentTrack(track);
    await audioEngine.loadTrack(track.url);
    audioEngine.play();
    setIsPlaying(true);
  };

  const handleTogglePlay = () => {
    if (!currentTrack) {
      if (tracks.length > 0) handleSelectTrack(tracks[0]);
      return;
    }

    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.play();
      setIsPlaying(true);
    }
  };

  const handleNextTrack = () => {
    if (tracks.length === 0 || !currentTrack) return;

    if (repeatMode === 'one') {
      audioEngine.seek(0);
      audioEngine.play();
      setIsPlaying(true);
      return;
    }

    let nextIndex = 0;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } else {
      const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
      nextIndex = (currentIndex + 1) % tracks.length;
      if (nextIndex === 0 && repeatMode === 'off') {
        setIsPlaying(false);
        return;
      }
    }

    handleSelectTrack(tracks[nextIndex]);
  };

  const handlePrevTrack = () => {
    if (tracks.length === 0 || !currentTrack) return;

    if (currentTime > 4) {
      audioEngine.seek(0);
      return;
    }

    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    handleSelectTrack(tracks[prevIndex]);
  };

  const handleSeek = (seconds: number) => {
    audioEngine.seek(seconds);
    setCurrentTime(seconds);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    audioEngine.setVolume(vol);
  };

  const handleToggleFavorite = async (trackId: string) => {
    const updated = tracks.map((t) =>
      t.id === trackId ? { ...t, isFavorite: !t.isFavorite } : t
    );
    setTracks(updated);
    const track = updated.find((t) => t.id === trackId);
    if (track) await saveTrack(track);
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    const plTracks = tracks.filter((t) => playlist.trackIds.includes(t.id));
    if (plTracks.length > 0) {
      handleSelectTrack(plTracks[0]);
    }
  };

  // Persistent Settings Updates
  const handleUpdateTheme = async (settings: ThemeSettings) => {
    setThemeSettings(settings);
    await saveSetting('themeSettings', settings);
  };

  const handleUpdateWidget = async (settings: WidgetSettings) => {
    setWidgetSettings(settings);
    await saveSetting('widgetSettings', settings);
  };

  const handleUpdateEQ = async (state: EqualizerState) => {
    setEqState(state);
    await saveSetting('eqState', state);
  };

  const handleUpdateYandex = async (settings: YandexSettings) => {
    setYandexSettings(settings);
    await saveSetting('yandexSettings', settings);
  };

  const accent = themeSettings.accentColor;

  return (
    <div 
      className={`min-h-screen bg-slate-950 text-white ${themeSettings.fontFamily} flex flex-col justify-between selection:bg-cyan-500 selection:text-black`}
    >
      {/* Top Application Bar */}
      <header 
        id="app-header"
        className="sticky top-0 z-30 backdrop-blur-xl bg-slate-950/85 border-b border-white/10 px-4 py-3 sm:px-6"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Logo & Platform Badge */}
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-black shadow-lg shadow-cyan-500/20"
              style={{ backgroundColor: accent }}
            >
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Aura Sound
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/5">
                  Android PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Hi-Res плеер: Память • Яндекс • NAS • Эквалайзер
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* PWA Install Button */}
            {isInstallable && (
              <button
                onClick={install}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-black flex items-center gap-1.5 shadow-md animate-pulse transition active:scale-95"
                style={{ backgroundColor: accent }}
                title="Установить Aura Sound как приложение на телефон"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Установить PWA</span>
              </button>
            )}

            {/* Equalizer Quick Modal */}
            <button
              onClick={() => setIsEqualizerOpen(true)}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                eqState.enabled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200'
              }`}
              title="Открыть 10-полосный эквалайзер"
            >
              <Sliders className="w-4 h-4" />
              <span className="hidden sm:inline font-mono">EQ: {eqState.preset}</span>
            </button>

            {/* Themes & Customization Modal */}
            <button
              onClick={() => setIsCustomizationOpen(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 flex items-center gap-1.5 transition"
              title="Кастомизация кнопок, цветов и шрифтов"
            >
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Тема</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 pt-4 pb-28">
        {/* Navigation Tabs Bar */}
        <nav 
          id="main-tabs"
          className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-3 mb-3 border-b border-white/5 no-scrollbar"
        >
          {[
            { id: 'library' as ActiveTab, label: 'Память телефона', icon: HardDrive, count: tracks.length },
            { id: 'yandex' as ActiveTab, label: 'Яндекс Музыка', icon: Radio, count: 'HQ' },
            { id: 'nas' as ActiveTab, label: 'NAS Хранилище', icon: Server, count: 'WebDAV' },
            { id: 'playlists' as ActiveTab, label: 'Списки M3U', icon: ListMusic, count: playlists.length },
            { id: 'widget' as ActiveTab, label: 'Виджет на рабочий стол', icon: Smartphone, count: 'Android' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 transition select-none ${
                  isActive
                    ? 'text-black shadow-lg shadow-cyan-500/10'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                }`}
                style={{
                  backgroundColor: isActive ? accent : undefined,
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span 
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Tab Views */}
        {activeTab === 'library' && (
          <LibraryView
            tracks={tracks}
            onSelectTrack={handleSelectTrack}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onRefreshTracks={refreshLibrary}
            themeSettings={themeSettings}
            onToggleFavorite={handleToggleFavorite}
            onAddToPlaylistModal={(track) => setPlaylistModalTrack(track)}
          />
        )}

        {activeTab === 'yandex' && (
          <YandexMusicView
            onSelectTrack={handleSelectTrack}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            themeSettings={themeSettings}
            yandexSettings={yandexSettings}
            onUpdateYandexSettings={handleUpdateYandex}
            onRefreshTracks={refreshLibrary}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {activeTab === 'nas' && (
          <NasStorageView
            onSelectTrack={handleSelectTrack}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            themeSettings={themeSettings}
            onRefreshTracks={refreshLibrary}
          />
        )}

        {activeTab === 'playlists' && (
          <PlaylistsView
            playlists={playlists}
            tracks={tracks}
            onSelectTrack={handleSelectTrack}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            themeSettings={themeSettings}
            onRefreshPlaylists={refreshLibrary}
            onPlayPlaylist={handlePlayPlaylist}
          />
        )}

        {activeTab === 'widget' && (
          <AndroidHomeScreen
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onTogglePlay={handleTogglePlay}
            onNext={handleNextTrack}
            onPrev={handlePrevTrack}
            onToggleFavorite={handleToggleFavorite}
            themeSettings={themeSettings}
            widgetSettings={widgetSettings}
            onUpdateWidgetSettings={handleUpdateWidget}
            onReturnToPlayer={() => setActiveTab('library')}
          />
        )}
      </main>

      {/* Floating Bottom Mini Player */}
      {currentTrack && activeTab !== 'widget' && (
        <MiniPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onTogglePlay={handleTogglePlay}
          onNext={handleNextTrack}
          onOpenFull={() => setIsFullPlayerOpen(true)}
          themeSettings={themeSettings}
        />
      )}

      {/* Fullscreen Player View */}
      <NowPlayingFull
        isOpen={isFullPlayerOpen}
        onClose={() => setIsFullPlayerOpen(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onTogglePlay={handleTogglePlay}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        onSeek={handleSeek}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        isShuffle={isShuffle}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        repeatMode={repeatMode}
        onToggleRepeat={() => {
          if (repeatMode === 'off') setRepeatMode('all');
          else if (repeatMode === 'all') setRepeatMode('one');
          else setRepeatMode('off');
        }}
        onToggleFavorite={handleToggleFavorite}
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
        themeSettings={themeSettings}
      />

      {/* 10-Band Equalizer Modal */}
      <EqualizerModal
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
        eqState={eqState}
        onUpdateEQ={handleUpdateEQ}
        themeSettings={themeSettings}
        isPlaying={isPlaying}
      />

      {/* Customization Modal: Themes, Fonts, Playback Buttons */}
      <CustomizationModal
        isOpen={isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
        themeSettings={themeSettings}
        onUpdateTheme={(updated) => handleUpdateTheme({ ...themeSettings, ...updated })}
      />

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        isOpen={!!playlistModalTrack}
        onClose={() => setPlaylistModalTrack(null)}
        track={playlistModalTrack}
        playlists={playlists}
        onRefreshPlaylists={refreshLibrary}
        themeSettings={themeSettings}
      />
    </div>
  );
}
