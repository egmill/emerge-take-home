export const SCORING_CONFIG = {
    // Exam score thresholds
    EXAM: {
      URGENT_THRESHOLD: 50,      // Below this = urgent
      MEDIUM_THRESHOLD: 75,      // Below this = medium
      URGENT_SCORE: 90,
      MEDIUM_SCORE: 75,
      LOW_SCORE: 5,
    },
    
    // Milestone timing thresholds
    MILESTONE: {
      URGENT_DAYS: 7,            // Within 7 days = urgent
      MEDIUM_DAYS: 14,           // Within 14 days = medium
      URGENT_SCORE: 80,
      MEDIUM_SCORE: 40,
      LOW_SCORE: 5,
    },
    
    // Video completion thresholds
    VIDEO: {
      URGENT_DAYS: 2,            // >2 days old incomplete = urgent
      MEDIUM_DAYS: 1,            // >1 day old incomplete = medium
      COMPLETION_THRESHOLD: 95,  // Below 95% = incomplete
      URGENT_SCORE: 80,
      MEDIUM_SCORE: 40,
      LOW_SCORE: 5,
    },
    
    // Recency weights for combining 3 events (must sum to 1.0)
    // [most recent, middle, oldest]
    RECENCY_WEIGHTS: [0.5, 0.3, 0.2],
  };
  
  // Keyword definitions with urgency scores
  export const URGENCY_KEYWORDS = {
    CRISIS: {
      score: 90,
      keywords: [
        'lost job', 'lost my job', 'fired', 'laid off',
        'funeral', 'died', 'death', 'passed away', 'bereavement', 'family member',
        'emergency', 'hospitalized', 'hospital',
        'eviction', 'evicted', 'homeless',
        'car accident', 'injured',
        'court', 'hearing', 'meet my po', 'po ',
      ]
    },
    
    HIGH: {
      score: 70,
      keywords: [
        'childcare', 'babysitter', 'kids', 'fell through', 'take care of',
        'transport', 'car broke', 'no ride', 'bus',
        'wifi', 'wi-fi', 'internet', 'connection', 'connectivity', 'keeps dropping',
        'phone cut off', 'no service', 'phone disconnected', 'phone got cut off', 'disconnected',
        'computer broke', 'laptop',
        'no response', 'tried to reach',
        'doctor', 'illness', 'not feeling well', 'need rest',
        'financial hardship', 'financial stress', 'can\'t pay',
        'limited access', 'offline materials',
      ]
    },
    
    MEDIUM: {
      score: 50,
      keywords: [
        "don't understand", "don't get",
        'confused', 'confusing',
        'lost', 'stuck',
        'not sure how', 'help with',
        'what does', 'how do i',
        'struggling', 'having trouble', 'can\'t',
        'nervous', 'anxiety', 'freeze up', 'panic', 'worried',
        'feels behind', 'feels flat', 'plateau',
        'forgot', 'postpone', 'what if i fail',
      ]
    },
    
    LOW: {
      score: 5,
      keywords: [
        'good week', 'feeling better', 'feeling good', 'all good',
        'confident', 'ready', 'excited',
        'thank', 'thanks', 'scores are going up',
        'doing well', 'on track', 'keeping pace',
        'no blockers', 'steady improvement', 'ahead of schedule',
        'committed to', 'try to get back', 'studied more',
        'reviewed progress', 'check-in', 'organized calendar',
        'extra practice', 'plan to review', 'coping techniques', 'breathing plan',
        'targeted practice', 'reduce workload',
      ]
    }
  };