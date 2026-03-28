import {
  FirestoreCourse,
  FirestoreCourseSession,
  FirestoreEmergencyMeditation,
  getCourseById,
  getCourses,
  getCourseSessionById,
  getCourseSessions,
  getEmergencyMeditationById,
  getEmergencyMeditations,
  getMeditationById,
  getMeditations,
} from '@features/meditate/data/meditateRepository';
import {
  FirestoreSleepMeditation,
  getBedtimeStories,
  getBedtimeStoryById,
  getSleepMeditationById,
  getSleepMeditations,
} from '@features/sleep/data/sleepRepository';
import { BedtimeStory } from '@/types';
import { GuidedMeditation } from '@/types';
import {
  buildEditableValues,
  getContentManagerEditFields,
} from './contentManagerEditConfig';
import {
  CONTENT_MANAGER_COLLECTION_LABELS,
  ContentManagerCollection,
  ContentManagerItemDetail,
  ContentManagerItemSummary,
  ContentPreviewRoute,
} from '../types';

function withCommonSummaryFields(
  collection: ContentManagerCollection,
  item: {
    id: string;
    title: string;
    description?: string;
    code?: string;
    durationMinutes?: number;
    thumbnailUrl?: string;
    access: 'free' | 'premium';
    previewRoute: ContentPreviewRoute;
  }
): ContentManagerItemSummary {
  return {
    id: item.id,
    collection,
    typeLabel: CONTENT_MANAGER_COLLECTION_LABELS[collection],
    title: item.title,
    description: item.description,
    identifier: item.code || item.id,
    code: item.code,
    access: item.access,
    durationMinutes: item.durationMinutes,
    thumbnailUrl: item.thumbnailUrl,
    previewRoute: item.previewRoute,
  };
}

function cleanValue(value: unknown): string | null {
  const text = String(value ?? '').trim();
  return text ? text : null;
}

function appendMetadata(
  fields: Array<{ label: string; value: unknown; monospace?: boolean }>
) {
  return fields
    .map((field) => {
      const value = cleanValue(field.value);
      if (!value) return null;
      return {
        label: field.label,
        value,
        monospace: field.monospace,
      };
    })
    .filter((field): field is NonNullable<typeof field> => Boolean(field));
}

export function normalizeGuidedMeditationSummary(
  meditation: GuidedMeditation
): ContentManagerItemSummary {
  return withCommonSummaryFields('guided_meditations', {
    id: meditation.id,
    title: meditation.title,
    description: meditation.description,
    durationMinutes: meditation.duration_minutes,
    thumbnailUrl: meditation.thumbnailUrl,
    access: 'free',
    previewRoute: {
      pathname: '/meditation/[id]',
      params: { id: meditation.id },
    },
  });
}

export function normalizeSleepMeditationSummary(
  meditation: FirestoreSleepMeditation
): ContentManagerItemSummary {
  return withCommonSummaryFields('sleep_meditations', {
    id: meditation.id,
    title: meditation.title,
    description: meditation.description,
    durationMinutes: meditation.duration_minutes,
    thumbnailUrl: meditation.thumbnailUrl,
    access: 'free',
    previewRoute: {
      pathname: '/sleep/meditation/[id]',
      params: { id: meditation.id },
    },
  });
}

export function normalizeBedtimeStorySummary(story: BedtimeStory): ContentManagerItemSummary {
  return withCommonSummaryFields('bedtime_stories', {
    id: story.id,
    title: story.title,
    description: story.description,
    durationMinutes: story.duration_minutes,
    thumbnailUrl: story.thumbnail_url,
    access: 'free',
    previewRoute: {
      pathname: '/sleep/[id]',
      params: { id: story.id },
    },
  });
}

export function normalizeEmergencyMeditationSummary(
  meditation: FirestoreEmergencyMeditation
): ContentManagerItemSummary {
  return withCommonSummaryFields('emergency_meditations', {
    id: meditation.id,
    title: meditation.title,
    description: meditation.description,
    durationMinutes: meditation.duration_minutes,
    thumbnailUrl: meditation.thumbnailUrl,
    access: 'free',
    previewRoute: {
      pathname: '/emergency/[id]',
      params: {
        id: meditation.id,
        title: meditation.title,
        description: meditation.description,
        duration: String(meditation.duration_minutes),
        audioPath: meditation.audioPath,
        color: meditation.color,
        icon: meditation.icon,
        narrator: meditation.narrator || '',
        thumbnailUrl: meditation.thumbnailUrl || '',
      },
    },
  });
}

