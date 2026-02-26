import { Timestamp } from 'firebase/firestore';

// ==================== JOB STATUS ====================

export type JobStatus =
  | 'pending'
  | 'llm_generating'
  | 'qa_formatting'
  | 'image_generating'
  | 'tts_pending'
  | 'tts_converting'
  | 'post_processing'
  | 'uploading'
  | 'publishing'
  | 'completed'
  | 'failed';

export const JOB_STATUS_ORDER: JobStatus[] = [
  'pending',
  'llm_generating',
  'qa_formatting',
  'image_generating',
  'tts_pending',
  'tts_converting',
  'post_processing',
  'uploading',
  'publishing',
  'completed',
];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'Pending',
  llm_generating: 'Generating Script',
  qa_formatting: 'Formatting',
  image_generating: 'Generating Image',
  tts_pending: 'Waiting for TTS',
  tts_converting: 'Converting to Audio',
  post_processing: 'Processing Audio',
  uploading: 'Uploading',
  publishing: 'Publishing',
  completed: 'Completed',
  failed: 'Failed',
};

// ==================== JOB BACKEND ====================

export type JobBackend = 'local' | 'api' | 'cloud';

/** Backends selectable in the admin UI. Cloud is kept for legacy but hidden. */
export const AVAILABLE_BACKENDS: JobBackend[] = ['local', 'api'];

export const BACKEND_LABELS: Record<JobBackend, string> = {
  local: 'Local',
  api: 'Gemini API',
  cloud: 'Cloud GPU',
};

export const BACKEND_DESCRIPTIONS: Record<JobBackend, string> = {
  local: 'Runs on your Mac (Ollama must be running)',
  api: 'Uses Gemini API (free tier)',
  cloud: 'Runs on GCE VM with GPU (unavailable)',
};

// ==================== CONTENT TYPES ====================

export type FactoryContentType =
  | 'guided_meditation'
  | 'sleep_meditation'
  | 'bedtime_story'
  | 'emergency_meditation'
  | 'course_session'
  | 'course';

export const CONTENT_TYPE_LABELS: Record<FactoryContentType, string> = {
  guided_meditation: 'Guided Meditation',
  sleep_meditation: 'Sleep Meditation',
  bedtime_story: 'Bedtime Story',
  emergency_meditation: 'Emergency Meditation',
  course_session: 'Course Session',
  course: 'Full Course (9 audio)',
};

// ==================== JOB PARAMS ====================

export interface ContentJobParams {
  topic: string;
  duration_minutes: number;
  style?: string;
  technique?: string;
  themes?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  customInstructions?: string;

  // Course-specific params (only when contentType === 'course')
  courseCode?: string;
  courseTitle?: string;
  subjectId?: string;
  subjectLabel?: string;
  subjectColor?: string;
  subjectIcon?: string;
  targetAudience?: 'beginner' | 'intermediate';
  tone?: 'gentle' | 'energetic' | 'very calm';
}

// ==================== CONTENT JOB ====================

export interface ContentJob {
  id: string;
  status: JobStatus;

  // Execution backends (independent per component)
  llmBackend: JobBackend;
  ttsBackend: JobBackend;

  // What to create
  contentType: FactoryContentType;
  params: ContentJobParams;

  // Model selection
  llmModel: string;
  ttsModel: string;
  ttsVoice: string;

  // Title — admin can set manually; if empty, LLM auto-generates one
  title?: string;

  // Publishing control
  autoPublish: boolean;

  // Pipeline outputs (filled as pipeline progresses)
  generatedScript?: string;
  formattedScript?: string;
  generatedTitle?: string;
  audioPath?: string;
  audioDurationSec?: number;
  publishedContentId?: string;
  imagePrompt?: string;
  imagePath?: string;
  thumbnailUrl?: string;
  imageModel?: string;
  lastCompletedStage?: JobStatus;
  failedStage?: JobStatus;
  resumeAvailable?: boolean;

  // Course-specific outputs
  courseProgress?: string;         // e.g. "Script 3/9", "Audio 5/9"
  coursePlan?: Record<string, any>;
  courseRawScripts?: Record<string, string>;
  courseFormattedScripts?: Record<string, string>;
  courseAudioResults?: Record<string, { storagePath: string; durationSec: number }>;
  coursePreviewSessions?: Array<{
    code: string;
    label: string;
    title: string;
    order: number;
    audioPath: string;
    durationSec: number;
  }>;
  courseSessionIds?: string[];     // published session doc IDs
  courseId?: string;               // published course doc ID

  // Metadata
  error?: string;
  deleteRequested?: boolean;
  deleteRequestedAt?: Timestamp;
  deleteInProgress?: boolean;
  deleteError?: string;

  // Watchdog tracking
  watchdogResetCount?: number;
  lastWatchdogResetAt?: Timestamp;
  lastWatchdogReason?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
  startedAt?: Timestamp;
  ttsPendingAt?: Timestamp;
  completedAt?: Timestamp;
  createdBy: string;
}

// ==================== LOCAL DRAFTS ====================

export interface ContentDraft {
  id: string;
  contentType: FactoryContentType;

  // Common fields
  title: string;
  topic: string;
  duration: number;
  style: string;
  technique: string;
  difficulty: string;
  customInstructions: string;
  imagePrompt: string;
  autoPublish: boolean;

  // Course fields
  courseCode: string;
  courseTitle: string;
  subjectId: string;
  targetAudience: string;
  tone: string;

  // Model configuration
  llmBackend: JobBackend;
  ttsBackend: JobBackend;
  llmModel: string;
  ttsModel: string;
  ttsVoice: string;

  // Metadata
  createdAt: number;
  updatedAt: number;
}

// ==================== WORKER STATUS ====================

export interface WorkerStatus {
  id: string;
  workerId?: string;
  workerType?: 'local' | 'cloud';
  lastHeartbeat?: Timestamp;
  updatedAt?: Timestamp;
  pollIntervalSec?: number;
}

// ==================== WORKER CONTROL ====================

export type WorkerDesiredState = 'auto' | 'running' | 'stopped';
export type WorkerRuntimeState = 'running' | 'stopped' | 'starting' | 'stopping';

export interface WorkerControl {
  id: string;
  desiredState?: WorkerDesiredState;
  idleTimeoutMin?: number;
  currentState?: WorkerRuntimeState;
  workerPid?: number | null;
  lastAction?: string;
  lastError?: string | null;
  lastChangeAt?: Timestamp;
  requestedBy?: string;
  requestedAt?: Timestamp;
}

// ==================== CREATE JOB INPUT ====================

export interface CreateJobInput {
  llmBackend: JobBackend;
  ttsBackend: JobBackend;
  contentType: FactoryContentType;
  params: ContentJobParams;
  llmModel: string;
  ttsModel: string;
  ttsVoice: string;
  title?: string;
  imagePrompt?: string;
  autoPublish: boolean;
}
