import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { PipelineStepper } from './PipelineStepper';
import { CollapsibleSection, SummaryItem } from './CollapsibleSection';
import {
  BACKEND_LABELS,
  CONTENT_TYPE_LABELS,
  JOB_STATUS_LABELS,
  ContentJob,
  JobStepTimelineEntry,
} from '../types';
import { getVoiceLabelById } from '../constants/models';
import { Theme } from '@/theme';

type Props = {
  job: ContentJob;
  timeline?: JobStepTimelineEntry[];
  isTimelineLoading?: boolean;
  isAwaitingApproval: boolean;
  isReviewable: boolean;
  isDeletable: boolean;
  onRetry: () => void;
  onCancel: () => void;
  onPublish: () => void;
  onDelete: () => void;
  onReview: () => void;
};

const SECTION_IDS = [
  'pipeline',
  'stepTimeline',
  'courseProgress',
  'jobDetails',
  'watchdog',
  'coursePlan',
  'publishedCourse',
  'customInstructions',
  'generatedScript',
  'error',
  'imagePrompt',
  'thumbnail',
  'output',
  'courseScripts',
];

export function JobDetailView({
  job,
  timeline = [],
  isTimelineLoading = false,
  isAwaitingApproval,
  isReviewable,
  isDeletable,
  onRetry,
  onCancel,
  onPublish,
  onDelete,
  onReview,
}: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [errorManuallyCollapsed, setErrorManuallyCollapsed] = useState(false);
  const [selectedCourseScript, setSelectedCourseScript] = useState<string>('');

  const courseScripts = job.courseFormattedScripts || job.courseRawScripts || {};
  const courseScriptKeys = Object.keys(courseScripts).sort(
    (a, b) => getCourseScriptOrder(a) - getCourseScriptOrder(b)
  );
  const activeCourseScript = selectedCourseScript || courseScriptKeys[0] || '';

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    SECTION_IDS.forEach((sectionId) => {
      initial[sectionId] = false;
    });
    if (job.error) {
      initial.error = true;
    }
    setExpandedSections(initial);
    setErrorManuallyCollapsed(false);
    if (job.contentType === 'course') {
      const scripts = job.courseFormattedScripts || job.courseRawScripts || {};
      const sorted = Object.keys(scripts).sort(
        (a, b) => getCourseScriptOrder(a) - getCourseScriptOrder(b)
      );
      const firstScript = sorted[0] || '';
      setSelectedCourseScript(firstScript);
    }
  }, [job.id, job.error, job.courseFormattedScripts, job.courseRawScripts, job.contentType]);

  const createdDate = job.createdAt?.toDate
    ? job.createdAt.toDate().toLocaleString()
    : 'Unknown';

  const sections = buildSections({
    job,
    timeline,
    isTimelineLoading,
    theme,
    styles,
    createdDate,
    courseScriptKeys,
    activeCourseScript,
    courseScripts,
    setSelectedCourseScript,
  });

  const visibleSections = sections.filter((section) => section.shouldRender);
  const allExpanded =
    visibleSections.length > 0 &&
    visibleSections.every((section) => expandedSections[section.id]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const nextExpanded = !prev[sectionId];
      if (sectionId === 'error') {
        setErrorManuallyCollapsed(!nextExpanded);
      }
      return { ...prev, [sectionId]: nextExpanded };
    });
  };

  const handleExpandAll = () => {
    setExpandedSections((prev) => {
      const next = { ...prev };
      visibleSections.forEach((section) => {
        next[section.id] = true;
      });
      return next;
    });
    setErrorManuallyCollapsed(false);
  };

  const handleCollapseAll = () => {
    setExpandedSections((prev) => {
      const next = { ...prev };
      visibleSections.forEach((section) => {
        if (section.id === 'error' && job.error && !errorManuallyCollapsed) {
          next[section.id] = true;
          return;
        }
        next[section.id] = false;
      });
      return next;
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Job Details</Text>
        <Pressable
          style={({ pressed }) => [
            styles.controlButton,
            pressed && { opacity: 0.85 },
          ]}
          onPress={allExpanded ? handleCollapseAll : handleExpandAll}
        >
          <Ionicons
            name={allExpanded ? 'contract-outline' : 'expand-outline'}
            size={16}
            color={theme.colors.text}
          />
        </Pressable>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Current Status</Text>
        <Text
          style={[
            styles.statusValue,
            {
              color:
                job.status === 'completed'
                  ? theme.colors.success
                  : job.status === 'failed'
                    ? theme.colors.error
                    : theme.colors.primary,
            },
          ]}
        >
          {JOB_STATUS_LABELS[job.status]}
        </Text>
      </View>

      {visibleSections.map((section) => (
        <CollapsibleSection
          key={section.id}
          title={section.title}
          summaryItems={section.summaryItems}
          expanded={Boolean(expandedSections[section.id])}
          onToggle={() => toggleSection(section.id)}
        >
          {section.content}
        </CollapsibleSection>
      ))}

      {/* Actions */}
      {job.status === 'failed' && (
        <PrimaryButton
          label="Retry Job"
          icon="refresh"
          color={theme.colors.primary}
          onPress={onRetry}
        />
      )}

      {isReviewable && (
        <PrimaryButton
          label="Review Audio"
          icon="play-circle-outline"
          color={theme.colors.primary}
          onPress={onReview}
        />
      )}

      {isAwaitingApproval && (
        <PrimaryButton
          label="Publish Now"
          icon="cloud-upload-outline"
          color={theme.colors.success}
          onPress={onPublish}
        />
      )}

      {isDeletable && (
        <PrimaryButton
          label="Delete Job"
          icon="trash-outline"
          color={theme.colors.error}
          onPress={onDelete}
        />
      )}

      {job.status !== 'completed' && job.status !== 'failed' && (
        <Pressable
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && { opacity: 0.85 },
          ]}
          onPress={onCancel}
        >
          <Ionicons name="close-circle-outline" size={20} color={theme.colors.error} />
          <Text style={styles.cancelText}>Cancel Job</Text>
        </Pressable>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function buildSections(params: {
  job: ContentJob;
  timeline: JobStepTimelineEntry[];
  isTimelineLoading: boolean;
  theme: Theme;
  styles: ReturnType<typeof createStyles>;
  createdDate: string;
  courseScriptKeys: string[];
  activeCourseScript: string;
  courseScripts: Record<string, string>;
  setSelectedCourseScript: (code: string) => void;
}) {
  const {
    job,
    timeline,
    isTimelineLoading,
    theme,
    styles,
    createdDate,
    courseScriptKeys,
    activeCourseScript,
    courseScripts,
    setSelectedCourseScript,
  } = params;

  const sections = [
    {
      id: 'pipeline',
      title: 'Pipeline Progress',
      summaryItems: toSummaryItems([
        { label: 'Current', value: JOB_STATUS_LABELS[job.status] },
      ]),
      shouldRender: true,
      content: <PipelineStepper currentStatus={job.status} />,
    },
    {
      id: 'stepTimeline',
      title: 'Step Timeline',
      summaryItems: toSummaryItems([
        { label: 'Events', value: timeline.length || undefined },
        {
          label: 'Latest',
          value: timeline[0]
            ? `${timeline[0].stepName} • ${formatStepState(timeline[0].state)}`
            : undefined,
        },
      ]),
      shouldRender: isTimelineLoading || timeline.length > 0,
      content: isTimelineLoading ? (
        <View style={styles.timelineLoadingRow}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.emptySubtext}>Loading timeline...</Text>
        </View>
      ) : (
        <View style={styles.scrollBox}>
          <ScrollView nestedScrollEnabled>
            {timeline.map((entry) => (
              <View key={entry.id} style={styles.timelineRow}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.timelineStepName}>{entry.stepName}</Text>
                  <Text
                    style={[
                      styles.timelineState,
                      { color: getStepStateColor(entry.state, theme) },
                    ]}
                  >
                    {formatStepState(entry.state)}
                  </Text>
                </View>
                <View style={styles.timelineMetaRow}>
                  <Text style={styles.timelineMetaText}>
                    {formatTimelineTimestamp(entry.timestamp)}
                  </Text>
                  {entry.runId && (
                    <Text style={styles.timelineMetaText}>
                      Run {truncate(entry.runId, 10)}
                    </Text>
                  )}
                  {typeof entry.attempt === 'number' && (
                    <Text style={styles.timelineMetaText}>
                      Attempt {entry.attempt}
                    </Text>
                  )}
                  <Text style={styles.timelineMetaText}>
                    {formatTimelineSource(entry.source)}
                  </Text>
                </View>
                {(entry.errorCode || entry.errorMessage) && (
                  <Text style={styles.timelineError}>
                    {[entry.errorCode, entry.errorMessage].filter(Boolean).join(': ')}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      ),
    },
    {
      id: 'courseProgress',
      title: 'Course Progress',
      summaryItems: toSummaryItems([
        { label: 'Progress', value: job.courseProgress },
      ]),
      shouldRender: job.contentType === 'course' && Boolean(job.courseProgress),
      content: (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {job.status !== 'completed' && job.status !== 'failed' && (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          )}
          <Text
            style={{
              fontFamily: 'DMSans-SemiBold',
              fontSize: 15,
              color:
                job.status === 'completed'
                  ? theme.colors.success
                  : job.status === 'failed'
                    ? theme.colors.error
                    : theme.colors.primary,
            }}
          >
            {job.courseProgress}
          </Text>
        </View>
      ),
    },
    {
      id: 'jobDetails',
      title: 'Job Details',
      summaryItems: toSummaryItems([
        { label: 'Type', value: CONTENT_TYPE_LABELS[job.contentType] },
        { label: 'Models', value: `${job.llmModel} / ${job.ttsModel}` },
        { label: 'Narrator', value: getVoiceLabelById(job.ttsVoice) },
      ]),
      shouldRender: true,
      content: (
        <>
          {(job.generatedTitle || job.title) && (
            <InfoRow label="Title" value={job.generatedTitle || job.title || ''} />
          )}
          <InfoRow
            label="LLM Backend"
            value={BACKEND_LABELS[job.llmBackend] || job.llmBackend || 'Local'}
          />
          <InfoRow
            label="TTS Backend"
            value={BACKEND_LABELS[job.ttsBackend] || job.ttsBackend || 'Local'}
          />
          <InfoRow label="Content Type" value={CONTENT_TYPE_LABELS[job.contentType]} />
          {job.contentType === 'course' ? (
            <>
              <InfoRow label="Course Code" value={job.params.courseCode || ''} />
              <InfoRow label="Course Title" value={job.params.courseTitle || ''} />
              <InfoRow label="Subject" value={job.params.subjectLabel || ''} />
              <InfoRow label="Audience" value={job.params.targetAudience || ''} />
              <InfoRow label="Tone" value={job.params.tone || ''} />
              <InfoRow label="Description" value={job.params.topic} />
            </>
          ) : (
            <>
              <InfoRow label="Topic" value={job.params.topic} />
              <InfoRow label="Duration" value={`${job.params.duration_minutes} minutes`} />
              {job.params.difficulty && (
                <InfoRow label="Difficulty" value={job.params.difficulty} />
              )}
              {job.params.style && <InfoRow label="Style" value={job.params.style} />}
              {job.params.technique && (
                <InfoRow label="Technique" value={job.params.technique} />
              )}
            </>
          )}
          <InfoRow label="Auto-publish" value={job.autoPublish ? 'Yes' : 'No (needs approval)'} />
          <InfoRow label="LLM Model" value={job.llmModel} />
          <InfoRow label="TTS Model" value={job.ttsModel} />
          <InfoRow label="Narrator" value={getVoiceLabelById(job.ttsVoice)} />
          <InfoRow label="Voice ID" value={job.ttsVoice} />
          {job.lastCompletedStage && (
            <InfoRow label="Last Completed" value={JOB_STATUS_LABELS[job.lastCompletedStage]} />
          )}
          {job.failedStage && (
            <InfoRow label="Failed Stage" value={JOB_STATUS_LABELS[job.failedStage]} />
          )}
          {job.errorCode && <InfoRow label="Error Code" value={job.errorCode} />}
          {typeof job.resumeAvailable === 'boolean' && (
            <InfoRow label="Resume Available" value={job.resumeAvailable ? 'Yes' : 'No'} />
          )}
          {job.engine && <InfoRow label="Engine" value={job.engine.toUpperCase()} />}
          {job.jobRunId && <InfoRow label="Run ID" value={job.jobRunId} />}
          {typeof job.runAttempt === 'number' && (
            <InfoRow label="Run Attempt" value={`${job.runAttempt}`} />
          )}
          {job.lastRunStatus && <InfoRow label="Run Status" value={job.lastRunStatus} />}
          {job.v2RunId && <InfoRow label="V2 Run ID" value={job.v2RunId} />}
          {job.v2DispatchError && <InfoRow label="V2 Dispatch Error" value={job.v2DispatchError} />}
          <InfoRow label="Created" value={createdDate} />
        </>
      ),
    },
    {
      id: 'watchdog',
      title: 'Watchdog Resets',
      summaryItems: toSummaryItems([
        {
          label: 'Resets',
          value: job.watchdogResetCount ? `${job.watchdogResetCount}` : undefined,
        },
        {
          label: 'Reason',
          value: job.lastWatchdogReason
            ? truncate(job.lastWatchdogReason, 40)
            : undefined,
        },
      ]),
      shouldRender: Boolean(job.watchdogResetCount && job.watchdogResetCount > 0),
      content: (
        <>
          <InfoRow label="Reset Count" value={`${job.watchdogResetCount || 0}`} />
          {job.lastWatchdogResetAt?.toDate && (
            <InfoRow
              label="Last Reset"
              value={job.lastWatchdogResetAt.toDate().toLocaleString()}
            />
          )}
          {job.lastWatchdogReason && (
            <InfoRow label="Reason" value={job.lastWatchdogReason} />
          )}
        </>
      ),
    },
    {
      id: 'coursePlan',
      title: 'Course Plan',
      summaryItems: toSummaryItems([
        {
          label: 'Modules',
          value: job.coursePlan?.modules ? job.coursePlan.modules.length : undefined,
        },
        {
          label: 'Title',
          value: job.coursePlan?.courseTitle || job.params.courseTitle,
        },
      ]),
      shouldRender: job.contentType === 'course' && Boolean(job.coursePlan),
      content: (
        <View style={styles.scrollBox}>
          <ScrollView nestedScrollEnabled>
            {job.coursePlan?.courseGoal && (
              <Text style={[styles.scriptText, { marginBottom: 12 }]}>
                {job.coursePlan.courseGoal}
              </Text>
            )}
            {(job.coursePlan?.modules || []).map((mod: any, i: number) => (
              <View
                key={i}
                style={{
                  marginBottom: 12,
                  borderTopWidth: i > 0 ? 1 : 0,
                  borderTopColor: theme.colors.gray[200],
                  paddingTop: i > 0 ? 12 : 0,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'DMSans-SemiBold',
                    fontSize: 14,
                    color: theme.colors.text,
                    marginBottom: 4,
                  }}
                >
                  Module {mod.moduleNumber || i + 1}: {mod.moduleTitle}
                </Text>
                {mod.objective && (
                  <Text style={styles.subtleText}>Objective: {mod.objective}</Text>
                )}
                {mod.lessonTitle && (
                  <Text style={styles.subtleText}>Lesson: {mod.lessonTitle}</Text>
                )}
                {mod.lessonSummary && (
                  <Text style={styles.subtleText}>Summary: {mod.lessonSummary}</Text>
                )}
                {mod.practiceTitle && (
                  <Text style={styles.subtleText}>Practice: {mod.practiceTitle}</Text>
                )}
                {mod.practiceType && (
                  <Text style={styles.subtleText}>Practice Type: {mod.practiceType}</Text>
                )}
                {Array.isArray(mod.reflectionPrompts) && mod.reflectionPrompts.length > 0 && (
                  <Text style={styles.subtleText}>
                    Prompts: {mod.reflectionPrompts.join(' • ')}
                  </Text>
                )}
                {mod.keyTakeaway && (
                  <Text style={styles.subtleText}>Key Takeaway: {mod.keyTakeaway}</Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      ),
    },
    {
      id: 'publishedCourse',
      title: 'Published Course',
      summaryItems: toSummaryItems([
        { label: 'Course ID', value: job.courseId },
        {
          label: 'Sessions',
          value: job.courseSessionIds ? `${job.courseSessionIds.length}` : undefined,
        },
      ]),
      shouldRender: job.contentType === 'course' && Boolean(job.courseId),
      content: (
        <>
          <InfoRow label="Course ID" value={job.courseId || ''} />
          {job.courseSessionIds && (
            <InfoRow label="Sessions" value={`${job.courseSessionIds.length} published`} />
          )}
        </>
      ),
    },
    {
      id: 'customInstructions',
      title: 'Custom Instructions',
      summaryItems: toSummaryItems([
        {
          label: 'Preview',
          value: job.params.customInstructions
            ? truncate(job.params.customInstructions.trim(), 40)
            : undefined,
        },
      ]),
      shouldRender: Boolean(job.params.customInstructions),
      content: (
        <View style={styles.scrollBox}>
          <ScrollView nestedScrollEnabled>
            <Text style={styles.scriptText}>{job.params.customInstructions}</Text>
          </ScrollView>
        </View>
      ),
    },
    {
      id: 'generatedScript',
      title: 'Generated Script',
      summaryItems: toSummaryItems([
        {
          label: 'Length',
          value: job.generatedScript ? `${job.generatedScript.length}` : undefined,
        },
      ]),
      shouldRender: Boolean(job.generatedScript),
      content: (
        <View style={styles.scrollBox}>
          <ScrollView nestedScrollEnabled>
            <Text style={styles.scriptText}>{job.generatedScript}</Text>
          </ScrollView>
        </View>
      ),
    },
    {
      id: 'error',
      title: 'Error',
      summaryItems: toSummaryItems([{ label: 'Error', value: getErrorType(job.error) }]),
      shouldRender: Boolean(job.error),
      content: (
        <View style={styles.scrollBox}>
          <ScrollView nestedScrollEnabled>
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
              <Text style={styles.errorText}>{job.error}</Text>
            </View>
          </ScrollView>
        </View>
      ),
    },
    {
      id: 'imagePrompt',
      title: 'Image Prompt',
      summaryItems: toSummaryItems([{ label: 'Prompt', value: 'Present' }]),
      shouldRender: Boolean(job.imagePrompt),
      content: (
        <View style={styles.scrollBox}>
          <ScrollView nestedScrollEnabled>
            <Text style={styles.scriptText}>{job.imagePrompt}</Text>
          </ScrollView>
        </View>
      ),
    },
    {
      id: 'thumbnail',
      title: 'Thumbnail',
      summaryItems: toSummaryItems([
        { label: 'Source', value: job.thumbnailUrl ? 'URL' : job.imagePath ? 'Path' : '' },
      ]),
      shouldRender: Boolean(job.thumbnailUrl || job.imagePath),
      content: (
        <>
          {job.thumbnailUrl ? (
            <Image source={{ uri: job.thumbnailUrl }} style={styles.thumbnailImage} />
          ) : (
            <Text style={styles.emptySubtext}>Thumbnail URL not available.</Text>
          )}
          {job.thumbnailUrl && <InfoRow label="Thumbnail URL" value={job.thumbnailUrl} />}
          {job.imagePath && <InfoRow label="Image Path" value={job.imagePath} />}
        </>
      ),
    },
    {
      id: 'courseScripts',
      title: 'Course Scripts',
      summaryItems: toSummaryItems([
        { label: 'Scripts', value: courseScriptKeys.length || undefined },
        {
          label: 'Selected',
          value: activeCourseScript
            ? getCourseScriptTitle(activeCourseScript, job.coursePlan)
            : undefined,
        },
      ]),
      shouldRender: job.contentType === 'course' && courseScriptKeys.length > 0,
      content: (
        <>
          <View style={styles.scriptPicker}>
            {courseScriptKeys.map((code) => {
              const selected = code === activeCourseScript;
              return (
                <Pressable
                  key={code}
                  onPress={() => setSelectedCourseScript(code)}
                  style={[
                    styles.scriptChip,
                    selected && styles.scriptChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.scriptChipText,
                      selected && styles.scriptChipTextActive,
                    ]}
                  >
                    {getCourseScriptTitle(code, job.coursePlan)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.scrollBox}>
            <ScrollView nestedScrollEnabled>
              <Text style={styles.scriptText}>
                {courseScripts[activeCourseScript]}
              </Text>
            </ScrollView>
          </View>
        </>
      ),
    },
    {
      id: 'output',
      title: 'Output',
      summaryItems: toSummaryItems([
        { label: 'Duration', value: formatDuration(job.audioDurationSec) || undefined },
        { label: 'Content ID', value: job.publishedContentId },
      ]),
      shouldRender: Boolean(job.audioPath),
      content: (
        <>
          <InfoRow label="Audio Path" value={job.audioPath || ''} />
          {job.audioDurationSec && (
            <InfoRow label="Audio Duration" value={formatDuration(job.audioDurationSec)} />
          )}
          {job.publishedContentId && (
            <InfoRow label="Content ID" value={job.publishedContentId} />
          )}
        </>
      ),
    },
  ];

  return sections;
}

function formatDuration(seconds?: number) {
  if (!seconds && seconds !== 0) return '';
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, '0')}`;
}

function formatTimelineTimestamp(timestamp?: { toDate?: () => Date }) {
  if (!timestamp?.toDate) return 'No timestamp';
  return timestamp.toDate().toLocaleString();
}

function formatStepState(state: string) {
  return state
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getStepStateColor(state: string, theme: Theme) {
  if (state === 'failed') return theme.colors.error;
  if (state === 'succeeded' || state === 'completed') return theme.colors.success;
  if (state === 'retry_scheduled') return theme.colors.warning;
  if (state === 'running' || state === 'publishing') return theme.colors.primary;
  return theme.colors.textMuted;
}

function formatTimelineSource(_source: JobStepTimelineEntry['source']) {
  return 'V2';
}

function toSummaryItems(
  items: Array<{ label: string; value?: string | number | null }>
): SummaryItem[] {
  return items
    .filter((item) => item.value !== undefined && item.value !== null)
    .map((item) => ({
      label: item.label,
      value: String(item.value).trim(),
    }))
    .filter((item) => item.value.length > 0);
}

function getErrorType(error?: string) {
  if (!error) return '';
  const parts = error.split(':');
  return (parts[0] || 'Error').trim();
}

const COURSE_LABELS: Record<string, string> = {
  INT: 'Course Intro',
  M1L: 'Module 1 — Lesson',
  M1P: 'Module 1 — Practice',
  M2L: 'Module 2 — Lesson',
  M2P: 'Module 2 — Practice',
  M3L: 'Module 3 — Lesson',
  M3P: 'Module 3 — Practice',
  M4L: 'Module 4 — Lesson',
  M4P: 'Module 4 — Practice',
};

const COURSE_SUFFIX_ORDER = Object.keys(COURSE_LABELS);

function getCourseScriptOrder(code: string) {
  const suffix = COURSE_SUFFIX_ORDER.find((key) => code.endsWith(key));
  const index = suffix ? COURSE_SUFFIX_ORDER.indexOf(suffix) : -1;
  return index === -1 ? 999 : index;
}

function getCourseScriptTitle(code: string, plan?: any) {
  if (!code) return code;
  if (code.endsWith('INT')) {
    return plan?.intro?.title || COURSE_LABELS.INT;
  }
  const match = code.match(/M(\d)([LP])$/);
  if (!match) return code;
  const moduleIndex = Number(match[1]) - 1;
  const type = match[2];
  const module = plan?.modules?.[moduleIndex];
  if (type === 'L') {
    return module?.lessonTitle || COURSE_LABELS[`M${match[1]}L`];
  }
  return module?.practiceTitle || COURSE_LABELS[`M${match[1]}P`];
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return value.slice(0, max) + '...';
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 8 }}>
      <Text
        style={{
          fontFamily: 'DMSans-Medium',
          fontSize: 14,
          color: theme.colors.textMuted,
          width: 120,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'DMSans-Regular',
          fontSize: 14,
          color: theme.colors.text,
          flex: 1,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function PrimaryButton({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: any;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: color,
          borderRadius: 16,
          paddingVertical: 16,
          gap: 10,
          marginTop: 12,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color="#fff" />
      <Text
        style={{
          fontFamily: 'DMSans-SemiBold',
          fontSize: 16,
          color: '#fff',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: 20,
    },
    title: {
      fontFamily: 'DMSans-Bold',
      fontSize: 20,
      color: theme.colors.text,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    statusCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      marginBottom: 16,
      ...theme.shadows.sm,
    },
    statusLabel: {
      fontFamily: 'DMSans-Regular',
      fontSize: 13,
      color: theme.colors.textMuted,
      marginBottom: 4,
    },
    statusValue: {
      fontFamily: 'DMSans-Bold',
      fontSize: 22,
    },
    controlButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
    },
    scrollBox: {
      maxHeight: 320,
    },
    scriptText: {
      fontFamily: 'DMSans-Regular',
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 22,
    },
    subtleText: {
      fontFamily: 'DMSans-Regular',
      fontSize: 13,
      color: theme.colors.textMuted,
      lineHeight: 20,
      marginBottom: 4,
    },
    timelineLoadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    timelineRow: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.gray[200],
    },
    timelineHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 4,
    },
    timelineStepName: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 13,
      color: theme.colors.text,
      flex: 1,
    },
    timelineState: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 12,
    },
    timelineMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 4,
    },
    timelineMetaText: {
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    timelineError: {
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.error,
    },
    errorCard: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
    },
    errorText: {
      fontFamily: 'DMSans-Regular',
      fontSize: 14,
      color: theme.colors.error,
      flex: 1,
      lineHeight: 20,
    },
    emptySubtext: {
      fontFamily: 'DMSans-Regular',
      fontSize: 13,
      color: theme.colors.textMuted,
      marginBottom: 8,
    },
    thumbnailImage: {
      width: '100%',
      height: 180,
      borderRadius: 12,
      marginBottom: 12,
      backgroundColor: theme.colors.gray[200],
    },
    scriptPicker: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    scriptChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.colors.gray[100],
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
    },
    scriptChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    scriptChipText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 12,
      color: theme.colors.text,
    },
    scriptChipTextActive: {
      color: '#fff',
    },
    cancelButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: `${theme.colors.error}15`,
      marginTop: 12,
    },
    cancelText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 15,
      color: theme.colors.error,
    },
  });