export function normalizeCourseSummary(course: FirestoreCourse): ContentManagerItemSummary {
  return withCommonSummaryFields('courses', {
    id: course.id,
    title: course.title,
    description: course.description,
    code: course.code,
    durationMinutes: course.duration_minutes || course.totalDuration,
    thumbnailUrl: course.thumbnailUrl,
    access: 'free',
    previewRoute: {
      pathname: '/course/[id]',
      params: { id: course.id },
    },
  });
}

export function normalizeCourseSessionSummary(
  session: FirestoreCourseSession,
  course?: Pick<FirestoreCourse, 'title' | 'code' | 'instructor' | 'color' | 'thumbnailUrl'>
): ContentManagerItemSummary {
  return withCommonSummaryFields('course_sessions', {
    id: session.id,
    title: session.title,
    description: session.description,
    code: session.code,
    durationMinutes: session.duration_minutes,
    access: session.isFree === true ? 'free' : 'premium',
    previewRoute: {
      pathname: '/course/session/[id]',
      params: {
        id: session.id,
        audioPath: session.audioPath,
        title: session.title,
        courseTitle: course?.title || '',
        courseCode: course?.code || '',
        sessionCode: session.code || '',
        duration: String(session.duration_minutes),
        instructor: course?.instructor || '',
        color: course?.color || '',
        thumbnailUrl: course?.thumbnailUrl || '',
      },
    },
  });
}

function normalizeGuidedMeditationDetail(
  meditation: GuidedMeditation
): ContentManagerItemDetail {
  return {
    ...normalizeGuidedMeditationSummary(meditation),
    metadata: appendMetadata([
      { label: 'Themes', value: (meditation.themes || []).join(', ') },
      { label: 'Techniques', value: (meditation.techniques || []).join(', ') },
      { label: 'Difficulty', value: meditation.difficulty_level },
      { label: 'Instructor', value: meditation.instructor },
      { label: 'Audio Path', value: meditation.audioPath, monospace: true },
    ]),
    relations: [],
    editableFields: getContentManagerEditFields('guided_meditations'),
    editableValues: buildEditableValues('guided_meditations', meditation as unknown as Record<string, unknown>),
  };
}

function normalizeSleepMeditationDetail(
  meditation: FirestoreSleepMeditation
): ContentManagerItemDetail {
  return {
    ...normalizeSleepMeditationSummary(meditation),
    metadata: appendMetadata([
      { label: 'Instructor', value: meditation.instructor },
      { label: 'Icon', value: meditation.icon },
      { label: 'Color', value: meditation.color, monospace: true },
      { label: 'Audio Path', value: meditation.audioPath, monospace: true },
    ]),
    relations: [],
    editableFields: getContentManagerEditFields('sleep_meditations'),
    editableValues: buildEditableValues('sleep_meditations', meditation as unknown as Record<string, unknown>),
  };
}

function normalizeBedtimeStoryDetail(story: BedtimeStory): ContentManagerItemDetail {
  return {
    ...normalizeBedtimeStorySummary(story),
    metadata: appendMetadata([
      { label: 'Narrator', value: story.narrator },
      { label: 'Category', value: story.category },
      { label: 'Thumbnail URL', value: story.thumbnail_url, monospace: true },
      { label: 'Audio URL', value: story.audio_url, monospace: true },
      { label: 'Audio Asset', value: story.audio_file, monospace: true },
    ]),
    relations: [],
    editableFields: getContentManagerEditFields('bedtime_stories'),
    editableValues: buildEditableValues('bedtime_stories', story as unknown as Record<string, unknown>),
  };
}

function normalizeEmergencyMeditationDetail(
  meditation: FirestoreEmergencyMeditation
): ContentManagerItemDetail {
  return {
    ...normalizeEmergencyMeditationSummary(meditation),
    metadata: appendMetadata([
      { label: 'Narrator', value: meditation.narrator },
      { label: 'Icon', value: meditation.icon },
      { label: 'Color', value: meditation.color, monospace: true },
      { label: 'Audio Path', value: meditation.audioPath, monospace: true },
    ]),
    relations: [],
    editableFields: getContentManagerEditFields('emergency_meditations'),
    editableValues: buildEditableValues(
      'emergency_meditations',
      meditation as unknown as Record<string, unknown>
    ),
  };
}

