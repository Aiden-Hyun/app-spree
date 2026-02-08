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
} from '@features/admin/types';
import {
  getLLMModelsForBackend,
  getTTSModelsForBackend,
  getVoicesForTTSModel,
  getDefaultLLMModel,
  getDefaultTTSModel,
  getDefaultVoice,
} from '@features/admin/constants/models';
import { Theme } from '@/theme';

const CONTENT_TYPES: FactoryContentType[] = [
  'guided_meditation',
  'sleep_meditation',
  'bedtime_story',
  'emergency_meditation',
  'course_session',
];

const DURATIONS = [5, 10, 15, 20, 30];

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

const BACKEND_ICON: Record<JobBackend, string> = {
  local: 'laptop-outline',
  api: 'cloud-outline',
  cloud: 'server-outline',
};

export default function CreateContentScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { createJob } = useJobQueue();

  // Form state
  const [contentType, setContentType] = useState<FactoryContentType>('guided_meditation');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState(10);
  const [style, setStyle] = useState('');
  const [technique, setTechnique] = useState('');
  const [difficulty, setDifficulty] = useState<string>('beginner');
  const [customInstructions, setCustomInstructions] = useState('');

  // Independent backend + model state
  const [llmBackend, setLlmBackend] = useState<JobBackend>('local');
  const [ttsBackend, setTtsBackend] = useState<JobBackend>('local');
  const [llmModel, setLlmModel] = useState(getDefaultLLMModel('local'));
  const [ttsModel, setTtsModel] = useState(getDefaultTTSModel('local'));
  const [ttsVoice, setTtsVoice] = useState(getDefaultVoice(getDefaultTTSModel('local')));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableLLMs = useMemo(() => getLLMModelsForBackend(llmBackend), [llmBackend]);
  const availableTTS = useMemo(() => getTTSModelsForBackend(ttsBackend), [ttsBackend]);
  const availableVoices = useMemo(() => getVoicesForTTSModel(ttsModel), [ttsModel]);

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

  const handleTTSModelChange = (modelId: string) => {
    setTtsModel(modelId);
    setTtsVoice(getDefaultVoice(modelId));
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

  const renderBackendSelector = (
    selected: JobBackend,
    onChange: (b: JobBackend) => void
  ) => (
    <View style={styles.segmentRow}>
      {AVAILABLE_BACKENDS.map((b) => (
        <Pressable
          key={b}
          style={[styles.segment, selected === b && styles.segmentActive]}
          onPress={() => onChange(b)}
        >
          <Ionicons
            name={BACKEND_ICON[b] as any}
            size={15}
            color={selected === b ? '#fff' : theme.colors.textMuted}
          />
          <Text
            style={[
              styles.segmentText,
              selected === b && styles.segmentTextActive,
            ]}
          >
            {BACKEND_LABELS[b]}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Content Type */}
      <Text style={styles.sectionTitle}>Content Type</Text>
      <View style={styles.chipRow}>
        {CONTENT_TYPES.map((ct) => (
          <Pressable
            key={ct}
            style={[styles.chip, contentType === ct && styles.chipActive]}
            onPress={() => setContentType(ct)}
          >
            <Text
              style={[
                styles.chipText,
                contentType === ct && styles.chipTextActive,
              ]}
            >
              {CONTENT_TYPE_LABELS[ct]}
            </Text>
          </Pressable>
        ))}
      </View>

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
      <Text style={styles.sectionTitle}>Duration (minutes)</Text>
      <View style={styles.chipRow}>
        {DURATIONS.map((d) => (
          <Pressable
            key={d}
            style={[styles.chip, duration === d && styles.chipActive]}
            onPress={() => setDuration(d)}
          >
            <Text
              style={[styles.chipText, duration === d && styles.chipTextActive]}
            >
              {d}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Difficulty */}
      <Text style={styles.sectionTitle}>Difficulty</Text>
      <View style={styles.chipRow}>
        {DIFFICULTIES.map((d) => (
          <Pressable
            key={d}
            style={[styles.chip, difficulty === d && styles.chipActive]}
            onPress={() => setDifficulty(d)}
          >
            <Text
              style={[
                styles.chipText,
                difficulty === d && styles.chipTextActive,
              ]}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

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
      {renderBackendSelector(llmBackend, handleLLMBackendChange)}

      <Text style={styles.sectionTitle}>LLM Model</Text>
      <View style={styles.chipRow}>
        {availableLLMs.map((m) => (
          <Pressable
            key={m.id}
            style={[styles.chip, llmModel === m.id && styles.chipActive]}
            onPress={() => setLlmModel(m.id)}
          >
            <Text
              style={[
                styles.chipText,
                llmModel === m.id && styles.chipTextActive,
              ]}
            >
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.sectionSpacer} />

      {/* TTS Backend + Model */}
      <Text style={styles.sectionTitle}>TTS Backend</Text>
      {renderBackendSelector(ttsBackend, handleTTSBackendChange)}

      <Text style={styles.sectionTitle}>TTS Model</Text>
      <View style={styles.chipRow}>
        {availableTTS.map((m) => (
          <Pressable
            key={m.id}
            style={[styles.chip, ttsModel === m.id && styles.chipActive]}
            onPress={() => handleTTSModelChange(m.id)}
          >
            <Text
              style={[
                styles.chipText,
                ttsModel === m.id && styles.chipTextActive,
              ]}
            >
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Voice */}
      {availableVoices.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Voice</Text>
          <View style={styles.chipRow}>
            {availableVoices.map((v) => (
              <Pressable
                key={v.id}
                style={[styles.chip, ttsVoice === v.id && styles.chipActive]}
                onPress={() => setTtsVoice(v.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    ttsVoice === v.id && styles.chipTextActive,
                  ]}
                >
                  {v.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

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
    sectionSpacer: {
      height: 8,
    },
    segmentRow: {
      flexDirection: 'row',
      gap: 8,
    },
    segment: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
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
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
    },
    chipActive: {
      backgroundColor: theme.colors.primary,
    },
    chipText: {
      fontFamily: 'DMSans-Medium',
      fontSize: 13,
      color: theme.colors.textMuted,
    },
    chipTextActive: {
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
