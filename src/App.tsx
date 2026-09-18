import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  Music, 
  Sliders, 
  Palette, 
  FolderSearch, 
  ArrowLeft, 
  AlertCircle, 
  ListMusic, 
  Users, 
  Music2,
  HardDrive
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
  deleteTrack,
  getAudioBlob,
  getAllPlaylists, 
  savePlaylist, 
  getSetting, 
  saveSetting 
} from './services/db';
import { audioEngine, DEFAULT_EQ_STATE } from './services/audioEngine';
import { 
  verifyAndCleanTracks, 
  removeObsoleteTrack 
} from './services/phoneStorageScanner';

// Views and Modals
import { LibraryView } from './components/LibraryView';
import { PlaylistsView } from './components/PlaylistsView';
import { ArtistsView } from './components/ArtistsView';
import { YandexMusicView } from './components/YandexMusicView';
import { NasStorageView } from './components/NasStorageView';
import { AndroidHomeScreen } from './components/AndroidHomeScreen';
import { MiniPlayer } from './components/MiniPlayer';
import { NowPlayingFull } from './components/NowPlayingFull';
import { EqualizerModal } from './components/EqualizerModal';
import { CustomizationModal } from './components/CustomizationModal';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { NavigationMenu, MusicSource } from './components/NavigationMenu';
import { StorageScannerModal } from './components/StorageScannerModal';

