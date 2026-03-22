import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  TextInput,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { PipelineStepper } from './PipelineStepper';
import { CollapsibleSection, SummaryItem } from './CollapsibleSection';
import { CoursePipelineMap } from './progress/CoursePipelineMap';
import { WorkerSwimlanes } from './progress/WorkerSwimlanes';
import {
  CourseProgressModel,
  deriveCourseProgressModel,
} from './progress/courseProgressModel';
import {
  BACKEND_LABELS,
  CONTENT_TYPE_LABELS,
  CourseRegenerationMode,
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
  publishButtonLabel?: string;
  onRegenerateCourse: (input: {
    mode: CourseRegenerationMode;
    targetSessionCodes: string[];
    formattedScriptEdits?: Record<string, string>;
  }) => Promise<void>;
  onApprovePendingScripts: (input?: {
    rawScriptEdits?: Record<string, string>;
    script?: string;
  }) => Promise<void>;
  onRegeneratePendingScripts: () => Promise<void>;
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
  'courseRegeneration',
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
  publishButtonLabel = 'Publish Now',
  onRegenerateCourse,
  onApprovePendingScripts,
  onRegeneratePendingScripts,
  onDelete,
  onReview,
}: Props) {
  const { theme } = useTheme();
  const { width: viewportWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    buildInitialExpandedSections(job)
  );
  const [errorManuallyCollapsed, setErrorManuallyCollapsed] = useState(false);
  const [selectedCourseScript, setSelectedCourseScript] = useState<string>('');
  const [pipelineTab, setPipelineTab] = useState<'pipeline' | 'workers'>('pipeline');
  const [regenerationMode, setRegenerationMode] = useState<CourseRegenerationMode>('audio_only');
  const [selectedRegenerationSessions, setSelectedRegenerationSessions] = useState<string[]>([]);
  const [regenerationScriptEdits, setRegenerationScriptEdits] = useState<Record<string, string>>({});
  const [regenerating, setRegenerating] = useState(false);
  const [approvingScripts, setApprovingScripts] = useState(false);
  const [approvalScriptEdits, setApprovalScriptEdits] = useState<Record<string, string>>({});
  const [singleApprovalScriptEdit, setSingleApprovalScriptEdit] = useState('');
  const [showScriptApprovalModal, setShowScriptApprovalModal] = useState(false);
  const previousJobIdRef = useRef(job.id);

  const courseScripts = useMemo(
    () => mergeCourseScripts(job.courseRawScripts, job.courseFormattedScripts),
    [job.courseFormattedScripts, job.courseRawScripts]
  );
  const courseScriptKeys = Object.keys(courseScripts).sort(
    (a, b) => getCourseScriptOrder(a) - getCourseScriptOrder(b)
  );
  const activeCourseScript = selectedCourseScript || courseScriptKeys[0] || '';
  const courseProgressModel = useMemo(
    () =>
      job.contentType === 'course'
        ? deriveCourseProgressModel(job, timeline, job.v2RunId)
        : null,
    [job, timeline]
  );
  const isAwaitingRegeneratedScriptApproval = Boolean(
    job.contentType === 'course' &&
      job.status === 'completed' &&
      job.courseRegeneration?.active &&
      job.courseRegeneration.mode === 'script_and_audio' &&
      job.courseRegeneration.awaitingScriptApproval
  );
  const isAwaitingSingleScriptApproval = Boolean(
    job.contentType !== 'course' &&
      job.status === 'completed' &&
      job.scriptApproval?.enabled &&
      job.scriptApproval.awaitingApproval
  );
  const isAwaitingInitialScriptApproval = Boolean(
    job.contentType === 'course' &&
      job.status === 'completed' &&
      job.courseScriptApproval?.enabled &&
      job.courseScriptApproval.awaitingApproval
  );
  const isAwaitingAnyScriptApproval =
    isAwaitingRegeneratedScriptApproval ||
    isAwaitingInitialScriptApproval ||
    isAwaitingSingleScriptApproval;
  const approvalSessionCodes = isAwaitingRegeneratedScriptApproval &&
    Array.isArray(job.courseRegeneration?.targetSessionCodes)
      ? job.courseRegeneration.targetSessionCodes
      : isAwaitingInitialScriptApproval
        ? getCanonicalCourseSessionCodes(job)
        : [];
  const approvalSessionCodesKey = approvalSessionCodes.join('|');
  const regenerationTargetSessionCodesKey = Array.isArray(job.courseRegeneration?.targetSessionCodes)
    ? job.courseRegeneration.targetSessionCodes.join('|')
    : '';
  const scriptApprovalTitle = isAwaitingSingleScriptApproval
    ? 'Approve Script'
    : isAwaitingRegeneratedScriptApproval
    ? 'Approve Regenerated Scripts'
    : 'Approve Course Scripts';
  const scriptApprovalSubtitle = isAwaitingSingleScriptApproval
    ? 'Review the script before audio generation begins.'
    : isAwaitingRegeneratedScriptApproval
    ? `Review ${approvalSessionCodes.length} regenerated session${approvalSessionCodes.length === 1 ? '' : 's'} before audio generation begins.`
    : `Review ${approvalSessionCodes.length} course session${approvalSessionCodes.length === 1 ? '' : 's'} before audio generation begins.`;
  const scriptApprovalBody = isAwaitingSingleScriptApproval
    ? 'This script is waiting on your approval. Audio generation will stay paused until you confirm it.'
    : isAwaitingRegeneratedScriptApproval
    ? 'These regenerated scripts are waiting on your approval. Audio generation will stay paused until you confirm them.'
    : 'These course scripts are waiting on your approval. TTS will stay paused until you confirm them.';
  const scriptApprovalPrimaryLabel = approvingScripts
    ? 'Starting Audio...'
    : isAwaitingSingleScriptApproval
      ? 'Approve Script & Start Audio'
      : isAwaitingRegeneratedScriptApproval
      ? 'Approve Scripts & Generate Audio'
      : 'Approve Scripts & Start TTS';
  const scriptRegenerateLabel = regenerating
    ? 'Starting...'
    : isAwaitingSingleScriptApproval
      ? 'Regenerate Script'
      : isAwaitingRegeneratedScriptApproval
      ? 'Regenerate Again'
      : 'Regenerate Scripts';

  useEffect(() => {
    if (previousJobIdRef.current === job.id) {
      return;
    }
    previousJobIdRef.current = job.id;
    setExpandedSections(buildInitialExpandedSections(job));
    setErrorManuallyCollapsed(false);
    setRegenerationMode('audio_only');
    setRegenerationScriptEdits({});
    setSelectedRegenerationSessions([]);
    if (job.contentType === 'course') {
      const firstTargetScript =
        isAwaitingRegeneratedScriptApproval &&
        Array.isArray(job.courseRegeneration?.targetSessionCodes)
          ? job.courseRegeneration.targetSessionCodes.find((code) => courseScriptKeys.includes(code))
          : '';
      setSelectedCourseScript(firstTargetScript || courseScriptKeys[0] || '');
      return;
    }
    setSelectedCourseScript('');
  }, [
    job,
    courseScriptKeys,
    job.contentType,
    isAwaitingRegeneratedScriptApproval,
  ]);

  useEffect(() => {
    if (job.contentType !== 'course') {
      return;
    }

    setSelectedCourseScript((current) => {
      if (current && courseScriptKeys.includes(current)) {
        return current;
      }
      const firstTargetScript =
        isAwaitingRegeneratedScriptApproval &&
        Array.isArray(job.courseRegeneration?.targetSessionCodes)
          ? job.courseRegeneration.targetSessionCodes.find((code) => courseScriptKeys.includes(code))
          : '';
      return firstTargetScript || courseScriptKeys[0] || '';
    });
  }, [
    job.contentType,
    courseScriptKeys,
    isAwaitingRegeneratedScriptApproval,
    regenerationTargetSessionCodesKey,
  ]);

  useEffect(() => {
    setPipelineTab('pipeline');
  }, [job.id]);

  useEffect(() => {
    if (isAwaitingAnyScriptApproval) {
      setShowScriptApprovalModal(true);
      return;
    }
    setShowScriptApprovalModal(false);
  }, [isAwaitingAnyScriptApproval, job.id]);

  useEffect(() => {
    if (!isAwaitingAnyScriptApproval || job.contentType !== 'course') {
      setApprovalScriptEdits({});
      return;
    }

    const nextApprovalEdits: Record<string, string> = {};
    approvalSessionCodes.forEach((sessionCode) => {
      nextApprovalEdits[sessionCode] = String(
        (job.courseRawScripts || {})[sessionCode] ||
          courseScripts[sessionCode] ||
          ''
      );
    });
    setApprovalScriptEdits(nextApprovalEdits);
  }, [
    job.id,
    isAwaitingAnyScriptApproval,
    approvalSessionCodesKey,
    job.courseRawScripts,
    courseScripts,
  ]);

  useEffect(() => {
    if (!isAwaitingSingleScriptApproval) {
      setSingleApprovalScriptEdit('');
      return;
    }

    setSingleApprovalScriptEdit(String(job.generatedScript || ''));
  }, [isAwaitingSingleScriptApproval, job.generatedScript, job.id]);

  const handleApprovePendingScripts = async () => {
    if (approvingScripts) {
      return;
    }

    if (isAwaitingSingleScriptApproval) {
      const nextScript = String(singleApprovalScriptEdit || '').trim();
      if (!nextScript) {
        Alert.alert('Script Required', 'Script cannot be empty.');
        return;
      }

      try {
        setApprovingScripts(true);
        await onApprovePendingScripts({ script: nextScript });
        setShowScriptApprovalModal(false);
        Alert.alert('Approval Started', 'Approved the script. Audio generation will begin shortly.');
      } catch (error) {
        Alert.alert(
          'Approval Failed',
          error instanceof Error ? error.message : 'Unable to approve the script.'
        );
      } finally {
        setApprovingScripts(false);
      }
      return;
    }

    const nextEdits: Record<string, string> = {};

    for (const sessionCode of approvalSessionCodes) {
      const script = String(approvalScriptEdits[sessionCode] || '').trim();
      if (!script) {
        Alert.alert(
          'Script Required',
          `${getCourseScriptTitle(sessionCode, job.coursePlan)} cannot be empty.`
        );
        return;
      }
      nextEdits[sessionCode] = script;
    }

    try {
      setApprovingScripts(true);
      await onApprovePendingScripts({ rawScriptEdits: nextEdits });
      setShowScriptApprovalModal(false);
      Alert.alert(
        'Approval Started',
        `Approved ${approvalSessionCodes.length} session${approvalSessionCodes.length > 1 ? 's' : ''}. Audio generation will begin shortly.`
      );
    } catch (error) {
      Alert.alert(
        'Approval Failed',
        error instanceof Error ? error.message : 'Unable to approve course scripts.'
      );
    } finally {
      setApprovingScripts(false);
    }
  };

  const startPendingScriptRegeneration = async () => {
    if ((!isAwaitingSingleScriptApproval && approvalSessionCodes.length === 0) || regenerating) {
      return;
    }

    if (!isAwaitingRegeneratedScriptApproval) {
      setRegenerating(true);
      try {
        await onRegeneratePendingScripts();
        setShowScriptApprovalModal(false);
        Alert.alert(
          'Regeneration Started',
          isAwaitingSingleScriptApproval
            ? 'Queued script regeneration. A fresh script will be generated shortly.'
            : `Queued regeneration for ${approvalSessionCodes.length} session${approvalSessionCodes.length > 1 ? 's' : ''}.`
        );
      } catch (error) {
        Alert.alert(
          'Regeneration Failed',
          error instanceof Error ? error.message : 'Unable to regenerate scripts.'
        );
      } finally {
        setRegenerating(false);
      }
      return;
    }

    try {
      setRegenerating(true);
      await onRegenerateCourse({
        mode: 'script_and_audio',
        targetSessionCodes: approvalSessionCodes,
      });
      setShowScriptApprovalModal(false);
      Alert.alert(
        'Regeneration Started',
        `Queued regeneration for ${approvalSessionCodes.length} session${approvalSessionCodes.length > 1 ? 's' : ''}.`
      );
    } catch (error) {
      Alert.alert(
        'Regeneration Failed',
        error instanceof Error ? error.message : 'Unable to regenerate scripts.'
      );
    } finally {
      setRegenerating(false);
    }
  };

  const handleRegeneratePendingScripts = () => {
    if ((!isAwaitingSingleScriptApproval && approvalSessionCodes.length === 0) || regenerating) {
      return;
    }

    const message = isAwaitingSingleScriptApproval
      ? 'This will discard the current script and generate a fresh version before TTS starts. Continue?'
      : isAwaitingRegeneratedScriptApproval
      ? 'This will discard the current regenerated scripts and generate a new version for the same sessions. Continue?'
      : 'This will discard the current course scripts and generate a fresh set before TTS starts. Continue?';

    if (Platform.OS === 'web') {
      const webConfirm = (
        globalThis as typeof globalThis & { confirm?: (value?: string) => boolean }
      ).confirm;
      const confirmed =
        typeof webConfirm === 'function' ? webConfirm(message) : true;
      if (!confirmed) {
        return;
      }
      void startPendingScriptRegeneration();
      return;
    }

    Alert.alert(
      isAwaitingSingleScriptApproval
        ? 'Regenerate Script'
        : isAwaitingRegeneratedScriptApproval
          ? 'Regenerate Again'
          : 'Regenerate Course Scripts',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          onPress: () => {
            void startPendingScriptRegeneration();
          },
        },
      ]
    );
  };

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
    courseProgressModel,
    pipelineTab,
    setPipelineTab,
    regenerationMode,
    setRegenerationMode,
    selectedRegenerationSessions,
    setSelectedRegenerationSessions,
    regenerationScriptEdits,
    setRegenerationScriptEdits,
    regenerating,
    setRegenerating,
    onRegenerateCourse,
    onOpenScriptApprovalModal: () => setShowScriptApprovalModal(true),
    onRegeneratePendingScripts: handleRegeneratePendingScripts,
  });

  const visibleSections = sections.filter((section) => section.shouldRender);
  const webSectionColumns = getWebSectionColumns(viewportWidth);
  const useWebSectionColumns = Platform.OS === 'web' && webSectionColumns > 1;
  const webSectionLayout = useMemo(
    () =>
      useWebSectionColumns
        ? buildWebSectionColumns(visibleSections, expandedSections, webSectionColumns)
        : [],
    [visibleSections, expandedSections, webSectionColumns, useWebSectionColumns]
  );
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
    <>
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

        {useWebSectionColumns ? (
          <View style={styles.sectionColumns}>
            {webSectionLayout.map((column, columnIndex) => (
              <View key={`section-column-${columnIndex}`} style={styles.sectionColumn}>
                {column.map((section) => {
                  const isExpanded = Boolean(expandedSections[section.id]);

                  return (
                    <CollapsibleSection
                      key={section.id}
                      title={section.title}
                      summaryItems={section.summaryItems}
                      expanded={isExpanded}
                      onToggle={() => toggleSection(section.id)}
                    >
                      {section.content}
                    </CollapsibleSection>
                  );
                })}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.sectionStack}>
            {visibleSections.map((section) => {
              const isExpanded = Boolean(expandedSections[section.id]);

              return (
                <CollapsibleSection
                  key={section.id}
                  title={section.title}
                  summaryItems={section.summaryItems}
                  expanded={isExpanded}
                  onToggle={() => toggleSection(section.id)}
                >
                  {section.content}
                </CollapsibleSection>
              );
            })}
          </View>
        )}

        {/* Actions */}
        {job.status === 'failed' && (
          <PrimaryButton
            label="Retry Job"
            icon="refresh"
            color={theme.colors.primary}
            onPress={onRetry}
          />
        )}

        {isAwaitingAnyScriptApproval && (
          <PrimaryButton
            label={isAwaitingSingleScriptApproval ? 'Review & Approve Script' : 'Review & Approve Scripts'}
            icon="document-text-outline"
            color={theme.colors.success}
            onPress={() => setShowScriptApprovalModal(true)}
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
            label={publishButtonLabel}
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

      <Modal
        visible={isAwaitingAnyScriptApproval && showScriptApprovalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowScriptApprovalModal(false)}
      >
        <View style={styles.approvalModalOverlay}>
          <View style={styles.approvalModalCard}>
            <View style={styles.approvalModalHeader}>
              <View style={styles.approvalModalTitleBlock}>
                <Text style={styles.approvalModalTitle}>{scriptApprovalTitle}</Text>
                <Text style={styles.approvalModalSubtitle}>{scriptApprovalSubtitle}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.approvalModalCloseButton,
                  pressed && { opacity: 0.75 },
                ]}
                onPress={() => setShowScriptApprovalModal(false)}
              >
                <Ionicons name="close" size={18} color={theme.colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.approvalModalScroll}
              contentContainerStyle={styles.approvalModalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.approvalModalBody}>{scriptApprovalBody}</Text>
              {isAwaitingSingleScriptApproval ? (
                <View style={styles.scriptEditorList}>
                  <View style={styles.scriptEditorCard}>
                    <Text style={styles.scriptEditorTitle}>
                      {job.generatedTitle || job.title || CONTENT_TYPE_LABELS[job.contentType]}
                    </Text>
                    <Text style={styles.scriptEditorMeta}>{CONTENT_TYPE_LABELS[job.contentType]}</Text>
                    <TextInput
                      multiline
                      editable={!regenerating && !approvingScripts}
                      style={[styles.scriptEditorInput, styles.approvalScriptEditorInput]}
                      value={singleApprovalScriptEdit}
                      onChangeText={setSingleApprovalScriptEdit}
                      placeholder="Edit the script before audio generation"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.scriptEditorList}>
                  {approvalSessionCodes.map((sessionCode) => {
                    const script = approvalScriptEdits[sessionCode] ?? '';
                    return (
                      <View key={sessionCode} style={styles.scriptEditorCard}>
                        <Text style={styles.scriptEditorTitle}>
                          {getCourseScriptTitle(sessionCode, job.coursePlan)}
                        </Text>
                        <Text style={styles.scriptEditorMeta}>{sessionCode}</Text>
                        <TextInput
                          multiline
                          editable={!regenerating && !approvingScripts}
                          style={[styles.scriptEditorInput, styles.approvalScriptEditorInput]}
                          value={script}
                          onChangeText={(value) =>
                            setApprovalScriptEdits((prev) => ({ ...prev, [sessionCode]: value }))
                          }
                          placeholder="Edit script for this session"
                          placeholderTextColor={theme.colors.textMuted}
                        />
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            <View style={styles.approvalModalActions}>
              <View style={styles.approvalModalSecondaryRow}>
                <Pressable
                  onPress={() => setShowScriptApprovalModal(false)}
                  style={({ pressed }) => [
                    styles.approvalModalSecondaryButton,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.approvalModalSecondaryButtonText}>Close</Text>
                </Pressable>
                <Pressable
                  onPress={handleRegeneratePendingScripts}
                  disabled={regenerating || approvingScripts}
                  style={({ pressed }) => [
                    styles.approvalModalRegenerateButton,
                    (regenerating || approvingScripts) && { opacity: 0.6 },
                    pressed && !regenerating && !approvingScripts && { opacity: 0.85 },
                  ]}
                >
                  <Ionicons name="refresh-outline" size={16} color={theme.colors.warning} />
                  <Text style={styles.approvalModalRegenerateButtonText}>
                    {scriptRegenerateLabel}
                  </Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => {
                  void handleApprovePendingScripts();
                }}
                disabled={approvingScripts || regenerating}
                style={({ pressed }) => [
                  styles.approvalModalPrimaryButton,
                  (pressed || approvingScripts || regenerating) && { opacity: 0.85 },
                ]}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={styles.approvalModalPrimaryButtonText}>{scriptApprovalPrimaryLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
  courseProgressModel: CourseProgressModel | null;
  pipelineTab: 'pipeline' | 'workers';
  setPipelineTab: (tab: 'pipeline' | 'workers') => void;
  regenerationMode: CourseRegenerationMode;
  setRegenerationMode: (mode: CourseRegenerationMode) => void;
  selectedRegenerationSessions: string[];
  setSelectedRegenerationSessions: React.Dispatch<React.SetStateAction<string[]>>;
  regenerationScriptEdits: Record<string, string>;
  setRegenerationScriptEdits: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  regenerating: boolean;
  setRegenerating: React.Dispatch<React.SetStateAction<boolean>>;
  onRegenerateCourse: (input: {
    mode: CourseRegenerationMode;
    targetSessionCodes: string[];
    formattedScriptEdits?: Record<string, string>;
  }) => Promise<void>;
  onOpenScriptApprovalModal: () => void;
  onRegeneratePendingScripts: () => void;
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
    courseProgressModel,
    pipelineTab,
    setPipelineTab,
    regenerationMode,
    setRegenerationMode,
    selectedRegenerationSessions,
    setSelectedRegenerationSessions,
    regenerationScriptEdits,
    setRegenerationScriptEdits,
    regenerating,
    setRegenerating,
    onRegenerateCourse,
    onOpenScriptApprovalModal,
    onRegeneratePendingScripts,
  } = params;

  const hasCourseConcurrencyData = Boolean(
    courseProgressModel &&
      courseProgressModel.runEntries.length > 0
  );
  const showCourseConcurrency =
    job.contentType === 'course' &&
    !isTimelineLoading &&
    hasCourseConcurrencyData;
  const showCourseFallbackNotice =
    job.contentType === 'course' &&
    !isTimelineLoading &&
    !showCourseConcurrency;
  const availableSessionCodes = getCanonicalCourseSessionCodes(job);
  const isInitialCourseScriptApprovalPending = Boolean(
    job.courseScriptApproval?.enabled && job.courseScriptApproval.awaitingApproval
  );
  const isCourseRegenerationEligible =
    job.contentType === 'course' &&
    job.status === 'completed' &&
    !isInitialCourseScriptApprovalPending;
  const publishedCourseRegeneration = Boolean(job.courseId);
  const requestedRegeneration = job.courseRegeneration;
  const isAwaitingRegeneratedScriptApproval = Boolean(
    requestedRegeneration?.active &&
      requestedRegeneration.mode === 'script_and_audio' &&
      requestedRegeneration.awaitingScriptApproval
  );
  const selectedSessionSet = new Set(selectedRegenerationSessions);

  const toggleSessionSelection = (sessionCode: string) => {
    setSelectedRegenerationSessions((prev) => (
      prev.includes(sessionCode)
        ? prev.filter((code) => code !== sessionCode)
        : [...prev, sessionCode]
    ));
  };

  const runRegeneration = async (targetSessionCodes: string[]) => {
    if (!isCourseRegenerationEligible) {
      Alert.alert('Unavailable', 'Session regeneration is only available for completed course jobs.');
      return;
    }
    if (targetSessionCodes.length === 0) {
      Alert.alert('Select Sessions', 'Select at least one session to regenerate.');
      return;
    }

    const formattedScriptEdits =
      regenerationMode === 'audio_only'
        ? Object.fromEntries(
            targetSessionCodes
              .map((sessionCode) => {
                const rawValue =
                  regenerationScriptEdits[sessionCode] ??
                  (job.courseFormattedScripts || {})[sessionCode] ??
                  '';
                return [sessionCode, String(rawValue)];
              })
          )
        : undefined;

    try {
      setRegenerating(true);
      await onRegenerateCourse({
        mode: regenerationMode,
        targetSessionCodes,
        formattedScriptEdits,
      });
      Alert.alert(
        'Regeneration Started',
        `Queued regeneration for ${targetSessionCodes.length} session${targetSessionCodes.length > 1 ? 's' : ''}.`
      );
    } catch (error) {
      Alert.alert(
        'Regeneration Failed',
        error instanceof Error ? error.message : 'Unable to start regeneration.'
      );
    } finally {
      setRegenerating(false);
    }
  };

  const sections = [
    {
      id: 'pipeline',
      title: 'Pipeline Progress',
      summaryItems: toSummaryItems([
        { label: 'Current', value: JOB_STATUS_LABELS[job.status] },
        {
          label: 'Run',
          value: showCourseConcurrency
            ? truncate(courseProgressModel?.selectedRunId || '', 12)
            : undefined,
        },
      ]),
      shouldRender: true,
      content: (
        <View style={styles.pipelinePanel}>
          {showCourseConcurrency && courseProgressModel ? (
            <>
              <View style={styles.pipelineTabsRow}>
                <Pressable
                  onPress={() => setPipelineTab('pipeline')}
                  style={[
                    styles.pipelineTab,
                    pipelineTab === 'pipeline' && styles.pipelineTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pipelineTabText,
                      pipelineTab === 'pipeline' && styles.pipelineTabTextActive,
                    ]}
                  >
                    Pipeline
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setPipelineTab('workers')}
                  style={[
                    styles.pipelineTab,
                    pipelineTab === 'workers' && styles.pipelineTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pipelineTabText,
                      pipelineTab === 'workers' && styles.pipelineTabTextActive,
                    ]}
                  >
                    Workers
                  </Text>
                </Pressable>
              </View>
              {pipelineTab === 'pipeline' ? (
                <CoursePipelineMap model={courseProgressModel} />
              ) : (
                <WorkerSwimlanes model={courseProgressModel} />
              )}
            </>
          ) : (
            <>
              {showCourseFallbackNotice && (
                <Text style={styles.pipelineFallbackNotice}>
                  Detailed timeline unavailable or not yet populated; showing compatibility progress.
                </Text>
              )}
              <PipelineStepper currentStatus={job.status} />
            </>
          )}
        </View>
      ),
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
                  {entry.shardKey && entry.shardKey !== 'root' && (
                    <Text style={styles.timelineMetaText}>
                      Session {entry.shardKey}
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
          <InfoRow
            label="Review Before TTS"
            value={
              (job.contentType === 'course' ? job.courseScriptApproval : job.scriptApproval)?.enabled
                ? (job.contentType === 'course' ? job.courseScriptApproval : job.scriptApproval)
                    ?.awaitingApproval
                  ? 'Waiting for approval'
                  : (job.contentType === 'course' ? job.courseScriptApproval : job.scriptApproval)
                      ?.scriptApprovedAt
                    ? 'Enabled (approved)'
                    : 'Enabled'
                : 'No'
            }
          />
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
      id: 'courseRegeneration',
      title: 'Session Regeneration',
      summaryItems: toSummaryItems([
        {
          label: 'Mode',
          value:
            requestedRegeneration?.active
              ? requestedRegeneration.mode === 'script_and_audio'
                ? 'Script + Audio'
                : 'Audio only'
              : regenerationMode === 'script_and_audio'
                ? 'Script + Audio'
                : 'Audio only',
        },
        {
          label: 'Selected',
          value: selectedRegenerationSessions.length || undefined,
        },
        {
          label: 'Approval',
          value: isAwaitingRegeneratedScriptApproval ? 'Pending script approval' : undefined,
        },
      ]),
      shouldRender: isCourseRegenerationEligible,
      content: (
        <>
          {publishedCourseRegeneration && (
            <Text style={styles.regenerationBanner}>
              This course is already published. Regenerated sessions will be staged and only go live after Publish.
            </Text>
          )}
          {requestedRegeneration?.active && (
            <Text style={styles.regenerationActiveMeta}>
              {isAwaitingRegeneratedScriptApproval ? 'Scripts ready for approval' : 'Pending regeneration'}:{' '}
              {requestedRegeneration.targetSessionCodes.length} sessions •{' '}
              {requestedRegeneration.mode === 'script_and_audio' ? 'Script + Audio' : 'Audio only'}
            </Text>
          )}

          {isAwaitingRegeneratedScriptApproval && (
            <View style={styles.regenerationApprovalCard}>
              <Text style={styles.regenerationBanner}>
                Review the regenerated scripts below or in Course Scripts, then confirm before audio generation starts.
              </Text>
              <View style={styles.scriptEditorList}>
                {requestedRegeneration?.targetSessionCodes.map((sessionCode) => {
                  const script = courseScripts[sessionCode] || '';
                  return (
                    <View key={sessionCode} style={styles.scriptEditorCard}>
                      <Text style={styles.scriptEditorTitle}>
                        {getCourseScriptTitle(sessionCode, job.coursePlan)}
                      </Text>
                      <Text style={styles.scriptEditorMeta}>{sessionCode}</Text>
                      <View style={styles.regeneratedScriptPreview}>
                        <ScrollView nestedScrollEnabled>
                          <Text style={styles.scriptText}>
                            {script || 'Script preview unavailable.'}
                          </Text>
                        </ScrollView>
                      </View>
                    </View>
                  );
                })}
              </View>
              <View style={styles.regenerationButtonRow}>
                <Pressable
                  onPress={onOpenScriptApprovalModal}
                  style={({ pressed }) => [
                    styles.regenerationButton,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Ionicons name="create-outline" size={16} color="#fff" />
                  <Text style={styles.regenerationButtonText}>Review / Edit Scripts</Text>
                </Pressable>
                <Pressable
                  onPress={onRegeneratePendingScripts}
                  disabled={regenerating}
                  style={({ pressed }) => [
                    styles.regenerationSecondaryButton,
                    regenerating && { opacity: 0.6 },
                    pressed && !regenerating && { opacity: 0.85 },
                  ]}
                >
                  <Text style={styles.regenerationSecondaryButtonText}>
                    {regenerating ? 'Starting...' : 'Regenerate Again'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          <View style={styles.regenerationModeRow}>
            <Pressable
              onPress={() => setRegenerationMode('audio_only')}
              style={[
                styles.modeChip,
                regenerationMode === 'audio_only' && styles.modeChipActive,
              ]}
            >
              <Text
                style={[
                  styles.modeChipText,
                  regenerationMode === 'audio_only' && styles.modeChipTextActive,
                ]}
              >
                Audio only
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setRegenerationMode('script_and_audio')}
              style={[
                styles.modeChip,
                regenerationMode === 'script_and_audio' && styles.modeChipActive,
              ]}
            >
              <Text
                style={[
                  styles.modeChipText,
                  regenerationMode === 'script_and_audio' && styles.modeChipTextActive,
                ]}
              >
                Script + Audio
              </Text>
            </Pressable>
          </View>

          <View style={styles.regenerationActionsRow}>
            <Pressable
              onPress={() => setSelectedRegenerationSessions(availableSessionCodes)}
              style={styles.selectionButton}
            >
              <Text style={styles.selectionButtonText}>Select all</Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedRegenerationSessions([])}
              style={styles.selectionButton}
            >
              <Text style={styles.selectionButtonText}>Clear</Text>
            </Pressable>
          </View>

          <View style={styles.regenerationSessionGrid}>
            {availableSessionCodes.map((sessionCode) => {
              const selected = selectedSessionSet.has(sessionCode);
              return (
                <Pressable
                  key={sessionCode}
                  onPress={() => toggleSessionSelection(sessionCode)}
                  style={[
                    styles.regenerationSessionChip,
                    selected && styles.regenerationSessionChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.regenerationSessionChipText,
                      selected && styles.regenerationSessionChipTextActive,
                    ]}
                  >
                    {getCourseScriptTitle(sessionCode, job.coursePlan)}
                  </Text>
                  <Text
                    style={[
                      styles.regenerationSessionCode,
                      selected && styles.regenerationSessionCodeActive,
                    ]}
                  >
                    {sessionCode}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {regenerationMode === 'audio_only' && selectedRegenerationSessions.length > 0 && (
            <View style={styles.scriptEditorList}>
              {selectedRegenerationSessions.map((sessionCode) => {
                const baseScript =
                  regenerationScriptEdits[sessionCode] ??
                  (job.courseFormattedScripts || {})[sessionCode] ??
                  '';
                return (
                  <View key={sessionCode} style={styles.scriptEditorCard}>
                    <Text style={styles.scriptEditorTitle}>
                      {getCourseScriptTitle(sessionCode, job.coursePlan)}
                    </Text>
                    <Text style={styles.scriptEditorMeta}>{sessionCode}</Text>
                    <TextInput
                      multiline
                      style={styles.scriptEditorInput}
                      value={baseScript}
                      onChangeText={(value) =>
                        setRegenerationScriptEdits((prev) => ({ ...prev, [sessionCode]: value }))
                      }
                      placeholder="Edit formatted script for this session"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.regenerationButtonRow}>
            <Pressable
              disabled={regenerating}
              onPress={() => runRegeneration(selectedRegenerationSessions)}
              style={({ pressed }) => [
                styles.regenerationButton,
                (pressed || regenerating) && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="refresh-outline" size={16} color="#fff" />
              <Text style={styles.regenerationButtonText}>
                {regenerating ? 'Starting...' : 'Regenerate Selected'}
              </Text>
            </Pressable>

            <Pressable
              disabled={regenerating}
              onPress={() => runRegeneration(availableSessionCodes)}
              style={({ pressed }) => [
                styles.regenerationSecondaryButton,
                (pressed || regenerating) && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.regenerationSecondaryButtonText}>Regenerate All</Text>
            </Pressable>
          </View>
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

function getWebSectionColumns(viewportWidth: number) {
  if (Platform.OS !== 'web') return 1;
  if (viewportWidth >= 1680) return 4;
  if (viewportWidth >= 1180) return 3;
  if (viewportWidth >= 860) return 2;
  return 1;
}

function buildWebSectionColumns<T extends { id: string; summaryItems?: SummaryItem[] }>(
  sections: T[],
  expandedSections: Record<string, boolean>,
  columnCount: number
) {
  const columns = Array.from({ length: columnCount }, () => [] as T[]);
  const heights = Array.from({ length: columnCount }, () => 0);

  sections.forEach((section) => {
    const estimatedHeight = estimateWebSectionHeight(
      section.id,
      Boolean(expandedSections[section.id]),
      section.summaryItems?.length || 0
    );
    const preferredColumn = getPreferredWebSectionColumn(section.id, columnCount);
    const targetColumn =
      preferredColumn !== null
        ? preferredColumn
        : heights.indexOf(Math.min(...heights));
    columns[targetColumn].push(section);
    heights[targetColumn] += estimatedHeight;
  });

  return columns;
}

function estimateWebSectionHeight(sectionId: string, expanded: boolean, summaryCount: number) {
  if (!expanded) {
    return 1.4 + summaryCount * 0.3;
  }

  const expandedWeights: Record<string, number> = {
    pipeline: 7.5,
    stepTimeline: 6.5,
    courseProgress: 2.4,
    jobDetails: 5.2,
    watchdog: 3.2,
    coursePlan: 6.8,
    publishedCourse: 2.6,
    customInstructions: 4.6,
    generatedScript: 6.2,
    error: 3.8,
    imagePrompt: 5.4,
    thumbnail: 4.8,
    courseRegeneration: 7.8,
    output: 3.2,
    courseScripts: 7.2,
  };

  return expandedWeights[sectionId] || 4.5;
}

function getPreferredWebSectionColumn(sectionId: string, columnCount: number) {
  const preferredColumns: Record<string, number> = {
    thumbnail: 1,
    courseScripts: 2,
  };

  const preferredColumn = preferredColumns[sectionId];
  if (preferredColumn === undefined) {
    return null;
  }

  return Math.min(preferredColumn, columnCount - 1);
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

function mergeCourseScripts(
  rawScripts?: Record<string, string>,
  formattedScripts?: Record<string, string>
): Record<string, string> {
  return {
    ...(rawScripts || {}),
    ...(formattedScripts || {}),
  };
}

function getCanonicalCourseSessionCodes(job: ContentJob): string[] {
  const knownCodes = new Set<string>();
  const addCodesFromRecord = (record?: Record<string, unknown>) => {
    Object.keys(record || {}).forEach((code) => {
      const normalized = String(code || '').trim();
      if (normalized) knownCodes.add(normalized);
    });
  };

  addCodesFromRecord(job.courseFormattedScripts as Record<string, unknown> | undefined);
  addCodesFromRecord(job.courseRawScripts as Record<string, unknown> | undefined);
  addCodesFromRecord(job.courseAudioResults as Record<string, unknown> | undefined);
  (job.coursePreviewSessions || []).forEach((session) => {
    const code = String(session?.code || '').trim();
    if (code) knownCodes.add(code);
  });

  const courseCode = String(job.params?.courseCode || '').trim();

  return COURSE_SUFFIX_ORDER.map((suffix) => {
    const existing = [...knownCodes].find((code) => code.toUpperCase().endsWith(suffix));
    if (existing) return existing;
    return courseCode ? `${courseCode}${suffix}` : suffix;
  });
}

function isAwaitingRegeneratedScriptApprovalJob(job: ContentJob): boolean {
  return Boolean(
    job.contentType === 'course' &&
      job.status === 'completed' &&
      job.courseRegeneration?.active &&
      job.courseRegeneration.mode === 'script_and_audio' &&
      job.courseRegeneration.awaitingScriptApproval
  );
}

function isAwaitingInitialScriptApprovalJob(job: ContentJob): boolean {
  return Boolean(
    job.contentType === 'course' &&
      job.status === 'completed' &&
      job.courseScriptApproval?.enabled &&
      job.courseScriptApproval.awaitingApproval
  );
}

function isAwaitingSingleScriptApprovalJob(job: ContentJob): boolean {
  return Boolean(
    job.contentType !== 'course' &&
      job.status === 'completed' &&
      job.scriptApproval?.enabled &&
      job.scriptApproval.awaitingApproval
  );
}

function buildInitialExpandedSections(job: ContentJob): Record<string, boolean> {
  const initial = SECTION_IDS.reduce<Record<string, boolean>>((acc, sectionId) => {
    acc[sectionId] = false;
    return acc;
  }, {});

  if (job.error) {
    initial.error = true;
  }

  if (
    isAwaitingRegeneratedScriptApprovalJob(job) ||
    isAwaitingInitialScriptApprovalJob(job) ||
    isAwaitingSingleScriptApprovalJob(job)
  ) {
    if (isAwaitingRegeneratedScriptApprovalJob(job)) {
      initial.courseRegeneration = true;
    }
    if (job.contentType === 'course') {
      initial.courseScripts = true;
    } else {
      initial.generatedScript = true;
    }
  }

  return initial;
}

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

function getDisplayValue(value: string) {
  if (Platform.OS !== 'web' || value.length < 48) {
    return value;
  }

  return value
    .replace(/([/:?&#=._-])/g, '$1\u200b')
    .replace(/([A-Za-z0-9]{18})(?=[A-Za-z0-9])/g, '$1\u200b');
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8 }}>
      <Text
        style={{
          fontFamily: 'DMSans-Medium',
          fontSize: 14,
          color: theme.colors.textMuted,
          width: 120,
          paddingRight: 12,
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
          width: 0,
          minWidth: 0,
          flexShrink: 1,
        }}
      >
        {getDisplayValue(value)}
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
    sectionStack: {
      width: '100%',
    },
    sectionColumns: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 16,
    },
    sectionColumn: {
      flex: 1,
      minWidth: 0,
    },
    pipelinePanel: {
      gap: 12,
    },
    pipelineTabsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
      borderRadius: 999,
      backgroundColor: theme.colors.gray[100],
      padding: 3,
    },
    pipelineTab: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 0,
      backgroundColor: 'transparent',
    },
    pipelineTabActive: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.gray[300],
    },
    pipelineTabText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    pipelineTabTextActive: {
      color: theme.colors.text,
    },
    pipelineFallbackNotice: {
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      color: theme.colors.warning,
      lineHeight: 18,
    },
    regenerationBanner: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 12,
      lineHeight: 18,
      color: theme.colors.warning,
      marginBottom: 8,
    },
    regenerationActiveMeta: {
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      color: theme.colors.textMuted,
      marginBottom: 8,
    },
    regenerationApprovalCard: {
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
      borderRadius: 14,
      backgroundColor: theme.colors.gray[50],
      padding: 12,
      marginBottom: 12,
    },
    regenerationModeRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
    },
    modeChip: {
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
      backgroundColor: theme.colors.gray[50],
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    modeChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    modeChipText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 12,
      color: theme.colors.text,
    },
    modeChipTextActive: {
      color: '#fff',
    },
    regenerationActionsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
    },
    selectionButton: {
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: theme.colors.surface,
    },
    selectionButtonText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 12,
      color: theme.colors.text,
    },
    regenerationSessionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 10,
    },
    regenerationSessionChip: {
      minWidth: '47%',
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: theme.colors.gray[50],
      gap: 2,
    },
    regenerationSessionChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.gray[100],
    },
    regenerationSessionChipText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 12,
      color: theme.colors.text,
    },
    regenerationSessionChipTextActive: {
      color: theme.colors.primary,
    },
    regenerationSessionCode: {
      fontFamily: 'DMSans-Regular',
      fontSize: 10,
      color: theme.colors.textMuted,
    },
    regenerationSessionCodeActive: {
      color: theme.colors.primary,
    },
    scriptEditorList: {
      gap: 10,
      marginBottom: 10,
    },
    scriptEditorCard: {
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      padding: 10,
      gap: 6,
    },
    scriptEditorTitle: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 13,
      color: theme.colors.text,
    },
    scriptEditorMeta: {
      fontFamily: 'DMSans-Regular',
      fontSize: 11,
      color: theme.colors.textMuted,
    },
    scriptEditorInput: {
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
      borderRadius: 10,
      minHeight: 100,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontFamily: 'DMSans-Regular',
      fontSize: 13,
      color: theme.colors.text,
      textAlignVertical: 'top',
      backgroundColor: theme.colors.gray[50],
    },
    regeneratedScriptPreview: {
      borderWidth: 1,
      borderColor: theme.colors.gray[200],
      borderRadius: 10,
      backgroundColor: theme.colors.background,
      maxHeight: 220,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    approvalModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 24,
    },
    approvalModalCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 16,
      maxHeight: '88%',
      gap: 12,
      ...theme.shadows.md,
    },
    approvalModalHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    approvalModalTitleBlock: {
      flex: 1,
      gap: 4,
    },
    approvalModalTitle: {
      fontFamily: 'DMSans-Bold',
      fontSize: 18,
      color: theme.colors.text,
    },
    approvalModalSubtitle: {
      fontFamily: 'DMSans-Regular',
      fontSize: 13,
      lineHeight: 19,
      color: theme.colors.textMuted,
    },
    approvalModalCloseButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.gray[100],
    },
    approvalModalScroll: {
      flexGrow: 0,
    },
    approvalModalScrollContent: {
      paddingBottom: 4,
    },
    approvalModalBody: {
      fontFamily: 'DMSans-Regular',
      fontSize: 13,
      lineHeight: 20,
      color: theme.colors.text,
      marginBottom: 10,
    },
    approvalModalActions: {
      gap: 10,
    },
    approvalModalSecondaryRow: {
      flexDirection: 'row',
      gap: 10,
    },
    approvalModalSecondaryButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.gray[300],
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    approvalModalSecondaryButtonText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 13,
      color: theme.colors.text,
    },
    approvalModalRegenerateButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: theme.colors.warning,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 11,
      backgroundColor: theme.colors.background,
    },
    approvalModalRegenerateButtonText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 13,
      color: theme.colors.warning,
    },
    approvalModalPrimaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 11,
      backgroundColor: theme.colors.primary,
    },
    approvalModalPrimaryButtonText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 13,
      color: '#fff',
    },
    approvalScriptEditorInput: {
      minHeight: 180,
      backgroundColor: theme.colors.background,
    },
    regenerationButtonRow: {
      flexDirection: 'row',
      gap: 8,
    },
    regenerationButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      paddingVertical: 10,
    },
    regenerationButtonText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 13,
      color: '#fff',
    },
    regenerationSecondaryButton: {
      borderWidth: 1,
      borderColor: theme.colors.gray[300],
      borderRadius: 10,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    regenerationSecondaryButtonText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 12,
      color: theme.colors.text,
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
