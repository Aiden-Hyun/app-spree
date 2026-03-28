import React from 'react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToDom } from '@/test-utils/domRender';
import { getContentManagerEditFields } from '../data/contentManagerEditConfig';

const repoMocks = vi.hoisted(() => ({
  getContentManagerItems: vi.fn(),
  getContentManagerItemDetail: vi.fn(),
  getContentManagerAuditEntries: vi.fn(),
  updateContentMetadata: vi.fn(),
}));

const focusEffectState = vi.hoisted(() => ({
  callbacks: [] as Array<() => void>,
}));

vi.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => {
    focusEffectState.callbacks.push(callback);
  },
}));

vi.mock('../data/contentManagerRepository', () => ({
  getContentManagerItems: repoMocks.getContentManagerItems,
  getContentManagerItemDetail: repoMocks.getContentManagerItemDetail,
}));

vi.mock('../data/contentManagerAdminRepository', () => ({
  getContentManagerAuditEntries: repoMocks.getContentManagerAuditEntries,
  updateContentMetadata: repoMocks.updateContentMetadata,
}));

import {
  useContentManagerCatalog,
  useContentManagerDetail,
} from '../hooks/useContentManager';

function buildDetail(title = 'Calm Breath') {
  return {
    id: 'item-1',
    collection: 'guided_meditations' as const,
    typeLabel: 'Guided Meditation',
    title,
    description: 'A grounding reset.',
    identifier: 'item-1',
    access: 'free' as const,
    previewRoute: { pathname: '/meditation/[id]' as const, params: { id: 'item-1' } },
    metadata: [{ label: 'Themes', value: 'focus' }],
    relations: [],
    editableFields: getContentManagerEditFields('guided_meditations'),
    editableValues: {
      title,
      description: 'A grounding reset.',
      duration_minutes: 10,
      thumbnailUrl: null,
      themes: ['focus'],
      techniques: ['breathing'],
      difficulty_level: 'beginner',
      instructor: 'Ava',
    },
  };
}

function CatalogHarness() {
  const { filteredItems } = useContentManagerCatalog();

  return <div data-testid="catalog-titles">{filteredItems.map((item) => item.title).join('|')}</div>;
}

function DetailHarness() {
  const detail = useContentManagerDetail('guided_meditations', 'item-1');

  return (
    <div>
      <div data-testid="detail-title">{detail.item?.title || ''}</div>
      <div data-testid="detail-mode">{detail.isEditing ? 'editing' : 'view'}</div>
      <div data-testid="detail-save-message">{detail.saveMessage || ''}</div>
      <div data-testid="detail-save-error">{detail.saveError || ''}</div>
      <div data-testid="detail-history">
        {detail.history
          .map((entry) => `${entry.actorEmail || entry.actorUid}:${entry.reason}:${entry.changedFields.join(',')}`)
          .join('|')}
      </div>

      <button data-testid="start-edit" type="button" onClick={detail.startEditing}>
        Start
      </button>
      <button data-testid="cancel-edit" type="button" onClick={detail.cancelEditing}>
        Cancel
      </button>
      <button
        data-testid="set-title"
        type="button"
        onClick={() => detail.setFieldValue('title', 'Updated Breath')}
      >
        Set title
      </button>
      <button
        data-testid="set-invalid-duration"
        type="button"
        onClick={() => detail.setFieldValue('duration_minutes', '0')}
      >
        Invalid duration
      </button>
      <button
        data-testid="set-reason"
        type="button"
        onClick={() => detail.setReason('Fixing metadata copy')}
      >
        Set reason
      </button>
      <button
        data-testid="save-edit"
        type="button"
        disabled={!detail.isDirty || !detail.isValid || detail.isSaving}
        onClick={() => detail.saveMetadata()}
      >
        Save
      </button>
    </div>
  );
}

