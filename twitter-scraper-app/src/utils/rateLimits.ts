// Twitter API rate limits as of current usage
interface RateLimit {
  endpoint: string;
  limit: number;
  resetMinutes: number;
  description: string;
}

// Rate limits for endpoints we're using
export const rateLimits: Record<string, RateLimit> = {
  'SEARCH_TWEETS': {
    endpoint: 'SearchTimeline',
    limit: 50,
    resetMinutes: 15,
    description: 'Search for tweets'
  },
  'HASHTAG_TWEETS': {
    endpoint: 'SearchTimeline',
    limit: 50,
    resetMinutes: 15,
    description: 'Search for hashtag tweets'
  },
  'USER_TWEETS': {
    endpoint: 'UserTweets',
    limit: 50,
    resetMinutes: 15,
    description: 'Get user tweets'
  },
  'USER_REPLIES': {
    endpoint: 'UserTweetsAndReplies',
    limit: 50,
    resetMinutes: 15,
    description: 'Get user tweets and replies'
  },
  'USER_MEDIA': {
    endpoint: 'UserMedia',
    limit: 500,
    resetMinutes: 15,
    description: 'Get user media tweets'
  },
  'USER_LIKES': {
    endpoint: 'Likes',
    limit: 500,
    resetMinutes: 15,
    description: 'Get user liked tweets'
  },
  'DATE_RANGE_TWEETS': {
    endpoint: 'SearchTimeline',
    limit: 50,
    resetMinutes: 15,
    description: 'Search tweets by date range'
  }
};

// Function to get rate limit info for a specific scrape type
export function getRateLimitInfo(scrapeType: string): RateLimit {
  // Default to search limit if not specifically defined
  return rateLimits[scrapeType] || rateLimits['SEARCH_TWEETS'];
}

// Local storage key for rate limit tracking
const RATE_LIMIT_STORAGE_KEY = 'twitter_scraper_rate_limits';

interface RateLimitUsage {
  endpoint: string;
  requestCount: number;
  lastResetTime: number;
}

// Initialize or get current rate limit usage
export function getRateLimitUsage(): Record<string, RateLimitUsage> {
  if (typeof window === 'undefined') return {};

  const storedData = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
  if (!storedData) return {};
  
  try {
    return JSON.parse(storedData);
  } catch (e) {
    return {};
  }
}

// Record a new API request
export function recordApiRequest(endpoint: string): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const usage = getRateLimitUsage();
  
  // Create or update the endpoint usage
  if (!usage[endpoint]) {
    usage[endpoint] = {
      endpoint,
      requestCount: 1,
      lastResetTime: now
    };
  } else {
    // Check if we need to reset the counter (15 minutes have passed)
    const timeSinceReset = now - usage[endpoint].lastResetTime;
    const resetTimeMs = 15 * 60 * 1000; // 15 minutes in milliseconds
    
    if (timeSinceReset >= resetTimeMs) {
      // Reset counter if 15 minutes have passed
      usage[endpoint].requestCount = 1;
      usage[endpoint].lastResetTime = now;
    } else {
      // Increment counter
      usage[endpoint].requestCount += 1;
    }
  }
  
  // Save updated usage
  localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(usage));
}

// Get remaining requests for a specific endpoint
export function getRemainingRequests(endpoint: string): number {
  const usage = getRateLimitUsage();
  const endpointData = Object.values(rateLimits).find(r => r.endpoint === endpoint);
  
  if (!endpointData) return 999; // Unknown endpoint
  if (!usage[endpoint]) return endpointData.limit; // No usage yet
  
  // Check if we need to reset (15 minutes have passed)
  const now = Date.now();
  const timeSinceReset = now - usage[endpoint].lastResetTime;
  const resetTimeMs = 15 * 60 * 1000; // 15 minutes
  
  if (timeSinceReset >= resetTimeMs) {
    // Reset has happened
    return endpointData.limit;
  }
  
  // Calculate remaining
  return Math.max(0, endpointData.limit - usage[endpoint].requestCount);
}

// Get time until next reset
export function getTimeUntilReset(endpoint: string): number {
  const usage = getRateLimitUsage();
  
  if (!usage[endpoint]) return 0;
  
  const now = Date.now();
  const resetTimeMs = 15 * 60 * 1000; // 15 minutes
  const timeElapsed = now - usage[endpoint].lastResetTime;
  
  return Math.max(0, resetTimeMs - timeElapsed);
} 