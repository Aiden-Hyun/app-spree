import { Timestamp } from 'firebase/firestore';

export type ContentManagerCollection =
  | 'guided_meditations'
  | 'sleep_meditations'
  | 'bedtime_stories'
  | 'emergency_meditations'
  | 'courses'
  | 'course_sessions';

export type ContentManagerAccess = 'free' | 'premium';

export type ContentManagerTypeFilter = 'all' | ContentManagerCollection;

export interface ContentPreviewRoute {
  pathname:
    | '/meditation/[id]'
    | '/sleep/meditation/[id]'
    | '/sleep/[id]'
    | '/emergency/[id]'
    | '/course/[id]'
    | '/course/session/[id]';
  params: Record<string, string> & {
    id: string;
  };
}

export interface ContentManagerFilterState {
  query: string;
  type: ContentManagerTypeFilter;
  access: 'all' | ContentManagerAccess;
}

export interface ContentManagerItemSummary {
  id: string;
  collection: ContentManagerCollection;
  typeLabel: string;
  title: string;
  description?: string;
  identifier: string;
  code?: string;
  access: ContentManagerAccess;
  durationMinutes?: number;
  thumbnailUrl?: string;
  previewRoute: ContentPreviewRoute;
}

export interface ContentManagerMetadataField {
  label: string;
  value: string;
  monospace?: boolean;
}

export type ContentManagerFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect';

export interface ContentManagerEditFieldOption {
  value: string;
  label: string;
}

export interface ContentManagerEditFieldDefinition {
  name: string;
  label: string;
  type: ContentManagerFieldType;
  required?: boolean;
  options?: ContentManagerEditFieldOption[];
  placeholder?: string;
  helperText?: string;
}

export type ContentManagerEditableValue = string | number | string[] | null;

export type ContentManagerEditableValues = Record<string, ContentManagerEditableValue>;

export type ContentManagerEditFormValue = string | string[];

export type ContentManagerEditFormValues = Record<string, ContentManagerEditFormValue>;

export interface ContentManagerAuditEntry {
  id: string;
  actorUid: string;
  actorEmail?: string;
  reason: string;
  changedFields: string[];
  before: ContentManagerEditableValues;
  after: ContentManagerEditableValues;
  createdAt?: Timestamp;
}

export interface ContentManagerSaveResult {
  changed: boolean;
  changedFields: string[];
}

export interface ContentManagerRelation {
  label: string;
  collection: ContentManagerCollection;
  id: string;
  title: string;
  code?: string;
}

export interface ContentManagerItemDetail extends ContentManagerItemSummary {
  metadata: ContentManagerMetadataField[];
  relations: ContentManagerRelation[];
  editableFields: ContentManagerEditFieldDefinition[];
  editableValues: ContentManagerEditableValues;
}

export const CONTENT_MANAGER_COLLECTION_LABELS: Record<ContentManagerCollection, string> = {
  guided_meditations: 'Guided Meditation',
  sleep_meditations: 'Sleep Meditation',
  bedtime_stories: 'Bedtime Story',
  emergency_meditations: 'Emergency Meditation',
  courses: 'Course',
  course_sessions: 'Course Session',
};

export const CONTENT_MANAGER_COLLECTIONS: ContentManagerCollection[] = [
  'guided_meditations',
  'sleep_meditations',
  'bedtime_stories',
  'emergency_meditations',
  'courses',
  'course_sessions',
];

export const CONTENT_MANAGER_DEFAULT_FILTERS: ContentManagerFilterState = {
  query: '',
  type: 'all',
  access: 'all',
};

export function isContentManagerCollection(
  value: string | string[] | undefined
): value is ContentManagerCollection {
  return (
    typeof value === 'string' &&
    CONTENT_MANAGER_COLLECTIONS.includes(value as ContentManagerCollection)
  );
}
