export interface ParsedTrackInfo {
  artist: string;
  title: string;
}

/**
 * Parses artist and title from audio file names according to user-specified schemes:
 * 1. исполнитель - название  (e.g., "Queen - Bohemian Rhapsody")
 * 2. исполнитель-название   (e.g., "Queen-Bohemian Rhapsody")
 * 3. исполнитель.название   (e.g., "Queen.Bohemian Rhapsody")
 * 4. исполнитель название   (e.g., "Queen Bohemian Rhapsody")
 * 
 * Also strips track number prefixes like "01. ", "01 - ", "01-", "01 " etc.
 */
export function parseTrackFilename(rawFileName: string): ParsedTrackInfo {
  if (!rawFileName || typeof rawFileName !== 'string') {
    return { artist: 'Неизвестный исполнитель', title: 'Без названия' };
  }

  // 1. Remove file extension (.mp3, .flac, .wav, .aac, .ogg, .m4a, .opus, etc.)
  let name = rawFileName.replace(/\.[a-zA-Z0-9]{2,5}$/, '').trim();

  // 2. Remove directory path if present (e.g. /Music/Rock/Queen - Song)
  const lastSlash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
  if (lastSlash >= 0) {
    name = name.slice(lastSlash + 1).trim();
  }

  // 3. Strip leading track indices: "01. ", "01 - ", "01-", "01_", "1. ", "01 "
  name = name.replace(/^(\d{1,3}[\.\-_\s]+)/, '').trim();

  // Scheme 1: "исполнитель - название" (space-hyphen-space or space-dash-space)
  if (name.includes(' - ') || name.includes(' – ') || name.includes(' — ')) {
    const delimiter = name.includes(' - ') ? ' - ' : name.includes(' – ') ? ' – ' : ' — ';
    const parts = name.split(delimiter);
    const artist = cleanString(parts[0]);
    const title = cleanString(parts.slice(1).join(delimiter));
    if (artist && title) {
      return { artist, title };
    }
  }

  // Scheme 2: "исполнитель-название" (hyphen without spaces)
  // Check if there is a hyphen with letters/digits on either side
  const hyphenMatch = name.match(/^([^\-]+)-([^\-]+.*)$/);
  if (hyphenMatch && hyphenMatch[1] && hyphenMatch[2]) {
    const artist = cleanString(hyphenMatch[1]);
    const title = cleanString(hyphenMatch[2]);
    if (artist && title) {
      return { artist, title };
    }
  }

  // Scheme 3: "исполнитель.название" (dot separated)
  // e.g. "Queen.Bohemian Rhapsody" or "Queen.Bohemian.Rhapsody"
  if (name.includes('.')) {
    const parts = name.split('.');
    if (parts.length >= 2) {
      const artist = cleanString(parts[0]);
      // The rest can be joined by space or preserved title
      const title = cleanString(parts.slice(1).join(' '));
      if (artist && title) {
        return { artist, title };
      }
    }
  }

  // Scheme 4: "исполнитель название" (separated by space)
  // e.g. "Queen Bohemian Rhapsody" -> first word as artist, remaining as title
  if (name.includes(' ') || name.includes('_')) {
    const normalized = name.replace(/_/g, ' ').trim();
    const words = normalized.split(/\s+/);
    if (words.length >= 2) {
      const artist = cleanString(words[0]);
      const title = cleanString(words.slice(1).join(' '));
      if (artist && title) {
        return { artist, title };
      }
    }
  }

  // Fallback: entire name is the title
  return {
    artist: 'Неизвестный исполнитель',
    title: cleanString(name) || 'Без названия'
  };
}

function cleanString(str: string): string {
  if (!str) return '';
  return str
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
