import { Track } from '../types';

export interface ParsedM3UEntry {
  title: string;
  artist: string;
  duration: number;
  uri: string;
  format?: string;
}

export function parseM3U(content: string): ParsedM3UEntry[] {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const entries: ParsedM3UEntry[] = [];

  let currentTitle = '';
  let currentArtist = '';
  let currentDuration = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('#EXTM3U')) {
      continue;
    }

    if (line.startsWith('#EXTINF:')) {
      // Format: #EXTINF:duration,Artist - Title or #EXTINF:duration,Title
      const infoPart = line.substring(8);
      const commaIdx = infoPart.indexOf(',');
      if (commaIdx !== -1) {
        const durStr = infoPart.substring(0, commaIdx).trim();
        const duration = parseInt(durStr, 10);
        currentDuration = isNaN(duration) ? 0 : Math.max(0, duration);

        const titlePart = infoPart.substring(commaIdx + 1).trim();
        if (titlePart.includes(' - ')) {
          const [artist, ...rest] = titlePart.split(' - ');
          currentArtist = artist.trim();
          currentTitle = rest.join(' - ').trim();
        } else {
          currentArtist = 'Неизвестный исполнитель';
          currentTitle = titlePart || 'Трек';
        }
      }
    } else if (!line.startsWith('#')) {
      // URI or file path
      const uri = line;
      const ext = uri.split('.').pop()?.toLowerCase();
      
      let title = currentTitle;
      let artist = currentArtist;
      
      if (!title) {
        // Derive title from filename
        const fileName = uri.split('/').pop()?.split('\\').pop()?.replace(/\.[^/.]+$/, '') || 'Трек';
        if (fileName.includes(' - ')) {
          const parts = fileName.split(' - ');
          artist = parts[0].trim();
          title = parts.slice(1).join(' - ').trim();
        } else {
          artist = 'Неизвестный исполнитель';
          title = fileName;
        }
      }

      entries.push({
        title,
        artist: artist || 'Неизвестный исполнитель',
        duration: currentDuration,
        uri,
        format: ext,
      });

      // Reset current values
      currentTitle = '';
      currentArtist = '';
      currentDuration = 0;
    }
  }

  return entries;
}

export function generateM3U(tracks: Track[], playlistTitle = 'Aura Playlist'): string {
  let content = '#EXTM3U\n';
  content += `#PLAYLIST:${playlistTitle}\n\n`;

  for (const track of tracks) {
    const duration = Math.round(track.duration || 0);
    content += `#EXTINF:${duration},${track.artist} - ${track.title}\n`;
    content += `${track.url}\n\n`;
  }

  return content;
}

export function downloadM3UFile(tracks: Track[], playlistName: string): void {
  const content = generateM3U(tracks, playlistName);
  const blob = new Blob([content], { type: 'audio/x-mpegurl;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = playlistName.replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]/g, '_');
  a.download = `${safeName || 'playlist'}.m3u`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
