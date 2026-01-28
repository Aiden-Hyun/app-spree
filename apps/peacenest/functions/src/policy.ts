/**
 * Policy Engine
 * 
 * Applies classification rules to determine filter actions.
 * Centralizes all "no reveal path" logic.
 */

export type FilterAction = 'ALLOW' | 'REMOVE' | 'REWRITE' | 'BLOCK_PAGE';

export interface PolicyResult {
  action: FilterAction;
  confidence: number;
  matchedLabel?: string;
}

// Threshold configuration
const THRESHOLDS = {
  // High-confidence threshold for filtering
  FILTER_THRESHOLD: 0.7,
  // Low-confidence threshold for ALLOW
  ALLOW_THRESHOLD: 0.3,
  // Toxicity threshold for comments
  TOXICITY_THRESHOLD: 0.6,
};

// Labels that map to REMOVE action
const REMOVE_LABELS = [
  'politics and political debate, elections, government, geopolitics',
  'societal bad news and doom news, crisis, fear-inducing news',
  'violence and casualties, killing, assault, war casualties',
  'controversial topics, heated arguments, divisive discussions',
];

// Labels that map to ALLOW action
const ALLOW_LABELS = [
  'neutral everyday content, hobbies, food, ASMR, lifestyle',
  'comedy and stand-up, crowd work, playful roasting',
  'educational content, tutorials, how-to guides',
  'music, entertainment, arts',
];

// Toxicity labels that trigger filtering
const TOXIC_LABELS = [
  'toxic',
  'severe_toxic',
  'obscene',
  'threat',
  'insult',
  'identity_hate',
];

/**
 * Apply policy rules to classification results
 */
export function applyPolicy(
  labels: string[],
  scores: number[],
  role: string,
  enabledCategories: string[]
): PolicyResult {
  // Handle toxicity classification (for comments)
  if (role === 'comment') {
    return applyToxicityPolicy(labels, scores);
  }

  // Handle zero-shot classification (for titles/content)
  return applyZeroShotPolicy(labels, scores, role, enabledCategories);
}

/**
 * Apply toxicity-based policy
 */
function applyToxicityPolicy(labels: string[], scores: number[]): PolicyResult {
  // Find highest toxicity score
  let maxToxicScore = 0;
  let matchedLabel = '';

  labels.forEach((label, i) => {
    const lowerLabel = label.toLowerCase();
    if (TOXIC_LABELS.some(t => lowerLabel.includes(t))) {
      if (scores[i] > maxToxicScore) {
        maxToxicScore = scores[i];
        matchedLabel = label;
      }
    }
  });

  if (maxToxicScore >= THRESHOLDS.TOXICITY_THRESHOLD) {
    return {
      action: 'REMOVE',
      confidence: maxToxicScore,
      matchedLabel,
    };
  }

  return {
    action: 'ALLOW',
    confidence: 1 - maxToxicScore,
  };
}

/**
 * Apply zero-shot classification policy
 */
function applyZeroShotPolicy(
  labels: string[],
  scores: number[],
  role: string,
  enabledCategories: string[]
): PolicyResult {
  // #region agent log - H1, H2: Log input parameters
  console.log(`[Policy:H1] Labels received: ${JSON.stringify(labels)}`);
  console.log(`[Policy:H1] Scores received: ${JSON.stringify(scores)}`);
  console.log(`[Policy:H2] enabledCategories: ${JSON.stringify(enabledCategories)}`);
  // #endregion

  // Find highest matching category
  let bestRemoveScore = 0;
  let bestRemoveLabel = '';
  let bestAllowScore = 0;

  labels.forEach((label, i) => {
    const score = scores[i];
    const lowerLabel = label.toLowerCase();

    // Check if this is a REMOVE category and is enabled
    const isRemoveCategory = REMOVE_LABELS.some(rl => 
      lowerLabel.includes(rl.toLowerCase()) || rl.toLowerCase().includes(lowerLabel)
    );
    
    const isEnabled = enabledCategories.some(ec => 
      lowerLabel.includes(ec.toLowerCase()) || ec.toLowerCase().includes(lowerLabel)
    );

    // #region agent log - H1, H5: Log matching results for each label
    console.log(`[Policy:H1,H5] Label "${label.slice(0,30)}..." score=${score.toFixed(3)} isRemove=${isRemoveCategory} isEnabled=${isEnabled}`);
    // #endregion

    if (isRemoveCategory && isEnabled && score > bestRemoveScore) {
      bestRemoveScore = score;
      bestRemoveLabel = label;
    }

    // Check if this is an ALLOW category
    const isAllowCategory = ALLOW_LABELS.some(al => 
      lowerLabel.includes(al.toLowerCase()) || al.toLowerCase().includes(lowerLabel)
    );

    // #region agent log - H4: Log ALLOW matching
    if (isAllowCategory) {
      console.log(`[Policy:H4] ALLOW category matched: "${label.slice(0,30)}..." score=${score.toFixed(3)}`);
    }
    // #endregion

    if (isAllowCategory && score > bestAllowScore) {
      bestAllowScore = score;
    }
  });

  // #region agent log - H3, H4: Log final scores before decision
  console.log(`[Policy:H3,H4] Final scores: bestRemoveScore=${bestRemoveScore.toFixed(3)} bestAllowScore=${bestAllowScore.toFixed(3)} threshold=${THRESHOLDS.FILTER_THRESHOLD}`);
  // #endregion

  // Decision logic
  if (bestRemoveScore >= THRESHOLDS.FILTER_THRESHOLD) {
    // Content matches a filter category with high confidence
    return {
      action: role === 'paragraph' ? 'REWRITE' : 'REMOVE',
      confidence: bestRemoveScore,
      matchedLabel: bestRemoveLabel,
    };
  }

  if (bestAllowScore >= THRESHOLDS.FILTER_THRESHOLD) {
    // Content is clearly safe
    return {
      action: 'ALLOW',
      confidence: bestAllowScore,
    };
  }

  // Uncertain - safety first for high-risk roles
  if (bestRemoveScore > bestAllowScore && bestRemoveScore >= THRESHOLDS.ALLOW_THRESHOLD) {
    return {
      action: role === 'paragraph' ? 'REWRITE' : 'REMOVE',
      confidence: bestRemoveScore,
      matchedLabel: bestRemoveLabel,
    };
  }

  // #region agent log - H3: Log when falling through to default ALLOW
  console.log(`[Policy:H3] Falling through to default ALLOW - no thresholds met`);
  // #endregion

  // Default to ALLOW if no concerning signals
  return {
    action: 'ALLOW',
    confidence: Math.max(bestAllowScore, 1 - bestRemoveScore),
  };
}

/**
 * Check if content should trigger a full page block
 */
export function shouldBlockPage(
  labels: string[],
  scores: number[],
  pageUrl: string
): boolean {
  // Block pages that are entirely about blocked topics
  // This is a stricter check - only blocks if very high confidence
  
  const blockScore = scores.reduce((max, score, i) => {
    const label = labels[i].toLowerCase();
    const isBlockCategory = REMOVE_LABELS.some(rl => 
      label.includes(rl.toLowerCase())
    );
    return isBlockCategory && score > max ? score : max;
  }, 0);

  return blockScore >= 0.9;
}

/**
 * Get policy version string
 */
export function getPolicyVersion(): string {
  return '2025-01-v1';
}