async function flushAsyncWork() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('useContentManager hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    focusEffectState.callbacks = [];
  });

  it('refreshes the catalog when the screen regains focus', async () => {
    repoMocks.getContentManagerItems
      .mockResolvedValueOnce([
        {
          id: 'item-1',
          collection: 'guided_meditations',
          typeLabel: 'Guided Meditation',
          title: 'Calm Breath',
          identifier: 'item-1',
          access: 'free',
          previewRoute: { pathname: '/meditation/[id]', params: { id: 'item-1' } },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'item-2',
          collection: 'bedtime_stories',
          typeLabel: 'Bedtime Story',
          title: 'Quiet Forest',
          identifier: 'item-2',
          access: 'free',
          previewRoute: { pathname: '/sleep/[id]', params: { id: 'item-2' } },
        },
      ]);

    const { getByTestId } = renderToDom(<CatalogHarness />);
    await flushAsyncWork();

    expect(getByTestId('catalog-titles').textContent).toContain('Calm Breath');

    await act(async () => {
      focusEffectState.callbacks.at(-1)?.();
      await Promise.resolve();
    });
    await flushAsyncWork();

    expect(getByTestId('catalog-titles').textContent).toContain('Quiet Forest');
  });

  it('tracks edit mode and only enables save when the form is dirty and valid', async () => {
    repoMocks.getContentManagerItemDetail.mockResolvedValue(buildDetail());
    repoMocks.getContentManagerAuditEntries.mockResolvedValue([]);

    const { getByTestId, click } = renderToDom(<DetailHarness />);
    await flushAsyncWork();

    expect(getByTestId('detail-mode').textContent).toBe('view');
    expect((getByTestId('save-edit') as HTMLButtonElement).disabled).toBe(true);

    click(getByTestId('start-edit'));
    expect(getByTestId('detail-mode').textContent).toBe('editing');

    click(getByTestId('set-title'));
    expect((getByTestId('save-edit') as HTMLButtonElement).disabled).toBe(true);

    click(getByTestId('set-reason'));
    expect((getByTestId('save-edit') as HTMLButtonElement).disabled).toBe(false);

    click(getByTestId('cancel-edit'));
    expect(getByTestId('detail-mode').textContent).toBe('view');
  });

  it('reloads detail data and audit history after a successful save', async () => {
    repoMocks.getContentManagerItemDetail
      .mockResolvedValueOnce(buildDetail('Calm Breath'))
      .mockResolvedValueOnce(buildDetail('Updated Breath'));
    repoMocks.getContentManagerAuditEntries
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'entry-1',
          actorUid: 'admin-1',
          actorEmail: 'admin@calmdemy.app',
          reason: 'Fixing metadata copy',
          changedFields: ['title'],
          before: { title: 'Calm Breath' },
          after: { title: 'Updated Breath' },
        },
      ]);
    repoMocks.updateContentMetadata.mockResolvedValue({
      changed: true,
      changedFields: ['title'],
    });

    const { getByTestId, click } = renderToDom(<DetailHarness />);
    await flushAsyncWork();

    click(getByTestId('start-edit'));
    click(getByTestId('set-title'));
    click(getByTestId('set-reason'));
    click(getByTestId('save-edit'));
    await flushAsyncWork();
    await flushAsyncWork();

    expect(repoMocks.updateContentMetadata).toHaveBeenCalledWith(
      'guided_meditations',
      'item-1',
      { title: 'Updated Breath' },
      'Fixing metadata copy'
    );
    expect(getByTestId('detail-title').textContent).toBe('Updated Breath');
    expect(getByTestId('detail-mode').textContent).toBe('view');
    expect(getByTestId('detail-history').textContent).toContain(
      'admin@calmdemy.app:Fixing metadata copy:title'
    );
    expect(getByTestId('detail-save-message').textContent).toContain('Saved 1 field');
  });

  it('keeps edit mode open when save fails', async () => {
    repoMocks.getContentManagerItemDetail.mockResolvedValue(buildDetail());
    repoMocks.getContentManagerAuditEntries.mockResolvedValue([]);
    repoMocks.updateContentMetadata.mockRejectedValue(new Error('Network down'));

    const { getByTestId, click } = renderToDom(<DetailHarness />);
    await flushAsyncWork();

    click(getByTestId('start-edit'));
    click(getByTestId('set-title'));
    click(getByTestId('set-reason'));
    click(getByTestId('save-edit'));
    await flushAsyncWork();

    expect(getByTestId('detail-mode').textContent).toBe('editing');
    expect(getByTestId('detail-save-error').textContent).toContain('Network down');
  });
});
