import React, { useMemo, useState } from 'react';
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
import { Theme } from '@/theme';

// ==================== DROPDOWN OPTION BUILDERS ====================

const CONTENT_TYPES: FactoryContentType[] = [
  'guided_meditation',
  'sleep_meditation',
  'bedtime_story',
  'emergency_meditation',
  'course_session',
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

  // Independent backend + model state
  const [llmBackend, setLlmBackend] = useState<JobBackend>('local');
  const [ttsBackend, setTtsBackend] = useState<JobBackend>('local');
  const [llmModel, setLlmModel] = useState(getDefaultLLMModel('local'));
  const [ttsModel, setTtsModel] = useState(getDefaultTTSModel('local'));
  const [ttsVoice, setTtsVoice] = useState(getDefaultVoice(getDefaultTTSModel('local')));
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!topic.trim()) {
      Alert.alert('Required', 'Please enter a topic.');
      return;
    }

    setIsSubmitting(true);
    try {
      const input: CreateJobInput = {
        llmBackend,
        ttsBackend,
        contentType,
        params: {
          topic: topic.trim(),
          duration_minutes: duration,
          style: style.trim() || undefined,
          technique: technique.trim() || undefined,
          difficulty,
          customInstructions: customInstructions.trim() || undefined,
        },
        llmModel,
        ttsModel,
        ttsVoice,
        title: title.trim() || undefined,
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
