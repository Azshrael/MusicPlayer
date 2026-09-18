import { Track, Playlist, AudioFormat } from '../types';
import { parseTrackFilename } from '../utils/filenameParser';
import { saveTrack, deleteTrack, getAudioBlob, savePlaylist, getAllPlaylists } from './db';
import { parseM3U } from './m3uParser';

const SUPPORTED_AUDIO_EXTS = ['mp3', 'flac', 'wav', 'aac', 'ogg', 'm4a', 'opus', 'wma'];
const SUPPORTED_PLAYLIST_EXTS = ['m3u', 'm3u8'];

export interface ScanResult {
  addedTracks: Track[];
  addedPlaylists: Playlist[];
  cleanedObsoleteCount: number;
  totalFoundFiles: number;
}

/**
 * Measure duration of audio blob
 */
function probeAudioDuration(file: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = 'metadata';
    const cleanUp = () => {
      URL.revokeObjectURL(url);
    };

    audio.onloadedmetadata = () => {
      const dur = Math.round(audio.duration || 0);
      cleanUp();
      resolve(dur);
    };

    audio.onerror = () => {
      cleanUp();
      resolve(180); // 3 min fallback if cannot probe
    };

    // Safety timeout in case audio metadata event hangs
    setTimeout(() => {
      cleanUp();
      resolve(180);
    }, 1500);

    audio.src = url;
  });
}

/**
 * Format bytes to readable string (e.g. 24.5 MB)
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Scan Phone Storage using HTML5 File System Access API (showDirectoryPicker)
 */
export async function scanPhoneDirectoryWithPicker(
  onProgress?: (status: string, count: number) => void
): Promise<ScanResult | null> {
  if (!('showDirectoryPicker' in window)) {
    return null;
  }

  try {
    const dirHandle = await (window as any).showDirectoryPicker({
      id: 'music-folder',
      mode: 'read',
    });

    const audioFiles: { file: File; path: string }[] = [];
    const playlistFiles: { file: File; path: string }[] = [];

    // Recursive traversal
    async function scanHandle(handle: any, currentPath = '') {
      for await (const [name, entry] of handle.entries()) {
        const itemPath = currentPath ? `${currentPath}/${name}` : name;
        if (entry.kind === 'directory') {
          await scanHandle(entry, itemPath);
        } else if (entry.kind === 'file') {
          const ext = name.split('.').pop()?.toLowerCase() || '';
          if (SUPPORTED_AUDIO_EXTS.includes(ext)) {
            const file = await entry.getFile();
            audioFiles.push({ file, path: itemPath });
            onProgress?.(`Найдено аудио: ${name}`, audioFiles.length);
          } else if (SUPPORTED_PLAYLIST_EXTS.includes(ext)) {
            const file = await entry.getFile();
            playlistFiles.push({ file, path: itemPath });
            onProgress?.(`Найден плейлист: ${name}`, playlistFiles.length);
          }
        }
      }
    }

    onProgress?.('Сканирование папок памяти телефона...', 0);
    await scanHandle(dirHandle);

    return await processScannedFiles(audioFiles, playlistFiles, onProgress);
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      // User cancelled picker
      return null;
    }
    console.error('Directory picker scan error:', err);
    throw err;
  }
}

/**
 * Scan files from an input element (webkitdirectory or multi-file)
 */
export async function scanFilesFromInput(
  files: FileList | File[],
  onProgress?: (status: string, count: number) => void
): Promise<ScanResult> {
  const audioFiles: { file: File; path: string }[] = [];
  const playlistFiles: { file: File; path: string }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const relPath = file.webkitRelativePath || file.name;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (SUPPORTED_AUDIO_EXTS.includes(ext)) {
      audioFiles.push({ file, path: relPath });
    } else if (SUPPORTED_PLAYLIST_EXTS.includes(ext)) {
      playlistFiles.push({ file, path: relPath });
    }
  }

  return await processScannedFiles(audioFiles, playlistFiles, onProgress);
}

/**
 * Core processing: saves audio blobs, parses names with requested schemes, parses M3U playlists
 */
