export type AudioSourceType = 'local' | 'yandex' | 'nas' | 'demo';
export type AudioFormat = 'mp3' | 'flac' | 'wav' | 'aac' | 'ogg' | 'm4a';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  url: string;
  coverArt: string;
  source: AudioSourceType;
  format: AudioFormat;
  bitrate?: string;
  fileSize?: string;
  dateAdded: number;
  blobKey?: string; // key in IndexedDB for offline audio data
  filePath?: string; // Local storage path on phone
  fileName?: string; // Original filename
  nasPath?: string;
  yandexId?: string;
  isFavorite?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  createdAt: number;
  isM3U?: boolean;
  coverArt?: string;
}

export type ThemeMode = 'amoled' | 'dark' | 'yandex' | 'cyberpunk' | 'retro' | 'light';

export type FontFamily = 
  | 'roboto' 
  | 'montserrat' 
  | 'jetbrains' 
  | 'orbitron' 
  | 'playfair' 
  | 'unbounded' 
  | 'inter';

export type ButtonStyle = 
  | 'rounded' 
  | 'neumorphic' 
  | 'cyber' 
  | 'pill' 
  | 'outline' 
  | 'neon';

export type ControlLayout = 'standard' | 'extended' | 'minimal';

export type BackgroundEffect = 'album-blur' | 'gradient' | 'minimal';

export type FontSizeScale = 'compact' | 'normal' | 'large';

export interface ThemeSettings {
  themeMode: ThemeMode;
  accentColor: string;
  fontFamily: FontFamily;
  fontSizeScale: FontSizeScale;
  buttonStyle: ButtonStyle;
  controlLayout: ControlLayout;
  bgEffect: BackgroundEffect;
  buttonScale: number; // 0.8 to 1.3
}

export interface EqualizerState {
  enabled: boolean;
  // 10 bands: 32Hz, 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz
  bands: number[]; // -12dB to +12dB
  preset: string;
  bassBoost: number; // 0 to 100%
  virtualizer: number; // 0 to 100% (3D spatial)
  preamp: number; // -6 to +6 dB
}

export interface NASConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'webdav';
  basePath: string;
  username: string;
  password?: string;
  autoSync: boolean;
  connected: boolean;
}

export interface YandexSettings {
  token: string;
  username: string;
  isConnected: boolean;
  highQuality: boolean;
}

export type WidgetStyle = '4x2' | '4x1' | '2x2';

export interface WidgetSettings {
  style: WidgetStyle;
  transparency: number; // 0 to 100%
  showWave: boolean;
  showCover: boolean;
}

export interface NASDirectoryItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  format?: AudioFormat;
  duration?: number;
}
