import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import { useNote } from '../../src/hooks/useNotes';
import { NoteService } from '../../src/services/noteService';
import { RichTextEditor } from '../../src/components/editor/RichTextEditor';
import { AttachmentList } from '../../src/components/editor/AttachmentList';
import { useAttachments } from '../../src/hooks/useAttachments';
import { useTemplate } from '../../src/hooks/useTemplates';
import { showAttachmentOptions } from '../../src/utils/filePicker';
import { router, useLocalSearchParams } from 'expo-router';

function EditorScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const noteId = params.id as string | undefined;
  const mode = params.mode as string | undefined;
  const notebookId = params.notebook as string | undefined;
  const templateId = params.template as string | undefined;
  
  const { note, loading: noteLoading, error: noteError, updateNote, autoSave } = useNote(noteId || '');
  const { attachments, uploading, uploadAttachment, deleteAttachment, getAttachmentUrl, loadAttachments } = useAttachments(noteId);
  const { template, loading: templateLoading, applyTemplate } = useTemplate(templateId || '');
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || '');
      loadAttachments();
    } else if (mode === 'create' && template) {
      const templateContent = applyTemplate();
      setTitle(template.title);
      setContent(templateContent);
    }
  }, [note, mode, template, applyTemplate]);

  // Auto-save functionality
  useEffect(() => {
    if (noteId && isModified && content) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      
      autoSaveTimer.current = setTimeout(() => {
        autoSave(content);
        setIsModified(false);
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [content, isModified, noteId, autoSave]);


  const handleContentChange = (text: string) => {
    setContent(text);
    setIsModified(true);
  };

  const saveNote = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please add a title');
      return;
    }

    setSaving(true);
    try {
      if (noteId) {
        // Update existing note
        await updateNote({
          title: title.trim(),
          content: content.trim()
        });
        Alert.alert('Success', 'Note updated successfully');
      } else {
        // Create new note
        const newNote = await NoteService.createNote({
          title: title.trim(),
          content: content.trim(),
          notebook_id: notebookId,
          template_id: templateId
        });
        
        // Increment template usage count if used
        if (templateId) {
          const { TemplateService } = await import('../../src/services/templateService');
          await TemplateService.incrementUsageCount(templateId);
        }
        
        // Replace the URL to edit mode with the new note ID
        router.replace(`/editor/index?id=${newNote.id}`);
        Alert.alert('Success', 'Note created successfully');
      }
      setIsModified(false);
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (isModified) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save before leaving?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Discard',
            onPress: () => router.back(),
            style: 'destructive'
          },
          {
            text: 'Save',
            onPress: async () => {
              await saveNote();
              router.back();
            }
          }
        ]
      );
    } else {
      router.back();
    }
  };

  const handleAttachFile = () => {
    if (!noteId) {
      Alert.alert('Save Note First', 'Please save the note before adding attachments.');
      return;
    }

    showAttachmentOptions(
      async (file) => {
        try {
          await uploadAttachment(file.uri, file.name, file.type);
          Alert.alert('Success', 'Image attached successfully');
        } catch (error) {
          Alert.alert('Error', 'Failed to attach image');
        }
      },
      async (file) => {
        try {
          await uploadAttachment(file.uri, file.name, file.type);
          Alert.alert('Success', 'Document attached successfully');
        } catch (error) {
          Alert.alert('Error', 'Failed to attach document');
        }
      },
      async (file) => {
        try {
          await uploadAttachment(file.uri, file.name, file.type);
          Alert.alert('Success', 'Photo attached successfully');
        } catch (error) {
          Alert.alert('Error', 'Failed to attach photo');
        }
      }
    );
  };

  if ((noteLoading && !note && noteId) || (templateLoading && !template && templateId)) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (noteError && noteId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{noteError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          {isModified && (
            <Text style={styles.autoSaveText}>Auto-saving...</Text>
          )}
          <TouchableOpacity style={styles.actionButton} onPress={handleAttachFile}>
            <Ionicons name="attach" size={24} color="#fff" />
            {uploading && <Text style={styles.uploadingText}>...</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleAttachFile}>
            <Ionicons name="image" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="mic" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.saveButton]} 
            onPress={saveNote}
            disabled={saving}
          >
            <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.titleContainer}>
        <TextInput
          style={styles.titleInput}
          placeholder="Note Title"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            setIsModified(true);
          }}
          placeholderTextColor="#95a5a6"
        />
      </View>

      {attachments.length > 0 && (
        <AttachmentList
          attachments={attachments}
          onDelete={deleteAttachment}
          getAttachmentUrl={getAttachmentUrl}
          onPress={(attachment) => {
            // TODO: Implement attachment preview
            Alert.alert('Attachment', `View ${attachment.file_name}`);
          }}
        />
      )}

      <RichTextEditor
        initialContent={content}
        onChange={handleContentChange}
        placeholder="Start writing..."
        autoFocus={!noteId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#00b894',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoSaveText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginRight: 12,
  },
  uploadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    position: 'absolute',
    bottom: -2,
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2c3e50',
    paddingVertical: 8,
  },
});

export default function Editor() {
  return (
    <ProtectedRoute>
      <EditorScreen />
    </ProtectedRoute>
  );
}