async function processScannedFiles(
  audioFiles: { file: File; path: string }[],
  playlistFiles: { file: File; path: string }[],
  onProgress?: (status: string, count: number) => void
): Promise<ScanResult> {
  const addedTracks: Track[] = [];
  const addedPlaylists: Playlist[] = [];

  // Default colorful cover arts for scanned local tracks
  const defaultCovers = [
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
  ];

  // 1. Process audio files
  for (let i = 0; i < audioFiles.length; i++) {
    const { file, path } = audioFiles[i];
    onProgress?.(`Импорт трека (${i + 1}/${audioFiles.length}): ${file.name}`, i + 1);

    const ext = file.name.split('.').pop()?.toLowerCase() as AudioFormat;
    // Parse using the 4 requested schemes: artist.title, artist - title, artist-title, artist title
    const { artist, title } = parseTrackFilename(file.name);
    const duration = await probeAudioDuration(file);

    const trackId = `local-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`;
    const coverArt = defaultCovers[i % defaultCovers.length];

    const track: Track = {
      id: trackId,
      title,
      artist,
      album: 'Внутренняя память',
      duration,
      url: '', // Local blob URL created on demand to preserve memory
      coverArt,
      source: 'local',
      format: ext || 'mp3',
      fileSize: formatBytes(file.size),
      dateAdded: Date.now(),
      blobKey: trackId,
      filePath: path,
      fileName: file.name,
    };

    // Save track and its audio blob to IndexedDB
    await saveTrack(track, file);
    addedTracks.push(track);
  }

  // 2. Process playlist files (.m3u and .m3u8)
  for (let i = 0; i < playlistFiles.length; i++) {
    const { file, path } = playlistFiles[i];
    onProgress?.(`Чтение плейлиста (${i + 1}/${playlistFiles.length}): ${file.name}`, i + 1);

    try {
      const text = await file.text();
      const parsed = parseM3U(text);
      const playlistName = file.name.replace(/\.[^/.]+$/, '');

      // Match playlist entries to scanned tracks by filename or title
      const matchedTrackIds: string[] = [];
      for (const item of parsed) {
        const itemFile = item.uri.replace(/\\/g, '/').split('/').pop()?.toLowerCase();
        const found = addedTracks.find((t) => {
          const tFile = t.fileName?.toLowerCase();
          const tPath = t.filePath?.toLowerCase();
          return (
            (itemFile && (tFile === itemFile || tPath?.endsWith(itemFile))) ||
            t.title.toLowerCase() === item.title.toLowerCase()
          );
        });
        if (found) {
          matchedTrackIds.push(found.id);
        }
      }

      const playlist: Playlist = {
        id: `m3u-${Date.now()}-${i}`,
        name: playlistName,
        description: `Импортирован из ${path} (${matchedTrackIds.length} треков)`,
        trackIds: matchedTrackIds,
        createdAt: Date.now(),
        isM3U: true,
        coverArt: defaultCovers[(i + 2) % defaultCovers.length],
      };

      await savePlaylist(playlist);
      addedPlaylists.push(playlist);
    } catch (err) {
      console.warn(`Could not parse M3U file ${file.name}:`, err);
    }
  }

  return {
    addedTracks,
    addedPlaylists,
    cleanedObsoleteCount: 0,
    totalFoundFiles: audioFiles.length + playlistFiles.length,
  };
}

/**
 * Verify and clean tracks: checks if audio file exists in IndexedDB blob storage.
 * If file was removed or deleted, prunes it from database so invalid paths don't clutter the library.
 */
export async function verifyAndCleanTracks(
  tracks: Track[]
): Promise<{ validTracks: Track[]; removedCount: number; removedTitles: string[] }> {
  const validTracks: Track[] = [];
  const removedTitles: string[] = [];

  for (const track of tracks) {
    if (track.source === 'local') {
      const blob = await getAudioBlob(track.id);
      if (!blob || blob.size === 0) {
        // Obsolete or missing audio file!
        await deleteTrack(track.id);
        removedTitles.push(track.title);
        continue;
      }
    }
    validTracks.push(track);
  }

  return {
    validTracks,
    removedCount: removedTitles.length,
    removedTitles,
  };
}

/**
 * Delete a specific obsolete track when playback detects it cannot be opened/found
 */
export async function removeObsoleteTrack(trackId: string): Promise<void> {
  await deleteTrack(trackId);
  // Also clean from playlists
  try {
    const playlists = await getAllPlaylists();
    for (const pl of playlists) {
      if (pl.trackIds.includes(trackId)) {
        pl.trackIds = pl.trackIds.filter((id) => id !== trackId);
        await savePlaylist(pl);
      }
    }
  } catch (err) {
    console.warn('Error cleaning track from playlists:', err);
  }
}
