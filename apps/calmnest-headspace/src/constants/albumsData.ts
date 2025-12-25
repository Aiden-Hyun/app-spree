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
    id: 'album_twilight',
    title: 'Twilight Ambience',
    description: 'Ethereal ambient soundscapes designed for deep relaxation and peaceful sleep. Let the gentle drones carry you away.',
    color: '#B4A7C7',
    artist: 'CalmNest',
    trackCount: 8,
    totalDuration: 64,
    category: 'ambient',
    tracks: [
      {
        id: 'twilight_t1',
        trackNumber: 1,
        title: 'Dusk Falling',
        duration_minutes: 8,
        audioKey: 'album_twilight_t1',
      },
      {
        id: 'twilight_t2',
        trackNumber: 2,
        title: 'Evening Glow',
        duration_minutes: 8,
        audioKey: 'album_twilight_t2',
      },
      {
        id: 'twilight_t3',
        trackNumber: 3,
        title: 'Starlight Drift',
        duration_minutes: 8,
        audioKey: 'album_twilight_t3',
      },
      {
        id: 'twilight_t4',
        trackNumber: 4,
        title: 'Moonrise',
        duration_minutes: 8,
        audioKey: 'album_twilight_t4',
      },
      {
        id: 'twilight_t5',
        trackNumber: 5,
        title: 'Nocturne',
        duration_minutes: 8,
        audioKey: 'album_twilight_t5',
      },
      {
        id: 'twilight_t6',
        trackNumber: 6,
        title: 'Midnight Blue',
        duration_minutes: 8,
        audioKey: 'album_twilight_t6',
      },
      {
        id: 'twilight_t7',
        trackNumber: 7,
        title: 'Deep Night',
        duration_minutes: 8,
        audioKey: 'album_twilight_t7',
      },
      {
        id: 'twilight_t8',
        trackNumber: 8,
        title: 'Before Dawn',
        duration_minutes: 8,
        audioKey: 'album_twilight_t8',
      },
    ],
  },
  {
    id: 'album_piano',
    title: 'Quiet Piano',
    description: 'Gentle piano melodies that flow like water. Simple, beautiful compositions for meditation and rest.',
    color: '#A8B4C4',
    artist: 'CalmNest',
    trackCount: 10,
    totalDuration: 50,
    category: 'piano',
    tracks: [
      {
        id: 'piano_t1',
        trackNumber: 1,
        title: 'Morning Light',
        duration_minutes: 5,
        audioKey: 'album_piano_t1',
      },
      {
        id: 'piano_t2',
        trackNumber: 2,
        title: 'Soft Rain',
        duration_minutes: 5,
        audioKey: 'album_piano_t2',
      },
      {
        id: 'piano_t3',
        trackNumber: 3,
        title: 'Gentle Waves',
        duration_minutes: 5,
        audioKey: 'album_piano_t3',
      },
      {
        id: 'piano_t4',
        trackNumber: 4,
        title: 'Autumn Leaves',
        duration_minutes: 5,
        audioKey: 'album_piano_t4',
      },
      {
        id: 'piano_t5',
        trackNumber: 5,
        title: 'Floating',
        duration_minutes: 5,
        audioKey: 'album_piano_t5',
      },
      {
        id: 'piano_t6',
        trackNumber: 6,
        title: 'Stillness',
        duration_minutes: 5,
        audioKey: 'album_piano_t6',
      },
      {
        id: 'piano_t7',
        trackNumber: 7,
        title: 'Reflection',
        duration_minutes: 5,
        audioKey: 'album_piano_t7',
      },
      {
        id: 'piano_t8',
        trackNumber: 8,
        title: 'Dreamscape',
        duration_minutes: 5,
        audioKey: 'album_piano_t8',
      },
      {
        id: 'piano_t9',
        trackNumber: 9,
        title: 'Lullaby',
        duration_minutes: 5,
        audioKey: 'album_piano_t9',
      },
      {
        id: 'piano_t10',
        trackNumber: 10,
        title: 'Goodnight',
        duration_minutes: 5,
        audioKey: 'album_piano_t10',
      },
    ],
  },
  {
    id: 'album_forest',
    title: 'Forest Sanctuary',
    description: 'Immersive nature recordings from ancient forests around the world. Birds, wind, and rustling leaves.',
    color: '#8B9F82',
    artist: 'CalmNest',
    trackCount: 6,
    totalDuration: 60,
    category: 'nature',
    tracks: [
      {
        id: 'forest_t1',
        trackNumber: 1,
        title: 'Dawn Chorus',
        duration_minutes: 10,
        audioKey: 'album_forest_t1',
      },
      {
        id: 'forest_t2',
        trackNumber: 2,
        title: 'Woodland Stream',
        duration_minutes: 10,
        audioKey: 'album_forest_t2',
      },
      {
        id: 'forest_t3',
        trackNumber: 3,
        title: 'Afternoon Breeze',
        duration_minutes: 10,
        audioKey: 'album_forest_t3',
      },
      {
        id: 'forest_t4',
        trackNumber: 4,
        title: 'Canopy Whispers',
        duration_minutes: 10,
        audioKey: 'album_forest_t4',
      },
      {
        id: 'forest_t5',
        trackNumber: 5,
        title: 'Twilight Birds',
        duration_minutes: 10,
        audioKey: 'album_forest_t5',
      },
      {
        id: 'forest_t6',
        trackNumber: 6,
        title: 'Night Forest',
        duration_minutes: 10,
        audioKey: 'album_forest_t6',
      },
    ],
  },
];

export const getAlbumById = (id: string): Album | undefined => {
  return albumsData.find((album) => album.id === id);
};

