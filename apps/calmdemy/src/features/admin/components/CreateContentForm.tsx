import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@core/providers/contexts/ThemeContext';
import { Dropdown, DropdownOption } from './Dropdown';
import { FactoryContentType, BACKEND_LABELS } from '../types';
import { Theme } from '@/theme';

type Props = {
  // Content type
  contentType: FactoryContentType;
  onContentTypeChange: (ct: FactoryContentType) => void;
  contentTypeOptions: DropdownOption[];

  // Common fields
  title: string;
  onTitleChange: (v: string) => void;
  topic: string;
  onTopicChange: (v: string) => void;
  duration: number;
  onDurationChange: (v: number) => void;
  style: string;
  onStyleChange: (v: string) => void;
  technique: string;
  onTechniqueChange: (v: string) => void;
  difficulty: string;
  onDifficultyChange: (v: string) => void;
  customInstructions: string;
  onCustomInstructionsChange: (v: string) => void;
  imagePrompt: string;
  onImagePromptChange: (v: string) => void;

  // Course-specific
  isCourse: boolean;
  courseCode: string;
  onCourseCodeChange: (v: string) => void;
  courseCodeError?: string | null;
  isCheckingCode: boolean;
  courseTitle: string;
  onCourseTitleChange: (v: string) => void;
  subjectId: string;
  onSubjectChange: (v: string) => void;
  subjectOptions: DropdownOption[];
  targetAudience: string;
  onTargetAudienceChange: (v: string) => void;
  tone: string;
  onToneChange: (v: string) => void;

  // Backends / models
  llmBackend: string;
  onLLMBackendChange: (v: any) => void;
  ttsBackend: string;
  onTTSBackendChange: (v: any) => void;
  llmModel: string;
  onLLMModelChange: (v: string) => void;
  ttsModel: string;
  onTTSModelChange: (v: string) => void;
  ttsVoice: string;
  onTTSVoiceChange: (v: string) => void;
  llmModelOptions: DropdownOption[];
  ttsModelOptions: DropdownOption[];
  voiceOptions: DropdownOption[];

  // Options
  autoPublish: boolean;
  onAutoPublishChange: (v: boolean) => void;

  // Submit
  onSubmit: () => void;
  isSubmitting: boolean;

  // Static options
  durationOptions: DropdownOption[];
  difficultyOptions: DropdownOption[];
  audienceOptions: DropdownOption[];
  toneOptions: DropdownOption[];
};

