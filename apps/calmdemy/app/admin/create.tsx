import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { useJobQueue } from '@features/admin/hooks/useJobQueue';
import {
  FactoryContentType,
  CONTENT_TYPE_LABELS,
  CreateJobInput,
  JobBackend,
  AVAILABLE_BACKENDS,
  BACKEND_LABELS,
  BACKEND_DESCRIPTIONS,
} from '@features/admin/types';
import {
  getLLMModelsForBackend,
  getTTSModelsForBackend,
  getVoicesForTTSModel,
  getDefaultLLMModel,
  getDefaultTTSModel,
  getDefaultVoice,
} from '@features/admin/constants/models';
import { Dropdown, DropdownOption } from '@features/admin/components/Dropdown';
import {
  getSubjects,
  checkCourseCodeExists,
  Subject,
} from '@features/admin/data/adminRepository';
import { Theme } from '@/theme';

// ==================== DROPDOWN OPTION BUILDERS ====================

const CONTENT_TYPES: FactoryContentType[] = [
  'guided_meditation',
  'sleep_meditation',
  'bedtime_story',
  'emergency_meditation',
  'course_session',
  'course',
];

const CONTENT_TYPE_OPTIONS: DropdownOption[] = CONTENT_TYPES.map((ct) => ({
  id: ct,
  label: CONTENT_TYPE_LABELS[ct],
}));

const DURATION_OPTIONS: DropdownOption[] = [5, 10, 15, 20, 30].map((d) => ({
  id: String(d),
  label: `${d} minutes`,
}));

const DIFFICULTY_OPTIONS: DropdownOption[] = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

const AUDIENCE_OPTIONS: DropdownOption[] = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
];

const TONE_OPTIONS: DropdownOption[] = [
  { id: 'gentle', label: 'Gentle' },
  { id: 'energetic', label: 'Energetic' },
  { id: 'very calm', label: 'Very Calm' },
];

// ==================== SCREEN ====================

