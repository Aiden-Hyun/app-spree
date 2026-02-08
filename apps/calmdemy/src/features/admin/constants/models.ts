// ==================== MODEL REGISTRY ====================
// Single source of truth for available models.
// Add or remove entries here; the admin UI dropdowns update automatically.

import { JobBackend } from '../types';

export interface ModelOption {
  id: string;
  label: string;
  description: string;
  backend: JobBackend | JobBackend[]; // which backend(s) this model runs on
}

export interface VoiceOption {
  id: string;
  label: string;
  ttsModel: string; // which TTS model this voice belongs to
  description: string;
}

// ==================== LLM MODELS ====================

export const LLM_MODELS: ModelOption[] = [
  // Local models — primary
  {
    id: 'lmstudio-local',
    label: 'LM Studio (Local)',
    description: 'Run any model via LM Studio on your Mac',
    backend: 'local',
  },
  {
    id: 'ollama-local',
    label: 'Ollama (Local)',
    description: 'Run any model via Ollama on your Mac',
    backend: 'local',
  },
  // API models (Gemini)
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    description: 'Google, fast and free, excellent quality',
    backend: 'api',
  },
  {
    id: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    description: 'Google, best quality, free tier available',
    backend: 'api',
  },
  // Cloud GPU models (legacy — hidden from UI)
  {
    id: 'gemma-3-12b',
    label: 'Gemma 3 12B',
    description: 'Google, strong instruction-following, runs on L4 GPU',
    backend: 'cloud',
  },
  {
    id: 'llama-3.1-8b',
    label: 'Llama 3.1 8B',
    description: 'Meta, general-purpose, efficient',
    backend: 'cloud',
  },
];

// ==================== TTS MODELS ====================

export const TTS_MODELS: ModelOption[] = [
  // Local TTS — primary
  {
    id: 'piper',
    label: 'Piper TTS',
    description: 'Fast, lightweight, runs on CPU, many voices',
    backend: ['local', 'cloud'],
  },
  // API TTS
  {
    id: 'gemini-tts-flash',
    label: 'Gemini TTS Flash',
    description: 'Google Gemini 2.5 Flash TTS, free tier',
    backend: 'api',
  },
  {
    id: 'gemini-tts-pro',
    label: 'Gemini TTS Pro',
    description: 'Google Gemini 2.5 Pro TTS, higher quality',
    backend: 'api',
  },
  // Cloud-only TTS (legacy — hidden from UI)
  {
    id: 'coqui-xtts-v2',
    label: 'Coqui XTTS v2',
    description: 'High quality, voice cloning, needs GPU',
    backend: 'cloud',
  },
];

// ==================== VOICES ====================

export const TTS_VOICES: VoiceOption[] = [
  // Piper voices
  {
    id: 'en_US-amy-medium',
    label: 'Amy (US Female)',
    ttsModel: 'piper',
    description: 'Calm, clear American female voice',
  },
  {
    id: 'en_US-danny-low',
    label: 'Danny (US Male)',
    ttsModel: 'piper',
    description: 'Deep, soothing American male voice',
  },
  {
    id: 'en_GB-alba-medium',
    label: 'Alba (UK Female)',
    ttsModel: 'piper',
    description: 'Warm British female voice',
  },
  {
    id: 'en_US-lessac-medium',
    label: 'Lessac (US Female)',
    ttsModel: 'piper',
    description: 'Natural, expressive American female voice',
  },
  // Coqui XTTS voices (legacy)
  {
    id: 'xtts-female-calm',
    label: 'XTTS Calm Female',
    ttsModel: 'coqui-xtts-v2',
    description: 'High-quality calm female voice',
  },
  {
    id: 'xtts-male-soothing',
    label: 'XTTS Soothing Male',
    ttsModel: 'coqui-xtts-v2',
    description: 'High-quality soothing male voice',
  },
  // Gemini TTS voices
  {
    id: 'gemini-default',
    label: 'Gemini Default',
    ttsModel: 'gemini-tts-flash',
    description: 'Default Gemini TTS voice',
  },
  {
    id: 'gemini-default-pro',
    label: 'Gemini Default',
    ttsModel: 'gemini-tts-pro',
    description: 'Default Gemini Pro TTS voice',
  },
];

// ==================== HELPERS ====================

function matchesBackend(
  modelBackend: JobBackend | JobBackend[],
  target: JobBackend
): boolean {
  if (Array.isArray(modelBackend)) {
    return modelBackend.includes(target);
  }
  return modelBackend === target;
}

export function getLLMModelsForBackend(backend: JobBackend): ModelOption[] {
  return LLM_MODELS.filter((m) => matchesBackend(m.backend, backend));
}

export function getTTSModelsForBackend(backend: JobBackend): ModelOption[] {
  return TTS_MODELS.filter((m) => matchesBackend(m.backend, backend));
}

export function getVoicesForTTSModel(ttsModelId: string): VoiceOption[] {
  return TTS_VOICES.filter((v) => v.ttsModel === ttsModelId);
}

export function getDefaultLLMModel(backend: JobBackend = 'local'): string {
  const models = getLLMModelsForBackend(backend);
  return models.length > 0 ? models[0].id : LLM_MODELS[0].id;
}

export function getDefaultTTSModel(backend: JobBackend = 'local'): string {
  const models = getTTSModelsForBackend(backend);
  return models.length > 0 ? models[0].id : TTS_MODELS[0].id;
}

export function getDefaultVoice(ttsModelId: string): string {
  const voices = getVoicesForTTSModel(ttsModelId);
  return voices.length > 0 ? voices[0].id : '';
}