function normalizeCourseDetail(course: FirestoreCourse): ContentManagerItemDetail {
  return {
    ...normalizeCourseSummary(course),
    metadata: appendMetadata([
      { label: 'Code', value: course.code, monospace: true },
      { label: 'Subtitle', value: course.subtitle },
      { label: 'Instructor', value: course.instructor },
      { label: 'Subject', value: course.subjectLabel },
      { label: 'Subject ID', value: course.subjectId, monospace: true },
      { label: 'Difficulty', value: course.difficulty },
      { label: 'Icon', value: course.icon },
      { label: 'Color', value: course.color, monospace: true },
      { label: 'Session Count', value: course.sessionCount || course.session_count || 0 },
    ]),
    relations: (course.sessions || []).map((session, index) => ({
      label: `Session ${index + 1}`,
      collection: 'course_sessions',
      id: session.id,
      title: session.title,
      code: session.code,
    })),
    editableFields: getContentManagerEditFields('courses'),
    editableValues: buildEditableValues('courses', course as unknown as Record<string, unknown>),
  };
}

function normalizeCourseSessionDetail(
  session: FirestoreCourseSession,
  course: FirestoreCourse | null
): ContentManagerItemDetail {
  return {
    ...normalizeCourseSessionSummary(session, course || undefined),
    metadata: appendMetadata([
      { label: 'Code', value: session.code, monospace: true },
      { label: 'Course ID', value: session.courseId, monospace: true },
      { label: 'Order', value: session.order },
      { label: 'Day Number', value: session.dayNumber },
      { label: 'Audio Path', value: session.audioPath, monospace: true },
    ]),
    relations: course
      ? [
          {
            label: 'Course',
            collection: 'courses',
            id: course.id,
            title: course.title,
            code: course.code,
          },
        ]
      : [],
    editableFields: getContentManagerEditFields('course_sessions'),
    editableValues: buildEditableValues(
      'course_sessions',
      session as unknown as Record<string, unknown>
    ),
  };
}

export async function getContentManagerItems(): Promise<ContentManagerItemSummary[]> {
  const [
    meditations,
    sleepMeditations,
    bedtimeStories,
    emergencyMeditations,
    courses,
    courseSessions,
  ] = await Promise.all([
    getMeditations(),
    getSleepMeditations(),
    getBedtimeStories(),
    getEmergencyMeditations(),
    getCourses(),
    getCourseSessions(),
  ]);

  const coursesById = new Map(courses.map((course) => [course.id, course]));

  return [
    ...meditations.map(normalizeGuidedMeditationSummary),
    ...sleepMeditations.map(normalizeSleepMeditationSummary),
    ...bedtimeStories.map(normalizeBedtimeStorySummary),
    ...emergencyMeditations.map(normalizeEmergencyMeditationSummary),
    ...courses.map(normalizeCourseSummary),
    ...courseSessions.map((session) =>
      normalizeCourseSessionSummary(session, coursesById.get(session.courseId))
    ),
  ];
}

export async function getContentManagerItemDetail(
  collection: ContentManagerCollection,
  id: string
): Promise<ContentManagerItemDetail | null> {
  switch (collection) {
    case 'guided_meditations': {
      const meditation = await getMeditationById(id);
      return meditation ? normalizeGuidedMeditationDetail(meditation) : null;
    }
    case 'sleep_meditations': {
      const meditation = await getSleepMeditationById(id);
      return meditation ? normalizeSleepMeditationDetail(meditation) : null;
    }
    case 'bedtime_stories': {
      const story = await getBedtimeStoryById(id);
      return story ? normalizeBedtimeStoryDetail(story) : null;
    }
    case 'emergency_meditations': {
      const meditation = await getEmergencyMeditationById(id);
      return meditation ? normalizeEmergencyMeditationDetail(meditation) : null;
    }
    case 'courses': {
      const course = await getCourseById(id);
      return course ? normalizeCourseDetail(course) : null;
    }
    case 'course_sessions': {
      const session = await getCourseSessionById(id);
      if (!session) return null;
      const course = session.courseId ? await getCourseById(session.courseId) : null;
      return normalizeCourseSessionDetail(session, course);
    }
    default:
      return null;
  }
}
