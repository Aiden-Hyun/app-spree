import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  buildEditFormValues,
  evaluateMetadataForm,
} from '../data/contentManagerEditConfig';
import {
  getContentManagerAuditEntries,
  updateContentMetadata,
} from '../data/contentManagerAdminRepository';
import {
  getContentManagerItemDetail,
  getContentManagerItems,
} from '../data/contentManagerRepository';
import { filterContentManagerItems } from '../data/contentManagerSearch';
import {
  CONTENT_MANAGER_DEFAULT_FILTERS,
  ContentManagerAuditEntry,
  ContentManagerCollection,
  ContentManagerEditFormValues,
  ContentManagerFilterState,
  ContentManagerItemDetail,
  ContentManagerItemSummary,
} from '../types';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export function useContentManagerCatalog() {
  const [items, setItems] = useState<ContentManagerItemSummary[]>([]);
  const [filters, setFilters] = useState<ContentManagerFilterState>(
    CONTENT_MANAGER_DEFAULT_FILTERS
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'refresh') => {
    if (mode === 'initial') {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const nextItems = await getContentManagerItems();
      setItems(nextItems);
      setError(null);
    } catch (loadError) {
      setError(getErrorMessage(loadError, 'Unable to load content manager items.'));
    } finally {
      hasLoadedRef.current = true;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load('initial');
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedRef.current) {
        return;
      }
      load('refresh');
    }, [load])
  );

  const filteredItems = useMemo(
    () => filterContentManagerItems(items, filters),
    [items, filters]
  );

  const setQuery = useCallback((query: string) => {
    setFilters((current) => ({ ...current, query }));
  }, []);

  const setType = useCallback((type: ContentManagerFilterState['type']) => {
    setFilters((current) => ({ ...current, type }));
  }, []);

  const setAccess = useCallback((access: ContentManagerFilterState['access']) => {
    setFilters((current) => ({ ...current, access }));
  }, []);

  return {
    items,
    filteredItems,
    filters,
    isLoading,
    isRefreshing,
    error,
    refresh: () => load('refresh'),
    setQuery,
    setType,
    setAccess,
  };
}

export function useContentManagerDetail(
  collection: ContentManagerCollection | null,
  id: string | null
) {
  const [item, setItem] = useState<ContentManagerItemDetail | null>(null);
  const [history, setHistory] = useState<ContentManagerAuditEntry[]>([]);
  const [formValues, setFormValues] = useState<ContentManagerEditFormValues>({});
  const [reason, setReason] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [reasonError, setReasonError] = useState<string | undefined>();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const isEditingRef = useRef(false);

  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  const resetFormState = useCallback((nextItem: ContentManagerItemDetail | null) => {
    setFormValues(
      nextItem ? buildEditFormValues(nextItem.collection, nextItem.editableValues) : {}
    );
    setReason('');
    setFieldErrors({});
    setReasonError(undefined);
    setSaveError(null);
  }, []);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'refresh') => {
      if (!collection || !id) {
        setItem(null);
        setHistory([]);
        resetFormState(null);
        setError('Missing content identifier.');
        setIsLoading(false);
        setIsRefreshing(false);
        return null;
      }

      if (mode === 'initial') {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const [nextItem, nextHistory] = await Promise.all([
          getContentManagerItemDetail(collection, id),
          getContentManagerAuditEntries(collection, id),
        ]);
        if (!nextItem) {
          setItem(null);
          setHistory([]);
          resetFormState(null);
          setError('Content not found.');
        } else {
          setItem(nextItem);
          setHistory(nextHistory);
          setError(null);
          if (!isEditingRef.current || mode === 'initial') {
            resetFormState(nextItem);
          }
        }
        return nextItem;
      } catch (loadError) {
        setError(getErrorMessage(loadError, 'Unable to load content detail.'));
        return null;
      } finally {
        hasLoadedRef.current = true;
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [collection, id, resetFormState]
  );

  useEffect(() => {
    load('initial');
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedRef.current) {
        return;
      }
      load('refresh');
    }, [load])
  );

  useEffect(() => {
    if (!saveMessage) {
      return;
    }
    const timer = setTimeout(() => setSaveMessage(null), 2400);
    return () => clearTimeout(timer);
  }, [saveMessage]);

  const validation = useMemo(() => {
    if (!item) {
      return {
        patch: {},
        normalizedValues: {},
        fieldErrors: {},
        reasonError: undefined,
        isDirty: false,
        isValid: false,
      };
    }

    return evaluateMetadataForm(item.collection, item.editableValues, formValues, reason);
  }, [formValues, item, reason]);

  const startEditing = useCallback(() => {
    if (!item) return;
    resetFormState(item);
    setSaveMessage(null);
    setIsEditing(true);
  }, [item, resetFormState]);

  const cancelEditing = useCallback(() => {
    resetFormState(item);
    setIsEditing(false);
  }, [item, resetFormState]);

  const setFieldValue = useCallback((fieldName: string, value: string | string[]) => {
    setFormValues((current) => ({ ...current, [fieldName]: value }));
    setFieldErrors((current) => {
      if (!(fieldName in current)) return current;
      const next = { ...current };
      delete next[fieldName];
      return next;
    });
    setSaveError(null);
  }, []);

  const toggleFieldOption = useCallback((fieldName: string, optionValue: string) => {
    setFormValues((current) => {
      const existing = Array.isArray(current[fieldName]) ? current[fieldName] : [];
      const nextValues = existing.includes(optionValue)
        ? existing.filter((value) => value !== optionValue)
        : [...existing, optionValue];
      return {
        ...current,
        [fieldName]: nextValues,
      };
    });
    setFieldErrors((current) => {
      if (!(fieldName in current)) return current;
      const next = { ...current };
      delete next[fieldName];
      return next;
    });
    setSaveError(null);
  }, []);

  const setChangeReason = useCallback((nextReason: string) => {
    setReason(nextReason);
    setReasonError(undefined);
    setSaveError(null);
  }, []);

  const saveMetadata = useCallback(async () => {
    if (!item) return;

    const nextValidation = evaluateMetadataForm(
      item.collection,
      item.editableValues,
      formValues,
      reason
    );

    setFieldErrors(nextValidation.fieldErrors);
    setReasonError(nextValidation.reasonError);

    if (!nextValidation.isDirty) {
      setSaveError('Make a change before saving.');
      return;
    }

    if (!nextValidation.isValid) {
      setSaveError('Fix the highlighted fields before saving.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await updateContentMetadata(
        item.collection,
        item.id,
        nextValidation.patch,
        reason.trim()
      );
      const nextItem = await load('refresh');
      setIsEditing(false);
      isEditingRef.current = false;
      resetFormState(nextItem || null);
      setSaveMessage(
        result.changed
          ? `Saved ${result.changedFields.length} field${result.changedFields.length === 1 ? '' : 's'}.`
          : 'No metadata changes were needed.'
      );
    } catch (saveMetadataError) {
      setSaveError(getErrorMessage(saveMetadataError, 'Unable to save content metadata.'));
    } finally {
      setIsSaving(false);
    }
  }, [formValues, item, load, reason, resetFormState]);

  return {
    item,
    history,
    formValues,
    reason,
    fieldErrors,
    reasonError,
    isEditing,
    isLoading,
    isRefreshing,
    isSaving,
    error,
    saveError,
    saveMessage,
    isDirty: validation.isDirty,
    isValid: validation.isValid,
    refresh: () => load('refresh'),
    startEditing,
    cancelEditing,
    setFieldValue,
    toggleFieldOption,
    setReason: setChangeReason,
    saveMetadata,
  };
}