export default function CreateContentScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { createJob } = useJobQueue();

  // Form state
  const [contentType, setContentType] = useState<FactoryContentType>('guided_meditation');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState(10);
  const [style, setStyle] = useState('');
  const [technique, setTechnique] = useState('');
  const [difficulty, setDifficulty] = useState<string>('beginner');
  const [customInstructions, setCustomInstructions] = useState('');
  const [autoPublish, setAutoPublish] = useState(true);

  // Course-specific state
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [targetAudience, setTargetAudience] = useState<string>('beginner');
  const [tone, setTone] = useState<string>('gentle');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courseCodeError, setCourseCodeError] = useState<string | null>(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const codeCheckTimeout = useRef<ReturnType<typeof setTimeout>>();

  const isCourse = contentType === 'course';

  // Independent backend + model state
  const [llmBackend, setLlmBackend] = useState<JobBackend>('local');
  const [ttsBackend, setTtsBackend] = useState<JobBackend>('local');
  const [llmModel, setLlmModel] = useState(getDefaultLLMModel('local'));
  const [ttsModel, setTtsModel] = useState(getDefaultTTSModel('local'));
  const [ttsVoice, setTtsVoice] = useState(getDefaultVoice(getDefaultTTSModel('local')));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load subjects for course creation
  useEffect(() => {
    getSubjects().then(setSubjects).catch(console.error);
  }, []);

  const subjectOptions: DropdownOption[] = useMemo(
    () => subjects.map((s) => ({ id: s.id, label: `${s.label} — ${s.fullName}` })),
    [subjects]
  );

  // Course code uniqueness validation (debounced)
  const handleCourseCodeChange = useCallback((code: string) => {
    const upper = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCourseCode(upper);
    setCourseCodeError(null);

    if (codeCheckTimeout.current) clearTimeout(codeCheckTimeout.current);
    if (!upper || upper.length < 3) return;

    setIsCheckingCode(true);
    codeCheckTimeout.current = setTimeout(async () => {
      try {
        const exists = await checkCourseCodeExists(upper);
        if (exists) {
          setCourseCodeError(`Code "${upper}" is already in use. Choose another.`);
        } else {
          setCourseCodeError(null);
        }
      } catch {
        // Ignore check errors
      } finally {
        setIsCheckingCode(false);
      }
    }, 500);
  }, []);

  // Derived options
  const llmModelOptions: DropdownOption[] = useMemo(
    () =>
      getLLMModelsForBackend(llmBackend).map((m) => ({
        id: m.id,
        label: m.label,
        description: m.description,
      })),
    [llmBackend]
  );

  const ttsModelOptions: DropdownOption[] = useMemo(
    () =>
      getTTSModelsForBackend(ttsBackend).map((m) => ({
        id: m.id,
        label: m.label,
        description: m.description,
      })),
    [ttsBackend]
  );

  const voiceOptions: DropdownOption[] = useMemo(
    () =>
      getVoicesForTTSModel(ttsModel).map((v) => ({
        id: v.id,
        label: v.label,
        description: v.description,
      })),
    [ttsModel]
  );

  // Handlers
  const handleLLMBackendChange = (newBackend: JobBackend) => {
    setLlmBackend(newBackend);
    const defaultLLM = getDefaultLLMModel(newBackend);
    setLlmModel(defaultLLM);
  };

  const handleTTSBackendChange = (newBackend: JobBackend) => {
    setTtsBackend(newBackend);
    const defaultTTS = getDefaultTTSModel(newBackend);
    setTtsModel(defaultTTS);
    setTtsVoice(getDefaultVoice(defaultTTS));
  };

  const handleTTSModelChange = (id: string) => {
    setTtsModel(id);
    setTtsVoice(getDefaultVoice(id));
  };

  const handleSubmit = async () => {
    if (isCourse) {
      // Course-specific validation
      if (!courseCode || courseCode.length < 3) {
        Alert.alert('Required', 'Please enter a course code (at least 3 characters).');
        return;
      }
      if (courseCodeError) {
        Alert.alert('Invalid', courseCodeError);
        return;
      }
      if (!courseTitle.trim()) {
        Alert.alert('Required', 'Please enter a course title.');
        return;
      }
      if (!subjectId) {
        Alert.alert('Required', 'Please select a therapy subject.');
        return;
      }
      if (!topic.trim()) {
        Alert.alert('Required', 'Please enter a course description / topic.');
        return;
      }
    } else {
      if (!topic.trim()) {
        Alert.alert('Required', 'Please enter a topic.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const selectedSubject = subjects.find((s) => s.id === subjectId);

      const input: CreateJobInput = {
        llmBackend,
        ttsBackend,
        contentType,
        params: {
          topic: topic.trim(),
          duration_minutes: isCourse ? 0 : duration,
          style: isCourse ? undefined : (style.trim() || undefined),
          technique: isCourse ? undefined : (technique.trim() || undefined),
          difficulty: isCourse ? undefined : difficulty as any,
          customInstructions: customInstructions.trim() || undefined,
          // Course-specific params
          ...(isCourse && {
            courseCode,
            courseTitle: courseTitle.trim(),
            subjectId,
            subjectLabel: selectedSubject?.label || subjectId,
            subjectColor: selectedSubject?.color || '#6B7280',
            subjectIcon: selectedSubject?.icon || 'school-outline',
            targetAudience: targetAudience as any,
            tone: tone as any,
          }),
        },
        llmModel,
        ttsModel,
        ttsVoice,
        title: isCourse ? courseTitle.trim() : (title.trim() || undefined),
        autoPublish,
      };

      await createJob(input);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to create job. Please try again.');
      console.error('Create job error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Content Type */}
      <Text style={styles.sectionTitle}>Content Type</Text>
      <Dropdown
        options={CONTENT_TYPE_OPTIONS}
        selectedId={contentType}
        onSelect={(id) => setContentType(id as FactoryContentType)}
      />

      {isCourse ? (
        <>
          {/* ========== COURSE-SPECIFIC FIELDS ========== */}

          {/* Subject */}
          <Text style={styles.sectionTitle}>Therapy Subject</Text>
          <Dropdown
            options={subjectOptions}
            selectedId={subjectId}
            onSelect={setSubjectId}
            placeholder="Select a therapy subject..."
          />

          {/* Course Code */}
          <Text style={styles.sectionTitle}>Course Code</Text>
          <View>
            <TextInput
              style={[
                styles.input,
                courseCodeError ? { borderWidth: 1, borderColor: theme.colors.error } : null,
              ]}
              placeholder='e.g. "CBT101"'
              placeholderTextColor={theme.colors.textMuted}
              value={courseCode}
              onChangeText={handleCourseCodeChange}
              autoCapitalize="characters"
            />
            {isCheckingCode && (
              <Text style={[styles.helperText, { color: theme.colors.textMuted }]}>
                Checking...
              </Text>
            )}
            {courseCodeError && (
              <Text style={[styles.helperText, { color: theme.colors.error }]}>
                {courseCodeError}
              </Text>
            )}
            {courseCode.length >= 3 && !courseCodeError && !isCheckingCode && (
              <Text style={[styles.helperText, { color: theme.colors.success }]}>
                Code available
              </Text>
            )}
          </View>

          {/* Course Title */}
          <Text style={styles.sectionTitle}>Course Title</Text>
          <TextInput
            style={styles.input}
            placeholder='e.g. "Rethink Your Thoughts"'
            placeholderTextColor={theme.colors.textMuted}
            value={courseTitle}
            onChangeText={setCourseTitle}
          />

          {/* Course Description / Topic */}
          <Text style={styles.sectionTitle}>Course Description</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder='Describe the course goal and what it covers...'
            placeholderTextColor={theme.colors.textMuted}
            value={topic}
            onChangeText={setTopic}
            multiline
            numberOfLines={3}
          />

          {/* Target Audience */}
          <Text style={styles.sectionTitle}>Target Audience</Text>
          <Dropdown
            options={AUDIENCE_OPTIONS}
            selectedId={targetAudience}
            onSelect={setTargetAudience}
          />

          {/* Tone */}
          <Text style={styles.sectionTitle}>Tone</Text>
          <Dropdown
            options={TONE_OPTIONS}
            selectedId={tone}
            onSelect={setTone}
          />

          {/* Custom Instructions */}
          <Text style={styles.sectionTitle}>Custom Instructions (optional)</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Any additional guidance for the LLM..."
            placeholderTextColor={theme.colors.textMuted}
            value={customInstructions}
            onChangeText={setCustomInstructions}
            multiline
            numberOfLines={3}
          />

          {/* Info Banner */}
          <View style={[styles.infoBanner, { backgroundColor: `${theme.colors.primary}10` }]}>
            <Ionicons name="information-circle-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.infoBannerText, { color: theme.colors.textLight }]}>
              This will generate 9 audio files: 1 intro + 4 modules (lesson + practice each).
            </Text>
          </View>
        </>
      ) : (
        <>
          {/* ========== SINGLE-ITEM FIELDS ========== */}

          {/* Title */}
          <Text style={styles.sectionTitle}>Title (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Leave empty to auto-generate from LLM"
            placeholderTextColor={theme.colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />

          {/* Topic */}
          <Text style={styles.sectionTitle}>Topic</Text>
          <TextInput
            style={styles.input}
            placeholder='e.g. "Body scan for anxiety relief"'
            placeholderTextColor={theme.colors.textMuted}
            value={topic}
            onChangeText={setTopic}
            multiline
          />

          {/* Duration */}
          <Text style={styles.sectionTitle}>Duration</Text>
          <Dropdown
            options={DURATION_OPTIONS}
            selectedId={String(duration)}
            onSelect={(id) => setDuration(Number(id))}
          />

          {/* Difficulty */}
          <Text style={styles.sectionTitle}>Difficulty</Text>
          <Dropdown
            options={DIFFICULTY_OPTIONS}
            selectedId={difficulty}
            onSelect={setDifficulty}
          />

          {/* Style & Technique */}
          <Text style={styles.sectionTitle}>Style (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder='e.g. "calm", "energizing", "grounding"'
            placeholderTextColor={theme.colors.textMuted}
            value={style}
            onChangeText={setStyle}
          />

          <Text style={styles.sectionTitle}>Technique (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder='e.g. "body_scan", "visualization"'
            placeholderTextColor={theme.colors.textMuted}
            value={technique}
            onChangeText={setTechnique}
          />

          {/* Custom Instructions */}
          <Text style={styles.sectionTitle}>Custom Instructions (optional)</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Any additional guidance for the LLM..."
            placeholderTextColor={theme.colors.textMuted}
            value={customInstructions}
            onChangeText={setCustomInstructions}
            multiline
            numberOfLines={3}
          />
        </>
      )}

      {/* Model Selection */}
      <View style={styles.divider} />
      <Text style={styles.sectionHeader}>Model Configuration</Text>

      {/* LLM Backend + Model */}
      <Text style={styles.sectionTitle}>LLM Backend</Text>
      <View style={styles.segmentRow}>
        {AVAILABLE_BACKENDS.map((b) => (
          <Pressable
            key={b}
            style={[styles.segment, llmBackend === b && styles.segmentActive]}
            onPress={() => handleLLMBackendChange(b)}
          >
            <Text
              style={[
                styles.segmentText,
                llmBackend === b && styles.segmentTextActive,
              ]}
            >
              {BACKEND_LABELS[b]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>LLM Model</Text>
      <Dropdown
        options={llmModelOptions}
        selectedId={llmModel}
        onSelect={setLlmModel}
      />

      {/* TTS Backend + Model */}
      <Text style={styles.sectionTitle}>TTS Backend</Text>
      <View style={styles.segmentRow}>
        {AVAILABLE_BACKENDS.map((b) => (
          <Pressable
            key={b}
            style={[styles.segment, ttsBackend === b && styles.segmentActive]}
            onPress={() => handleTTSBackendChange(b)}
          >
            <Text
              style={[
                styles.segmentText,
                ttsBackend === b && styles.segmentTextActive,
              ]}
            >
              {BACKEND_LABELS[b]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>TTS Model</Text>
      <Dropdown
        options={ttsModelOptions}
        selectedId={ttsModel}
        onSelect={handleTTSModelChange}
      />

      {/* Voice */}
      {voiceOptions.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Voice</Text>
          <Dropdown
            options={voiceOptions}
            selectedId={ttsVoice}
            onSelect={setTtsVoice}
          />
        </>
      )}

      {/* Auto-Publish Toggle */}
      <View style={styles.divider} />
      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleLabel}>Auto-publish</Text>
          <Text style={styles.toggleDescription}>
            {autoPublish
              ? 'Content will be published automatically when done'
              : 'Content will need manual approval before publishing'}
          </Text>
        </View>
        <Switch
          value={autoPublish}
          onValueChange={setAutoPublish}
          trackColor={{ false: theme.colors.gray[300], true: `${theme.colors.primary}80` }}
          thumbColor={autoPublish ? theme.colors.primary : theme.colors.gray[400]}
        />
      </View>

      {/* Submit */}
      <Pressable
        style={({ pressed }) => [
          styles.submitButton,
          pressed && { opacity: 0.85 },
          isSubmitting && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.submitText}>Generate Content</Text>
          </>
        )}
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
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
    sectionHeader: {
      fontFamily: 'DMSans-Bold',
      fontSize: 18,
      color: theme.colors.text,
      marginBottom: 16,
    },
    sectionTitle: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 14,
      color: theme.colors.textLight,
      marginBottom: 10,
      marginTop: 16,
    },
    segmentRow: {
      flexDirection: 'row',
      gap: 8,
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
    },
    segmentActive: {
      backgroundColor: theme.colors.primary,
    },
    segmentText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 13,
      color: theme.colors.textMuted,
    },
    segmentTextActive: {
      color: '#fff',
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontFamily: 'DMSans-Regular',
      fontSize: 15,
      color: theme.colors.text,
    },
    multilineInput: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    helperText: {
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      marginTop: 6,
      marginLeft: 4,
    },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 12,
      padding: 14,
      marginTop: 16,
    },
    infoBannerText: {
      fontFamily: 'DMSans-Regular',
      fontSize: 13,
      flex: 1,
      lineHeight: 18,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.gray[200],
      marginVertical: 24,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    toggleInfo: {
      flex: 1,
      marginRight: 16,
    },
    toggleLabel: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 15,
      color: theme.colors.text,
    },
    toggleDescription: {
      fontFamily: 'DMSans-Regular',
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      paddingVertical: 18,
      gap: 10,
      marginTop: 32,
    },
    submitButtonDisabled: {
      backgroundColor: theme.colors.gray[300],
    },
    submitText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 17,
      color: '#fff',
    },
  });