type MainScreenTab = 'tracks' | 'playlists' | 'artists';

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
  // Navigation
  const [activeSource, setActiveSource] = useState<MusicSource>('local');
  const [mainScreenTab, setMainScreenTab] = useState<MainScreenTab>('tracks');

  // Core Audio Data (Starts 100% clean and empty without generated sample filler)
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');

  // Modals & Drawers
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Settings
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(DEFAULT_THEME);
  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings>(DEFAULT_WIDGET);
  const [eqState, setEqState] = useState<EqualizerState>(DEFAULT_EQ_STATE);
  const [yandexSettings, setYandexSettings] = useState<YandexSettings>(DEFAULT_YANDEX);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Load Real User Library (no auto-seeding mock tracks)
  const refreshLibrary = async () => {
    const dbTracks = await getAllTracks();
    // Filter out any legacy demo filler tracks if present from previous sessions
    const realTracks = dbTracks.filter((t) => t.source !== 'demo');
    if (realTracks.length !== dbTracks.length) {
      for (const t of dbTracks) {
        if (t.source === 'demo') await deleteTrack(t.id);
      }
    }
    setTracks(realTracks);

    const dbPlaylists = await getAllPlaylists();
    setPlaylists(dbPlaylists);

    // If current track is no longer in tracks, reset it
    if (currentTrack && !realTracks.some((t) => t.id === currentTrack.id)) {
      setCurrentTrack(realTracks.length > 0 ? realTracks[0] : null);
    }
  };

  useEffect(() => {
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
      if (dur > 0) setDuration(dur);
    });

    audioEngine.setOnTrackEnded(() => {
      handleNextTrack();
    });

    // Handle track playback error (e.g. file was moved or deleted from phone storage)
    audioEngine.setOnTrackError(async () => {
      if (currentTrack && currentTrack.source === 'local') {
        const deadTrack = currentTrack;
        await removeObsoleteTrack(deadTrack.id);
        await refreshLibrary();
        showToast(`Файл «${deadTrack.filePath || deadTrack.title}» удален или перемещен. Неактуальный путь удален.`);
        handleNextTrack();
      }
    });
  }, [currentTrack, tracks, isShuffle, repeatMode]);

  // MediaSession API integration for Android lockscreen & notification shade
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album || 'Aura Sound',
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

  // Playback Handlers
  const handleSelectTrack = async (track: Track) => {
    if (currentTrack?.id === track.id) {
      handleTogglePlay();
      return;
    }

    let audioUrl = track.url;

    // Local track: check if file / blob is accessible
    if (track.source === 'local') {
      const blob = await getAudioBlob(track.id);
      if (!blob || blob.size === 0) {
        // Obsolete / deleted file: clean from database immediately
        console.warn(`File missing for track ${track.title} at path ${track.filePath}`);
        await removeObsoleteTrack(track.id);
        await refreshLibrary();
        showToast(`Файл не найден по пути: ${track.filePath || track.title}. Неактуальный путь удален.`);
        return;
      }
      audioUrl = URL.createObjectURL(blob);
    }

    setCurrentTrack(track);
    try {
      await audioEngine.loadTrack(audioUrl);
      await audioEngine.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Audio play error:', err);
      if (track.source === 'local') {
        await removeObsoleteTrack(track.id);
        await refreshLibrary();
        showToast(`Не удалось открыть файл «${track.title}». Неактуальный путь удален.`);
      }
    }
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

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    audioEngine.setVolume(newVol);
  };

  const handleToggleFavorite = async (trackId: string) => {
    const updated = tracks.map((t) => (t.id === trackId ? { ...t, isFavorite: !t.isFavorite } : t));
    setTracks(updated);
    const target = updated.find((t) => t.id === trackId);
    if (target) {
      await saveTrack(target);
    }
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    const plTracks = tracks.filter((t) => playlist.trackIds.includes(t.id));
    if (plTracks.length > 0) {
      handleSelectTrack(plTracks[0]);
    }
  };

  const handlePlayArtist = (artistTracks: Track[]) => {
    if (artistTracks.length > 0) {
      handleSelectTrack(artistTracks[0]);
    }
  };

  // Verify paths & clean obsolete/moved tracks
  const handleVerifyPaths = async () => {
    const { removedCount } = await verifyAndCleanTracks(tracks);
    await refreshLibrary();
    if (removedCount > 0) {
      showToast(`Удалено ${removedCount} неактуальных путей: файлы были перемещены или удалены.`);
    } else {
      showToast('Все пути к файлам проверены и актуальны.');
    }
  };

  // Settings Handlers
  const handleUpdateTheme = async (newTheme: ThemeSettings) => {
    setThemeSettings(newTheme);
    await saveSetting('themeSettings', newTheme);
  };

  const handleUpdateWidget = async (newWidget: WidgetSettings) => {
    setWidgetSettings(newWidget);
    await saveSetting('widgetSettings', newWidget);
  };

  const handleUpdateEQ = async (newEQ: EqualizerState) => {
    setEqState(newEQ);
    audioEngine.applyEqualizerState(newEQ);
    await saveSetting('eqState', newEQ);
  };

  const handleUpdateYandex = async (newYM: YandexSettings) => {
    setYandexSettings(newYM);
    await saveSetting('yandexSettings', newYM);
  };

  const accent = themeSettings.accentColor;

  return (
    <div 
      className={`min-h-screen flex flex-col font-${themeSettings.fontFamily} bg-black text-slate-100 selection:bg-cyan-500 selection:text-black`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-white/20 text-white text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header 
        id="app-header"
        className="sticky top-0 z-30 backdrop-blur-xl bg-slate-950/85 border-b border-white/10 px-4 py-3 sm:px-6"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Left: Hamburger Menu Button & App Brand */}
          <div className="flex items-center gap-3">
            {/* Top-Left Menu Button (Requirement 5) */}
            <button
              id="btn-nav-menu"
              onClick={() => setIsNavMenuOpen(true)}
              className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white transition border border-white/5"
              title="Открыть меню разделов и настроек"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                  Aura Sound
                </h1>
                {activeSource !== 'local' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-cyan-300 border border-white/5 uppercase">
                    {activeSource === 'yandex' ? 'Яндекс' : activeSource === 'nas' ? 'NAS' : 'Виджет'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {activeSource === 'local' 
                  ? 'Внутренняя память телефона • Hi-Res 24-bit' 
                  : activeSource === 'yandex'
                  ? 'Яндекс Музыка'
                  : activeSource === 'nas'
                  ? 'NAS Сетевое хранилище'
                  : 'Виджет рабочего стола Android'}
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Scan Memory Button */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold text-black flex items-center gap-1.5 shadow-md transition hover:scale-105 active:scale-95"
              style={{ backgroundColor: accent }}
              title="Сканировать память телефона"
            >
              <FolderSearch className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Сканировать</span>
            </button>

            {/* Quick Equalizer Button */}
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
              <span className="hidden sm:inline font-mono">EQ</span>
            </button>

            {/* Quick Theme Button */}
            <button
              onClick={() => setIsCustomizationOpen(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 flex items-center gap-1.5 transition"
              title="Кастомизация"
            >
              <Palette className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 pt-4 pb-28">
        {/* If user switched to another source in menu (Yandex, NAS, Widget), show return banner */}
        {activeSource !== 'local' && (
          <button
            onClick={() => setActiveSource('local')}
            className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-slate-200 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Вернуться на главный экран (Внутренняя память)</span>
          </button>
        )}

        {/* MAIN SCREEN (Внутренняя память): Exactly 3 tabs as requested in Requirement 5 */}
        {activeSource === 'local' && (
          <div className="space-y-4">
            {/* 3 Main Screen Tabs */}
            <nav 
              id="main-screen-tabs"
              className="grid grid-cols-3 gap-2 p-1.5 bg-slate-900/60 rounded-2xl border border-white/5 backdrop-blur-md"
            >
              <button
                onClick={() => setMainScreenTab('tracks')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  mainScreenTab === 'tracks'
                    ? 'text-black shadow-lg shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: mainScreenTab === 'tracks' ? accent : undefined,
                }}
              >
                <Music2 className="w-3.5 h-3.5" />
                <span>Треки</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  mainScreenTab === 'tracks' ? 'bg-black/20 text-black' : 'bg-white/10 text-slate-400'
                }`}>
                  {tracks.length}
                </span>
              </button>

              <button
                onClick={() => setMainScreenTab('playlists')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  mainScreenTab === 'playlists'
                    ? 'text-black shadow-lg shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: mainScreenTab === 'playlists' ? accent : undefined,
                }}
              >
                <ListMusic className="w-3.5 h-3.5" />
                <span>Плейлисты</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  mainScreenTab === 'playlists' ? 'bg-black/20 text-black' : 'bg-white/10 text-slate-400'
                }`}>
                  {playlists.length}
                </span>
              </button>

              <button
                onClick={() => setMainScreenTab('artists')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  mainScreenTab === 'artists'
                    ? 'text-black shadow-lg shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: mainScreenTab === 'artists' ? accent : undefined,
                }}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Исполнители</span>
              </button>
            </nav>

            {/* View 1: Список треков */}
            {mainScreenTab === 'tracks' && (
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
                onOpenScanner={() => setIsScannerOpen(true)}
              />
            )}

            {/* View 2: Группировка по плейлистам */}
            {mainScreenTab === 'playlists' && (
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

            {/* View 3: Группировка по исполнителям (схемы: artist.title, artist - title, artist-title, artist title) */}
            {mainScreenTab === 'artists' && (
              <ArtistsView
                tracks={tracks}
                onSelectTrack={handleSelectTrack}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
                onPlayArtist={handlePlayArtist}
                themeSettings={themeSettings}
                onOpenScanner={() => setIsScannerOpen(true)}
              />
            )}
          </div>
        )}

        {/* Alternate Source: Yandex Music */}
        {activeSource === 'yandex' && (
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

        {/* Alternate Source: NAS Storage */}
        {activeSource === 'nas' && (
          <NasStorageView
            onSelectTrack={handleSelectTrack}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            themeSettings={themeSettings}
            onRefreshTracks={refreshLibrary}
          />
        )}

        {/* Alternate Source: Android Widget Preview */}
        {activeSource === 'widget' && (
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
            onReturnToPlayer={() => setActiveSource('local')}
          />
        )}
      </main>

      {/* Floating Bottom Mini Player */}
      {currentTrack && activeSource !== 'widget' && (
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

      {/* Navigation Slide-Out Drawer Menu (Requirement 5) */}
      <NavigationMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        activeSource={activeSource}
        onSelectSource={setActiveSource}
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
        onOpenCustomization={() => setIsCustomizationOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onVerifyPaths={handleVerifyPaths}
        themeSettings={themeSettings}
        tracksCount={tracks.length}
      />

      {/* Storage Scanner & Paths Manager Modal (Requirements 2 & 4) */}
      <StorageScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        tracks={tracks}
        onRefreshLibrary={refreshLibrary}
        themeSettings={themeSettings}
        onNotify={showToast}
      />

      {/* Fullscreen Player Modal */}
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
