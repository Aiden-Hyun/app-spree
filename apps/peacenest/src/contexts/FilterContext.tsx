import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import {
  FilterState,
  FilterSettings,
  FilterStats,
  DEFAULT_FILTER_SETTINGS,
  INITIAL_FILTER_STATS,
  AdapterHealthReport,
  ClassificationResult,
} from '../types';

type FilterAction =
  | { type: 'UPDATE_SETTINGS'; payload: Partial<FilterSettings> }
  | { type: 'UPDATE_STATS'; payload: Partial<FilterStats> }
  | { type: 'RESET_STATS' }
  | { type: 'SET_ADAPTER_HEALTH'; payload: AdapterHealthReport }
  | { type: 'SET_FALLBACK'; payload: { active: boolean; reason: string | null; surfaces: string[] } }
  | { type: 'SET_INITIAL_FILTER_COMPLETE'; payload: boolean }
  | { type: 'RECORD_CLASSIFICATION'; payload: ClassificationResult[] };

const initialState: FilterState = {
  settings: DEFAULT_FILTER_SETTINGS,
  stats: INITIAL_FILTER_STATS,
  fallback: {
    active: false,
    reason: null,
    affectedSurfaces: [],
  },
  adapterHealth: {},
  initialFilterComplete: false,
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case 'UPDATE_STATS':
      return {
        ...state,
        stats: { ...state.stats, ...action.payload },
      };

    case 'RESET_STATS':
      return {
        ...state,
        stats: { ...INITIAL_FILTER_STATS, sessionStart: Date.now() },
      };

    case 'SET_ADAPTER_HEALTH':
      return {
        ...state,
        adapterHealth: {
          ...state.adapterHealth,
          [`${action.payload.site}-${action.payload.surface}`]: action.payload,
        },
      };

    case 'SET_FALLBACK':
      return {
        ...state,
        fallback: {
          active: action.payload.active,
          reason: action.payload.reason as FilterState['fallback']['reason'],
          affectedSurfaces: action.payload.surfaces,
        },
      };

    case 'SET_INITIAL_FILTER_COMPLETE':
      return {
        ...state,
        initialFilterComplete: action.payload,
      };

    case 'RECORD_CLASSIFICATION': {
      const results = action.payload;
      let removed = 0;
      let rewritten = 0;
      let allowed = 0;

      results.forEach(result => {
        if (result.action === 'REMOVE') removed++;
        else if (result.action === 'REWRITE') rewritten++;
        else if (result.action === 'ALLOW') allowed++;
      });

      return {
        ...state,
        stats: {
          ...state.stats,
          totalProcessed: state.stats.totalProcessed + results.length,
          removed: state.stats.removed + removed,
          rewritten: state.stats.rewritten + rewritten,
          allowed: state.stats.allowed + allowed,
        },
      };
    }

    default:
      return state;
  }
}

interface FilterContextValue {
  state: FilterState;
  updateSettings: (settings: Partial<FilterSettings>) => void;
  updateStats: (stats: Partial<FilterStats>) => void;
  resetStats: () => void;
  setAdapterHealth: (health: AdapterHealthReport) => void;
  setFallback: (active: boolean, reason: string | null, surfaces: string[]) => void;
  setInitialFilterComplete: (complete: boolean) => void;
  recordClassification: (results: ClassificationResult[]) => void;
  incrementCacheHit: (tier: 'l1' | 'l2') => void;
  updateLatency: (latencyMs: number) => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(filterReducer, initialState);

  const updateSettings = useCallback((settings: Partial<FilterSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);

  const updateStats = useCallback((stats: Partial<FilterStats>) => {
    dispatch({ type: 'UPDATE_STATS', payload: stats });
  }, []);

  const resetStats = useCallback(() => {
    dispatch({ type: 'RESET_STATS' });
  }, []);

  const setAdapterHealth = useCallback((health: AdapterHealthReport) => {
    dispatch({ type: 'SET_ADAPTER_HEALTH', payload: health });
  }, []);

  const setFallback = useCallback((active: boolean, reason: string | null, surfaces: string[]) => {
    dispatch({ type: 'SET_FALLBACK', payload: { active, reason, surfaces } });
  }, []);

  const setInitialFilterComplete = useCallback((complete: boolean) => {
    dispatch({ type: 'SET_INITIAL_FILTER_COMPLETE', payload: complete });
  }, []);

  const recordClassification = useCallback((results: ClassificationResult[]) => {
    dispatch({ type: 'RECORD_CLASSIFICATION', payload: results });
  }, []);

  const incrementCacheHit = useCallback((tier: 'l1' | 'l2') => {
    dispatch({
      type: 'UPDATE_STATS',
      payload: tier === 'l1' 
        ? { l1CacheHits: state.stats.l1CacheHits + 1 }
        : { l2CacheHits: state.stats.l2CacheHits + 1 },
    });
  }, [state.stats.l1CacheHits, state.stats.l2CacheHits]);

  const updateLatency = useCallback((latencyMs: number) => {
    const currentAvg = state.stats.avgLatencyMs;
    const count = state.stats.totalProcessed;
    const newAvg = count === 0 ? latencyMs : (currentAvg * count + latencyMs) / (count + 1);
    dispatch({ type: 'UPDATE_STATS', payload: { avgLatencyMs: newAvg } });
  }, [state.stats.avgLatencyMs, state.stats.totalProcessed]);

  const value: FilterContextValue = {
    state,
    updateSettings,
    updateStats,
    resetStats,
    setAdapterHealth,
    setFallback,
    setInitialFilterComplete,
    recordClassification,
    incrementCacheHit,
    updateLatency,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter(): FilterContextValue {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}
