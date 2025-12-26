/**
 * Music Albums - Grouped music/sound collections
 */

export interface AlbumTrack {
  id: string;
  trackNumber: number;
  title: string;
  duration_minutes: number;
  audioKey: string;
}

export interface Album {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  color: string;
  artist: string;
  trackCount: number;
  totalDuration: number;
  category: 'ambient' | 'piano' | 'nature' | 'classical' | 'lofi';
  tracks: AlbumTrack[];
}

export const albumsData: Album[] = [
  {
    id: 'album_meditation',
    title: 'Meditation Music',
    description: 'Peaceful ambient soundscapes designed for meditation and deep relaxation. Let these gentle melodies guide you to inner calm.',
    color: '#B4A7C7',
    artist: 'CalmNest',
    trackCount: 3,
    totalDuration: 15,
    category: 'ambient',
    tracks: [
      {
        id: 'meditation_t1',
        trackNumber: 1,
        title: 'Calm Reflection',
        duration_minutes: 4,
        audioKey: 'album_meditation_t1',
      },
      {
        id: 'meditation_t2',
        trackNumber: 2,
        title: 'Inner Peace',
        duration_minutes: 4,
        audioKey: 'album_meditation_t2',
      },
      {
        id: 'meditation_t3',
        trackNumber: 3,
        title: 'Gentle Awakening',
        duration_minutes: 7,
        audioKey: 'album_meditation_t3',
      },
    ],
  },
];

export const getAlbumById = (id: string): Album | undefined => {
  return albumsData.find((album) => album.id === id);
};
