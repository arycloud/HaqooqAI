/**
 * Check if a date is within the last 24 hours
 */
export const isWithinLast24Hours = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 24;
};

/**
 * Check if quota has reset (24 hours have passed)
 */
export const hasQuotaReset = (lastResetString: string): boolean => {
  const lastReset = new Date(lastResetString);
  const now = new Date();
  const diffInHours = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
  return diffInHours >= 24;
};

/**
 * Get the next quota reset time (24 hours from now)
 */
export const getNextQuotaReset = (): Date => {
  const now = new Date();
  return new Date(now.getTime() + 24 * 60 * 60 * 1000);
};

/**
 * Parse ISO date string safely
 */
export const parseDate = (dateString: string): Date | null => {
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

/**
 * Get relative time string
 */
export const getRelativeTime = (dateString: string): string => {
  const date = parseDate(dateString);
  if (!date) return 'Unknown';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}mo ago`;
};
