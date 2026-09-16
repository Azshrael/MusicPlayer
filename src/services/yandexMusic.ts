import { Track } from '../types';

export interface YandexCatalogCategory {
  id: string;
  title: string;
  description: string;
  cover: string;
  tracks: Track[];
}

export const YANDEX_CHARTS: Track[] = [
  {
    id: 'ym-1',
    title: 'Пыяла (Deep Remaster)',
    artist: 'Аигел',
    album: 'Эдем',
    duration: 184,
    url: 'https://cdn.freesound.org/previews/689/689369_14839843-lq.mp3',
    coverArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    source: 'yandex',
    format: 'mp3',
    bitrate: '320 kbps (Yandex HQ)',
    fileSize: '7.4 MB',
    dateAdded: Date.now(),
    yandexId: 'ym_track_88291',
    isFavorite: true,
  },
  {
    id: 'ym-2',
    title: 'Моя Волна: Неоновый Дождь',
    artist: 'Курсор & Моя Волна',
    album: 'Рекомендации дня',
    duration: 210,
    url: 'https://cdn.freesound.org/previews/612/612610_5674468-lq.mp3',
    coverArt: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    source: 'yandex',
    format: 'mp3',
    bitrate: '320 kbps',
    fileSize: '8.2 MB',
    dateAdded: Date.now(),
    yandexId: 'ym_track_10293',
    isFavorite: false,
  },
  {
    id: 'ym-3',
    title: 'Группа крови (Acoustic Tribute)',
    artist: 'Кино Cover Orchestra',
    album: 'Звезда по имени Солнце',
    duration: 245,
    url: 'https://cdn.freesound.org/previews/462/462806_8386274-lq.mp3',
    coverArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    source: 'yandex',
    format: 'flac',
    bitrate: '1411 kbps FLAC Lossless',
    fileSize: '31.4 MB',
    dateAdded: Date.now(),
    yandexId: 'ym_track_44312',
    isFavorite: true,
  },
  {
    id: 'ym-4',
    title: 'Сияй (Vibe Lounge)',
    artist: 'Ramil & Rompasso',
    album: 'Ночной Токио',
    duration: 168,
    url: 'https://cdn.freesound.org/previews/556/556708_9574343-lq.mp3',
    coverArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    source: 'yandex',
    format: 'mp3',
    bitrate: '320 kbps HQ',
    fileSize: '6.7 MB',
    dateAdded: Date.now(),
    yandexId: 'ym_track_77812',
    isFavorite: false,
  },
  {
    id: 'ym-5',
    title: 'Кометы (Orchestral Edition)',
    artist: 'Polnalyubvi',
    album: 'Сказки лесной тишины',
    duration: 202,
    url: 'https://cdn.freesound.org/previews/530/530415_11861866-lq.mp3',
    coverArt: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    source: 'yandex',
    format: 'wav',
    bitrate: '1411 kbps Studio',
    fileSize: '29.3 MB',
    dateAdded: Date.now(),
    yandexId: 'ym_track_99411',
    isFavorite: true,
  },
];

export const YANDEX_CATEGORIES: YandexCatalogCategory[] = [
  {
    id: 'my-vibe',
    title: 'Моя волна',
    description: 'Бесконечный персональный поток треков под ваше настроение',
    cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    tracks: [YANDEX_CHARTS[1], YANDEX_CHARTS[0], YANDEX_CHARTS[3]],
  },
  {
    id: 'top-chart',
    title: 'Чарт Яндекс Музыки (Топ-100)',
    description: 'Самые популярные треки в России прямо сейчас',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    tracks: YANDEX_CHARTS,
  },
  {
    id: 'rock-classics',
    title: 'Русский рок и Легенды',
    description: 'Культовые гитарные риффы и вечные хиты',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    tracks: [YANDEX_CHARTS[2], YANDEX_CHARTS[4]],
  },
  {
    id: 'electronic-vibe',
    title: 'Электроника & Deep House',
    description: 'Атмосферный саундтрек для концентрации и поездок',
    cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    tracks: [YANDEX_CHARTS[0], YANDEX_CHARTS[1], YANDEX_CHARTS[3]],
  },
];

export async function searchYandexMusic(query: string): Promise<Track[]> {
  const q = query.toLowerCase().trim();
  if (!q) return YANDEX_CHARTS;

  return YANDEX_CHARTS.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q)
  );
}
