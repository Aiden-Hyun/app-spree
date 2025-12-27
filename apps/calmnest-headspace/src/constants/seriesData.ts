/**
 * Bedtime Story Series - Multi-chapter story collections
 */

export interface SeriesChapter {
  id: string;
  chapterNumber: number;
  title: string;
  description: string;
  duration_minutes: number;
  audioKey: string;
}

export interface Series {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  color: string;
  narrator: string;
  chapterCount: number;
  totalDuration: number;
  category: "fantasy" | "nature" | "travel" | "thriller" | "fiction";
  chapters: SeriesChapter[];
}

export const seriesData: Series[] = [
  {
    id: "series_midnight_crossing",
    title: "The Midnight Crossing",
    description:
      "A suspenseful journey through shadows and mystery. Each act unfolds new secrets as the night holds its breath, guiding you deeper into dreamland.",
    color: "#4A5568",
    narrator: "Rachel",
    chapterCount: 1,
    totalDuration: 6,
    category: "thriller",
    chapters: [
      {
        id: "midnight_crossing_act1",
        chapterNumber: 1,
        title: "Act 1: The Beginning",
        description: "The journey begins as darkness falls and secrets stir",
        duration_minutes: 6,
        audioKey: "story_midnight_crossing",
      },
    ],
  },
];

export const getSeriesById = (id: string): Series | undefined => {
  return seriesData.find((series) => series.id === id);
};
