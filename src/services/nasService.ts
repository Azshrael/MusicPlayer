import { NASConfig, NASDirectoryItem, Track } from '../types';

export const DEFAULT_NAS_CONFIG: NASConfig = {
  id: 'default-nas',
  name: 'Synology DiskStation DS920+',
  host: '192.168.1.120',
  port: 5005,
  protocol: 'http',
  basePath: '/music',
  username: 'admin',
  password: '••••••••',
  autoSync: false,
  connected: true,
};

export const NAS_PRESETS: Array<{ name: string; port: number; protocol: 'http' | 'https' | 'webdav'; basePath: string }> = [
  { name: 'Synology Audio Station', port: 5005, protocol: 'webdav', basePath: '/music' },
  { name: 'QNAP Music Station', port: 8080, protocol: 'webdav', basePath: '/Multimedia/Music' },
  { name: 'TrueNAS CORE / SCALE', port: 80, protocol: 'http', basePath: '/mnt/storage/audio' },
  { name: 'Nextcloud WebDAV', port: 443, protocol: 'webdav', basePath: '/remote.php/webdav/Music' },
  { name: 'Custom HTTP Media Server', port: 8000, protocol: 'http', basePath: '/' },
];

export const MOCK_NAS_FILESYSTEM: Record<string, NASDirectoryItem[]> = {
  '/music': [
    { name: 'Hi-Res Lossless (FLAC 24-bit)', path: '/music/Hi-Res Lossless (FLAC 24-bit)', type: 'folder' },
    { name: 'Vinyl Rips & WAV Studio', path: '/music/Vinyl Rips & WAV Studio', type: 'folder' },
    { name: 'MP3 320k Best Collection', path: '/music/MP3 320k Best Collection', type: 'folder' },
    { name: 'Playlists M3U', path: '/music/Playlists M3U', type: 'folder' },
    { name: 'Pink Floyd - Time (2023 Remaster).flac', path: '/music/Pink Floyd - Time (2023 Remaster).flac', type: 'file', size: 48200000, format: 'flac', duration: 425 },
    { name: 'Sting - Shape of My Heart.mp3', path: '/music/Sting - Shape of My Heart.mp3', type: 'file', size: 9100000, format: 'mp3', duration: 278 },
  ],
  '/music/Hi-Res Lossless (FLAC 24-bit)': [
    { name: 'Dire Straits - Brothers in Arms (96kHz).flac', path: '/music/Hi-Res Lossless (FLAC 24-bit)/Dire Straits - Brothers in Arms (96kHz).flac', type: 'file', size: 76000000, format: 'flac', duration: 418 },
    { name: 'Hans Zimmer - Interstellar Main Theme.flac', path: '/music/Hi-Res Lossless (FLAC 24-bit)/Hans Zimmer - Interstellar Main Theme.flac', type: 'file', size: 54000000, format: 'flac', duration: 247 },
    { name: 'Daft Punk - Giorgio by Moroder (Hi-Res).flac', path: '/music/Hi-Res Lossless (FLAC 24-bit)/Daft Punk - Giorgio by Moroder (Hi-Res).flac', type: 'file', size: 68500000, format: 'flac', duration: 544 },
  ],
  '/music/Vinyl Rips & WAV Studio': [
    { name: 'Queen - Bohemian Rhapsody (PCM Master).wav', path: '/music/Vinyl Rips & WAV Studio/Queen - Bohemian Rhapsody (PCM Master).wav', type: 'file', size: 62000000, format: 'wav', duration: 354 },
    { name: 'Miles Davis - So What (Original Tape).wav', path: '/music/Vinyl Rips & WAV Studio/Miles Davis - So What (Original Tape).wav', type: 'file', size: 59000000, format: 'wav', duration: 562 },
  ],
  '/music/MP3 320k Best Collection': [
    { name: 'The Weeknd - Blinding Lights (320kbps).mp3', path: '/music/MP3 320k Best Collection/The Weeknd - Blinding Lights (320kbps).mp3', type: 'file', size: 8400000, format: 'mp3', duration: 200 },
    { name: 'Gorillaz - Feel Good Inc.mp3', path: '/music/MP3 320k Best Collection/Gorillaz - Feel Good Inc.mp3', type: 'file', size: 8200000, format: 'mp3', duration: 223 },
    { name: 'Nirvana - Smells Like Teen Spirit.mp3', path: '/music/MP3 320k Best Collection/Nirvana - Smells Like Teen Spirit.mp3', type: 'file', size: 11400000, format: 'mp3', duration: 301 },
  ],
  '/music/Playlists M3U': [
    { name: 'Hi-Res_Favorites.m3u', path: '/music/Playlists M3U/Hi-Res_Favorites.m3u', type: 'file', size: 4500 },
    { name: 'Car_Audio_Selection.m3u8', path: '/music/Playlists M3U/Car_Audio_Selection.m3u8', type: 'file', size: 8900 },
  ],
};

export async function fetchNASDirectory(path: string): Promise<NASDirectoryItem[]> {
  // Simulate network request to NAS
  await new Promise((r) => setTimeout(r, 250));
  return MOCK_NAS_FILESYSTEM[path] || [
    { name: 'Track-01.flac', path: `${path}/Track-01.flac`, type: 'file', size: 34000000, format: 'flac', duration: 215 },
    { name: 'Track-02.mp3', path: `${path}/Track-02.mp3`, type: 'file', size: 7500000, format: 'mp3', duration: 190 },
  ];
}

export function convertNASItemToTrack(item: NASDirectoryItem, nasConfig: NASConfig): Track {
  const parts = item.name.replace(/\.[^/.]+$/, '').split(' - ');
  const artist = parts.length > 1 ? parts[0].trim() : 'NAS Media';
  const title = parts.length > 1 ? parts.slice(1).join(' - ').trim() : item.name.replace(/\.[^/.]+$/, '');
  
  const sampleAudioUrls = [
    'https://cdn.freesound.org/previews/612/612610_5674468-lq.mp3',
    'https://cdn.freesound.org/previews/556/556708_9574343-lq.mp3',
    'https://cdn.freesound.org/previews/462/462806_8386274-lq.mp3',
    'https://cdn.freesound.org/previews/530/530415_11861866-lq.mp3',
  ];
  const urlIdx = Math.abs(item.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % sampleAudioUrls.length;

  const sizeMb = item.size ? `${(item.size / (1024 * 1024)).toFixed(1)} MB` : '18.4 MB';
  const bitrate = item.format === 'flac' ? '1411 kbps (FLAC)' : item.format === 'wav' ? '1536 kbps (WAV Lossless)' : '320 kbps (CBR)';

  return {
    id: `nas-${item.path}`,
    title,
    artist,
    album: nasConfig.name || 'Сетевое хранилище NAS',
    duration: item.duration || 240,
    url: sampleAudioUrls[urlIdx],
    coverArt: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&w=600&q=80',
    source: 'nas',
    format: item.format || 'flac',
    bitrate,
    fileSize: sizeMb,
    dateAdded: Date.now(),
    nasPath: item.path,
    isFavorite: false,
  };
}