export function CreateContentForm(props: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.sectionHeader}>Create Content</Text>

      {/* Content Type */}
      <Text style={styles.sectionTitle}>Content Type</Text>
      <Dropdown
        options={props.contentTypeOptions}
        selectedId={props.contentType}
        onSelect={(id) => props.onContentTypeChange(id as FactoryContentType)}
      />

      {/* Course fields */}
      {props.isCourse ? (
        <>
          <Text style={styles.sectionTitle}>Course Code</Text>
          <TextInput
            style={styles.input}
            placeholder="E.g. CBT101"
            value={props.courseCode}
            onChangeText={props.onCourseCodeChange}
            autoCapitalize="characters"
          />
          {props.courseCodeError ? (
            <Text style={[styles.helperText, { color: theme.colors.error }]}>
              {props.courseCodeError}
            </Text>
          ) : (
            <Text style={[styles.helperText, { color: theme.colors.textMuted }]}>
              {props.isCheckingCode ? 'Checking...' : 'Must be unique (3+ chars, alphanumeric)'}
            </Text>
          )}

          <Text style={styles.sectionTitle}>Course Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Course title"
            value={props.courseTitle}
            onChangeText={props.onCourseTitleChange}
          />

          <Text style={styles.sectionTitle}>Therapy Subject</Text>
          <Dropdown
            options={props.subjectOptions}
            selectedId={props.subjectId}
            onSelect={(id) => props.onSubjectChange(String(id))}
          />

          <Text style={styles.sectionTitle}>Target Audience</Text>
          <Dropdown
            options={props.audienceOptions}
            selectedId={props.targetAudience}
            onSelect={(id) => props.onTargetAudienceChange(String(id))}
          />

          <Text style={styles.sectionTitle}>Tone</Text>
          <Dropdown
            options={props.toneOptions}
            selectedId={props.tone}
            onSelect={(id) => props.onToneChange(String(id))}
          />
        </>
      ) : null}

      {/* Common Fields */}
      {!props.isCourse && (
        <>
          <Text style={styles.sectionTitle}>Title (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="A calming title"
            value={props.title}
            onChangeText={props.onTitleChange}
          />
        </>
      )}

      <Text style={styles.sectionTitle}>{props.isCourse ? 'Course Description' : 'Topic'}</Text>
      <TextInput
        style={styles.input}
        placeholder={props.isCourse ? 'Course description' : 'What should we generate?'}
        value={props.topic}
        onChangeText={props.onTopicChange}
      />

      {!props.isCourse && (
        <>
          <Text style={styles.sectionTitle}>Duration</Text>
          <Dropdown
            options={props.durationOptions}
            selectedId={String(props.duration)}
            onSelect={(id) => props.onDurationChange(Number(id))}
          />
        </>
      )}

      {!props.isCourse && (
        <>
          <Text style={styles.sectionTitle}>Style</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Calm, compassionate"
            value={props.style}
            onChangeText={props.onStyleChange}
          />

          <Text style={styles.sectionTitle}>Technique</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Body scan, breath focus"
            value={props.technique}
            onChangeText={props.onTechniqueChange}
          />

          <Text style={styles.sectionTitle}>Difficulty</Text>
          <Dropdown
            options={props.difficultyOptions}
            selectedId={props.difficulty}
            onSelect={(id) => props.onDifficultyChange(String(id))}
          />
        </>
      )}

      <Text style={styles.sectionTitle}>Custom Instructions</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        placeholder="Add any extra guidance for the LLM"
        value={props.customInstructions}
        onChangeText={props.onCustomInstructionsChange}
        multiline
      />

      <Text style={styles.sectionTitle}>Image Prompt (optional)</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        placeholder="Describe the thumbnail image"
        value={props.imagePrompt}
        onChangeText={props.onImagePromptChange}
        multiline
      />

      {/* Model selection */}
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>LLM Backend</Text>
      <View style={styles.segmentRow}>
        {['local', 'api'].map((backend) => (
          <Pressable
            key={backend}
            style={[
              styles.segment,
              props.llmBackend === backend && styles.segmentActive,
            ]}
            onPress={() => props.onLLMBackendChange(backend)}
          >
            <Text
              style={[
                styles.segmentText,
                props.llmBackend === backend && styles.segmentTextActive,
              ]}
            >
              {BACKEND_LABELS[backend as keyof typeof BACKEND_LABELS] || backend}
            </Text>
          </Pressable>
        ))}
      </View>
      <Dropdown
        options={props.llmModelOptions}
        selectedId={props.llmModel}
        onSelect={(id) => props.onLLMModelChange(String(id))}
      />

      <Text style={styles.sectionTitle}>TTS Backend</Text>
      <View style={styles.segmentRow}>
        {['local', 'api'].map((backend) => (
          <Pressable
            key={backend}
            style={[
              styles.segment,
              props.ttsBackend === backend && styles.segmentActive,
            ]}
            onPress={() => props.onTTSBackendChange(backend)}
          >
            <Text
              style={[
                styles.segmentText,
                props.ttsBackend === backend && styles.segmentTextActive,
              ]}
            >
              {BACKEND_LABELS[backend as keyof typeof BACKEND_LABELS] || backend}
            </Text>
          </Pressable>
        ))}
      </View>
      <Dropdown
        options={props.ttsModelOptions}
        selectedId={props.ttsModel}
        onSelect={(id) => props.onTTSModelChange(String(id))}
      />

      {/* Voice */}
      {props.voiceOptions.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Voice</Text>
          <Dropdown
            options={props.voiceOptions}
            selectedId={props.ttsVoice}
            onSelect={props.onTTSVoiceChange}
          />
        </>
      )}

      {/* Auto-Publish Toggle */}
      <View style={styles.divider} />
      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleLabel}>Auto-publish</Text>
          <Text style={styles.toggleDescription}>
            {props.autoPublish
              ? 'Content will be published automatically when done'
              : 'Content will need manual approval before publishing'}
          </Text>
        </View>
        <Switch
          value={props.autoPublish}
          onValueChange={props.onAutoPublishChange}
          trackColor={{ false: theme.colors.gray[300], true: `${theme.colors.primary}80` }}
          thumbColor={props.autoPublish ? theme.colors.primary : theme.colors.gray[400]}
        />
      </View>

      {/* Submit */}
      <Pressable
        style={({ pressed }) => [
          styles.submitButton,
          pressed && { opacity: 0.85 },
          props.isSubmitting && styles.submitButtonDisabled,
        ]}
        onPress={props.onSubmit}
        disabled={props.isSubmitting}
      >
        {props.isSubmitting ? (
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
    divider: {
      height: 1,
      backgroundColor: theme.colors.gray[200],
      marginVertical: 24,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    toggleInfo: {
      flex: 1,
    },
    toggleLabel: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 14,
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
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#6C5CE7',
      paddingVertical: 14,
      borderRadius: 14,
      marginTop: 12,
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    submitText: {
      fontFamily: 'DMSans-SemiBold',
      fontSize: 15,
      color: '#fff',
    },
  });

