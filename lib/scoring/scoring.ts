import { StudentEvent } from '../types';
import { SCORING_CONFIG, URGENCY_KEYWORDS } from '../config';

/**
 * Get urgency tier from score
 */
function getUrgencyTier(score: number): 'CRISIS' | 'HIGH' | 'MEDIUM' | 'LOW' {
  if (score >= 90) return 'CRISIS';
  if (score >= 60) return 'HIGH';
  if (score >= 30) return 'MEDIUM';
  return 'LOW';
}

/**
 * Generate a summary string for a single event based on type and urgency tier
 */
export async function generateEventSummary(event: StudentEvent): Promise<string> {
  const score = await scoreEvent(event);
  const tier = getUrgencyTier(score);

  switch (event.type) {
    case 'call_transcript':
      switch (tier) {
        case 'CRISIS':
          return 'Experienced a crisis situation during a call.';
        case 'HIGH':
          return 'Reported significant blockers during a call.';
        case 'MEDIUM':
          return 'Expressed concerns or confusion during a call.';
        case 'LOW':
          return 'Had a positive or neutral call interaction.';
      }
      break;

    case 'exam_score':
      const examScore = parseInt(event.value);
      if (!isNaN(examScore)) {
        switch (tier) {
          case 'CRISIS':
            return `Experienced a critically low exam score (${examScore}).`;
          case 'HIGH':
            return `Received a concerning exam score (${examScore}).`;
          case 'MEDIUM':
            return `Scored below expectations on an exam (${examScore}).`;
          case 'LOW':
            return `Performed well on an exam (${examScore}).`;
        }
      } else {
        return 'Received an exam score.';
      }
      break;

    case 'message':
      switch (tier) {
        case 'CRISIS':
          return 'Sent a message indicating a crisis situation.';
        case 'HIGH':
          return 'Sent a message about significant blockers.';
        case 'MEDIUM':
          return 'Sent a message expressing concerns or needing help.';
        case 'LOW':
          return 'Sent a positive or routine message.';
      }
      break;

    case 'milestone':
      try {
        const milestone = JSON.parse(event.value);
        const milestoneDate = new Date(milestone.date);
        const today = new Date();
        const daysUntil = Math.floor(
          (milestoneDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        const milestoneName = milestone.name || 'milestone';
        
        switch (tier) {
          case 'CRISIS':
            return `Has an urgent upcoming ${milestoneName} (${daysUntil} days away).`;
          case 'HIGH':
            return `Has an approaching ${milestoneName} (${daysUntil} days away).`;
          case 'MEDIUM':
            return `Has a ${milestoneName} coming up (${daysUntil} days away).`;
          case 'LOW':
            return daysUntil < 0 
              ? `Completed a ${milestoneName}.`
              : `Has a ${milestoneName} scheduled (${daysUntil} days away).`;
        }
      } catch {
        switch (tier) {
          case 'CRISIS':
            return 'Has an urgent upcoming milestone.';
          case 'HIGH':
            return 'Has an approaching milestone.';
          case 'MEDIUM':
            return 'Has a milestone coming up.';
          case 'LOW':
            return 'Has a milestone scheduled.';
        }
      }
      break;

    case 'video_watched':
      const completion = parseInt(event.value.replace('%', ''));
      if (!isNaN(completion)) {
        switch (tier) {
          case 'CRISIS':
            return `Has an incomplete video (${completion}% watched) that needs attention.`;
          case 'HIGH':
            return `Has an incomplete video (${completion}% watched) that may need follow-up.`;
          case 'MEDIUM':
            return `Watched part of a video (${completion}% complete).`;
          case 'LOW':
            return `Completed watching a video (${completion}% watched).`;
        }
      } else {
        switch (tier) {
          case 'CRISIS':
            return 'Has an incomplete video that needs attention.';
          case 'HIGH':
            return 'Has an incomplete video that may need follow-up.';
          case 'MEDIUM':
            return 'Watched part of a video.';
          case 'LOW':
            return 'Completed watching a video.';
        }
      }
      break;

    default:
      return 'Had an event update.';
  }
  
  return 'Had an event update.'; // Fallback
}

/**
 * Generate overall summary by concatenating summaries for recent events
 */
export async function generateStudentSummary(events: StudentEvent[]): Promise<string> {
  if (events.length === 0) {
    return 'No recent activity.';
  }

  const summaries = await Promise.all(
    events.map(event => generateEventSummary(event))
  );

  return summaries.join(' ');
}

/**
 * Find the highest urgency keyword match in text
 * Returns urgency score or null if no keywords match
 */
export function findKeywordMatch(text: string): number | null {
  const textLower = text.toLowerCase();

  // Check in priority order: CRISIS > HIGH > MEDIUM > LOW
  const priorities = ['CRISIS', 'HIGH', 'MEDIUM', 'LOW'] as const;

  for (const priority of priorities) {
    const { keywords, score } = URGENCY_KEYWORDS[priority];
    if (keywords.some(keyword => textLower.includes(keyword))) {
      return score;
    }
  }

  return null; // No keywords matched
}

/**
 * Score a call transcript (0-99)
 * Uses keyword matching only, returns 50 if no keywords match
 */
export async function scoreCallTranscript(value: string) {
  // Try keyword matching first
  const keywordScore = findKeywordMatch(value);
  if (keywordScore !== null) {
    return keywordScore;
  }

  return 50;
}

/**
 * Score an exam (0-99)
 * Based on numeric score thresholds
 */
export function scoreExamScore(value: string): number {
  const score = parseInt(value);

  if (isNaN(score)) {
    console.warn('Invalid exam score:', value);
    return 0;
  }

  if (score < SCORING_CONFIG.EXAM.URGENT_THRESHOLD) {
    return SCORING_CONFIG.EXAM.URGENT_SCORE; // < 50 = urgent
  }
  if (score < SCORING_CONFIG.EXAM.MEDIUM_THRESHOLD) {
    return SCORING_CONFIG.EXAM.MEDIUM_SCORE; // < 75 = medium
  }
  return SCORING_CONFIG.EXAM.LOW_SCORE; // >= 75 = low urgency
}

/**
 * Score a message (0-99)
 * Uses keyword matching only, returns 50 if no keywords match
 */
export async function scoreMessage(value: string) {
  // Try keyword matching first
  const keywordScore = findKeywordMatch(value);
  if (keywordScore !== null) {
    return keywordScore;
  }

  return 50;
}

/**
 * Score a milestone (0-99)
 * Based on days until milestone date
 */
export function scoreMilestone(value: string): number {
  try {
    const milestone = JSON.parse(value);
    const milestoneDate = new Date(milestone.date);
    const today = new Date();
    
    // Calculate days until milestone
    const daysUntil = Math.floor(
      (milestoneDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If milestone has passed, low urgency
    if (daysUntil < 0) {
      return SCORING_CONFIG.MILESTONE.LOW_SCORE;
    }

    if (daysUntil <= SCORING_CONFIG.MILESTONE.URGENT_DAYS) {
      return SCORING_CONFIG.MILESTONE.URGENT_SCORE; // <= 7 days
    }
    if (daysUntil <= SCORING_CONFIG.MILESTONE.MEDIUM_DAYS) {
      return SCORING_CONFIG.MILESTONE.MEDIUM_SCORE; // <= 14 days
    }
    return SCORING_CONFIG.MILESTONE.LOW_SCORE; // > 14 days
    
  } catch (error) {
    console.warn('Error parsing milestone:', value);
    return 0;
  }
}

/**
 * Score a video watch event (0-99)
 * Based on completion % and days since timestamp
 */
export function scoreVideoWatched(value: string, timestamp: string): number {
  const completion = parseInt(value.replace('%', ''));
  
  if (isNaN(completion)) {
    console.warn('Invalid video completion:', value);
    return 0;
  }

  // If video is complete (>= 95%), low urgency
  if (completion >= SCORING_CONFIG.VIDEO.COMPLETION_THRESHOLD) {
    return SCORING_CONFIG.VIDEO.LOW_SCORE;
  }

  // Video is incomplete - check how old it is
  const videoDate = new Date(timestamp);
  const today = new Date();
  const daysAgo = Math.floor(
    (today.getTime() - videoDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysAgo > SCORING_CONFIG.VIDEO.URGENT_DAYS) {
    return SCORING_CONFIG.VIDEO.URGENT_SCORE; // > 2 days old, incomplete
  }
  if (daysAgo > SCORING_CONFIG.VIDEO.MEDIUM_DAYS) {
    return SCORING_CONFIG.VIDEO.MEDIUM_SCORE; // > 1 day old, incomplete
  }
  return SCORING_CONFIG.VIDEO.LOW_SCORE; // Recent, incomplete = low urgency
}

/**
 * Score a single event based on its type
 * Router function that calls the appropriate scorer
 */
export async function scoreEvent(event: StudentEvent): Promise<number> {
  switch (event.type) {
    case 'call_transcript':
      return await scoreCallTranscript(event.value);
    
    case 'exam_score':
      return scoreExamScore(event.value);
    
    case 'message':
      return await scoreMessage(event.value);
    
    case 'milestone':
      return scoreMilestone(event.value);
    
    case 'video_watched':
      return scoreVideoWatched(event.value, event.timestamp);
    
    default:
      console.warn('Unknown event type:', event.type);
      return 0;
  }
}

/**
 * Calculate overall urgency for a student (0-99)
 * Combines scores from up to 3 recent events with recency weighting
 */
export async function calculateStudentUrgency(
  events: StudentEvent[]
): Promise<number> {
  // Handle edge cases
  if (events.length === 0) {
    return 0;
  }

  // Score each event
  const scores = await Promise.all(
    events.map(event => scoreEvent(event))
  );

  // Apply recency weights
  const weights = SCORING_CONFIG.RECENCY_WEIGHTS;
  let weightedScore = 0;

  scores.forEach((score, index) => {
    // Use weight for this position, or 0 if we have fewer than 3 events
    const weight = weights[index] || 0;
    weightedScore += score * weight;
  });

  // Normalize if we have fewer than 3 events
  // (so weights still sum to 1.0)
  if (events.length < 3) {
    const usedWeights = weights.slice(0, events.length);
    const weightSum = usedWeights.reduce((sum, w) => sum + w, 0);
    weightedScore = weightedScore / weightSum;
  }

  // Round to integer and clamp to 0-99
  return Math.min(99, Math.max(0, Math.round(weightedScore)));
}